import React, { useEffect, useRef, useState, useMemo } from "react";
import { Contact, Channel } from './types.ts'

interface MessageItemType  {
    sender: number;
    receiver?: number;
    senderNick?: string;
    chanId?: number;
    message?: string;
    content?: string;
    type?: string;
}

interface MessagesProps {
    messages : MessageItemType[];
    userInfo: Contact | null;
    selectedContact?: Contact;
    selectedChannel?: Channel | null;
}


export default function Messages({ messages, userInfo, selectedContact, selectedChannel }: MessagesProps) {
    return (
        <div>
            {messages.map((message, index) => <MessageItem key={index} {
                ...{
                    message,
                    isCurrentUser:message.sender === userInfo?.id,
                    nickname: selectedContact?.nickname || message.senderNick
                }
            }/>)}
        </div>
    );
}

function MessageItem(props: { message: MessageItemType, isCurrentUser?: boolean, nickname?: string }) {
    const { message, isCurrentUser, nickname } = props

    const senderName = useMemo(() => {
        if (isCurrentUser) return 'you';
        return nickname || 'you';
    }, [message, isCurrentUser, nickname]);

    return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
        <strong className="message-user">{senderName}:</strong>
        <div className="message-text">
            {message.content || message?.message}
        </div>
    </div>)
}