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
// LOG RAW CONTEXT
const RAW_CTX = window.MISSION_CONTEXT;
const MISSION_SLUG = (RAW_CTX && RAW_CTX.slug) ? RAW_CTX.slug : 'arret_cardiaque';

// Debug Logger
function logDebug(msg) {
    const logBox = document.getElementById('debug-log');
    if (logBox) {
        const line = document.createElement('div');
        line.textContent = `[JS] ${msg}`;
        logBox.appendChild(line);
    }
    console.log(msg);
}

// Log immediately
if (document.getElementById('debug-log')) {
    document.getElementById('debug-log').innerHTML += "<div>[JS] Raw Context: " + JSON.stringify(window.MISSION_CONTEXT) + "</div>";
}

async function init() {
    logDebug("Init started. Slug: " + MISSION_SLUG);

    // Start mission on server
    try {
        logDebug("Fetching /api/mission/start/" + MISSION_SLUG);
        const res = await fetch(`/api/mission/start/${MISSION_SLUG}`, { method: 'POST' });
        logDebug("Fetch status: " + res.status);

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to start mission: ${res.status} - ${text}`);
        }

        const data = await res.json();
        logDebug("Data received: " + JSON.stringify(data));

        if (!data) {
            throw new Error("Data is null/undefined");
        }

        renderStep(data);
    } catch (e) {
        logDebug("CRITICAL ERROR: " + e.message);
        if (dialogueText) {
            dialogueText.textContent = "ERREUR FATALE: " + e.message;
            dialogueText.style.color = "red";
        }
    }
}

function renderStep(data) {
    logDebug("Rendering step: " + (data.phase || 'Unknown'));

    if (data.finished) {
        showVictory(data.final_score);
        return;
    }

    if (data.is_game_over) {
        // Game over logic if needed
    }

    // Update Text
    if (phaseDisplay) phaseDisplay.textContent = data.phase || '';
    if (speakerName) speakerName.textContent = data.speaker || '';
    if (dialogueText) {
        dialogueText.textContent = data.text || '';
        dialogueText.style.color = ""; // reset error color
    }

    // Update Score
    if (scoreDisplay) scoreDisplay.textContent = `${data.score} pts`;

    // Media
    const sceneVideo = qs('#scene-video');
    if (data.video) {
        if (sceneImg) sceneImg.classList.add('hidden');
        if (sceneVideo) {
            sceneVideo.src = `/static/img/mission_acr/${data.video}`;
            sceneVideo.classList.remove('hidden');
            sceneVideo.play().catch(e => logDebug("Autoplay blocked"));
        }
    } else if (data.img) {
        if (sceneVideo) sceneVideo.classList.add('hidden');
        if (sceneImg) {
            // Check if absolute or relative
            let src = data.img;
            if (!src.startsWith('/') && !src.startsWith('http')) {
                // default path used in game_engine, but quiz uses ../protec38dps/
                src = `/static/img/mission_acr/${data.img}`;
            }
            sceneImg.src = src;
            sceneImg.classList.remove('hidden');
        }
    }

    // Choices
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        if (data.choices) {
            data.choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice.label;
                btn.onclick = (e) => handleChoice(choice, index, e.currentTarget);
                choicesContainer.appendChild(btn);
            });
        }
    }

    // Minigame Trigger?
    if (data.minigame && data.step_id) {
        if (data.step_id.includes('cpr')) startCPRMinigame();
        if (data.step_id.includes('electrodes')) startElectrodeGame();
        if (data.step_id.includes('shock')) startShockGame();
    }

    if (data.is_game_over) {
        const btn = document.createElement('button');
        btn.className = 'choice-btn critical';
        btn.textContent = '❌ ÉCHEC - Recommencer';
        btn.style.borderColor = '#ff3f3f';
        btn.onclick = () => location.reload();
        if (choicesContainer) choicesContainer.appendChild(btn);
    }
}

async function handleChoice(choice, index, btnElement) {
    // Visual Feedback (User Request)
    if (choice.score >= 0 || choice.type === 'minigame') {
        btnElement.style.background = 'rgba(46, 204, 113, 0.5)'; // Green
        btnElement.style.borderColor = '#2ecc71';
    } else {
        btnElement.style.background = 'rgba(231, 76, 60, 0.5)'; // Red
        btnElement.style.borderColor = '#e74c3c';
    }

    // Tiny delay to let user see the color
    await new Promise(r => setTimeout(r, 500));

    logDebug("Choice clicked: " + index + " (" + choice.label + ")");
    try {
        const res = await fetch(`/api/mission/action/${MISSION_SLUG}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                choice_index: index,
                choice_label: choice.label
            })
        });
        const data = await res.json();
        renderStep(data);
    } catch (e) {
        logDebug("Action Error: " + e);
    }
}

// Minigames
function startElectrodeGame() {
    const overlay = qs('#electrodes-overlay');
    if (overlay) overlay.classList.remove('hidden');
    const ids = ['#zone-1', '#zone-2'];
    let count = 0;
    ids.forEach(id => {
        const el = qs(id);
        if (el) {
            el.onclick = (e) => {
                e.stopPropagation();
                el.style.display = 'none';
                count++;
                if (count >= 2) {
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        sendMinigameResult({ success: true, score: 10 });
                    }, 500);
                }
            };
        }
    });
}

function startShockGame() {
    const overlay = qs('#shock-overlay');
    if (overlay) overlay.classList.remove('hidden');
    const btn = qs('#shock-btn');
    if (btn) {
        btn.onclick = () => {
            if (overlay) overlay.classList.add('hidden');
            sendMinigameResult({ success: true, score: 10 });
        };
    }
}

function startCPRMinigame() {
    const overlay = qs('#minigame-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    const btn = qs('#cpr-btn');
    const display = qs('#bpm-counter');
    const feedback = qs('#minigame-overlay p');

    let lastTime = 0;
    let streak = 0;
    let penalties = 0;
    const TARGET_STREAK = 6;

    if (btn) btn.onclick = (e) => {
        // Visual click effect
        btn.style.transform = "scale(0.9)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);

        const now = Date.now();
        if (lastTime === 0) {
            lastTime = now;
            if (display) display.textContent = "BPM: ...";
            if (feedback) feedback.textContent = "Gardez le rythme !";
            return;
        }

        const delta = now - lastTime;
        lastTime = now;

        // Prevent absurdly fast clicks (debounce)
        if (delta < 200) return;

        const bpm = Math.round(60000 / delta);

        // Logic
        let color = 'red';
        let msg = "Trop lent !";

        if (bpm > 130) msg = "Trop vite !";
        else if (bpm < 90) msg = "Trop lent !";

        // Green: 100-120 (Optimal)
        if (bpm >= 100 && bpm <= 120) {
            color = '#2ecc71'; // Green
            msg = "Parfait !";
            streak++;
        }
        // Orange: 90-100 OR 120-130 (Acceptable)
        else if ((bpm >= 90 && bpm < 100) || (bpm > 120 && bpm <= 130)) {
            color = '#f39c12'; // Orange
            msg = "Attention...";
            streak++;
        } else {
            // Fail (Red)
            color = '#e74c3c';
            streak = 0;
            penalties += 5;
            msg += " (-5 pts)";
        }

        if (display) {
            display.textContent = `BPM: ${bpm}`;
            display.style.color = color;
        }
        if (feedback) {
            feedback.textContent = `${msg} (Série: ${streak}/${TARGET_STREAK})`;
            feedback.style.color = color;
        }

        if (streak >= TARGET_STREAK) {
            btn.onclick = null; // Disable further clicks
            streak = 0; // Reset just in case
            const finalScore = Math.max(-100, 10 - penalties);
            if (feedback) feedback.textContent = `VICTOIRE ! (${finalScore} pts)`;

            setTimeout(() => {
                overlay.classList.add('hidden');
                sendMinigameResult({ success: true, score: finalScore });
            }, 800);
        }
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
        logDebug("Minigame API Error: " + e);
    }
}

function showVictory(score) {
    if (endScreen) {
        endScreen.classList.remove('hidden');
        const sc = qs('#end-score');
        if (sc) sc.textContent = score;
    }
}

document.addEventListener('DOMContentLoaded', init);
