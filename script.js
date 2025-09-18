// ================================================================
//  চূড়ান্ত কোড: মাল্টিপ্লেয়ার এবং সিঙ্গেল প্লেয়ার (কম্পিউটার) মোড
// ================================================================

// --- প্রথম অংশ: মাল্টিপ্লেয়ার লজিক ---

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
    const roomId = joinRoomInput.value.trim().toUpperCase();
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

socket.on('hostUpdate', (hostId) => {
    if (socket.id === hostId) {
        startGameBtn.classList.remove('hidden');
        startGameMsg.classList.add('hidden');
    }
});

socket.on('gameStarted', () => {
    lobbyPage.classList.add('hidden');
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
//  --- দ্বিতীয় অংশ: আপনার বানানো কম্পিউটারের সাথে খেলার সম্পূর্ণ লজিক ---
// ================================================================

playComputerBtn.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    // কম্পিউটারের সাথে খেলার জন্য UI তৈরি করা
    setupSinglePlayerGameUI();
    // কম্পিউটারের সাথে খেলা শুরু করা
    startSinglePlayerGame();
});

function setupSinglePlayerGameUI() {
    gameContainer.innerHTML = `
        <div id="shuffle-overlay">
            <div class="shuffle-container">
                <div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div><div class="card back shuffle-card"></div>
            </div>
        </div>
        <div class="player-area" id="computer-area">
            <h2>Computer (<span id="computer-card-count">0</span>)</h2>
            <div class="hand" id="computer-hand"></div>
        </div>
        <div id="deck-area">
            <div class="card-pile" id="deck-pile"><div class="card back"></div><span>Deck</span></div>
            <div class="card-pile" id="discard-pile"></div>
        </div>
        <div class="player-area" id="player-area">
            <h2>Your Hand (<span id="player-card-count">0</span>)</h2>
            <div class="hand" id="player-hand"></div>
        </div>
        <div id="game-status"><p id="status-message"></p><button id="pass-button" class="hidden">Pass</button><button id="uno-button" class="hidden">UNO!</button></div>
    `;
    gameContainer.classList.remove('hidden');
}

function startSinglePlayerGame() {
    // এই ফাংশনের ভেতরে আপনার মূল গেমের সব কোড রাখা হয়েছে

    const getEl = id => document.getElementById(id);

    const playerHandEl = getEl('player-hand');
    const computerHandEl = getEl('computer-hand');
    const discardPileEl = getEl('discard-pile');
    const deckPileEl = getEl('deck-pile');
    const statusMsgEl = getEl('status-message');
    const playerCardCountEl = getEl('player-card-count');
    const computerCardCountEl = getEl('computer-card-count');
    const unoBtn = getEl('uno-button');
    const passBtn = getEl('pass-button');

    const COLORS = ['red', 'green', 'blue', 'yellow'];
    const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
    const WILD_VALUES = ['wild', 'wild_draw4'];

    let deck, playerHand, computerHand, discardPile, currentPlayer, activeColor, isGameOver;
    let unoState = { player: false, computer: false };

    function createDeck() { const d = []; COLORS.forEach(c => { VALUES.forEach(v => { d.push({ color: c, value: v }); if (v !== '0') d.push({ color: c, value: v }); }); }); WILD_VALUES.forEach(v => { for (let i = 0; i < 4; i++) d.push({ color: 'black', value: v }); }); return d; }
    function shuffle(d) { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }

    async function initializeGame() {
        isGameOver = false;
        deck = shuffle(createDeck());
        playerHand = [];
        computerHand = [];
        discardPile = [];
        unoState = { player: false, computer: false };

        for (let i = 0; i < 7; i++) {
            playerHand.push(deck.pop());
            computerHand.push(deck.pop());
        }

        let firstCard;
        do {
            if (deck.length === 0) deck = shuffle(createDeck());
            firstCard = deck.pop();
        } while (WILD_VALUES.includes(firstCard.value));
        
        discardPile.push(firstCard);
        activeColor = firstCard.color;
        currentPlayer = 'player';
        
        runGameLoop();
    }

    async function runGameLoop() {
        while (!isGameOver) {
            updateUI();
            if (currentPlayer === 'player') {
                statusMsgEl.textContent = "Your turn!";
                await playerTurn();
            } else {
                statusMsgEl.textContent = "Computer's turn...";
                await computerTurn();
            }
            checkGameOver();
            if (!isGameOver) {
                switchPlayer();
            }
        }
    }

    function playerTurn() {
        return new Promise(resolve => {
            deckPileEl.onclick = async () => {
                if (deck.length === 0) refillDeck();
                playerHand.push(deck.pop());
                deckPileEl.onclick = null; // Prevent multiple draws
                resolve();
            };

            playerHandEl.querySelectorAll('.playable').forEach(cardEl => {
                cardEl.onclick = async () => {
                    const cardIndex = parseInt(cardEl.dataset.index, 10);
                    const card = playerHand[cardIndex];
                    
                    playerHand.splice(cardIndex, 1);
                    discardPile.push(card);
                    
                    if (card.color === 'black') {
                        activeColor = await playerChooseColor();
                    } else {
                        activeColor = card.color;
                    }

                    // Handle special cards
                    // ... (special card logic will go here)

                    playerHandEl.querySelectorAll('.playable').forEach(c => c.onclick = null);
                    deckPileEl.onclick = null;
                    resolve();
                };
            });
        });
    }

    async function computerTurn() {
        await new Promise(res => setTimeout(res, 1500)); // Thinking time

        const playableCards = computerHand.filter(c => isPlayable(c, 'computer'));
        if (playableCards.length > 0) {
            const card = playableCards[0]; // Simple AI
            computerHand.splice(computerHand.indexOf(card), 1);
            discardPile.push(card);

            if (card.color === 'black') {
                activeColor = COLORS[Math.floor(Math.random() * 4)];
            } else {
                activeColor = card.color;
            }
        } else {
            if (deck.length === 0) refillDeck();
            computerHand.push(deck.pop());
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 'player' ? 'computer' : 'player';
    }

    function checkGameOver() {
        if (playerHand.length === 0) {
            isGameOver = true;
            alert("YOU WIN!");
        } else if (computerHand.length === 0) {
            isGameOver = true;
            alert("COMPUTER WINS!");
        }
    }
    
    function refillDeck() {
        const topCard = discardPile.pop();
        deck = shuffle(discardPile);
        discardPile = [topCard];
    }

    function isPlayable(card) {
        const topCard = discardPile[discardPile.length - 1];
        return card.color === 'black' || card.color === activeColor || card.value === topCard.value;
    }

    function playerChooseColor() {
        return new Promise(resolve => {
            const colors = ['red', 'green', 'blue', 'yellow'];
            const chosenColor = prompt(`Choose a color: ${colors.join(', ')}`);
            if (colors.includes(chosenColor)) {
                resolve(chosenColor);
            } else {
                resolve(colors[0]); // Default
            }
        });
    }

    function updateUI() {
        // Update Player's Hand
        playerHandEl.innerHTML = '';
        playerHand.forEach((card, index) => {
            const cardEl = renderCard(card);
            cardEl.dataset.index = index;
            if (currentPlayer === 'player' && isPlayable(card)) {
                cardEl.classList.add('playable');
            }
            playerHandEl.appendChild(cardEl);
        });

        // Update Computer's Hand
        computerHandEl.innerHTML = '';
        computerHand.forEach(() => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card back';
            computerHandEl.appendChild(cardEl);
        });

        // Update Discard Pile
        discardPileEl.innerHTML = '';
        const topCard = discardPile[discardPile.length - 1];
        if (topCard) {
            const topCardEl = renderCard(topCard);
            if (topCard.color === 'black') {
                topCardEl.style.borderColor = activeColor;
                topCardEl.style.borderWidth = '4px';
            }
            discardPileEl.appendChild(topCardEl);
        }

        // Update Card Counts
        playerCardCountEl.textContent = playerHand.length;
        computerCardCountEl.textContent = computerHand.length;
    }
    
    function renderCard(card) { 
        const el=document.createElement('div'); el.className='card'; el.dataset.color=card.color; el.dataset.value=card.value; let c=card.value,s=card.value; if(s==='skip')c=s='⊘'; if(s==='reverse')c=s='⇄'; if(s==='draw2')c=s='+2'; if(s==='wild')s='W'; if(s==='wild_draw4')s='W+4'; const corner=document.createElement('div'); corner.className='card-corner'; corner.textContent=s; const content=document.createElement('div'); content.className='card-content'; content.textContent=c; if(card.color==='black'){ corner.textContent=''; content.innerHTML=card.value==='wild_draw4'?'WILD<br>+4':'WILD'; const wildBg=document.createElement('div');wildBg.className='wild-bg'; el.appendChild(wildBg); } el.appendChild(corner); el.appendChild(content); return el;
    }

    // গেমটি শুরু করা হচ্ছে
    initializeGame();
}
