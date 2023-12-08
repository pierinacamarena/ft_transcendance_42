import React, { useState, useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { GiBootKick } from "react-icons/gi";
import { FaBan } from "react-icons/fa";
import { BiVolumeMute } from "react-icons/bi";
import { GiConfirmed } from "react-icons/gi";
import { GiCancel } from "react-icons/gi";
import { FaUserTie } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa";
import Modal from 'react-modal';
import "../../css/Chat/ChannelCreate.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createPortal } from 'react-dom';
import {ChanMember,Contact} from './types.ts';
import { Socket } from "socket.io-client"

interface RenderButtonsProps {
    member: ChanMember;
    userIsAdmin:boolean;
    isOwner: boolean
    userInfo: Contact;
    socket: Socket;
}

export default function RenderButtons({member, userIsAdmin, isOwner, userInfo, socket} : RenderButtonsProps){

    console.log("RenderButtons props: member, isAdmin, isOwner, userInfo: ", {member, userIsAdmin, isOwner, userInfo});

    const [muteDuration, setMuteDuration] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [memberIsUser, setMemberIsUser] = useState<boolean>(false);
    const [isKicked, setIsKicked] = useState<boolean>(false);
    const [isBanned, setIsBanned] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [memberIsChanAdmin, setMemberIsChanAdmin] = useState<boolean>(member.isAdmin);

    useEffect(() => {
        setMemberIsUser(member.member === userInfo.id);
        setMemberIsChanAdmin(member.isAdmin);
    }, [member, userInfo]);  
    
    // useEffect(() => {
    //     setMemberIsUser(member.member === userInfo.id);
    // }, [member, userInfo]);      

    const handleMakeAdmin = () => {
        console.log("MAKEADMINBUTTONPRESSED");
        if (!memberIsChanAdmin) {
            socket.emit('makeMemberAdmin', {chanOwnerId: userInfo.id, chanId: member.chanId, memberId: member.member});
            socket.once('newAdminInRoom', () => {
                setMemberIsChanAdmin(true);
                toast.success(`Member has been made admin`, {
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
        else {
            toast.error(`Member is already admin`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            });
        }
    }

    const handleRemoveAdmin = () => {
        console.log("REMOVEADMINPRESSED");
        if (memberIsChanAdmin) {
            socket.emit('removeAdminPriv', {chanOwnerId: userInfo.id, chanId: member.chanId, memberId: member.member});
            socket.once('succededInRemovingMemberAdmin', () => {
                setMemberIsChanAdmin(false);
                toast.info(`Member lost admin privileges`, {
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
        else {
            toast.error(`Member doesn't have admin privileges`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            });
        }

    }

    const handleKick = () => {
        socket.emit('kickMember', {chanId: member.chanId, memberToKickId: member.member, adminId: userInfo.id});
        socket.once('memberKicked', () => {
            setIsKicked(true);
            toast.info(`Member has been kicked`, {
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

    const ConfirmBanToast = ({ closeToast, userInfo, member, socket } : 
        { closeToast?: () => void, userInfo: any, member: any, socket: Socket }) => (
        <div>
            This is irreversible, are you sure?
            <button className="chat-game-btn" onClick={() => {
                socket.emit('banMember', {
                    chanId: member.chanId,
                    memberToBanId: member.member,
                    adminId: userInfo.id});
                socket.once('memberBanned', () => {
                        toast.info(`Member has been banned`, {
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
                closeToast && closeToast();
                }}>
                    Confirm
            </button>
            <button className="chat-game-btn" onClick={() => closeToast && closeToast()}>
                Cancel
            </button>
        </div>
    );

    const handleBan = () => {
        if (member && userInfo) {
            toast(props => <ConfirmBanToast {...props} userInfo={userInfo} member={member} socket={socket} />, {
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

    const handleMute = () => {
        setIsModalOpen(true);
    }

    const confirmMute = () => {
        setIsModalOpen(false);
        socket.emit('muteMember', {chanId: member.chanId, memberToMuteId: member.member, adminId: userInfo.id, muteDuration: muteDuration});
        socket.once('memberMuted', () => {
            toast.info(`Member has been muted for ${muteDuration} minutes`, {
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

    const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);

        if (value >= 0) {
            setMuteDuration(value);
        }
        else {
            toast.error(`Mute duration is not valid, only positive values`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: 'custom-toast',
            });
        }
    }


    console.log("isAdmin: ", userIsAdmin);
    if (userIsAdmin || isOwner) {
        return (
            <div className="admin-action-button">
                <button className="member-action-btn" onClick={handleKick}>
                    <GiBootKick/>
                </button>
                <button className="member-action-btn" onClick={handleBan}>
                    <FaBan/>
                </button>
                <button className="member-action-btn" onClick={handleMute}>
                    <BiVolumeMute/>
                </button>
                {isOwner && !memberIsUser && !member.isAdmin &&
                    <button className="word-btn" onClick={handleMakeAdmin}>
                        MakeAdmin
                    </button>
                }
                {isOwner && !memberIsUser && member.isAdmin &&
                    <button className="word-btn" onClick={handleRemoveAdmin}>
                        RemoveAdmin
                    </button>
                }
                <Modal 
                    isOpen={isModalOpen}
                    className="modal-mute-member"
                    ariaHideApp={false}
                    overlayClassName="overlay-mute-member"
                >
                    <div className="title-mute-duration">
                        <h2>Enter mute duration(minutes)</h2>
                    </div>
                    <div className="body-mute-duration">
                        <input 
                            type="number"
                            value={muteDuration}
                            onChange={handleDurationChange}
                        />
                        <button className="member-action-btn" onClick={confirmMute}>
                            <GiConfirmed/>
                        </button>
                        <button className="member-action-btn" onClick={() => setIsModalOpen(false)}>
                            <GiCancel/>
                        </button>
                    </div>
                </Modal>
            </div>
        )
    }
    return null;
}
