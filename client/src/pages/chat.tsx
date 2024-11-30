import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchData } from "@/config";
import {
  PaperclipIcon,
  PlusCircleIcon,
  FileIcon,
  Download,
  VideoIcon,
  Phone
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
// import { useNavigate } from "react-router-dom";
import VideoCall from "./call";

const Chat = () => {
  // const navigate = useNavigate();

  const [chats, setChats] = useState<any>([]);
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [recieverId, setRecieverId] = useState<string>("");
  const [chatId, setChatId] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [recieverName, setRecieverName] = useState<string>("");
  const [messages, setMessages] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewDialog, setPreviewDialog] = useState<boolean>(false);

  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [receiverSocketId, setReceiverSocketId] = useState<string>('');

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

  const initiateCall = async () => {
    // Assume you have an API or method to get socket ID by userId
    const response = await fetchData(`/getSocketId?userId=${recieverId}`, "GET", {}, {});
    if(response.status === 200){
      setReceiverSocketId(response?.data?.socketId);
      console.log(response.data.socketId);
      setIsCalling(true);
    } else{
      alert("User is not online");
    }
  };

  useEffect(()=>{
    socket.emit('register', token);
  },[]);

  useEffect(() => {
    if (chatId && socket) {
      if (prevChatIdRef.current && prevChatIdRef.current !== chatId) {
        socket.emit("leave-chat", { chatId: prevChatIdRef.current });
      }

      socket.emit("join-chat", { chatId });
      prevChatIdRef.current = chatId;

      // socket.on("user:connect", ({ socketId }) => {
      //   setSocketId(socketId);
      // });

      socket.on("receive-message", (data: any) => {
        setMessages((prevMessages: any) => [...prevMessages, data]);
      });

      // socket.on("user-joined", ({socketId}) => {
      //   // getMessage();
      //   setSocketId(socketId);
      //   console.log(socketId);
      // });
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

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if(file.size > 1024 * 1024 * 5) {
      alert("File size should be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewDialog(true);
  };

  const sendMessage = async () => {
    let fileName: any = null;
    let fileData: any = null;

    if (selectedFile) {
      fileName = selectedFile.name;
      const reader: any = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        fileData = reader.result.split(",")[1];

        socket.emit("send-message", {
          recieverId,
          chatId,
          message: msg,
          token,
          fileName,
          fileData,
        });

        setMsg("");
        setSelectedFile(null);
      };
    } else {
      socket.emit("send-message", {
        recieverId,
        chatId,
        message: msg,
        token,
      });

      setMsg("");
    }
  };

  const getMessage = async () => {
    const res = await fetchData(
      `/getmsg?chatId=${chatId}`,
      "GET",
      {},
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      setMessages(res.data.Messages);
      setRecieverName(res.data.name);
    }
  };

  useEffect(() => {
    getMessage();
  }, [chatId]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewDialog(false);
  };

  const renderFilePreview = (fileBuffer: string, fileName: string) => {
    const fileType = fileName.split(".").pop()?.toLowerCase();

    if (fileType && ["jpg", "jpeg", "png", "gif", "bmp"].includes(fileType)) {
      return (
          <Dialog>
            <DialogTrigger>
            <div className="w-32 h-32 bg-green-100 p-2">
          <img
            src={`data:image/${fileType};base64,${fileBuffer}`}
            alt={fileName}
            className="w-full h-full object-cover"
          />
          </div>
            </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img
              src={`data:image/${fileType};base64,${fileBuffer}`}
              alt={fileName}
              className="w-full h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <FileIcon className="w-8 h-8" />
        <a
          href={`data:application/octet-stream;base64,${fileBuffer}`}
          download={fileName}>
          <Button>
            <Download /> {fileName}
          </Button>
        </a>
      </div>
    );
  };

  return !isCalling && !receiverSocketId ? (
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
                  className="flex flex-col gap-1 cursor-pointer"
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
          onOpenChange={() => setOpen(!open)}>
          <DialogTrigger>
            <div
              className="fixed bottom-4 right-[72%]"
              onClick={() => setOpen(true)}>
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
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chatId && (
        <div className="flex flex-col w-[70%] h-screen">
          <div className="flex justify-between items-center border-b border-white w-full px-5 py-2.5">
            <h1 className="text-2xl font-semibold">{recieverName}</h1>
            <div className="flex gap-5">
              <VideoIcon className="cursor-pointer" onClick={()=>{initiateCall()}}/>
              <Phone className="cursor-pointer" />
            </div>
          </div>
          <div className="flex flex-col w-full gap-5 px-5 py-2 h-[80vh] overflow-auto">
            {messages.map((message: any, index: number) => (
              <div
                key={index}
                className={`w-full flex ${
                  message.recieverId === recieverId ? "justify-end" : ""
                }`}>
                {message.message && (
                  <p
                    className={`text-lg py-2 px-4 rounded-md max-w-[60%] ${
                      message.recieverId === recieverId
                        ? "text-right bg-blue-400"
                        : "bg-orange-400"
                    }`}>
                    {message.message}
                  </p>
                )}
                {message.fileData &&
                  renderFilePreview(message.fileData, message.fileName)}
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-5 py-2">
            <div className="flex items-center">
              <Label htmlFor="file">
                <PaperclipIcon />
              </Label>
              <Input
                id="file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <Input
              placeholder="Type a message"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />

            <Dialog
              open={previewDialog}
              onOpenChange={setPreviewDialog}>
              <DialogContent>
                {selectedFile && (
                  <div className="flex flex-col items-center mt-4">
                    {selectedFile.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="preview"
                        className="w-32 h-32 object-cover mb-2"
                      />
                    ) : (
                      <FileIcon className="w-16 h-16 mb-2" />
                    )}
                    <p className="text-sm font-semibold">{selectedFile.name}</p>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="secondary"
                        onClick={handleRemoveFile}>
                        Remove
                      </Button>
                      <Button
                        onClick={() => {
                          setPreviewDialog(false);
                          sendMessage();
                        }}>
                        Confirm & Send
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      )}
    </div>
  ) : (
    // <VideoCall
    //   chatId={chatId}
    //   recieverId={recieverId}
    //   recieverName={recieverName}
    //   socketId={socketId}
    //   setIsCalling={setIsCalling}
    // />
    <VideoCall
    socketId={receiverSocketId}
    onCallEnd={() => {
      setIsCalling(false);
      setReceiverSocketId('');
    }}
  />
  );
};

export default Chat;
