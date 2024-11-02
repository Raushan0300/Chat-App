const Message = require('../models/Messages');

async function sentMessage(chatId, senderId, recieverId, message){
    try {
        const newMessage = new Message({
            chatId,
            senderId,
            recieverId,
            message
        });
        await newMessage.save();
        return ({msg: 'Message sent'});
    } catch (error) {
        console.log(error);
        return ({err: 'Internal Server Error'});
    }
};

module.exports = sentMessage;