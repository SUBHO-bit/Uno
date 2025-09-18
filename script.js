// ================================================================
//  এই ফাইলটিতে দুটি অংশ আছে:
//  ১. মাল্টিপ্লেয়ার মোডের জন্য কোড (Multiplayer Logic)
//  ২. কম্পিউটারের সাথে খেলার জন্য কোড (Single Player Logic)
// ================================================================


// ================================================================
//  ১. মাল্টিপ্লেয়ার লজিক (Multiplayer Logic)
// ================================================================

const socket = io();

// সব পেজ এবং এলিমেন্ট
const landingPage = document.getElementById('landing-page');
const lobbyPage = document.getElementById('lobby-page');
const gameContainer = document.getElementById('game-container');

const playComputerBtn = document.getElementById('play-computer-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomInput = document.getElementById('join-room-input');
const joinRoomBtn = document.getElementById('join-room-btn');

const roomCodeEl = document.getElementById('room-code');
const playerListEl = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game-btn');
const startGameMsg = document.getElementById('start-game-msg');

let myRoomId = null;

// --- মাল্টিপ্লেয়ার ইভেন্ট ---
createRoomBtn.addEventListener('click', () => {
    window.open(window.location.href + '?action=create', '_blank');
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = joinRoomInput.value.trim();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    }
});

startGameBtn.addEventListener('click', () => {
    if (myRoomId) {
        socket.emit('startGame', myRoomId);
    }
});

// পেজ লোড হলে URL চেক করা
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'create') {
    socket.emit('createRoom');
}

// --- সার্ভার থেকে বার্তা শোনা ---
socket.on('roomCreated', (data) => {
    myRoomId = data.roomId;
    showLobby(data, true);
    window.history.replaceState({}, document.title, window.location.pathname);
});

socket.on('joinedRoom', (data) => {
    myRoomId = data.roomId;
    showLobby(data, socket.id === data.hostId);
});

socket.on('playerUpdate', (players) => {
    updatePlayerList(players);
});

socket.on('gameStarted', () => {
    lobbyPage.classList.add('hidden');
    // গেম কন্টেইনারে মাল্টিপ্লেয়ার UI তৈরি করা হবে
    setupMultiplayerGameUI();
});

socket.on('errorMsg', (message) => {
    alert(`Error: ${message}`);
});

// --- মাল্টিপ্লেয়ার UI ফাংশন ---
function showLobby(data, isHost) {
    landingPage.classList.add('hidden');
    lobbyPage.classList.remove('hidden');
    roomCodeEl.textContent = data.roomId;
    updatePlayerList(data.players);
    if (isHost) {
        startGameBtn.classList.remove('hidden');
        startGameMsg.classList.add('hidden');
    } else {
        startGameBtn.classList.add('hidden');
        startGameMsg.classList.remove('hidden');
    }
}

function updatePlayerList(players) {
    playerListEl.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `Player ${player.id.substring(0, 5)}`;
        if (player.id === socket.id) {
            li.textContent += ' (You)';
            li.style.fontWeight = 'bold';
        }
        playerListEl.appendChild(li);
    });
}

function setupMultiplayerGameUI() {
    gameContainer.innerHTML = `
        <div class="player-area" id="opponent-area"><h2>Opponents</h2><div id="opponents-hands" class="hand"></div></div>
        <div id="deck-area">
            <div class="card-pile" id="deck-pile"><div class="card back"></div></div>
            <div class="card-pile" id="discard-pile"></div>
        </div>
        <div class="player-area" id="player-area"><h2>Your Hand</h2><div class="hand" id="player-hand"></div></div>
    `;
    gameContainer.classList.remove('hidden');
}


// ================================================================
//  ২. কম্পিউটারের সাথে খেলার লজিক (Single Player Logic)
// ================================================================

playComputerBtn.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    // গেম কন্টেইনারে কম্পিউটারের সাথে খেলার UI তৈরি করা হবে
    setupSinglePlayerGameUI();
    // কম্পিউটারের সাথে খেলা শুরু করা হবে
    startSinglePlayerGame();
});

function setupSinglePlayerGameUI() {
    gameContainer.innerHTML = `
        <div class="player-area" id="computer-area"><h2>Computer (<span id="computer-card-count">0</span>)</h2><div class="hand" id="computer-hand"></div></div>
        <div id="deck-area">
            <div class="card-pile" id="deck-pile"><div class="card back"></div></div>
            <div class="card-pile" id="discard-pile"></div>
        </div>
        <div class="player-area" id="player-area"><h2>Your Hand (<span id="player-card-count">0</span>)</h2><div class="hand" id="player-hand"></div></div>
        <div id="game-status"><p id="status-message"></p></div>
    `;
    gameContainer.classList.remove('hidden');
}

function startSinglePlayerGame() {
    // এখানে আপনার পুরনো script.js থেকে কম্পিউটারের সাথে খেলার
    // সমস্ত লজিক পেস্ট করতে হবে। এটি একটি উদাহরণ:
    alert("Computer game mode is starting!");
    
    // আপনার পুরনো script.js এর কোড এখানে যুক্ত হবে।
    // যেহেতু কোডটি অনেক বড়, আপাতত আমরা শুধু একটি মেসেজ দেখাচ্ছি।
    // আমরা এই অংশটি পরে সম্পূর্ণ করব।
}
