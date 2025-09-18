// এই পুরো কোডটি কপি করুন
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path'); // <-- আমরা এই নতুন লাইনটি যোগ করেছি

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// পুরনো লাইনটির বদলে আমরা এই নতুন এবং উন্নত লাইনটি ব্যবহার করছি
app.use(express.static(path.join(__dirname, '..')));

io.on('connection', (socket) => {
    console.log('একজন প্লেয়ার অনলাইনে এসেছেন:', socket.id);

    socket.on('disconnect', () => {
        console.log('একজন প্লেয়ার অফলাইনে চলে গেছেন:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`আমাদের গেম সার্ভার ${PORT} নম্বরে চালু হয়েছে`);
});
