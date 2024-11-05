import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchData } from "@/config";
import { PlusCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import socket from "@/socket";
import { ModeToggle } from "@/components/mode-toggle";

const Chat = () => {
  const [chats, setChats] = useState<any>([]);
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [recieverId, setRecieverId] = useState<string>("");
  const [chatId, setChatId] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [recieverName, setRecieverName] = useState<string>("");

  const [messages, setMessages] = useState<any>([]);

  const prevChatIdRef = useRef<string>("");

  const token = localStorage.getItem("token");

  const fetchChats = async () => {
    const res = await fetchData(
      "/chat",
      "GET",
      {},
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      setChats(res.data);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId && socket) {

      if(prevChatIdRef.current && prevChatIdRef.current !== chatId){
        socket.emit("leave-chat", { chatId: prevChatIdRef.current });
      }
        
      socket.emit("join-chat", { chatId });
      prevChatIdRef.current = chatId;

      socket.on("receive-message", (data: any) => {
        setMessages((prevMessages: any) => [...prevMessages, data]);
      });
    }

    return () => {
      if (socket) {
        socket.off("receive-message");
      }
    };
  }, [chatId]);

  const handleAddUser = async () => {
    const res = await fetchData(
      "/add-user",
      "POST",
      { email },
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      await fetchChats();
      setOpen(false);
    } else {
      alert(res.data.err);
    }
  };

  const sendMessage = async () => {

    socket.emit("send-message", { recieverId, chatId, message: msg, token });
    setMsg("");
  };

  const getMessage = async () => {
    const res = await fetchData(
      `/getmsg?chatId=${chatId}`,
      "GET",
      {},
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      console.log(res.data);
      setMessages(res.data.Messages);
      setRecieverName(res.data.name);
    }
  };

  useEffect(() => {
    getMessage();
  }, [chatId]);

  return (
    <div className="flex w-screen">
      <div className="flex flex-col border-r border-white w-[30%] h-screen">
        <div>
          <div className="flex justify-between border-b border-white w-full px-5 py-2">
            <h1 className="text-3xl font-semibold">Chats</h1>
            <ModeToggle />
          </div>
          <div className="flex flex-col px-5 py-2 gap-5 mt-5">
            {chats?.Chats?.[0]?.connectedUsers &&
              chats?.Chats?.[0]?.connectedUsers?.map((chat: any) => (
                <div
                  key={chat._id}
                  className="flex flex-col gap-1"
                  onClick={() => {
                    setChatId(chat._id);
                    setRecieverId(chat.user);
                  }}>
                  <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{chat.name}</h2>
                    <p className="text-sm">{chat.lastMessageTime}</p>
                  </div>
                  <p className="text-sm">{chat.lastMessage}</p>
                </div>
              ))}
          </div>
        </div>

        <Dialog
          open={open}
          onOpenChange={() => {
            setOpen(!open);
          }}>
          <DialogTrigger>
            <div
              className="fixed bottom-4 right-[72%]"
              onClick={() => {
                setOpen(true);
              }}>
              <PlusCircleIcon className="w-[50px] h-[50px]" />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to your Chat List</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Enter Email of User"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
              <Button
                onClick={() => {
                  handleAddUser();
                }}>
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chatId&&<div className="flex flex-col w-[70%] h-screen">
        <div className="flex flex-col border-b border-white w-full px-5 py-2">
          <h1 className="text-2xl font-semibold">{recieverName}</h1>
        </div>
        <div className="flex flex-col w-full gap-5 px-5 py-2 h-[80vh] overflow-auto">
          {messages.map((message: any) => (
            <div
              className={`w-full flex ${
                message.recieverId === recieverId ? "justify-end" : ""
              }`}>
              <p
                className={`text-lg py-2 px-4 rounded-md max-w-[60%] ${
                  message.recieverId === recieverId
                    ? "text-right bg-blue-400"
                    : "bg-orange-400"
                }`}>
                {message.message}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-5 py-2">
          <Input
            placeholder="Type a message"
            value={msg}
            onChange={(e) => {
              setMsg(e.target.value);
            }}
          />
          <Button
            onClick={() => {
              sendMessage();
            }}>
            Send
          </Button>
        </div>
      </div>}
    </div>
  );
};

export default Chat;
