const qs = (sel) => document.querySelector(sel);

// UI Elements
const scoreVal = qs('#score-value');
const totalScoreVal = qs('#total-score-value');
const gameData = qs('#game-data');
const statPlayed = qs('#stat-played');
const statWon = qs('#stat-won');
const statLost = qs('#stat-lost');
const progressBar = qs('#global-progress-bar');
const wordDisplay = qs('#word-display');
const keyboard = qs('#keyboard');
const activeGame = qs('#active-game');
const endScreen = qs('#end-screen');
const hangmanContainer = qs('.hangman-visual');

let baseScore = 0;
if (gameData) {
    baseScore = parseInt(gameData.dataset.baseScore || "0");
}

// Init
async function init() {
    console.log("Pendu Secure Init v3");
    // Force visible immediately
    if (activeGame) activeGame.classList.remove('hidden');

    try {
        await fetchStats();
        // If fetchStats worked, try game
        fetchNextWord();
    } catch (e) {
        console.error("Init failed", e);
        alert("Erreur initialisation: " + e.message);
    }
}

async function fetchStats() {
    try {
        const res = await fetch('/api/pendu/state');
        if (!res.ok) throw new Error("Failed to fetch state");
        const data = await res.json();
        updateStats(data);
    } catch (err) {
        console.error("fetchStats error:", err);
    }
}

function updateStats(data) {
    if (!data) return;
    if (statPlayed) statPlayed.textContent = data.played_count;
    if (statWon) statWon.textContent = data.won_count;
    if (statLost) statLost.textContent = data.lost_count;

    const currentScore = data.score || 0;
    if (scoreVal) scoreVal.textContent = currentScore;
    if (totalScoreVal) totalScoreVal.textContent = baseScore + currentScore;

    if (progressBar) {
        const pct = (data.played_count / (data.total_words || 300)) * 100;
        progressBar.style.width = `${pct}%`;
    }
}

async function fetchNextWord() {
    console.log("Fetching new game...");
    // alert("DEBUG: Fetching word..."); // Uncomment if needed, but let's try console first
    resetBoard();
    toggleLoading(true);

    try {
        const res = await fetch('/api/pendu/word');
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Server Error: ${res.status} - ${txt}`);
        }
        const data = await res.json();
        console.log("RX DATA:", data);

        if (!data || !data.masked_word) {
            throw new Error("Invalid Data Received: " + JSON.stringify(data));
        }

        // Render initial state
        renderGame(data);
        toggleLoading(false);

    } catch (err) {
        console.error("fetchNextWord error:", err);
        if (wordDisplay) {
            wordDisplay.innerHTML = `<span class="danger-text">Erreur connexion. <button onclick="location.reload()">↺</button></span>`;
        }
    }
}

function resetBoard() {
    // Reset visual to start state
    updateHangmanVisual(0);
    if (wordDisplay) wordDisplay.innerHTML = 'Chargement...';

    // Ensure keyboard is cleared AND visible (it gets hidden at end game)
    if (keyboard) {
        keyboard.innerHTML = '';
        keyboard.classList.remove('hidden');
    }

    const nextAction = qs('#next-action');
    if (nextAction) nextAction.classList.add('hidden');

    if (activeGame) activeGame.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');
}

function renderGame(gameState) {
    // Word
    if (wordDisplay) {
        wordDisplay.innerHTML = '';
        const chars = gameState.masked_word.split('');
        chars.forEach(char => {
            const slot = document.createElement('span');
            slot.className = 'letter-slot';
            slot.textContent = char;
            wordDisplay.appendChild(slot);
        });
    }

    // Keyboard
    renderKeyboard(gameState.guessed_letters, gameState.masked_word);

    // Visuals
    updateHangmanVisual(gameState.wrong_count);

    // End State
    if (gameState.finished) {
        handleEndGame(gameState);
    }
}

function renderKeyboard(guessedList, maskedWord) {
    if (!keyboard) return;
    const guessedSet = new Set(guessedList);

    // Normalize mask to check keys
    const revealedChars = new Set(maskedWord.split(''));

    keyboard.innerHTML = '';
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let char of alphabet) {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.textContent = char;

        if (guessedSet.has(char)) {
            btn.disabled = true;
            btn.classList.add('disabled');

            // Check if correct or wrong based on presence in revealed word
            if (revealedChars.has(char)) {
                btn.classList.add('correct'); // CSS should make this GREEN
            } else {
                btn.classList.add('wrong');   // CSS should make this RED
            }
        } else {
            btn.onclick = () => sendGuess(char, btn);
        }
        keyboard.appendChild(btn);
    }
}

async function sendGuess(letter, btn) {
    // Optimistic UI
    btn.disabled = true;
    btn.classList.add('disabled');

    try {
        const res = await fetch('/api/pendu/guess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letter: letter })
        });

        if (!res.ok) {
            throw new Error(`Err server`);
        }

        const newState = await res.json();
        renderGame(newState);

    } catch (e) {
        console.error("Guess Error:", e);
        // Silent fail or small UI indicator preferred over alert
        btn.disabled = false;
        btn.classList.remove('disabled');
    }
}

function updateHangmanVisual(count) {
    const emojis = ["😀", "🙂", "😐", "😕", "😟", "😨", "💀"];
    const index = Math.min(count, 6);
    if (hangmanContainer) {
        hangmanContainer.innerHTML = `<div class="hangman-emoji">${emojis[index]}</div>`;
    }
}

function handleEndGame(finalState) {
    // Show End Screen / Next Button
    if (keyboard) keyboard.classList.add('hidden');

    const msg = qs('#result-message');
    if (msg) {
        if (finalState.success) {
            msg.textContent = `BRAVO ! +${finalState.score_gained} pts`;
            msg.className = "success-text";
        } else {
            msg.textContent = `PERDU ! C'était "${finalState.masked_word}"`; // Server sends full word on loss
            msg.className = "danger-text";
        }
    }

    const nextAction = qs('#next-action');
    if (nextAction) {
        nextAction.classList.remove('hidden');
        const nextBtn = qs('#next-word-btn');
        if (nextBtn) nextBtn.onclick = () => fetchNextWord();
    }

    // Update stats one last time
    fetchStats();
}

function toggleLoading(isLoading) {
    // Simple spinner or opacity
    if (activeGame) activeGame.style.opacity = isLoading ? 0.5 : 1;
}

init();
