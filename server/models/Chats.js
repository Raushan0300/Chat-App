const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    connectedUsers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            messageId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message'
            },
            lastMessage: String
        }
    ]
});

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;