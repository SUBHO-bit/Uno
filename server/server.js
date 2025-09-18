const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '..')));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        socket.join(roomId);
        rooms[roomId] = {
            players: [{ id: socket.id }],
            host: socket.id
        };
        socket.emit('roomCreated', { roomId, players: rooms[roomId].players, hostId: rooms[roomId].host });
    });

    socket.on('joinRoom', (roomId) => {
        roomId = roomId.toUpperCase();
        const room = rooms[roomId];
        if (room && room.players.length < 4) {
            socket.join(roomId);
            room.players.push({ id: socket.id });
            io.to(roomId).emit('playerUpdate', room.players);
            socket.emit('joinedRoom', { roomId, players: room.players, hostId: room.host });
        } else {
            socket.emit('errorMsg', 'Room is full or does not exist.');
        }
    });

    socket.on('startGame', (roomId) => {
        const room = rooms[roomId];
        if (room && room.host === socket.id) {
            io.to(roomId).emit('gameStarted');
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex > -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    if (room.host === socket.id) {
                        room.host = room.players[0].id;
                    }
                    io.to(roomId).emit('playerUpdate', room.players);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
