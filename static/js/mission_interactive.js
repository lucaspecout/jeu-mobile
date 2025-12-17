const qs = (sel) => document.querySelector(sel);
const sceneImg = qs('#scene-img');
const speakerName = qs('#speaker-name');
const dialogueText = qs('#dialogue-text');
const choicesContainer = qs('#choices-container');
const phaseDisplay = qs('#phase-display');
const scoreDisplay = qs('#score-display');
const endScreen = qs('#end-screen');
const minigameOverlay = qs('#minigame-overlay');

// Global Context from server injection
const MISSION_SLUG = window.MISSION_CONTEXT ? window.MISSION_CONTEXT.slug : 'arret_cardiaque';

async function init() {
    // Start mission on server
    try {
        const res = await fetch(`/api/mission/start/${MISSION_SLUG}`, { method: 'POST' });
        if (!res.ok) throw new Error("Failed to start mission");
        const data = await res.json();
        renderStep(data);
    } catch (e) {
        console.error(e);
        dialogueText.textContent = "Erreur de connexion au QG...";
    }
}

function renderStep(data) {
    console.log("Rendering step:", data);

    if (data.finished) {
        showVictory(data.final_score);
        return;
    }

    if (data.is_game_over) {
        // Handle Game Over UI (reuse existing UI or specific)
        // For now using simple reload alert or just visual state
    }

    // Update Text
    phaseDisplay.textContent = data.phase || '';
    speakerName.textContent = data.speaker || '';
    dialogueText.textContent = data.text || '';

    // Update Score
    scoreDisplay.textContent = `${data.score} pts`;

    // Media
    const sceneVideo = qs('#scene-video');
    if (data.video) {
        if (sceneImg) sceneImg.classList.add('hidden');
        if (sceneVideo) {
            sceneVideo.src = `/static/img/mission_acr/${data.video}`;
            sceneVideo.classList.remove('hidden');
            sceneVideo.play().catch(e => console.log("Autoplay blocked"));
        }
    } else if (data.img) {
        if (sceneVideo) sceneVideo.classList.add('hidden');
        if (sceneImg) {
            sceneImg.src = `/static/img/mission_acr/${data.img}`;
            sceneImg.classList.remove('hidden');
        }
    }

    // Choices
    choicesContainer.innerHTML = '';
    data.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.label;
        btn.onclick = () => handleChoice(choice);
        choicesContainer.appendChild(btn);
    });

    // Minigame Trigger?
    if (data.minigame) {
        // Based on step_id, assume strict coupling for now
        if (data.step_id.includes('cpr')) startCPRMinigame();
        if (data.step_id.includes('electrodes')) startElectrodeGame();
        if (data.step_id.includes('shock')) startShockGame();
    }
}

async function handleChoice(choice) {
    // Send action to server
    try {
        const res = await fetch(`/api/mission/action/${MISSION_SLUG}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choice_index: choice.index })
        });
        const nextData = await res.json();

        // Optimistic UI feedback could be added here
        renderStep(nextData);

    } catch (e) {
        console.error(e);
    }
}

// --- MINIGAMES (Keep visuals local, report result to server) ---

// CPR
function startCPRMinigame() {
    minigameOverlay.classList.remove('hidden');
    const btn = qs('#cpr-btn');
    const bpmDisplay = qs('#bpm-counter');
    const streakDisplay = qs('#cpr-streak');

    let clicks = [];
    let streak = 0;
    let lastClick = 0;

    const end = (success) => {
        minigameOverlay.classList.add('hidden');
        // Report result
        sendMinigameResult({ success: success, score: streak * 1 });
    };

    btn.onclick = () => {
        const now = Date.now();
        gsap.to(btn, { scale: 0.9, duration: 0.05, yoyo: true, repeat: 1 });

        if (lastClick !== 0) {
            const delta = now - lastClick;
            const bpm = Math.round(60000 / delta);
            bpmDisplay.textContent = bpm;

            if (bpm >= 100 && bpm <= 120) {
                bpmDisplay.style.color = '#3af2ff';
                streak++;
            } else {
                bpmDisplay.style.color = '#ff3f3f';
                streak = 0;
            }
            streakDisplay.textContent = `Série : ${streak} / 8`;
        }
        lastClick = now;

        if (streak >= 8) {
            streakDisplay.textContent = 'PARFAIT !';
            setTimeout(() => end(true), 500);
            btn.onclick = null;
        }
    };

    // Add fail safe / skip button logic if needed (kept simple for brevity)
}

// Electrodes
function startElectrodeGame() {
    const overlay = qs('#electrodes-overlay');
    overlay.classList.remove('hidden');
    // ... simplified visual logic ...
    // For now, auto-win for demo or simple click
    const ids = ['#zone-1', '#zone-2'];
    let count = 0;
    ids.forEach(id => {
        qs(id).onclick = (e) => {
            e.stopPropagation();
            qs(id).style.display = 'none';
            // show electrode
            count++;
            if (count >= 2) {
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    sendMinigameResult({ success: true, score: 10 });
                }, 500);
            }
        };
    });
}

// Shock
function startShockGame() {
    const overlay = qs('#shock-overlay');
    overlay.classList.remove('hidden');
    const btn = qs('#shock-btn');
    btn.onclick = () => {
        // Flash
        overlay.classList.add('hidden');
        sendMinigameResult({ success: true, score: 10 });
    };
}

async function sendMinigameResult(result) {
    try {
        const res = await fetch(`/api/mission/action/${MISSION_SLUG}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minigame_result: result })
        });
        const data = await res.json();
        renderStep(data);
    } catch (e) {
        console.error(e);
    }
}

function showVictory(score) {
    endScreen.classList.remove('hidden');
    qs('#end-score').textContent = score;
}

// Init
document.addEventListener('DOMContentLoaded', init);
