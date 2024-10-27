import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchData } from "@/config";
import { useEffect, useState } from "react";


const Chat = () => {
    // const chats = [
    //     {
    //         id: 1,
    //         name: "John Doe",
    //         lastMessage: "Hello",
    //         lastMessageTime: "10:00 AM",
    //         unreadMessages: 1
    //     },
    //     {
    //         id: 2,
    //         name: "Jane Doe",
    //         lastMessage: "Hi",
    //         lastMessageTime: "10:01 AM",
    //         unreadMessages: 0
    //     },
    //     {
    //         id: 3,
    //         name: "Alice",
    //         lastMessage: "Hey",
    //         lastMessageTime: "10:02 AM",
    //         unreadMessages: 0
    //     },
    //     {
    //         id: 4,
    //         name: "Bob",
    //         lastMessage: "Hola",
    //         lastMessageTime: "10:03 AM",
    //         unreadMessages: 0
    //     },
    //     {
    //         id: 5,
    //         name: "Charlie",
    //         lastMessage: "Bonjour",
    //         lastMessageTime: "10:04 AM",
    //         unreadMessages: 0
    //     }
    // ];

    const [chats, setChats] = useState<any>([]);

    const token = localStorage.getItem("token");

    useEffect(()=>{
        const fetchChats = async()=>{
            const res = await fetchData('/chat', "GET", {}, {authorization: `${token}`});
            if(res.status === 200){
                setChats(res.data);
                console.log(res.data?.Chats[0]?.connectedUsers);
            }
        };
        fetchChats();
    },[]);

    const messages = [
        {
            user1: "John Doe",
            message: "Hello",
        },
        {
            user1: "Jane Doe",
            message: "Hi",
        },
        {
            user2: "John width",
            message: "Hello",
        },
        {
            user2: "Jane Doe",
            message: "Hi",
        }
    ]
  return (
    <div className="flex w-screen">
        <div className="flex flex-col border-r border-white w-[30%] h-screen">
            <div className="flex flex-col border-b border-white w-full px-5 py-2">
                <h1 className="text-3xl font-semibold">Chats</h1>
            </div>
            <div className="flex flex-col px-5 py-2 gap-5 mt-5">
                {chats?.Chats?.[0]?.connectedUsers && chats?.Chats?.[0]?.connectedUsers?.map((chat:any) => (
                    <div key={chat.id} className="flex flex-col gap-1">
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">{chat.name}</h2>
                            <p className="text-sm">{chat.lastMessageTime}</p>
                        </div>
                        <p className="text-sm">{chat.lastMessage}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-col w-[70%] h-screen">
            <div className="flex flex-col border-b border-white w-full px-5 py-2">
                <h1 className="text-2xl font-semibold">John Doe</h1>
                <p>online</p>
            </div>
            <div className="flex flex-col w-full gap-5 px-5 py-2">
                {messages.map((message) => (
                    <div className="w-full">
                        <div className="flex flex-col gap-1 text-right">
                            <p className="text-sm">{message.message}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm">{message.message}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 px-5 py-2">
                <Input placeholder="Type a message" />
                <Button>Send</Button>
            </div>
        </div>
    </div>
  )
}

export default Chat;