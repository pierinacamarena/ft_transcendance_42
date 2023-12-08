import React, { useState, useEffect } from "react";
import { BsSearchHeart } from "react-icons/bs";
import { FiRefreshCw } from "react-icons/fi";
import {
    User,
    Contact,
    ChanMember,
    ChatInfoProps,
    Channel
} from './types.ts'
import { Socket } from "socket.io-client"

interface DmHandlerProps {
    allUsers: Contact[];
    setAllUsers: React.Dispatch<React.SetStateAction<Contact[]>>
    setSelectedContact: React.Dispatch<React.SetStateAction<Contact| null>>
    userInfo: Contact | null;
    setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>
    socket: Socket
}

export default function DmHandler({ allUsers, userInfo, setAllUsers, setSelectedContact, setSelectedChannel, socket}: DmHandlerProps)
{

    const [contact, setContact] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<{id: number; nickname: string; email:string,  avatarFilename: string}[]>([]);

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();
        //here send the value
        setContact("");
    }

    useEffect(() => {
        socket.on('allUsersFound', (userData: {id: number; email: string; nickname: string; avatarFilename: string}[]) => {
            setAllUsers(userData);
            console.log('getting all the users')
        });
        socket.emit('getAllUsers')
    }, []);

    const fetchUsers = () => {

        const getUsers = () => {
            socket.on('allUsersFound', (userData: {id: number; email: string; nickname: string; avatarFilename: string}[]) => {
                setAllUsers(userData);
                console.log('getting all the users')
            });
            socket.emit('getAllUsers')
        }
    
        getUsers();
    };

    useEffect(() => {
        fetchUsers();
        console.log("inside DM Handler: ", userInfo);
        return () => {
            socket.off('allUsersFound');
        };
    }, []);

    const filterUsers = (input: string) => {
        socket.emit('getUserStartsBy', {startBy: input, userId: userInfo?.id});
    };

    useEffect(() => {
        socket.on('usersStartByFound', (filteredUsersData: {id: number; email:string; nickname: string; avatarFilename: string}[]) => {
            setFilteredUsers(filteredUsersData);
        });
        return () => {
            socket.off('usersStartByFound');
        }
    }, [])

    useEffect(() => {
        setFilteredUsers(allUsers);
    }, [allUsers]);
    

    return (
    <div className='direct-messages'>
        <div className="DM-title">
            <h1>
                [Direct Messages]
            </h1>
            <button className="Chan-refresh-btn" onClick={fetchUsers}>
                <FiRefreshCw/>
            </button>
        </div>
        <div className="DM-find">
            <div className="DM-find-text">
                <input
                    onChange={(e)=> { setContact(e.target.value); filterUsers(e.target.value); }}
                    // onChange={(e)=>setContact(e.target.value)}
                    placeholder="Search conversation"
                    value={contact}
                />
            </div>
            <button className="DM-find-btn">
                <BsSearchHeart/>
            </button>
        </div>
        <div className="DM-conversations">
                {filteredUsers.filter(user => user.id !== userInfo?.id).map((user) => (
                <button className="conversation-btn" key={user.id} onClick={() => {
                    setSelectedContact(user);
                    setSelectedChannel(null);
                    }}>
                    {user.nickname}
                </button>
            ))}
        </div>
    </div>
    )
}