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

        const ChatExist = await Chat.findOne({user: req.user._id});
        
        if(!ChatExist){
            const newChat = new Chat({
                user: req.user.id,
                connectedUsers: [
                    {
                        user: userId,
                        lastMessage: '',
                        name: user.name
                    }
                ]
            });

            await newChat.save();

            const newConnectedChat = new Chat({
                user: userId,
                connectedUsers: [
                    {
                        user: req.user._id,
                        lastMessage: '',
                        name: req.user.name
                    }
                ]
            });

            await newConnectedChat.save();
            return res.status(200).json({msg: 'User added to chat'});
        }

        const userExist = ChatExist.connectedUsers.find(user => user.user == userId);
        if(userExist) return res.status(400).json({err: 'User already added'});

        const newConnectedUser = await Chat.findOneAndUpdate({user: req.user._id}, {
            $push: {
                connectedUsers: {
                    user: userId,
                    lastMessage: '',
                    name: user.name
                }
            }
        }, {new: true});

        await newConnectedUser.save();

        const newConnectedUserChat = await Chat.findByIdAndUpdate({user: userId}, {
            $push: {
                connectedUsers: {
                    user: req.user._id,
                    lastMessage: '',
                    name: req.user.name
                }
            }
        }, {new: true});

        await newConnectedUserChat.save();
        return res.status(200).json({msg: 'User added to chat'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
})

module.exports = router;