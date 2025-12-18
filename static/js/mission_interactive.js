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
    logDebug("Choice clicked: " + index + " (" + choice.label + ")");
    try {
        const res = await fetch(`/api/mission/action/${MISSION_SLUG}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ choice_index: index })
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
    let streak = 0;

    if (btn) btn.onclick = () => {
        streak++;
        if (streak >= 8) {
            overlay.classList.add('hidden');
            sendMinigameResult({ success: true, score: 10 });
        }
        if (display) display.textContent = "BPM: " + (100 + Math.random() * 20).toFixed(0);
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
