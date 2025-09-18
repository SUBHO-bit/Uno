// এই পুরো কোডটি কপি করে server.js ফাইলে পেস্ট করুন
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// এই লাইনটি আপনার index.html, script.js, style.css ফাইলগুলোকে খুঁজে পেতে সাহায্য করে
app.use(express.static('../'));

io.on('connection', (socket) => {
    console.log('একজন প্লেয়ার অনলাইনে এসেছেন:', socket.id);

    socket.on('disconnect', () => {
        console.log('একজন প্লেয়ার অফলাইনে চলে গেছেন:', socket.id);
    });

    // মাল্টিপ্লেয়ার খেলার বাকি কোড এখানে যোগ করা হবে
});

server.listen(PORT, () => {
    console.log(`আমাদের গেম সার্ভার ${PORT} নম্বরে চালু হয়েছে`);
});