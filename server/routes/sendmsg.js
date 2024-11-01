const express = require('express');
const router = express.Router();

const Message = require('../models/Messages');
const User = require('../models/Users');

const isAuthenticated = require('../controller/isAuthenticated');

router.post('/', isAuthenticated ,async(req, res)=>{
    const {recieverId, message, chatId} = req.body;

    try {
        const senderId = req.user._id;

        const user = await User.findById(recieverId);
        if(!user) return res.status(400).json({err: 'User not found'});

        const newMessage = new Message({
            chatId,
            senderId,
            recieverId,
            message
        });
        await newMessage.save();
        return res.status(200).json({msg: 'Message sent'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({err: 'Internal Server Error'});
    }
})


module.exports = router;