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
        btn.onclick = (e) => handleChoice(choice, e.currentTarget);
        choicesContainer.appendChild(btn);
    });

    // Minigame Trigger?
    if (data.minigame) {
        // Based on step_id, assume strict coupling for now
        if (data.step_id.includes('cpr')) startCPRMinigame();
        if (data.step_id.includes('electrodes')) startElectrodeGame();
        if (data.step_id.includes('shock')) startShockGame();
    }

    if (data.is_game_over) {
        const btn = document.createElement('button');
        btn.className = 'choice-btn critical'; // Use critical style for attention or just standard
        btn.textContent = '❌ ÉCHEC - Recommencer';
        btn.style.borderColor = '#ff3f3f';
        btn.onclick = () => location.reload();
        choicesContainer.appendChild(btn);
    }
}

async function handleChoice(choice, btnElement) {
    // Send action to server
    try {
        const res = await fetch(`/api/mission/action/${MISSION_SLUG}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choice_index: choice.index })
        });
        const nextData = await res.json();

        // Feedback Logic
        if (btnElement) {
            // Check if score improved or stayed same (neutral/good) vs decreased/gameover (bad)
            // But nextData.score is total score. We need to compare with previous.
            // We can approximate: if choice.score is negative -> wrong, positive -> correct.
            // But choice.score isn't fully exposed in 'choice' object passed here? Yes it is if we used the original object.
            // Wait, data.choices in renderStep comes from get_step_data which has limited fields.
            // Checking game_engine.py: get_step_data sends 'choices' with 'index', 'label', 'type'. Score is hidden.

            // So we must rely on Result comparison or optimistic assumption.
            // Easier: Compare current score displayed in DOM with new score.
            const currentScore = parseInt(scoreDisplay.textContent) || 0;
            const newScore = nextData.score;
            const delta = newScore - currentScore;

            if (nextData.is_game_over || delta < 0) {
                btnElement.classList.add('wrong');
            } else if (delta > 0) {
                btnElement.classList.add('correct');
            } else {
                // Zero points. If it leads to next step successfully, maybe neutral or correct?
                // Some correct steps give 0 points (e.g. intro).
                // Use blue/default or maybe green if not game over?
            }

            // Wait a bit to show color
            await new Promise(r => setTimeout(r, 800));
        }

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
    const skipBtn = qs('#cpr-skip-btn');

    let clicks = [];
    let streak = 0;
    let lastClick = 0;
    let failures = 0;

    // Reset UI
    if (skipBtn) {
        skipBtn.classList.add('hidden');
        skipBtn.onclick = () => end(true);
    }

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
                streak = 0; // Failure of rhythm
                failures++;
                if (failures >= 5 && skipBtn) {
                    skipBtn.classList.remove('hidden');
                }
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
