document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const getEl = id => document.getElementById(id);

    // Landing Page Elements
    const landingPage = getEl('landing-page');
    const animatedBg = getEl('animated-bg');
    const playComputerBtn = getEl('play-computer-btn');
    const createRoomBtn = getEl('create-room-btn');
    const showStatsBtn = getEl('show-stats-btn');

    // Title Animation
    const title = document.querySelector('.landing-content h1');
    const titleText = title.textContent;
    title.innerHTML = '';
    titleText.split('').forEach((char, index) => {
        if (char === ' ') {
            title.innerHTML += ' ';
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.animationDelay = `${index * 0.05}s`;
            title.appendChild(span);
        }
    });

    // Parallax Effect
    landingPage.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { offsetWidth, offsetHeight } = landingPage;
        const x = (clientX / offsetWidth - 0.5) * 30;
        const y = (clientY / offsetHeight - 0.5) * 30;
        animatedBg.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Game Elements
    const gameContainer = getEl('game-container');
    const shuffleOverlay = getEl('shuffle-overlay');
    const playerArea = getEl('player-area'), computerArea = getEl('computer-area');
    const playerHandEl = getEl('player-hand'), computerHandEl = getEl('computer-hand');
    const discardPileEl = getEl('discard-pile'), deckPileEl = getEl('deck-pile');
    const statusMsgEl = getEl('status-message');
    const playerCardCountEl = getEl('player-card-count'), computerCardCountEl = getEl('computer-card-count');
    const playerScoreEl = getEl('player-score'), computerScoreEl = getEl('computer-score');
    const restartBtn = getEl('restart-button'), unoBtn = getEl('uno-button'), rulesBtn = getEl('rules-button'), passBtn = getEl('pass-button');
    
    // Modals
    const colorPickerModal = getEl('color-picker-modal'), colorChoices = document.querySelectorAll('.color-choice');
    const rulesModal = getEl('rules-modal'), closeRulesBtn = getEl('close-rules-button');
    const gameOverModal = getEl('game-over-modal');
    const gameOverMsgEl = getEl('game-over-message');
    const finalStatsEl = getEl('final-stats');
    const lobbyModal = getEl('lobby-modal'), startGameBtn = getEl('start-game-btn'), aiDifficultySelect = getEl('ai-difficulty');
    
    // *** NEW MODAL ELEMENTS ***
    const statsModal = getEl('stats-modal');
    const statsContentEl = getEl('stats-content');
    const closeStatsBtn = getEl('close-stats-btn');
    const roundOverModal = getEl('round-over-modal');
    const roundOverMessageEl = getEl('round-over-message');
    const nextRoundBtn = getEl('next-round-btn');


    const toastNotification = getEl('toast-notification');
    const toastMessage = getEl('toast-message');

    // Constants & Game State
    const COLORS = ['red', 'green', 'blue', 'yellow'], VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'], WILD_VALUES = ['wild', 'wild_draw4'];
    const DELAY = 1500, UNO_TIMER_DURATION = 5000, TARGET_SCORE = 500;
    
    let deck, playerHand, computerHand, discardPile, activeColor, currentPlayer, isGameOver;
    let unoState = { player: false, computer: false };
    let playerScore = 0, computerScore = 0;
    let aiDifficulty = 'medium';

    // --- Helper Functions ---
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    const updateStatus = async (message) => {
        toastMessage.textContent = message;
        toastNotification.classList.add('show');
        await wait(DELAY);
        toastNotification.classList.remove('show');
        await wait(400);
    };

    function getStats() {
        const stats = localStorage.getItem('unoPlayerStats');
        return stats ? JSON.parse(stats) : { wins: 0, losses: 0, gamesPlayed: 0 };
    }

    function saveStats(stats) {
        localStorage.setItem('unoPlayerStats', JSON.stringify(stats));
    }
    
    function calculatePoints(hand) {
        return hand.reduce((points, card) => {
            if (WILD_VALUES.includes(card.value)) return points + 50;
            if (['skip', 'reverse', 'draw2'].includes(card.value)) return points + 20;
            return points + parseInt(card.value, 10);
        }, 0);
    }

    function createDeck() { const d = []; COLORS.forEach(c => { VALUES.forEach(v => { d.push({ color: c, value: v }); if (v !== '0') d.push({ color: c, value: v }); }); }); WILD_VALUES.forEach(v => { for (let i = 0; i < 4; i++) d.push({ color: 'black', value: v }); }); return d; }
    function shuffle(d) { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }

    async function drawCards(player, num) {
        const hand = player === 'player' ? playerHand : computerHand;
        for (let i = 0; i < num; i++) {
            if (deck.length === 0) { if (discardPile.length <= 1) return; const top = discardPile.pop(); deck = shuffle(discardPile.slice(0, -1)); discardPile = [top]; }
            if (deck.length > 0) { await animateCardDraw(player); hand.push(deck.pop()); updateUI(); if (num > 1) await wait(200); }
        }
        if (player === 'player') unoState.player = false; else unoState.computer = false;
    }

    const gameManager = {
        async start(isNewGame = false) {
            if (isNewGame) {
                playerScore = 0;
                computerScore = 0;
            }
            gameOverModal.classList.add('hidden');
            shuffleOverlay.classList.add('active');
            
            await this.animateShuffle();
            
            shuffleOverlay.classList.remove('active');

            isGameOver = false;
            deck = shuffle(createDeck());
            playerHand = []; computerHand = [];
            discardPile = null;
            unoState = { player: false, computer: false };
            
            let firstCard;
            do { if (deck.length === 0) deck = shuffle(createDeck()); firstCard = deck.pop(); } while (WILD_VALUES.includes(firstCard.value));
            
            statusMsgEl.textContent = "Dealing cards...";
            for (let i = 0; i < 7; i++) { await drawCards('computer', 1); await wait(100); await drawCards('player', 1); await wait(100); }
            statusMsgEl.textContent = ""; 
            
            discardPile = [firstCard];
            activeColor = firstCard.color;
            unoBtn.classList.add('hidden');
            passBtn.classList.add('hidden');
            
            await updateStatus("Game is starting!");
            currentPlayer = 'player';
            this.run();
        },

        animateShuffle() { return new Promise(resolve => { const cards = document.querySelectorAll('.shuffle-card'); const duration = 2000; setTimeout(() => cards.forEach(card => card.classList.add('shuffling')), 100); setTimeout(() => cards.forEach(card => card.classList.remove('shuffling')), duration / 2); setTimeout(resolve, duration); }); },
        
        async run() { while (!isGameOver) { updateUI(); if (currentPlayer === 'player') { await this.playerTurn(); } else { await this.computerTurn(); } this.checkRoundOver(); } },
        
        async playerTurn() { if (unoState.computer) { await updateStatus("Computer forgot to call UNO!\nIt draws 2 cards."); await drawCards('computer', 2); } await updateStatus("Your turn!"); const choice = await this.waitForPlayerAction(); let skipNext = false; let playedCard = false; if (choice.action === 'draw') { await updateStatus("You chose to draw."); await drawCards('player', 1); const drawnCard = playerHand[playerHand.length - 1]; if (isPlayable(drawnCard)) { await updateStatus("You drew a playable card!\nPlay it or pass."); passBtn.classList.remove('hidden'); const playChoice = await this.waitForPlayerAction(drawnCard, true); passBtn.classList.add('hidden'); if (playChoice.action === 'play') { skipNext = await this.processCard(playChoice.card, 'player', playChoice.cardEl); playerHand = playerHand.filter(c => c !== playChoice.card); if (playerHand.length === 1) unoState.player = true; playedCard = true; } } } else if (choice.action === 'play') { skipNext = await this.processCard(choice.card, 'player', choice.cardEl); playerHand = playerHand.filter(c => c !== choice.card); if (playerHand.length === 1) unoState.player = true; playedCard = true; } if (playedCard && unoState.player) { updateUI(); await this.handleUnoTimer(); } if (playedCard) { if (!skipNext) this.switchPlayer(); } else { this.switchPlayer(); } },
        
        async computerTurn() { 
            if (unoState.player) { await updateStatus("You forgot to call UNO!\nYou draw 2 cards."); await drawCards('player', 2); } 
            await updateStatus("Computer's turn..."); 
            const thinkingTime = Math.random() * (1500 - 750) + 750;
            await wait(thinkingTime);
            let skipNext = false; 
            const playableCards = computerHand.filter(isPlayable); 
            if (playableCards.length === 0) { await updateStatus("Computer draws a card."); await drawCards('computer', 1); } 
            else { const card = computerAI.chooseCard(playableCards, playerHand.length); skipNext = await this.processCard(card, 'computer'); computerHand = computerHand.filter(c => c !== card); if (computerHand.length === 1) { await updateStatus("Computer calls UNO!"); unoState.computer = false; } } 
            if (!skipNext) this.switchPlayer(); 
        },

        async processCard(card, player, cardEl = null) {
            if (player === 'player' && cardEl) {
                await animateCardPlay(cardEl, false);
            } else if (player === 'computer') {
                const tempCard = renderCard(card);
                const computerAreaRect = computerArea.getBoundingClientRect();
                tempCard.style.position = 'fixed';
                tempCard.style.left = `${computerAreaRect.left + computerAreaRect.width / 2 - 50}px`;
                tempCard.style.top = `${computerAreaRect.top + 50}px`;
                tempCard.style.zIndex = '100';
                document.body.appendChild(tempCard);
                await animateCardPlay(tempCard, true);
            }

            discardPile.push(card);
            let skipNextPlayer = false;

            if (card.color === 'black') {
                activeColor = await (player === 'player' ? this.playerChooseColor() : computerAI.chooseColor(computerHand));
            } else {
                activeColor = card.color;
            }

            switch (card.value) {
                case 'skip':
                case 'reverse':
                    skipNextPlayer = true;
                    break;
                case 'draw2':
                    await drawCards(player === 'player' ? 'computer' : 'player', 2);
                    skipNextPlayer = true;
                    break;
                case 'wild_draw4':
                    await drawCards(player === 'player' ? 'computer' : 'player', 4);
                    skipNextPlayer = true;
                    await updateStatus(`${player === 'player' ? 'Computer draws 4!' : 'You draw 4!'}`);
                    break;
            }
            return skipNextPlayer;
        },

        handleUnoTimer() { return new Promise(resolve => { let timerId; const clickHandler = () => { clearTimeout(timerId); toastNotification.classList.remove('show'); updateStatus("You called UNO!"); unoState.player = false; updateUI(); unoBtn.removeEventListener('click', clickHandler); resolve(); }; unoBtn.addEventListener('click', clickHandler); updateStatus("Call UNO!"); timerId = setTimeout(async () => { unoBtn.removeEventListener('click', clickHandler); if (unoState.player) { await updateStatus("Time's up! You forgot to call UNO\nand draw 2 cards."); await drawCards('player', 2); } updateUI(); resolve(); }, UNO_TIMER_DURATION); }); },
        
        waitForPlayerAction(specificCard = null, isDrawnCard = false) { return new Promise(resolve => { const cleanUp = () => { deckPileEl.onclick = null; passBtn.onclick = null; playerHandEl.querySelectorAll('.player-card').forEach(c => c.onclick = null); }; if (isDrawnCard) { passBtn.onclick = () => { cleanUp(); resolve({ action: 'pass' }); }; } else { deckPileEl.onclick = () => { cleanUp(); resolve({ action: 'draw' }); }; } playerHandEl.querySelectorAll('.player-card').forEach(cardEl => { cardEl.onclick = () => { const cardIndex = parseInt(cardEl.dataset.index, 10); const card = playerHand[cardIndex]; if (card && (!specificCard || card === specificCard) && isPlayable(card)) { cleanUp(); resolve({ action: 'play', card, cardEl }); } }; }); }); },
        
        playerChooseColor() { return new Promise(resolve => { colorPickerModal.classList.remove('hidden'); const handler = event => { const chosenColor = event.currentTarget.dataset.color; colorChoices.forEach(c => c.removeEventListener('click', handler)); colorPickerModal.classList.add('hidden'); resolve(chosenColor); }; colorChoices.forEach(choice => choice.addEventListener('click', handler)); }); },
        
        switchPlayer() { currentPlayer = (currentPlayer === 'player' ? 'computer' : 'player'); },
        
        checkRoundOver() {
            let roundWinner = null;
            if (playerHand.length === 0) roundWinner = 'player';
            if (computerHand.length === 0) roundWinner = 'computer';

            if (roundWinner) {
                isGameOver = true;
                const loserHand = roundWinner === 'player' ? computerHand : playerHand;
                const pointsWon = calculatePoints(loserHand);

                if (roundWinner === 'player') playerScore += pointsWon; else computerScore += pointsWon;
                updateUI();

                if (playerScore >= TARGET_SCORE || computerScore >= TARGET_SCORE) {
                    const stats = getStats();
                    stats.gamesPlayed++;
                    const finalWinner = playerScore >= TARGET_SCORE ? 'You' : 'Computer';
                    
                    if (finalWinner === 'You') stats.wins++; else stats.losses++;
                    saveStats(stats);
                    
                    gameOverMsgEl.textContent = `${finalWinner} won the game!`;
                    finalStatsEl.innerHTML = `<p><strong>Final Score:</strong> You ${playerScore} - ${computerScore} Computer</p><hr><p><strong>Career Stats:</strong></p><p>Games Played: ${stats.gamesPlayed}</p><p>Wins: ${stats.wins} | Losses: ${stats.losses}</p><p>Win Rate: ${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%</p>`;
                    gameOverModal.classList.remove('hidden');
                } else {
                    // *** OLD ALERT() IS REPLACED WITH NEW MODAL ***
                    const message = roundWinner === 'player' ? `You won the round and get ${pointsWon} points!` : `Computer won the round and gets ${pointsWon} points.`;
                    setTimeout(() => {
                        roundOverMessageEl.textContent = `${message}\n\nCurrent Score: You ${playerScore} - ${computerScore} Computer\n\nStarting next round...`;
                        roundOverModal.classList.remove('hidden');
                    }, 1000);
                }
            }
        }
    };
    
    const computerAI = {
        chooseCard: (cards, playerCards) => {
            switch (aiDifficulty) {
                case 'easy':
                    return cards[0];
                case 'hard':
                    if (playerCards <= 3) {
                        const actionCard = cards.find(c => ['draw2', 'wild_draw4', 'skip', 'reverse'].includes(c.value));
                        if (actionCard) return actionCard;
                    }
                case 'medium':
                default:
                    const nonWild = cards.find(c => c.color !== 'black');
                    if (nonWild) return nonWild;
                    return cards.find(c => c.value === 'wild') || cards[0];
            }
        },
        chooseColor: (hand) => {
            const counts = {}; COLORS.forEach(c => counts[c] = 0);
            hand.forEach(c => { if (c.color !== 'black') counts[c.color]++; });
            let bestColor = 'red', maxCount = 0;
            for (const color in counts) { if (counts[color] > maxCount) { maxCount = counts[color]; bestColor = color; } }
            return bestColor;
        }
    };

    function isPlayable(card) {
        if (!discardPile || discardPile.length === 0) return false;
        const top = discardPile[discardPile.length - 1];

        if (card.color === 'black') return true;
        if (top.color === 'black') return card.color === activeColor;
        return card.color === top.color || card.value === top.value;
    }
    
    function renderCard(card) { const el=document.createElement('div'); el.className='card'; el.dataset.color=card.color; el.dataset.value=card.value; let c=card.value,s=card.value; if(s==='skip')c=s='⊘'; if(s==='reverse')c=s='⇄'; if(s==='draw2')c=s='+2'; if(s==='wild')s='W'; if(s==='wild_draw4')s='W+4'; const corner=document.createElement('div'); corner.className='card-corner'; corner.textContent=s; const content=document.createElement('div'); content.className='card-content'; content.textContent=c; if(card.color==='black'){ corner.textContent=''; content.innerHTML=card.value==='wild_draw4'?'WILD<br>+4':'WILD'; const wildBg=document.createElement('div');wildBg.className='wild-bg'; el.appendChild(wildBg); } el.appendChild(corner); el.appendChild(content); return el;}
    
    function animateCardPlay(cardEl, isComputerCard = false) {
        return new Promise(resolve => {
            const discardPileRect = discardPileEl.getBoundingClientRect();
            const cardRect = cardEl.getBoundingClientRect();
    
            if (!isComputerCard) {
                cardEl.classList.add('playing');
                cardEl.style.left = `${cardRect.left}px`;
                cardEl.style.top = `${cardRect.top}px`;
            }
    
            requestAnimationFrame(() => {
                const x = discardPileRect.left + (discardPileRect.width / 2) - cardRect.left - (cardRect.width / 2);
                const y = discardPileRect.top + (discardPileRect.height / 2) - cardRect.top - (cardRect.height / 2);
                cardEl.style.transform = `translate(${x}px, ${y}px) rotate(360deg) scale(1.05)`;
                cardEl.style.opacity = '0.8';
            });
    
            setTimeout(() => {
                if (isComputerCard) cardEl.remove();
                else {
                    cardEl.classList.remove('playing');
                    cardEl.style.transform = '';
                    cardEl.style.opacity = '';
                }
                resolve();
            }, 500);
        });
    }

    async function animateCardDraw(player) { const startRect = deckPileEl.getBoundingClientRect(); const endRect = player === 'player' ? playerHandEl.getBoundingClientRect() : computerHandEl.getBoundingClientRect(); const tempCard = document.createElement('div'); tempCard.className = 'card back dealing-card'; tempCard.style.left = `${startRect.left}px`; tempCard.style.top = `${startRect.top}px`; document.body.appendChild(tempCard); await wait(20); const x = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2); const y = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2); tempCard.style.transform = `translate(${x}px, ${y}px)`; await wait(400); tempCard.remove(); }
    
    function updateUI() {
        playerHandEl.innerHTML = '';
        playerHand.forEach((card, index) => {
            const el = renderCard(card);
            el.dataset.index = index;
            if (currentPlayer === 'player' && !isGameOver) {
                el.classList.add('player-card');
                if (isPlayable(card)) {
                    el.classList.add('playable');
                    if (card.color === 'black') {
                        el.classList.add('playable-glow-wild');
                    } else {
                        el.classList.add(`playable-glow-${card.color}`);
                    }
                }
            }
            playerHandEl.appendChild(el);
        });
        
        unoBtn.classList.toggle('hidden', !unoState.player);
        
        computerHandEl.innerHTML = '';
        computerHand.forEach(() => {
            const el = document.createElement('div');
            el.className = 'card back';
            computerHandEl.appendChild(el);
        });
        
        discardPileEl.innerHTML = '';
        if (discardPile && discardPile.length > 0) {
            const top = discardPile[discardPile.length - 1];
            const el = renderCard(top);
            
            const glowColor = top.color === 'black' ? activeColor : top.color;
            el.classList.add(`discard-glow-${glowColor}`);

            if (top.color === 'black') {
                el.style.borderColor = activeColor;
                el.style.borderWidth = '5px';
            }
            discardPileEl.appendChild(el);
        }
        
        playerCardCountEl.textContent = playerHand.length;
        computerCardCountEl.textContent = computerHand.length;
        playerScoreEl.textContent = playerScore;
        computerScoreEl.textContent = computerScore;

        playerArea.classList.toggle('active-player', currentPlayer === 'player' && !isGameOver);
        computerArea.classList.toggle('active-player', currentPlayer === 'computer' && !isGameOver);
    }

    // --- Event Listeners and Initial Setup ---
    playComputerBtn.addEventListener('click', () => {
        lobbyModal.classList.remove('hidden');
    });

    startGameBtn.addEventListener('click', () => {
        aiDifficulty = aiDifficultySelect.value;
        lobbyModal.classList.add('hidden');
        landingPage.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameManager.start(true);
    });

    createRoomBtn.addEventListener('click', () => {
        alert('Custom Room feature is coming soon!');
    });

    // *** MODIFIED to use new modal instead of alert() ***
    showStatsBtn.addEventListener('click', () => {
        const stats = getStats();
        const winRate = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1) : 0;
        
        statsContentEl.innerHTML = `
            <p><strong>Games Played:</strong> ${stats.gamesPlayed}</p>
            <p><strong>Wins:</strong> ${stats.wins}</p>
            <p><strong>Losses:</strong> ${stats.losses}</p>
            <p><strong>Win Rate:</strong> ${winRate}%</p>
        `;
        statsModal.classList.remove('hidden');
    });
    
    // *** NEW EVENT LISTENERS for the new modals ***
    closeStatsBtn.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });

    nextRoundBtn.addEventListener('click', () => {
        roundOverModal.classList.add('hidden');
        gameManager.start(false); // Start the next round
    });

    restartBtn.addEventListener('click', () => gameManager.start(true));
    rulesBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
    closeRulesBtn.addEventListener('click', () => rulesModal.classList.add('hidden'));
});