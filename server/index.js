const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

require('./connection');

app.get('/', (req, res)=>{
    res.send('Hello World');
});

app.use('/auth', require('./routes/auth'));
app.use('/chat', require('./routes/chatRoute'));
app.use('/add-user', require('./routes/addUser'));
app.use('/getmsg', require('./routes/getMsg'));
app.use('/sendmsg', require('./routes/sendmsg'));

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})