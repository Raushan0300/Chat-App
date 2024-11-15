const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const {Server: SocketServer} = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

const sentMessage = require('./controller/sentMessage');

const io = new SocketServer({
    cors: '*',
    maxHttpBufferSize: 1e8
})

io.attach(server);

const PORT = process.env.PORT || 8000;

require('./connection');

app.get('/', (req, res)=>{
    res.send('Hello World');
});



io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-chat', ({ chatId }) => {
        socket.join(chatId);
        console.log('User joined chat:', chatId);
    });

    socket.on('leave-chat', ({ chatId }) => {
        socket.leave(chatId);
        console.log('User left chat:', chatId);
    });

    socket.on('send-message', async (data) => {
        const { recieverId, message, chatId, token, fileName, fileData } = data;

        try {
            // Verify JWT token to get senderId
            const isVerify = jwt.verify(token, process.env.JWT_SECRET);
            const senderId = isVerify.id;

            // Save message with optional file info

            io.to(chatId).emit('receive-message', {
                chatId,
                senderId,
                recieverId,
                message,
                fileName,
                fileData,  // Emit the raw buffer for real-time file handling on the client side
                lastTime: Date.now(),
            });

            
            await sentMessage(chatId, senderId, recieverId, message, fileName, fileData);

            // Emit message or file metadata to the chat room
        } catch (error) {
            console.log('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use('/auth', require('./routes/auth'));
app.use('/chat', require('./routes/chatRoute'));
app.use('/add-user', require('./routes/addUser'));
app.use('/getmsg', require('./routes/getMsg'));
app.use('/sendmsg', require('./routes/sendmsg'));

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})