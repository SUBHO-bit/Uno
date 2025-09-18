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

// UNO Game Logic
const COLORS = ['red', 'green', 'blue', 'yellow'];
const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
const WILD_VALUES = ['wild', 'wild_draw4'];

function createDeck() { const d = []; COLORS.forEach(c => { VALUES.forEach(v => { d.push({ color: c, value: v }); if (v !== '0') d.push({ color: c, value: v }); }); }); WILD_VALUES.forEach(v => { for (let i = 0; i < 4; i++) d.push({ color: 'black', value: v }); }); return d; }
function shuffle(d) { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        socket.join(roomId);
        rooms[roomId] = {
            players: [{ id: socket.id, hand: [] }],
            host: socket.id,
            deck: [],
            discardPile: [],
            currentPlayerIndex: 0
        };
        socket.emit('roomCreated', { roomId, players: rooms[roomId].players.map(p => ({ id: p.id })), hostId: rooms[roomId].host });
    });

    socket.on('joinRoom', (roomId) => {
        roomId = roomId.toUpperCase();
        const room = rooms[roomId];
        if (room && room.players.length < 4) {
            socket.join(roomId);
            room.players.push({ id: socket.id, hand: [] });
            io.to(roomId).emit('playerUpdate', room.players.map(p => ({ id: p.id })));
            socket.emit('joinedRoom', { roomId, players: room.players.map(p => ({ id: p.id })), hostId: room.host });
        } else {
            socket.emit('errorMsg', 'Room is full or does not exist.');
        }
    });

    socket.on('startGame', (roomId) => {
        const room = rooms[roomId];
        if (room && room.host === socket.id) {
            room.deck = shuffle(createDeck());
            let firstCard;
            do { firstCard = room.deck.pop(); } while (WILD_VALUES.includes(firstCard.value));
            room.discardPile.push(firstCard);
            room.activeColor = firstCard.color;

            room.players.forEach(player => {
                player.hand = room.deck.splice(0, 7);
            });

            io.to(roomId).emit('gameStarted');
            
            room.players.forEach(player => {
                io.to(player.id).emit('yourHand', player.hand);
            });
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
                    io.to(roomId).emit('playerUpdate', room.players.map(p => ({ id: p.id })));
                    io.to(roomId).emit('hostUpdate', room.host);
                }
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
