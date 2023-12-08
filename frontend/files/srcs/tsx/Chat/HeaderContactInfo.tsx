import React, { useState, useEffect } from "react";
import defaultPhoto from "../../resources/assets/ui/kitty.png";
import { AiOutlineEdit } from "react-icons/ai";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { ToastContainer, toast } from 'react-toastify';
import { ftFetch } from '../Root.tsx';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';
import PasswordPrompt from './ChanPasswordPrompt.tsx'
import {
    HeaderContactInfoProps
} from './types.ts'

export default function HeaderContactInfo ({photo = defaultPhoto, userInfo, selectedChannel, selectedContact, socket}: HeaderContactInfoProps) {
    
    const [chatPhoto, setChatPhoto] = useState("");
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [newChatType, setNewChatType] = useState<string>("");
    const [password, setPassword] = useState<string | null>(null);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [chatName, setChatName] = useState<string>("No conversation selected");
    const [chanType, setChanType] = useState<string>("");
    const [passwordInput, setPasswordInput] = useState("");
    const [mode, setMode] = useState<"setTypeProtected" | "changePassword" | null>(null);

    useEffect(() => {
        if(userInfo) {
            if (!selectedChannel && !selectedContact) {
                ftFetch(`/avatars/${userInfo.avatarFilename}`, undefined, undefined, 'img')
                    .then(x => {
                        setChatPhoto(URL.createObjectURL(x));
                        console.log("Image blob: ", x);
                    })
                    .catch(x => console.error('HeaderContactInfo selectedContact:', x));
            }
        }
    }, [userInfo])

    useEffect(() => {
        if(selectedChannel) {
            console.log("channelType: ", selectedChannel.type);
            setChatName(selectedChannel.name);
            setChanType(selectedChannel.type);
            setChatPhoto(defaultPhoto);
            setShowDropdown(false);
        }
        else if (selectedContact) {
            setChatName(selectedContact.nickname);
            ftFetch(`/avatars/${selectedContact.avatarFilename}`, undefined, undefined, 'img')
                .then(x => {
                    setChatPhoto(URL.createObjectURL(x));
                    console.log("Image blob: ", x);
                })
                .catch(x => console.error('HeaderContactInfo selectedContact:', x));
        }
    }, [selectedChannel, selectedContact]);

    useEffect(() => {
        if (selectedChannel && userInfo) {
            socket.emit('isChanOwner', {chanId: selectedChannel.id, memberId: userInfo.id, userId:userInfo.id});
            socket.emit('isMember', {chanId: selectedChannel.id, memberId: userInfo.id, userId:userInfo.id});
        }
        socket.on('foundOwnerStatus', (data) => {
            setIsOwner(data);
        });
        socket.on('foundIsMember', (data) => {
            setIsMember(data);
        })
        return () => {
            socket.off('foundOwnerStatus');
            socket.off('foundIsMember');
        }
    }, [userInfo, selectedChannel, showDropdown]);
    

    useEffect(() => {
        const chanTypeChangeListener = (confirmedChanType: string) => {
            setNewChatType(confirmedChanType);
            setChanType(confirmedChanType);
            toast.success(`The channel type has been changed to '${confirmedChanType} :D`, {
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
        socket.on('chanTypeChanged', chanTypeChangeListener);
        return () => {
            socket.off('chanTypeChanged');
        }
    });

    useEffect(() => {
        const chanPasswordChangeListener = () => {
            if (selectedChannel) {
                toast.success(`You have changed the password of channel '${selectedChannel.name} :D`, {
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
        socket.on('chanPasswordChangeSuccessful', chanPasswordChangeListener);
        return () => {
            socket.off('chanPasswordChangeSuccessful');
        }
    }, [selectedChannel]);

    const handleEditChatName = () => {
        console.log('will change channel name');
    };

    const handleEditPassword =() => {
        if (selectedChannel && userInfo && selectedChannel.type === 'PROTECTED'){
            setMode('changePassword');
            setShowPasswordPrompt(true);
        }
    }

    const handleEditChatType = (newType: string) => {
        if (newType === "PROTECTED") {
            setMode('setTypeProtected');
            setShowPasswordPrompt(true);    
        } else {
            setNewChatType(newType);
            setChannelType(newType);
        }
    };

    const setChannelType = (newType: string) => {
        if (selectedChannel && userInfo && isOwner){
            console.log('meow');
            if (newType === 'PROTECTED') {
                socket.emit('setChannelType', {userId: userInfo.id, chanId: selectedChannel.id, newChanType: newType, password: passwordInput});
            }
            else {
                socket.emit('setChannelType', {userId: userInfo.id, chanId: selectedChannel.id, newChanType: newType, password: password});
            }
            setShowDropdown(false);
        }
    };

    const closePrompt = () => {
        setShowPasswordPrompt(false);
    };

    const handleTypePasswordSubmit = (event: any) => {
        event.preventDefault();
        if (selectedChannel && userInfo && isOwner) {
            if(mode === 'setTypeProtected') {
                socket.emit('setChannelType', {userId: userInfo.id, chanId: selectedChannel.id, newChanType: 'PROTECTED', password: passwordInput});
            } else if(mode === 'changePassword') {
                socket.emit('setNewPasswd', {chanId: selectedChannel.id, userId: userInfo.id, newPasswd: passwordInput});
            }
        }
        setMode(null);
        setPasswordInput("");
        closePrompt();
    }

    return(
        <div className='header-contact'>
            <div className="chat-info-photo">
                <img className="chat-photo" src={chatPhoto} alt='contactPhoto'/>
            </div>
            <div className="chat-name">
                <h3>{chatName}</h3>
            </div>
            <PasswordPrompt 
                isOpen={showPasswordPrompt}
                closePrompt={closePrompt}
                handleProtectedTypeSubmit={handleTypePasswordSubmit}
                passwordInput={passwordInput}
                setPasswordInput={setPasswordInput}
            />
            {selectedChannel && isOwner && isMember && <div className="chat-type">
                {!showDropdown && <span className="chat-type-text">
                    Chat Type: {chanType}
                </span>}
                {showDropdown ?
                <div className="dropdown">
                    {["PUBLIC", "PRIVATE", "PROTECTED"].filter(type => type !== chanType).map(type =>
                    <div onClick={() => handleEditChatType(type)}>{type}</div>
                    )}
                </div>
                : 
                <button className="edit-btn" onClick={() => setShowDropdown(true)}>
                    < AiOutlineEdit/>
                </button>}
                {showDropdown &&
                <button className="edit-btn" onClick={() => setShowDropdown(false)}>
                    <AiOutlineCloseCircle/>
                </button>
                }
            </div>}
            {selectedChannel && isOwner && isMember && (chanType === 'PROTECTED') && <div className="password-change">
                <span className="password-change-text">
                    Change Password
                </span>
                <button className="edit-btn" onClick={handleEditPassword}>
                    < AiOutlineEdit/>
                </button>
            </div>}
        </div>
    )
}

                {/* {selectedChannel && isOwner &&
                <button className="edit-btn" onClick={handleEditChatName}>
                    < AiOutlineEdit/>
                </button>} */}