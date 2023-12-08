import { Socket } from "socket.io-client"

export interface Channel {
    id: number;
    name: string;
    chanOwner: number;
    type: string;
    passwd: string | null;
}

export interface ChatChannelsProps {
    userInfo: { id: number; email: string; nickname: string; avatarFilename: string } | null;
    allChannelsbyUser: Channel[];
    allChannelsNotJoined: Channel[];
    setAllChannelsNotJoined: React.Dispatch<React.SetStateAction<Channel[]>>
    setAllChannelsbyUser: React.Dispatch<React.SetStateAction<Channel[]>>
    setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>
    setSelectedContact: React.Dispatch<React.SetStateAction<{ id: number; email: string; nickname: string; avatarFilename: string } | null>>
    socket: Socket
}

export interface ChatHeaderProps {
    selectedContact: Contact | null;
    selectedChannel: Channel | null;
    userInfo: Contact | null;
    // photo?: string;
    // chatName: string;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    socket: Socket;
}

export interface User {
    nickname: string;
}

export interface Contact {
    id: number;
    email: string;
    nickname: string;
    avatarFilename: string
}

export interface ChanMember {
    chanId: number;
    member: number;
    isAdmin: boolean;
    muteTime: string;
    memberRef: User;
}

export interface ChanMessage {
    sender: number;
    senderNick: string;
    chanId: number;
    timeSent?: string;
    content: string;
}

export interface ChatInfoProps {
    userInfo: Contact | null;
    selectedChannel: Channel | null;
    selectedContact: Contact | null;
    socket: Socket;
}

export interface ContactInfoProps {
    selectedContact: Contact;
    userInfo: Contact | null;
    socket: Socket;
}

export interface HeaderContactInfoProps {
    photo?: string;
    userInfo: Contact | null;
    selectedContact: Contact | null;
    selectedChannel: Channel | null;
    socket: Socket;
}

export type ChannelMessage = {
    sender: number;
    senderNick: string;
    chanId: number;
    content: string;
    type: string;
};


export interface PrivMessage {
    sender: number;
    receiver: number;
    message: string;
    type: string;
    timeSent?: string;
}


export type PrivateMessage = {
    sender: number;
    receiver: number;
    message: string;
    type: string;
    timeSent?: string;
}