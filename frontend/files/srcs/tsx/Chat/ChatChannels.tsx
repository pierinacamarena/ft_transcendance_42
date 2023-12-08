import React, { useState, useEffect } from "react";
import { BsSearchHeart } from "react-icons/bs";
import { BsPlusCircle } from "react-icons/bs";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { FiRefreshCw } from "react-icons/fi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import "../../css/Chat/ChannelCreate.css"
import { ChatChannelsProps, Channel, Contact } from './types.ts'

export default function ChatChannels({
    userInfo,
    allChannelsbyUser,
    allChannelsNotJoined,
    setAllChannelsNotJoined,
    setAllChannelsbyUser,
    setSelectedChannel,
    setSelectedContact,
    socket} : ChatChannelsProps)
{   
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [channel, setChannel] = useState("");
    const [incompleteFormMessage, setIncompleteFormMessage] = useState("");
    /*members*/
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<{id: number; nickname: string; avatarFilename: string} | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<{id: number; nickname: string; avatarFilename: string}[]>([]);
    const [matchedUsers, setMatchedUsers] = useState<{id: number; nickname: string; avatarFilename: string}[]>([]);
    const [members, setMembers] = useState<{id: number; nickname: string; avatarFilename: string}[]>([]);
    /*name*/
    const [newChannelName, setNewChannelName] = useState("");
    /*type*/
    const [channelType, setChannelType] = useState("");
    const [password, setPassword] = useState("");
    /*channelsDisplay*/
    const [showChannelsbyUser, setShowChannelsByUser] = useState(true);
    const [selectedOption, setSelectedOption] = useState('Joined');
    const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
    /*channel join*/
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [channelToJoin, setChannelToJoin] = useState<Channel | null>(null);

    const handleSubmitNewChannel = (e: any) =>
    {
        e.preventDefault();
        if (newChannelName === "" || channelType === "" || (channelType === 'PROTECTED' && password === "")) {
            setIncompleteFormMessage("There are missing fields");
            return;
        }
        setIncompleteFormMessage("");
        if (!userInfo) {
            console.log("handleSubmitNewChannel: no userInfo");
            return;
        }
        socket.emit('createChannel', {
            name: newChannelName,
            userId: userInfo.id,
            type: channelType,
            psswd: password
        });

        socket.once('channelCreated', (channel: any) => {
            console.log("channel received: ", channel);
            const channelId = channel.id;
            console.log('channelid sent from front: ', channelId )
            members.forEach((member) => {
                socket.emit('joinChannel', { chanID: channelId, userID: member.id });
            });
            toast.success(`You created the channel '${newChannelName}'! if you dont see it, you can refrsh your channels`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            })

        });
        setNewChannelName("");
        setSelectedUsers([]);
        setMembers([]);
        setIsModalOpen(false);
        setChannelType("");

    }

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setSelectedUser(null);
    }

    useEffect(() => {
        console.log('receiving users that start by');
        socket.on('usersStartByFound', (users: {id: number; nickname: string; avatarFilename: string}[]) => {
            setMatchedUsers(users);
        });

        // Clean up when component unmounts
        return () => {
            socket.off('usersStartByFound');
        };
    }, []);

    const handleMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        console.log('getting users that start by');
        if (!userInfo) {
            console.log('handleMembersChange:  no userInfo');
            return;
        }
        console.log('user.id: ', userInfo.id);
        socket.emit('getUserStartsBy', {startBy: e.target.value, userId: userInfo.id});
    }

    const handleSelectUser = (user: {id: number; nickname: string; avatarFilename: string}) => {
        console.log('adding or removing selected member from channel');
      
        if (members.some(member => member.id === user.id)) {
            setMembers(members.filter(member => member.id !== user.id));
        } else {
            setMembers([...members, user]);
        }
      
        if (selectedUsers.some(selectedUser => selectedUser.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(selectedUser => selectedUser.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
        console.log('channel members: ', members);
    }

    const handleJoinChannel = (channel: Channel) => {
        setChannelToJoin(channel);
        if (channel.type === 'PUBLIC'){
            if(userInfo){
                socket.emit("joinChannel", {chanID: channel.id, userID: userInfo.id});
            }
        }
        else if (channel.type == "PROTECTED") {
            setIsPasswordPromptOpen(true);
        }
        else if (channel.type == "PRIVATE") {
            toast.error(`You cannot join a private channel`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            });
        };

        return () => {
            socket.off('userIsBanned');
        };
    };

    const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("inside handlePasswordSubmit");
        if(channelToJoin && userInfo) {
            console.log("going to emit socket event to join private channel")
            socket.emit("joinProtectedChannel", {
                chanID: channelToJoin.id,
                userID: userInfo.id,
                password: passwordInput
            });
            socket.once('userIsBanned', (channelName) => {
                toast.error(`'You cannot join the channel '${channelName}'`, {
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
        }
        setIsPasswordPromptOpen(false);
        setPasswordInput("");

        return () => {
            socket.off('userIsBanned');
        };
    };
    
    /**
     * 
     */

    const fetchChannels = () => {
        if (!userInfo) {
            console.log("user is not set");
            return;
        }
    
        const userId = userInfo.id;
    
        const getChannelsByUser = () => {
            socket.once('channelsByUserFound', (channels: Channel[]) => {
                setAllChannelsbyUser(channels);
                // console.log("channels of the user: ", channels);
            });
    
            socket.emit('GetChannelsByUser', userId);
        };
    
        const getNotJoinedChannels = () => {
            socket.once('notJoinedChannelsFound', (channels: Channel[]) => {
                setAllChannelsNotJoined(channels);
                // console.log("not joined channels: ", channels);
            });
    
            socket.emit('GetNotJoinedChannels', userId);
        };
    
        getChannelsByUser();
        getNotJoinedChannels();
    };
    
    useEffect(() => {
        fetchChannels();

        socket.on('joinnedRoom', (channelName) => {
            fetchChannels();
            toast.success(`'You have joined the channel '${channelName}'`, {
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

        socket.on('joinnedProtectedChannel', (channelName) => {
            fetchChannels();
            toast.success(`'You have joined the channel '${channelName}'`, {
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

        socket.on('memberBanned', (channelName) => {
            fetchChannels();
        });
        
        socket.on('youWereBanned', (channelName) => {
            fetchChannels();
        });

        socket.on('memberKicked', (channelName) => {
            fetchChannels();
        });
        
        socket.on('youHaveBeenKicked', (channelName) => {
            fetchChannels();
        });

        // socket.on('youLeftChannel', (channelName) => {
        //     fetchChannels();
        //     console.log("all channels by user", allChannelsbyUser);
        //     console.log("all channels not jouned", allChannelsNotJoined);
        //     // fetchChannels();
        // });
        
        socket.on('youLeftChannel', async (channelName) => {
            // Process "left" event...
            // Once done, fetch channels again
            await fetchChannels();
        });

        socket.on('EmptyChannelDeleted', () => {
            fetchChannels();
        });

        socket.on('chanTypeChanged', () => {
            fetchChannels();
        });

        socket.on('failedToCreateChannel', (channelName) => {
            toast.error(` ${channelName} could not create channel`, {
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

        socket.on('channelDeleted', (chanName) => {
            fetchChannels();
			toast.info(` ${chanName}was deleted`, {
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

        socket.on('userIsBanned', (channelName) => {
            toast.error(`'You cannot join the channel '${channelName}'`, {
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

        socket.on('wrongPassword', (channelName) => {
            toast.error(`'Wrong password for channel '${channelName}'`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            });
        })

        return () => {
            socket.off('channelsByUserFound');
            socket.off('notJoinedChannelsFound');
            socket.off('joinnedProtectedChannel');
            socket.off('joinnedRoom');
            socket.off('memberBanned');
            socket.off('youWereBanned');
            socket.off('memberKicked');
            socket.off('youHaveBeenKicked');
            socket.off('channelDeleted');
            socket.off('youLeftChannel');
            socket.off('failedToCreateChannel');
            socket.off('EmptyChannelDeleted');
            socket.off('userIsBanned');
            socket.off('wrongPassword');
            socket.off('chanTypeChanged');

        };
    }, [userInfo]);
    
    const handleClick = (option: string) => {
        setSelectedOption(option);
        setShowChannelsByUser(option === 'Joined');
    };

    return (
    <div className='channels'>
        <div className="Chan-title">
            <h1>
               [Channels] 
            </h1>
            <button className="Chan-refresh-btn" onClick={fetchChannels}>
                <FiRefreshCw/>
            </button>
        </div>
        <div className="Chan-find">
            <button className="Chan-find-btn" onClick={handleOpenModal}>
                <BsPlusCircle/>
            </button>
        </div>
        <div className="Chan-all-channels">
            <div className="chan-show-btns">
                <button className={`chan-show-btn ${selectedOption === 'Joined' ? "selected" : ""}`} 
                        onClick={() => handleClick('Joined')}>
                    Joined
                </button>
                <button className={`chan-show-btn ${selectedOption === 'Not Joined' ? "selected" : ""}`} 
                        onClick={() => handleClick('Not Joined')}>
                    Not Joined
                </button>
            </div>
            {(showChannelsbyUser ? allChannelsbyUser : allChannelsNotJoined).map((channel) => (
                <div key={channel.id} className={`channel-container ${selectedChannelId === channel.id ? 'selected' : ''}`}>
                    <button className="channel-btn" key={channel.id} onClick={() => {
                        setSelectedChannelId(channel.id);
                        setSelectedChannel(channel);
                        setSelectedContact(null);
                    }}>
                        {channel.name}
                    </button>
                    {!showChannelsbyUser && (
                        <button className="word-btn" onClick={() => handleJoinChannel(channel)}>
                                Join
                        </button>
                    )}
                </div>
            ))}
        </div>
        <Modal
          isOpen={isPasswordPromptOpen}
          ariaHideApp={false}
          onRequestClose={() => setIsPasswordPromptOpen(false)}
          className="modal-chan-psswd"
          overlayClassName="overlay-chan-psswd"
        >
          <div className="chan-psswd">
            <div className="title-chan-psswd">
                <h2>Enter Password</h2>
            </div>
            <div className="form-chan-psswd">
                <form onSubmit={handlePasswordSubmit}>
                    <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    />
                    <button className="chan-create-btn" type="submit">Join</button>
                </form>
            </div>
            <div className="close-chan-psswd">
                <button className="chan-create-btn" onClick={() => setIsPasswordPromptOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
        <Modal 
            isOpen={isModalOpen}
            ariaHideApp={false}
            onRequestClose={() => {
                setIsModalOpen(false);
                setSelectedUsers([]);
                setMembers([]);
            }}
            className="modal-chan-create"
            overlayClassName="overlay-chan-create"
        >
            <div className="chan-create-grid">
                <div className="create-title">
                    <h2>Create a new channel</h2>
                </div>
                <form className="create-form" onSubmit={handleSubmitNewChannel}>
                    <div className="create-name">
                        <input 
                            onChange={(e)=>setNewChannelName(e.target.value)}
                            placeholder="New channel name..."
                            value={newChannelName}
                        />
                    </div>
                    <div className="select-members">
                        <input 
                            onChange={handleMembersChange}
                            placeholder="Add members"
                            value={searchQuery}
                        />
                        {/* Dropdown */}
                        {matchedUsers.length > 0 && (
                            <div
                                className="select-members-dropdown">
                                {matchedUsers.map(user => (
                                    <div 
                                        key={user.id}
                                        className={`select-members-dropdown-item ${selectedUsers.find(selectedUser => selectedUser.id == user.id)? 'selected' : ''}`}
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        {user.nickname}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="select-type">
                        <select className="channel-select"
                            onChange={(e)=>setChannelType(e.target.value)}
                            value={channelType} >
                            <option value="" disabled>Select channel type</option>
                            <option value="PRIVATE">Private</option>
                            <option value="PUBLIC">Public</option>
                            <option value="PROTECTED">Protected</option>
                        </select>
                        {channelType === 'PROTECTED' && 
                        <div className="chan-password-input">
                            <input 
                                type="password"
                                onChange={(e)=>setPassword(e.target.value)}
                                placeholder="Enter password"
                                value={password}
                            />
                        </div>}
                    </div>
                    {incompleteFormMessage && (
                        <div className="form-error-message">
                            {incompleteFormMessage}
                        </div>
                        )}
                </form>
                <div className="chan-create-submit">
                    <button className="chan-create-btn" type="submit" onClick={handleSubmitNewChannel}>Create Channel</button>
                </div>
            </div>
        </Modal>
    </div>
    )
}


            {/* <div className="Chan-find-text">
                <input 
                    onChange={(e)=>setChannel(e.target.value)}
                    placeholder="Search channel"
                    value={channel}
                />
            </div>
            <button className="Chan-find-btn">
                <BsSearchHeart/>
            </button> */}
            {/* <div className="Chan-find-text">
                <input 
                    onChange={(e)=>setNewChannelName(e.target.value)}
                    placeholder="Type new channel name"
                    value={newChannelName}
                />
            </div> */}
