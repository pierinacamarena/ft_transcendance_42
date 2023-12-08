import React, { useState } from "react";
import "../../css/Chat/SendMessage.css"
import "../../css/Chat/InputText.css"
import { AiOutlineSend } from 'react-icons/ai';
import { Channel } from './types.ts'

interface Props {
    sendMessage: (value: string) => void;
    userInfo: { id: number; email: string; nickname: string; avatarFilename: string } | null;
    selectedContact: { id: number; email: string; nickname: string; avatarFilename: string } | null;
    selectedChannel: Channel | null;
}

export default function MessageInput({
    sendMessage,
    userInfo,
    selectedContact,
    selectedChannel,
}: Props) {
    const [value, setValue] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.length > 0) {
            sendMessage(value.trim());
        }
        setValue("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="input_text">
                <input
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Type your message"
                    value={value}
                />
                <button className="submit-btn" type="submit">
                    <AiOutlineSend />
                </button>
            </div>
        </form>
    );
}
