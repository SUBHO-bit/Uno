document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // All pages and elements
    const landingPage = document.getElementById('landing-page');
    const lobbyPage = document.getElementById('lobby-page');
    const gameContainer = document.getElementById('game-container');

    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomInput = document.getElementById('join-room-input');
    const joinRoomBtn = document.getElementById('join-room-btn');
    
    const roomCodeEl = document.getElementById('room-code');
    const playerListEl = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game-btn');
    const startGameMsg = document.getElementById('start-game-msg');

    const playerHandEl = document.getElementById('player-hand');

    let myRoomId = null;

    // --- Event Listeners ---
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
    
    roomCodeEl.addEventListener('click', () => {
        navigator.clipboard.writeText(myRoomId).then(() => {
            alert('Room Code Copied!');
        });
    });

    // --- On Page Load ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'create') {
        socket.emit('createRoom');
    }

    // --- Listening to Server ---
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
        gameContainer.classList.remove('hidden');
    });

    socket.on('yourHand', (hand) => {
        renderPlayerHand(hand);
    });

    socket.on('errorMsg', (message) => {
        alert(`Error: ${message}`);
    });

    // --- UI Functions ---
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
    
    function renderPlayerHand(hand) {
        playerHandEl.innerHTML = '';
        hand.forEach(card => {
            const cardEl = renderCard(card);
            playerHandEl.appendChild(cardEl);
        });
    }

    function renderCard(card) {
        const el=document.createElement('div'); el.className='card'; el.dataset.color=card.color; el.dataset.value=card.value; let c=card.value,s=card.value; if(s==='skip')c=s='⊘'; if(s==='reverse')c=s='⇄'; if(s==='draw2')c=s='+2'; if(s==='wild')s='W'; if(s==='wild_draw4')s='W+4'; const corner=document.createElement('div'); corner.className='card-corner'; corner.textContent=s; const content=document.createElement('div'); content.className='card-content'; content.textContent=c; if(card.color==='black'){ corner.textContent=''; content.innerHTML=card.value==='wild_draw4'?'WILD<br>+4':'WILD'; const wildBg=document.createElement('div');wildBg.className='wild-bg'; el.appendChild(wildBg); } el.appendChild(corner); el.appendChild(content); return el;
    }
});
