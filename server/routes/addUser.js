const express = require('express');
const router = express.Router();

const User = require('../models/Users');
const Chat = require('../models/Chats');
const Message = require('../models/Messages');

const isAuthenticated = require('../controller/isAuthenticated');

router.post('/', isAuthenticated, async(req, res)=>{
    const {userId} = req.body;

    try {
        const user = await User.findById(userId);
        if(!user) return res.status(400).json({err: 'User not found'});

        const ChatExist = await Chat.findById(req.user.chatId);
        
        if(!ChatExist){
            const newChat = new Chat({
                user: req.user.id,
                connectedUsers: [
                    {
                        user: userId,
                        lastMessage: ''
                    }
                ]
            });

            await newChat.save();
            return res.status(200).json({msg: 'User added to chat'});
        }

        const userExist = ChatExist.connectedUsers.find(user => user.user.toString() === userId);
        if(userExist) return res.status(400).json({err: 'User already added'});

        const newConnectedUser = await Chat.findByIdAndUpdate(req.user.chatId, {
            $push: {
                connectedUsers: {
                    user: userId,
                    lastMessage: ''
                }
            }
        }, {new: true});

        await newConnectedUser.save();
        return res.status(200).json({msg: 'User added to chat'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
})

module.exports = router;