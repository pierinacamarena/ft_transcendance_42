
import React, { useState, useEffect, useCallback } from "react";
import { FiRefreshCw } from "react-icons/fi";

import Modal from 'react-modal';
import "../../css/Chat/ChannelCreate.css";
import RenderButtons from './RenderButtons.tsx';
import ContactInfo from "./ContactInfo.tsx";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createPortal } from 'react-dom';
import {
    User,
    Contact,
    ChanMember,
    ChatInfoProps,
    Channel
} from './types.ts'
import { Socket } from "socket.io-client"

interface renderMemberStatusObj {
    member: ChanMember;
    membersStatus: Map<number, boolean>;
    userIsAdmin: boolean;
    isOwner: boolean;
    userInfo: Contact;
    socket: Socket;
    selectedChannel: Channel;
}

function renderMemberStatus({member, membersStatus, userIsAdmin, isOwner, userInfo, socket, selectedChannel} : renderMemberStatusObj) {
    const status = membersStatus.get(member.member);

    return (
        <div className="member-status">
            <span className={`status-indicator ${status ? 'online' : 'offline'}`}></span>
            {member.memberRef.nickname}
            {member.member === selectedChannel.chanOwner && <span className="status-label">👑 owner</span>}
            {(member.member != selectedChannel.chanOwner) && (member.isAdmin) && <span className="status-label">🌟 admin</span>}
            {(member.member != userInfo.id ) && (selectedChannel.chanOwner != member.member) && <RenderButtons member={member} userIsAdmin={userIsAdmin} isOwner={isOwner} userInfo={userInfo} socket={socket} />}
        </div>
    );
}

export default function ChatInfo({ userInfo, selectedChannel, selectedContact, socket }: ChatInfoProps) {
    const [contactStatus, setContactStatus] = useState<boolean>(false);
    const [channelState, setChannelState] = useState({
        userIsAdmin: false,
        isMember: false,
        isOwner: false,
        members: [] as ChanMember[],
        membersStatus: new Map<number, boolean>(),
    });

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [searchNonMemberQuery, setSearchNonMemberQuery] = useState('');
    const [matchedNonMembers, setMatchedNonMembers] = useState([]);
    const [selectedNonMembers, setSelectedNonMembers] = useState([]);

    const fetchMembersData = useCallback(() => {
        if (selectedChannel && userInfo && !selectedContact) {
            socket.emit('GetChannelMembers', { chanId: selectedChannel.id, userId: userInfo?.id });

            socket.on('MembersofChannelFound', (members) => {
                setChannelState(prevState => ({ ...prevState, members }));

                members.forEach((member: ChanMember) => {
                    socket.emit('getUserStatus', { userId: userInfo?.id, memberId: member.member });
                });
            });

            socket.on('foundUserStatus', (data) => {
                setChannelState(prevState => ({
                    ...prevState,
                    membersStatus: new Map(prevState.membersStatus).set(data.memberId, data.status)
                }));
            });

            socket.emit('isMemberAdmin', { chanId: selectedChannel?.id, memberId: userInfo.id, userId: userInfo.id });

            socket.on('foundAdminStatus', (data) => {
                console.log('isAdmin?: ', data);
                setChannelState(prevState => ({
                    ...prevState,
                    userIsAdmin: data
                }));
            });

            socket.emit('isChanOwner', { chanId: selectedChannel?.id, memberId: userInfo.id, userId: userInfo.id });

            socket.on('foundOwnerStatus', (data) => {
                setChannelState(prevState => ({
                    ...prevState,
                    isOwner: data
                }));
            });

            socket.emit('isMember', { chanId: selectedChannel?.id, memberId: userInfo.id, userId: userInfo.id });

            socket.on('foundIsMember', (data) => {
                setChannelState(prevState => ({
                    ...prevState,
                    isMember: data
                }));
            });
            return () => {
                socket.off('MembersofChannelFound');
                socket.off('foundUserStatus');
                socket.off('foundAdminStatus');
                socket.off('foundOwnerStatus');
                socket.off('foundIsMember');
            }
        }
    }, [selectedChannel, userInfo, selectedContact]);

    useEffect(() => {
        fetchMembersData();

        socket.on('memberBanned', (channelName) => {
            fetchMembersData();
        });

        socket.on('userLeftChannel', (channelName) => {
            fetchMembersData();
        });

        socket.on('userJoinnedRoom', (channelName) => {
            fetchMembersData();
        });

        socket.on('joinnedRoom', (channelName) => {
            fetchMembersData();
        });

        socket.on('joinnedProtectedChannel', (channelName) => {
            fetchMembersData();
        });

        socket.on('youWereBanned', (channelName) => {
            fetchMembersData();
        });

        socket.on('memberKicked', (channelName) => {
            fetchMembersData();
        });

        socket.on('youHaveBeenKicked', (channelName) => {
            fetchMembersData();
        });

        socket.on('youWereMadeAdmin', (channelName) => {
            fetchMembersData();
        });

        socket.on('youWereRemovedAsAdmin', (channelName) => {
            fetchMembersData();
        });

        socket.on('succededInMakingMemberAdmin', (channelName) => {
            fetchMembersData();
        });

        socket.on('succededInRemovingMemberAdmin', (channelName) => {
            fetchMembersData();
        });

        socket.on('channelDeleted', (chanName) => {
            fetchMembersData();
		});

        socket.on('EmptyChannelDeleted', (chanName) => {
            fetchMembersData();
		});

        return () => {
            socket.off('memberBanned');
            socket.off('joinnedRoom');
            socket.off('joinnedProtectedChannel');
            socket.off('youWereBanned');
            socket.off('memberKicked');
            socket.off('youHaveBeenKicked');
            socket.off('youWereMadeAdmin');
            socket.off('youWereRemovedAsAdmin');
            socket.off('succededInMakingMemberAdmin');
            socket.off('succededInRemovingMemberAdmin');
            socket.off('userLeftChannel');
            socket.off('EmptyChannelDeleted');
            socket.off('userJoinnedRoom');
        }
    }, [fetchMembersData]);


    const handleLeaveChannel = () => {
        if (selectedChannel && userInfo) {
            socket.emit('leaveChannel', { chanId: selectedChannel.id, userId: userInfo.id });
            socket.once('youLeftChannel', (data) => {
                toast.info(`'${data.user_nickname}', you have left the channel '${data.chan_name}'`, {
                    position: "top-right",
                    autoClose: 50000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    className: 'custom-toast',
                })
                fetchMembersData();
            });
        }
    }

    // Modify your toast to accept these props
    const ConfirmDeleteToast = ({ closeToast, userInfo, selectedChannel, socket } : 
        { closeToast?: () => void, userInfo: any, selectedChannel: any, socket: Socket }) => (
        <div>
            Are you absolutely sure?
            <button className="chat-game-btn" onClick={() => {
                socket.emit('deleteChannel', {
                userId: userInfo.id,
                chanId: selectedChannel.id,
                chanName: selectedChannel.name,
                });
                closeToast && closeToast();
                }}>
                    Delete
            </button>
            <button className="chat-game-btn" onClick={() => closeToast && closeToast()}>
                Cancel
            </button>
        </div>
    );


    const handleDeleteChannel = () => {
        if (selectedChannel && userInfo && channelState.isOwner) {
        toast(props => <ConfirmDeleteToast {...props} userInfo={userInfo} selectedChannel={selectedChannel} socket={socket} />, {
            position: "top-center",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            toastId: "confirmDelete",
            closeButton: false,
            className: 'custom-toast-delete',
        });
        }
    }

    return (
        <div className="chat-info">
            {/* {selectedChannel && channelState.isMember && (<div className="add-members-channel">
                <button className="word-btn" onClick={handleAddMembers}>
                    Add Members
                </button>
            </div>)} */}
            {selectedChannel && channelState.isMember && (<div className="leave-channel">
                <button className="word-btn" onClick={handleLeaveChannel}>
                    Leave Channel
                </button>
            </div>)}
            {selectedChannel && channelState.isMember && channelState.isOwner && (<div className="leave-channel">
                <button className="word-btn" onClick={handleDeleteChannel}>
                    Delete Channel
                </button>
            </div>)}
            {selectedChannel && <div className="members-title">
                <h1>
                    {selectedChannel.name}'s Members
                </h1>
                <button className="Chan-refresh-btn" onClick={fetchMembersData}>
                    <FiRefreshCw />
                </button>
            </div>}
            <div className="conversation-info">
                {channelState.isMember && !selectedContact && selectedChannel && userInfo && channelState.members.map(member =>
                    <div key={member.member}>
                        {renderMemberStatus({
                            member: member,
                            membersStatus: channelState.membersStatus,
                            userIsAdmin: channelState.userIsAdmin,
                            isOwner: channelState.isOwner,
                            userInfo: userInfo,
                            socket: socket,
                            selectedChannel: selectedChannel
                        })}
                    </div>)}
                {selectedContact &&
                    <div>
                        <ContactInfo selectedContact={selectedContact} userInfo={userInfo} socket={socket} />
                    </div>
                }
            </div>
        </div>
    );
}


                // channelState.members.map(member =>
                //     <div>
                //         {renderMemberStatus}
                //         {/* {renderMemberStatus(member, channelState.membersStatus, channelState.userIsAdmin, channelState.isOwner, userInfo, socket)} */}
                //     </div>
                // )

    // const handleAddMembers = () => {
    //     //i need to open a modal 
    //     //then i need to get all users
    //     //filter the users that are not members
    //     //display those users
    //     //select users to make members
    //     //then i need to trigger the socket event to add all these users
    //     //on my chat have a listener for the event youHaveBeenAddedToChannel
    //     //on success display notification members were added to channel
    //     console.log("WILL ADD MEMBERS");
    // };