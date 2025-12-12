
const qs = (sel) => document.querySelector(sel);

// Logic State
let currentWord = "";
let currentWordIndex = -1;
let guessedLetters = new Set();
let wrongCount = 0;
const MAX_ERRORS = 6; // Emoji steps: 0=Happy -> 6=Skull

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

// Logic State
let baseScore = 0;
if (gameData) {
    baseScore = parseInt(gameData.dataset.baseScore || "0");
}

// Init
async function init() {
    console.log("Pendu Init");
    await fetchStats();
    fetchNextWord();
    renderKeyboard();
}

async function fetchStats() {
    try {
        const res = await fetch('/api/pendu/state');
        if (!res.ok) throw new Error("Failed to fetch state");
        const data = await res.json();
        updateStats(data);
        if (data.is_finished) {
            showEndScreen(data);
        }
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
    console.log("Fetching next word...");
    resetBoard();

    // Explicitly sync stats when starting new word (after 3s delay)
    // This ensures header info is up to date
    await fetchStats();

    try {
        const res = await fetch('/api/pendu/word');
        if (!res.ok) throw new Error("Failed to fetch word");
        const data = await res.json();

        if (data.finished) {
            fetchStats(); // Trigger end screen via stats
            return;
        }

        currentWord = (data.word || "").toUpperCase();
        currentWordIndex = data.index;
        console.log("New word loaded:", currentWord);
        renderWordSlots();
    } catch (err) {
        console.error("fetchNextWord error:", err);
    }
}

function resetBoard() {
    guessedLetters.clear();
    wrongCount = 0;
    updateHangmanVisual();

    // Hide Next Action, Show Keyboard
    const nextAction = qs('#next-action');
    if (nextAction) nextAction.classList.add('hidden');

    if (keyboard) keyboard.classList.remove('hidden');
    renderKeyboard();
}

function renderWordSlots() {
    if (!wordDisplay) return;
    wordDisplay.innerHTML = '';
    for (let char of currentWord) {
        const slot = document.createElement('span');
        slot.className = 'letter-slot';
        slot.textContent = guessedLetters.has(char) ? char : '_';
        wordDisplay.appendChild(slot);
    }
}

function renderKeyboard() {
    if (!keyboard) return;
    keyboard.innerHTML = '';
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let char of alphabet) {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.textContent = char;
        btn.onclick = () => handleGuess(char, btn);
        keyboard.appendChild(btn);
    }
}

function handleGuess(letter, btn) {
    if (guessedLetters.has(letter) || wrongCount >= MAX_ERRORS) return;

    guessedLetters.add(letter);
    btn.disabled = true;

    if (currentWord.includes(letter)) {
        btn.classList.add('correct');
        checkWin();
    } else {
        btn.classList.add('wrong');
        wrongCount++;
        updateHangmanVisual();
        checkLoss();
    }
    renderWordSlots();
}

function updateHangmanVisual() {
    const emojis = ["😀", "🙂", "😐", "😕", "😟", "😨", "💀"];
    // Clamp index between 0 and 6
    const index = Math.min(wrongCount, 6);
    const container = qs('.hangman-visual');
    if (container) {
        container.innerHTML = `<div class="hangman-emoji">${emojis[index]}</div>`;
    }
}

function checkWin() {
    if (!currentWord) return;
    // Check if all letters revealed
    const isWin = [...currentWord].every(c => guessedLetters.has(c));
    if (isWin) {
        endRound(true);
    }
}

function checkLoss() {
    if (wrongCount >= MAX_ERRORS) {
        // Reveal word
        [...currentWord].forEach(c => guessedLetters.add(c));
        renderWordSlots();
        endRound(false); // Success = false
    }
}

async function endRound(success) {
    console.log("End round. Success:", success);

    try {
        const res = await fetch('/api/pendu/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: currentWordIndex, success: success })
        });
        const data = await res.json();

        // Update stats UI immediately
        updateStats({
            played_count: data.finished ? 300 : parseInt(statPlayed.textContent || "0") + 1,
            won_count: data.won,
            lost_count: data.lost,
            total_words: 300,
            score: data.score
        });

        // Show result message
        const msg = qs('#result-message');
        if (msg) {
            msg.textContent = success ? "BRAVO ! +10 pts" : `DOMMAGE ! C'était "${currentWord}"`;
            msg.className = success ? "success-text" : "danger-text";
        }

        // Hide keyboard, show next button (as backup)
        if (keyboard) keyboard.classList.add('hidden');
        const nextAction = qs('#next-action');
        if (nextAction) nextAction.classList.remove('hidden');

        const nextBtn = qs('#next-word-btn');
        if (nextBtn) nextBtn.onclick = () => fetchNextWord();

        // AUTO ADVANCE REMOVED - User must click Next
        // if (!data.finished) {
        //     console.log("Auto-advancing in 3s...");
        //     setTimeout(() => {
        //         fetchNextWord();
        //     }, 3000);
        // } else {
        if (data.finished) {
            showEndScreen(data);
        }
        // }

    } catch (err) {
        console.error("endRound error:", err);
        // Fallback removed
    }
}

function showEndScreen(data) {
    if (activeGame) activeGame.classList.add('hidden');
    if (endScreen) endScreen.classList.remove('hidden');
    const finalScore = qs('#final-score');
    const finalWon = qs('#final-won');
    if (finalScore) finalScore.textContent = data.score || scoreVal.textContent;
    if (finalWon) finalWon.textContent = data.won_count || statWon.textContent;
}

// Start
init();
