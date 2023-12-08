import React, { useState, useEffect } from "react";
import { GrUserExpert } from "react-icons/gr";
import { FaUserSlash } from "react-icons/fa";
import Modal from 'react-modal';
import "../../css/Chat/ChannelCreate.css";
import { Socket } from "socket.io-client"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createPortal } from 'react-dom';
import { ContactInfoProps } from './types.ts'
import { Routes, Route, useLocation, NavLink, useNavigate } from 'react-router-dom'


export default function ContactInfo({ selectedContact, userInfo, socket }: ContactInfoProps) {

    const [isBlocked, setIsBlocked] = useState<boolean>(false);

    useEffect(() => {
        if (selectedContact && userInfo && selectedContact.id != userInfo.id) {
            console.log("ENTERED IS BLOCKED IF");
            function fetchData() {
                socket.emit('userIsBlocked', { blockerID: userInfo?.id, blockeeID: selectedContact.id });
                socket.once('blockInfo', (data) => {
                    setIsBlocked(data);
                });
            }
            fetchData();
        }
        console.log("isBlocked: ", isBlocked);
    }, [selectedContact]);

    const handleInvite = () => {
        console.log("WILL INVITE TO PLAY");
        if (userInfo && selectedContact) {
            socket.emit('gameInvitation', {inviter: userInfo.id, invited: selectedContact.id, inviterNick: userInfo.nickname, invitedNick: selectedContact.nickname});
            socket.once('playInvitationSend', (data) => {
                toast.success(`${data} was was invited to play, if he/she/they accept, you will receive a notification`, {
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
    };

    const handleBlock = () => {
        if (selectedContact && userInfo && !isBlocked) {
            socket.emit('blockUser', { blockerID: userInfo.id, blockeeID: selectedContact.id })
            socket.once('userBlocked', () => {
                setIsBlocked(true);
                toast.info(`${selectedContact.nickname} was blocked`, {
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
            toast.error(`${selectedContact.nickname} could not be blocked`, {
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
    };

    const handleUnblock = () => {
        console.log("isBlocked: ", isBlocked);
        if (selectedContact && userInfo && isBlocked) {
            socket.emit('unblockUser', { blockerID: userInfo.id, blockeeID: selectedContact.id })
            socket.once('userUnblocked', () => {
                setIsBlocked(false);
                toast.success(`${selectedContact.nickname} was unblocked :)`, {
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
            toast.error(`${selectedContact.nickname} could not be unblocked`, {
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

    };

    const navigate = useNavigate();

    const handleProfile = () => {
        navigate(`/profile/${selectedContact.id}`);
    };

    return (
        <div>
            {(userInfo?.id != selectedContact.id) &&  <div className="selected-contact-info">
                <div className="block-unblock">
                    {isBlocked ? (
                        <button className="profile-icon-btn" onClick={handleUnblock}>
                            <GrUserExpert /> Unblock
                        </button>
                    ) : (
                        <button className="profile-icon-btn" onClick={handleBlock}>
                            <FaUserSlash /> Block
                        </button>
                    )}
                </div>
                <div className="profile-view">
                    <button className="profile-word-btn" onClick={handleProfile}>
                        View Profile
                    </button>
                </div>
                <div className="invite-play">
                    <button className="profile-word-btn" onClick={handleInvite}>
                        Invite to Play
                    </button>
                </div>
            </div>}
            { (userInfo?.id === selectedContact.id) && <div>
                <div className="user-profile-view">
                    <button className="profile-word-btn" onClick={handleProfile}>
                        View Profile
                    </button>
                </div>
            </div>}

        </div>
    )
}
