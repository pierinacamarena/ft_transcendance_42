import React, { useEffect, useState } from "react";
import { ChatHeaderProps } from './types.ts'
import { ftFetch } from '../Root.tsx';
import kittyImage from '../../resources/assets/ui/kitty.png';
import { fade } from '../utils/ftMotion.tsx'
import { AnimatePresence, motion } from 'framer-motion'

export default function ChatHeader({setIsOpen, selectedChannel, selectedContact, userInfo, socket} : ChatHeaderProps) {
    const [chatPhoto, setChatPhoto] = useState<undefined | string>();
    const [chatName, setChatName] = useState<String>();

    useEffect(() => {
        if (!userInfo && !selectedChannel && !selectedContact)
			socket.emit('getUserInfo', () => {});
    }, [userInfo, selectedChannel, selectedContact])


    useEffect(() => {
        if (userInfo) {
            if (!selectedChannel && !selectedContact) {
                ftFetch(`/avatars/${userInfo.avatarFilename}`, undefined, undefined, 'img')
                    .then(x => {
                        setChatPhoto(URL.createObjectURL(x));
                        console.log("Image blob: ", x);
                    })
                    .catch(x => {
                        setChatPhoto(kittyImage);
                        console.error('HeaderContactInfo selectedContact:', x);
                    });
                setChatName("No conversation selected")
            }
        }
    }, [userInfo])

    useEffect(() => {
        if (selectedChannel && !selectedContact) {
            setChatName(selectedChannel.name);
            setChatPhoto(kittyImage)
        }
        else if (!selectedChannel && selectedContact) {
            setChatName(selectedContact.nickname);
            ftFetch(`/avatars/${selectedContact.avatarFilename}`, undefined, undefined, 'img')
                .then(x => {
                    setChatPhoto(URL.createObjectURL(x));
                    console.log("Image blob: ", x);
                })
                .catch(
                    x => {
                        setChatPhoto(kittyImage);
                        console.error('ChatHeader selectedContact:', x);
                    }
                );
        }
    }, [selectedChannel, selectedContact])

    if (!userInfo || !chatName || !chatPhoto) {
		return (
            <AnimatePresence>
                <motion.p {...fade({})}>loading...</motion.p>
            </AnimatePresence>
        )
    }

    return (
        <div className='chat-header'>
            <button className="chat-header-btn" onClick={() => {setIsOpen(current => !current)}}>
                <img className="chat-header-photo" src={chatPhoto} alt='contactPhoto'/>
            </button>
            <div>
                <h3 className="chat-header-name">{chatName}</h3>
            </div>
        </div>
    )
}
