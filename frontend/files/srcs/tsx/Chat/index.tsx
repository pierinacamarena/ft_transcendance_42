import React, { useCallback, useMemo } from 'react'
import { useEffect, useState } from 'react'
import io, { Socket } from "socket.io-client"
import MessageInput from './MessageInput.tsx'
import Messages from './Messages.tsx'
import { Link } from 'react-router-dom'
import "../../css/Chat/ChatMainGrid.css"
import ChatHeader from './ChatHeader.tsx'
import HeaderContactInfo from './HeaderContactInfo.tsx'
import ChatChannels from './ChatChannels.tsx'
import DmHandler from './DmHandler.tsx'
import ChatInfo from './ChatInfo.tsx'
import { ToastContainer, toast, ToastContentProps, ToastContent } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createPortal } from 'react-dom';
import { ChanMember, Channel, ChanMessage, ChannelMessage, Contact, PrivMessage, PrivateMessage } from './types.ts'

type connexionType = 'matchmaking' | 'private'
function Chat({ socket, startGameSockets }: {
	socket: Socket,
	startGameSockets: (type: connexionType, opponentID?: number) => void
}) {

	const [isOpen, setIsOpen] = useState<boolean>(false);

	//Users
	const [userInfo, setUserInfo] = useState<Contact | null>(null);
	const [allUsers, setAllUsers] = useState<Contact[]>([]);

	//PrivateMessage
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [allMessages, setAllMessages] = useState<PrivMessage[]>([]);
	const [contactBlockStatus, setContactBlockStatus] = useState<Boolean>(false);

	//Channel
	const [allChannelsbyUser, setAllChannelsbyUser] = useState<Channel[]>([]);
	const [allChannelsNotJoined, setAllChannelsNotJoined] = useState<Channel[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
	const [channelMessages, setChannelMessages] = useState<{ [key: number]: ChanMessage[] }>({});

	/**
	 * Users Info
	 */
	useEffect(() => {
		// if (!userInfo) {
			socket.on('userInfo', (userData: { id: number; email: string; nickname: string; avatarFilename: string }) => {
				setUserInfo(userData);
				const { nickname } = userData;
				console.log(' nickname ', nickname);
			});

			socket.emit('getUserInfo', () => { });
		// }
		return () => {
			socket.off('userInfo');
		};
	}, []);

	useEffect(() => {
		if (!userInfo) console.error('No user Info');
		else console.error('Got User info')

	}, [userInfo])

	useEffect(() => {
		socket.on('allUsersFound', (userData: { id: number; email: string; nickname: string; avatarFilename: string }[]) => {
			setAllUsers(userData);
			console.log('getting all the users')
		});
		socket.emit('getAllUsers')
	}, []);

	/**
	 * Private message
	 */

	const SendMessage = useCallback((value: string) => {
		if (!userInfo) {
			return;
		}
		if (!selectedContact && !selectedChannel) {
			return;
		}
		if (selectedContact) {
			const message = {
				sender: userInfo.id,
				receiver: selectedContact.id,
				message: value,
				type: "sent",
			};
			socket.emit('createPrivateMessage', { senderID: userInfo.id, recipientID: selectedContact.id, content: value });
			socket.emit('sendPrivateMessage', { senderID: userInfo.id, recipientID: selectedContact.id, content: value })
		}
		else if (selectedChannel) {
			const message = {
				sender: userInfo.id,
				senderNick: userInfo.nickname,
				chanId: selectedChannel.id,
				content: value,
				type: "sent",
			};
			socket.emit('sendChanMessage', { senderId: userInfo.id, senderNick: userInfo.nickname, chanId: selectedChannel.id, content: value });
		}
		else {
			console.log("Neither user nor channel is selected for the message to be sent");
		}
	}, [userInfo, selectedContact, selectedChannel]);

	const privateMessageCreatedListener = useCallback((message: {
		sender: number;
		recipient: number;
		content: string;
		timeSent: string;
	}) => {
		if (message.sender && message.recipient && message.content) 
		{
			const { recipient: receiver, content, ...msg } = message;
			const formated = { ...msg, receiver, message: content, type: 'received' };
			setAllMessages((allMessages) => {
				if (!allMessages.find(m =>
					m.timeSent === message.timeSent &&
					m.message === message.content &&
					m.sender === message.sender &&
					m.receiver === message.recipient)) {
						return [...allMessages, formated]
					}
				else return allMessages
			});
		}
	}, [selectedContact]);

	useEffect(() => {
		const conversationListener = (conversation: { sender: number; recipient: number; timeSent: Date; content: string }[]) => {
			const transformedConversation = conversation.map(msg => {
				return {
					sender: msg.sender,
					receiver: msg.recipient,
					timeSent: msg.timeSent.toLocaleString(),
					message: msg.content,
					type: "received"
				};
			});
			setAllMessages(transformedConversation);
		};

		socket.on("foundPrivateConversation", conversationListener);
		socket.on("privateMessageCreated", privateMessageCreatedListener);
		socket.on("privateMessageSent", privateMessageCreatedListener);

		return () => {
			socket.off("foundPrivateConversation", conversationListener);
			socket.off("privateMessageCreated", privateMessageCreatedListener);
			socket.off("privateMessageSent", privateMessageCreatedListener);
		};
	}, [privateMessageCreatedListener]);

	// useEffect(() => {
	// 	if (userInfo && selectedContact) {
	// 		socket.emit('getBlockStatus', { userId: userInfo.id, contactId: selectedContact.id });
	// 		socket.on('foundBlockStatus', (blockStatus) => {
	// 			setContactBlockStatus(blockStatus);
	// 		});
	// 	}
	// 	return () => {
	// 		socket.off('foundBlockStatus');
	// 	}
	// }, [userInfo, selectedContact]);

	useEffect(() => {
		if (userInfo && selectedContact) {
			socket.emit('getPrivateConversation', { firstUser: userInfo.id, secondUser: selectedContact.id });
		}
		// else if (userInfo && selectedContact && contactBlockStatus) {
		// 	setAllMessages([]);
		// }
	}, [userInfo, selectedContact]);

	useEffect(() => {
		const chatMessages = document.getElementById("chat-messages");
		if (chatMessages) {
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}
	}, [allMessages, channelMessages]);

	/**
	 * Channel
	 */

	const channelMessageCreatedListener = useCallback((message: {
		sender: number,
		senderNick: string,
		chanId: number,
		content: string,
		timeSent: string,
	}) => {
		if (message.sender && message.senderNick && message.content && (selectedChannel?.id === message.chanId)) {
			const { sender, content, ...msg } = message;
			const formatted = {
				...msg,
				sender,
				content: content,
				type: sender === userInfo?.id ? 'sent' : 'received' // Determine the type based on sender
			};
			setChannelMessages((currentMessages) => {
				const channelMessages = currentMessages[selectedChannel.id] || [];
				const isDuplicate = channelMessages.find(m =>
					m.timeSent === formatted.timeSent &&
					m.content === formatted.content &&
					m.sender === formatted.sender &&
					m.chanId === formatted.chanId);
				if (!isDuplicate) {
					return {
						...currentMessages,
						[selectedChannel.id]: [...channelMessages, formatted],
					};
				} else {
					return currentMessages;
				}
			});
		}
	}, [userInfo, selectedChannel]);


	useEffect(() => {
		const channelMessageListener = ({ messages, chanId }: { messages: ChannelMessage[], chanId: number }) => {
			setChannelMessages((currentMessages) => {
				return { ...currentMessages, [chanId]: messages };
			});
		};
		socket.on("channelMessagesFound", channelMessageListener);
		socket.on("SentChanMessage", channelMessageCreatedListener);

		return () => {
			socket.off("channelMessagesFound", channelMessageListener);
			socket.off("channelMessageCreated", channelMessageCreatedListener);
		};
	}, [channelMessageCreatedListener]);


	useEffect(() => {
		if (userInfo && selectedChannel &&
			!allChannelsNotJoined.some(notJoinedChannel => notJoinedChannel.id === selectedChannel.id)) {
			console.log("getting channel messages first if");
			socket.emit('GetChannelMessages', { chanId: selectedChannel.id, userId: userInfo.id });
		}
		else if (selectedChannel) {
			console.log("getting channel messages second if");
			setChannelMessages((currentMessages) => {
				return { ...currentMessages, [selectedChannel?.id]: [] };
			});
		}
	}, [userInfo, selectedChannel]);



	//retrieving joined chnnels
	useEffect(() => {
		if (!userInfo) {
			console.log("user is not set");
			return;
		}

		const userId = userInfo.id;

		socket.on('channelsByUserFound', (channels: Channel[]) => {
			setAllChannelsbyUser(channels);
			console.log("channels of the user: ", channels);
		});

		socket.emit('GetChannelsByUser', userId);

		return () => {
			socket.off('channelsByUserFound');
		};
	}, [userInfo]);

	//retrieving not joined channels
	useEffect(() => {
		if (!userInfo) {
			console.log("user is not set");
			return;
		}

		const userId = userInfo.id;

		socket.on('notJoinedChannelsFound', (channels: Channel[]) => {
			setAllChannelsNotJoined(channels);
			// console.log("not joined channels: ", channels);
		});

		socket.emit('GetNotJoinedChannels', userId);

		return () => {
			socket.off('notJoinedChannelsFound');
		};
	}, [userInfo]);

	useEffect(() => {
		console.log('socket: ', socket.id);
	},)


	//listen for notification events

	// TypeScript types

	interface CustomToastProps {
		closeToast: () => void;
		inviterNick: string;
		inviterID: number;
		socket: Socket;
		userInfo: Contact
	}
	// Custom toast component
	const CustomToast: React.FC<CustomToastProps> = ({ closeToast, inviterNick, inviterID, socket, userInfo }) => (
		<div>
			You have been invited to play with {inviterNick}
			<button className="chat-game-btn" onClick={() => {
				if (userInfo) {
					socket.emit('gameConfirmation', { inviter: inviterID, invited: userInfo.id, response: true, inviterNick: inviterNick, invitedNick: userInfo.nickname });
					closeToast();
				}
			}}>Accept</button>
			<button className="chat-game-btn" onClick={() => {
				if (userInfo) {
					socket.emit('gameConfirmation', { inviter: inviterID, invited: userInfo.id, response: false, inviterNick: inviterNick, invitedNick: userInfo.nickname });
				}
				closeToast();
			}}>Reject</button>
		</div>
	);


	useEffect(() => {
		socket.on('youHaveBeenKicked', (channelName) => {
			toast.error(`You have been kicked from the channel '${channelName}', you can contact the channel admin to ask why and refresh your channels to see the change`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});
		socket.on('youHaveBeenMuted', (channelName) => {
			toast.error(`You have been muted in the channel '${channelName}', you can contact the channel admin to ask why and refresh your channels to see the change`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});
		socket.on('youWereBanned', (channelName) => {
			toast.error(`You have been banned from the channel '${channelName}', contact the channel admin to ask why and refresh your channels to see the change`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});
		socket.on('youWereMadeAdmin', (channelName) => {
			toast.success(`You have been granted admin privileges of the channel '${channelName}', congrats! Now you can ban, mute and kick members`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});
		socket.on('youWereRemovedAsAdmin', (channelName) => {
			toast.info(`You have lost admin privileges of the channel '${channelName}', contact the channel owner to ask why`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});

		socket.on('gameAccepted', ({ inviterNick, inviterID, invitedNick, invitedID }) => {
			console.log('inviterNick, inviterID, invitedNick, invitedID: ', inviterNick, inviterID, invitedNick, invitedID);
			toast.info(`${invitedNick} accepted to play with you`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
			console.log('inviterNick',inviterNick);
			console.log('inviteDNick',invitedNick);
			console.log('inviterID',inviterID);
			console.log('invitedID',invitedID);
			setTimeout(() => {
				console.log("BATTLING AGAINST", invitedID)
				startGameSockets('private', invitedID)
			}, 100);
		});

		socket.on('youAcceptedGame', ({ inviterNick, inviterID, invitedNick, invitedID }) => {
			console.log('inviterNick, inviterID, invitedNick, invitedID: ', inviterNick, inviterID, invitedNick, invitedID);
			toast.info(`You accepted to play with ${inviterNick}`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
			console.log('inviterNick',inviterNick);
			console.log('inviteDNick',invitedNick);
			console.log('inviterID',inviterID);
			console.log('invitedID',invitedID);
			setTimeout(() => {
				console.log("BATTLING AGAINST", inviterID)
				startGameSockets('private', inviterID)
			}, 200);
		});

		socket.on('gameRejected', (inviterNick, inviterID, invitedNick, invitedID) => {
			toast.info(`${invitedNick} does not want to play`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});

		socket.on('youRejectedGame', (inviterNick) => {
			toast.info(`You rejected ${inviterNick}'s invitation to play`, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				className: 'custom-toast',
			});
		});

		return () => {
			socket.off('youHaveBeenKicked');
			socket.off('youHaveBeenMuted');
			socket.off('youWereBanned');
			socket.off('youWereMadeAdmin');
			socket.off('youWereRemovedAsAdmin');
			socket.off('gameAccepted');
			socket.off('youAcceptedGame');
			socket.off('gameRejected');
			socket.off('youRejectedGame');
		}
	}, [userInfo]);

	useEffect(() => {
		socket.on('youHaveBeenInvitedToPlay', ({ inviterNick, inviterID }) => {
			if (userInfo) {
				toast.info(
					<CustomToast
						inviterNick={inviterNick}
						inviterID={inviterID}
						socket={socket}
						closeToast={() => toast.dismiss()}
						userInfo={userInfo}
					/>,
					{
						position: "top-center",
						autoClose: false,
						hideProgressBar: false,
						closeOnClick: false,
						pauseOnHover: true,
						draggable: true,
						progress: undefined,
						className: 'custom-toast',
					}
				);
			}
		});

		return () => {
			socket.off('youHaveBeenInvitedToPlay');
		}

	}, [userInfo]);

	// if (!userInfo) {
	// 	// Insert Loading screen
	// 	return <div>Loading... Please wait</div>
	// }


	return (
		<div className={`chat-main-grid ${isOpen ? "open" : "close"}`}>
			{createPortal(<ToastContainer />, document.body)}
			<div className="manage-rooms">
				<DmHandler {...{ allUsers, userInfo, setAllUsers, setSelectedContact, setSelectedChannel, socket }} />
				<ChatChannels {...{ userInfo, allChannelsbyUser, allChannelsNotJoined, setAllChannelsNotJoined, setAllChannelsbyUser, setSelectedChannel, socket, setSelectedContact }} />
			</div>
			<div className="chatbox">
				<ChatHeader selectedChannel={selectedChannel} selectedContact={selectedContact} setIsOpen={setIsOpen} userInfo={userInfo} socket={socket}/>
				<div className='chat-messages' id="chat-messages">
					{selectedContact && <Messages key={JSON.stringify(selectedContact)} messages={allMessages || []} userInfo={userInfo} selectedContact={selectedContact} />}
					{/* {selectedChannel && <Messages key={selectedChannel} messages={allChannelMessages || []} userInfo={userInfo} selectedChannel={selectedChannel}/>} */}
					{selectedChannel && <Messages key={JSON.stringify(selectedChannel)} messages={channelMessages[selectedChannel.id] || []} userInfo={userInfo} selectedChannel={selectedChannel} />}
				</div>
				<div className='chat-input-text'>
					<MessageInput sendMessage={SendMessage} userInfo={userInfo} selectedContact={selectedContact} selectedChannel={selectedChannel} />
				</div>
			</div>
			<div className={`contact-info ${isOpen ? "open" : "close"}`}>
				<HeaderContactInfo userInfo={userInfo} selectedChannel={selectedChannel} selectedContact={selectedContact} socket={socket} />
				<div className='body-contact'>
					{(selectedContact || selectedChannel) && <ChatInfo userInfo={userInfo} selectedChannel={selectedChannel} selectedContact={selectedContact} socket={socket} />}
				</div>
			</div>
		</div>
	);
}

export default Chat;