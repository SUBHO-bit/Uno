// ================================================================
//  ফাইনাল কোড: এটি "ম্যানেজার" হিসেবে কাজ করবে
// ================================================================

const socket = io();
const getEl = id => document.getElementById(id);

// --- Landing Page এবং Lobby Elements ---
const landingPage = getEl('landing-page');
const lobbyPage = getEl('lobby-page');
const gameContainer = getEl('game-container');
const playComputerBtn = getEl('play-computer-btn');
const createRoomBtn = getEl('create-room-btn');
const joinRoomInput = getEl('join-room-input');
const joinRoomBtn = getEl('join-room-btn');
const showStatsBtn = getEl('show-stats-btn');
const roomCodeEl = getEl('room-code');
const playerListEl = getEl('player-list');
const startGameBtn = getEl('start-game-btn');
const startGameMsg = getEl('start-game-msg');

// --- বাটন ক্লিক হলে কী হবে ---

// 1. কম্পিউটারের সাথে খেলার বাটন
playComputerBtn.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    
    // গেমের জন্য আপনার বানানো আসল HTML কোডটি এখানে তৈরি করা হচ্ছে
    gameContainer.innerHTML = `
        <div id="shuffle-overlay"><div class="shuffle-container"><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div></div></div>
        <div class="player-area" id="computer-area"><h2>Computer (<span id="computer-card-count">0</span>) - Score: <span id="computer-score">0</span></h2><div class="hand" id="computer-hand"></div></div>
        <div id="deck-area"><div class="card-pile" id="deck-pile"><div class="card back"></div><span>Deck</span></div><div class="card-pile" id="discard-pile"></div></div>
        <div class="player-area" id="player-area"><h2>Your Hand (<span id="player-card-count">0</span>) - Score: <span id="player-score">0</span></h2><div class="hand" id="player-hand"></div></div>
        <div id="game-status"><p id="status-message"></p><button id="pass-button" class="hidden">Pass</button><button id="uno-button" class="hidden">UNO!</button><button id="rules-button">How to Play</button></div>
    `;
    gameContainer.classList.remove('hidden');

    // এবার আপনার সুরক্ষিত রাখা singlePlayer.js ফাইলটি লোড করে গেম চালু করা হবে
    import('./singlePlayer.js'); 
});

// 2. মাল্টিপ্লেয়ার ইভেন্ট
createRoomBtn.addEventListener('click', () => {
    window.open(window.location.href + '?action=create', '_blank');
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = joinRoomInput.value.trim().toUpperCase();
    if (roomId) socket.emit('joinRoom', roomId);
});

startGameBtn.addEventListener('click', () => {
    socket.emit('startGame', myRoomId);
});

// 3. My Stats বাটন
showStatsBtn.addEventListener('click', () => {
    const statsModal = getEl('stats-modal');
    const statsContentEl = getEl('stats-content');
    const closeStatsBtn = getEl('close-stats-btn');
    const stats = JSON.parse(localStorage.getItem('unoPlayerStats') || '{"wins":0,"losses":0,"gamesPlayed":0}');
    const winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0;
    statsContentEl.innerHTML = `<p><strong>Games Played:</strong> ${stats.gamesPlayed}</p><p><strong>Wins:</strong> ${stats.wins}</p><p><strong>Losses:</strong> ${stats.losses}</p><p><strong>Win Rate:</strong> ${winRate}%</p>`;
    statsModal.classList.remove('hidden');
    closeStatsBtn.onclick = () => statsModal.classList.add('hidden');
});

// --- মাল্টিপ্লেয়ার লজিক ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'create') {
    socket.emit('createRoom');
}

let myRoomId = null;

socket.on('roomCreated', data => {
    myRoomId = data.roomId;
    showLobby(data, true);
    window.history.replaceState({}, document.title, window.location.pathname);
});

socket.on('joinedRoom', data => {
    myRoomId = data.roomId;
    showLobby(data, socket.id === data.hostId);
});

socket.on('playerUpdate', players => updatePlayerList(players));

socket.on('hostUpdate', hostId => {
    if (socket.id === hostId) {
        startGameBtn.classList.remove('hidden');
        startGameMsg.classList.add('hidden');
    }
});

socket.on('gameStarted', () => {
    lobbyPage.classList.add('hidden');
    gameContainer.innerHTML = `<p style="font-size: 2rem; text-align: center; margin-top: 100px;">Multiplayer game has started! (Gameplay coming soon)</p>`;
    gameContainer.classList.remove('hidden');
});

socket.on('errorMsg', message => alert(`Error: ${message}`));

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
