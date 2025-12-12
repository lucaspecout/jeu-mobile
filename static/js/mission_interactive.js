const qs = (sel) => document.querySelector(sel);
const sceneImg = qs('#scene-img');
const speakerName = qs('#speaker-name');
const dialogueText = qs('#dialogue-text');
const choicesContainer = qs('#choices-container');
const phaseDisplay = qs('#phase-display');
const scoreDisplay = qs('#score-display');
const endScreen = qs('#end-screen');
const minigameOverlay = qs('#minigame-overlay');

// Sounds (placeholders or using browser synthesis if needed, but for now just visual)

const SCENARIO = [
    {
        id: 'intro',
        phase: 'Phase 1 : ALERTE',
        img: 'protec_intervention_start.jpg',
        speaker: 'PC DPS',
        text: '« VPSP de PC. Départ immédiat pour malaise sur voie publique. »',
        choices: [
            { label: 'Bien reçu : Départ VPSP', next: 'departure', correct: true },
            { label: 'Refuser, on est en pause', next: 'game_over_refusal', correct: false }
        ]
    },
    {
        id: 'departure',
        phase: 'Phase 1 : DÉPART',
        video: 'PROT_S001_S001_T531.mov',
        speaker: 'Chef d\'équipe',
        text: 'Le VPSP se met en route. Gyrophares activés. Concentrez-vous.',
        choices: [
            { label: 'Arriver sur les lieux', next: 'scene_sighting', correct: true }
        ]
    },
    {
        id: 'scene_sighting',
        phase: 'Phase 1 : ARRIVÉE',
        img: 'protec_scene.jpg',
        speaker: 'Conducteur',
        text: 'Nous sommes sur place. Une victime au sol, foule agitée.',
        choices: [
            { label: 'Sécuriser la zone (plots, gilet)', next: 'approach', correct: true },
            { label: 'Courir vers la victime', next: 'game_over_secu', correct: false }
        ]
    },
    {
        id: 'approach',
        phase: 'Phase 1 : BILAN',
        img: 'protec_scene.jpg',
        speaker: 'Action',
        text: 'Zone sûre. Vous approchez. La victime ne réagit pas aux ordres.',
        choices: [
            { label: 'Contrôler la respiration (LVA + Voir/Entendre/Sentir)', next: 'diagnosis', correct: true },
            { label: 'Mettre en PLS', next: 'game_over_pls', correct: false, feedback: 'Position latérale de sécurité interdite ici.' }
        ]
    },
    {
        id: 'diagnosis',
        phase: 'Phase 2 : DIAGNOSTIC',
        img: 'protec_scene.jpg',
        speaker: 'Bilan',
        text: 'Pas de mouvement thoracique. Pas de souffle. C\'est un ACR.',
        choices: [
            { label: 'Masser immédiatement (30:2)', next: 'cpr_loop', correct: true },
            { label: 'Prendre la tension', next: 'game_over_time', correct: false, feedback: 'Perte de temps critique.' }
        ]
    },
    {
        id: 'cpr_loop',
        phase: 'Phase 3 : RCP',
        img: 'protec_scene.jpg',
        speaker: 'Action',
        text: 'Vous commencez le massage. Le DAE arrive. Préparez-vous.',
        choices: [
            { label: 'Masser (Mini-jeu)', next: 'minigame_cpr', correct: true },
            { label: 'Attendre le médecin', next: 'game_over_wait', correct: false }
        ]
    },
    {
        id: 'dae_setup',
        phase: 'Phase 4 : DAE',
        img: 'protec_scene.jpg',
        speaker: 'DAE',
        text: 'Le défibrillateur est prêt. Il faut poser les électrodes.',
        choices: [
            { label: 'Poser les électrodes', next: 'minigame_electrodes', correct: true },
            { label: 'Masser par dessus les vêtements', next: 'bad_dae', correct: false }
        ]
    },
    {
        id: 'analysing',
        phase: 'Phase 5 : ANALYSE',
        img: 'protec_van.jpg',
        speaker: 'DAE',
        text: '« Analyse en cours... Ne touchez pas la victime. »',
        choices: [
            { label: 'Écarter tout le monde', next: 'shock_advise', correct: true },
            { label: 'Toucher la victime', next: 'game_over_dae_touch', correct: false }
        ]
    },
    {
        id: 'shock_advise',
        phase: 'Phase 5 : CHOC',
        img: 'protec_van.jpg',
        speaker: 'DAE',
        text: '« Choc recommandé. Appuyez sur le bouton orange clignotant. »',
        choices: [
            { label: 'Délivrer le choc', next: 'minigame_shock', correct: true },
            { label: 'Attendre', next: 'game_over_wait', correct: false }
        ]
    },
    {
        id: 'post_shock',
        phase: 'FIN DE CYCLE',
        img: 'protec_scene.jpg',
        speaker: 'DAE',
        text: '« Choc délivré. Reprenez le massage. »',
        choices: [
            { label: 'Reprendre RCP', next: 'victory', correct: true },
            { label: 'Vérifier le pouls', next: 'bad_check', correct: false }
        ]
    },
    {
        id: 'victory',
        phase: 'SUCCÈS',
        img: 'protec_team.jpg',
        speaker: 'SAMU',
        text: 'Le médecin du SAMU arrive. Vous avez maintenu une perfusion efficace. Beau travail d\'équipe VPSP !',
        choices: [
            { label: 'Terminer la mission', next: 'victory_screen_trigger', correct: true },
            { label: 'Rester sur place', next: 'victory_screen_trigger', correct: true }
        ]
    },

    // FAIL STATES
    {
        id: 'game_over_refusal',
        phase: 'ÉCHEC',
        img: 'protec_intervention_start.jpg',
        speaker: 'Chef de Centre',
        text: 'Refus de départ injustifié. Une vie était en jeu.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_secu',
        phase: 'ÉCHEC',
        img: 'protec_scene.jpg',
        speaker: 'Instructeur',
        text: 'Suraccident ! Toujours sécuriser avant d\'intervenir.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_pls',
        phase: 'ÉCHEC CRITIQUE',
        img: 'protec_scene.jpg',
        speaker: 'Erreur Fatale',
        text: 'Ne JAMAIS mettre une victime en arrêt cardiaque en PLS. Le massage est impossible dans cette position.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_time',
        phase: 'TROP LENT',
        img: 'protec_scene.jpg',
        speaker: 'Temps écoulé',
        text: 'Trop lent ! Chaque minute perdue réduit la survie de 10%.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_alert',
        phase: 'ÉCHEC',
        img: 'protec_van.jpg',
        speaker: 'Isolement',
        text: 'Vous massez seul sans renforts ni DAE. Vous allez vous épuiser et la victime ne sera pas choquée.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_cpr_start',
        phase: 'ÉCHEC',
        img: 'protec_scene.jpg',
        speaker: 'Protocole',
        text: 'On commence toujours par les compressions thoraciques (C-A-B) chez l\'adulte.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_dae_touch',
        phase: 'DANGER',
        img: 'protec_van.jpg',
        speaker: 'DAE Perturbé',
        text: 'Vos mouvements faussent l\'analyse du DAE. Retard de traitement.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'game_over_wait',
        phase: 'ÉCHEC',
        img: 'protec_van.jpg',
        speaker: 'Hésitation',
        text: 'Le choc n\'a pas été délivré. La fibrillation ventriculaire continue.',
        choices: [{ label: 'Recommencer', action: 'retry' }]
    },
    {
        id: 'bad_dae',
        phase: 'ERREUR',
        img: 'protec_van.jpg',
        speaker: 'Conseil',
        text: 'Toujours allumer le DAE en premier, il vous guidera vocalement.',
        choices: [{ label: 'Corriger et continuer', next: 'dae_analysis', correct: true }]
    },
    {
        id: 'bad_check',
        phase: 'PERTE DE TEMPS',
        img: 'protec_scene.jpg',
        speaker: 'Protocole',
        text: 'Ne vérifiez pas le pouls après un choc. Reprenez le massage immédiatement pour 2 min.',
        choices: [{ label: 'Reprendre RCP', next: 'victory', correct: true }]
    }
];

let currentState = {
    stepId: 'intro',
    score: 0,
    maxScore: 100, // Approximate
    history: []
};


function renderStep(stepId) {
    const step = SCENARIO.find(s => s.id === stepId);
    if (!step) return;

    // Update State
    currentState.stepId = stepId;
    currentState.history.push(stepId);

    // Update UI
    phaseDisplay.textContent = step.phase || 'Mission';
    speakerName.textContent = step.speaker;
    dialogueText.textContent = step.text;

    // Handle Image/Video Toggle
    const sceneVideo = qs('#scene-video');

    if (step.video) {
        if (sceneImg) sceneImg.classList.add('hidden');
        if (sceneVideo) {
            sceneVideo.src = `/static/img/mission_acr/${step.video}`;
            sceneVideo.classList.remove('hidden');
            sceneVideo.play().catch(e => console.log("Autoplay bloqué", e));
        }
    } else {
        if (sceneVideo) {
            sceneVideo.classList.add('hidden');
            sceneVideo.pause();
        }
        if (sceneImg) {
            const imgPath = `/static/img/mission_acr/${step.img}`;
            // Simple fade effect
            sceneImg.style.opacity = 0;
            setTimeout(() => {
                sceneImg.src = imgPath;
                sceneImg.onload = () => { sceneImg.style.opacity = 0.6; };
                sceneImg.classList.remove('hidden');
            }, 300);
        }
    }

    // Render Choices
    choicesContainer.innerHTML = '';
    step.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.label;
        btn.onclick = () => handleChoice(choice, step);
        choicesContainer.appendChild(btn);
    });
}

function handleChoice(choice, currentStep) {
    if (choice.action === 'retry') {
        location.reload();
        return;
    }

    if (choice.correct) {
        currentState.score += 10;
        updateScore();
        // playSound('success');
    } else if (choice.correct === false) {
        currentState.score = Math.max(0, currentState.score - 5);
        updateScore();
        // playSound('error');
    }

    if (choice.next === 'minigame_cpr') {
        startCPRMinigame();
    } else if (choice.next === 'minigame_electrodes') {
        startElectrodeGame();
    } else if (choice.next === 'minigame_shock') {
        startShockGame();
    } else if (choice.next === 'victory_screen_trigger') {
        finishMission(true);
    } else {
        renderStep(choice.next);
    }
}

function updateScore() {
    scoreDisplay.textContent = `${currentState.score} pts`;
    // Simple pulse animation
    gsap.fromTo(scoreDisplay, { scale: 1.5 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
}

// CPR Minigame
let cprClicks = [];
let cprActive = false;
let cprStreak = 0;

function startCPRMinigame() {
    minigameOverlay.classList.remove('hidden');
    cprActive = true;
    cprClicks = [];
    cprStreak = 0;

    const btn = qs('#cpr-btn');
    const bpmDisplay = qs('#bpm-counter');
    const streakDisplay = qs('#cpr-streak');

    streakDisplay.textContent = `Série : 0 / 8`;
    bpmDisplay.textContent = 'PRÊT ?';
    bpmDisplay.style.color = '#fff';

    let lastClickTime = 0;

    btn.onclick = (e) => {
        const now = Date.now();
        gsap.to(btn, { scale: 0.9, duration: 0.05, yoyo: true, repeat: 1 });

        if (lastClickTime !== 0) {
            const delta = now - lastClickTime;
            const bpm = Math.round(60000 / delta);
            bpmDisplay.textContent = bpm;

            if (bpm >= 100 && bpm <= 120) {
                // GOOD
                bpmDisplay.style.color = '#3af2ff';
                btn.style.borderColor = '#3af2ff';
                btn.style.boxShadow = '0 0 30px #3af2ff';
                currentState.score += 2;
                cprStreak++;
            } else {
                // BAD
                bpmDisplay.style.color = '#ff3f3f';
                btn.style.borderColor = '#ff3f3f';
                btn.style.boxShadow = '0 0 30px #ff3f3f';
                gsap.to(btn, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
                cprStreak = 0; // Reset streak
                currentState.score = Math.max(0, currentState.score - 1);
            }

            // Visual Update for Streak
            streakDisplay.textContent = `Série : ${cprStreak} / 8`;
            if (cprStreak > 0) {
                gsap.fromTo(streakDisplay, { scale: 1.5, color: '#3af2ff' }, { scale: 1, color: '#fff', duration: 0.3 });
            } else {
                gsap.fromTo(streakDisplay, { x: 10, color: '#ff3f3f' }, { x: 0, color: '#fff', duration: 0.3, ease: 'elastic.out' });
            }

            updateScore();
        } else {
            // First click
            bpmDisplay.textContent = "GO !";
            bpmDisplay.style.color = "#fff";
        }
        lastClickTime = now;

        // Challenge Success Condition
        if (cprStreak >= 8) {
            streakDisplay.textContent = 'PARFAIT !';
            streakDisplay.style.color = '#3af2ff';
            btn.onclick = null;
            setTimeout(() => {
                endCPRMinigame();
            }, 1000);
        }
    };
}

function endCPRMinigame() {
    cprActive = false;
    minigameOverlay.classList.add('hidden');
    renderStep('dae_setup');
}

// Electrodes Minigame
function startElectrodeGame() {
    const overlay = qs('#electrodes-overlay');
    const el1 = qs('#electrode-1');
    const el2 = qs('#electrode-2');
    const zone1 = qs('#zone-1');
    const zone2 = qs('#zone-2');

    overlay.classList.remove('hidden');
    el1.classList.add('hidden');
    el2.classList.add('hidden');
    zone1.style.display = 'block';
    zone2.style.display = 'block';

    let placedCount = 0;

    const checkWin = () => {
        if (placedCount >= 2) {
            setTimeout(() => {
                overlay.classList.add('hidden');
                renderStep('analysing');
            }, 1000);
        }
    };

    zone1.onclick = (e) => {
        e.stopPropagation();
        zone1.style.display = 'none'; // Hide zone logic
        el1.classList.remove('hidden');
        gsap.fromTo(el1, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out' });
        placedCount++;
        checkWin();
    };

    zone2.onclick = (e) => {
        e.stopPropagation();
        zone2.style.display = 'none';
        el2.classList.remove('hidden');
        gsap.fromTo(el2, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out' });
        placedCount++;
        checkWin();
    };
}

// Shock Minigame
function startShockGame() {
    const overlay = qs('#shock-overlay');
    const btn = qs('#shock-btn');
    overlay.classList.remove('hidden');

    // Make button flash
    const flashAnim = gsap.to(btn, { opacity: 0.5, duration: 0.2, yoyo: true, repeat: -1 });

    btn.onclick = () => {
        flashAnim.kill();
        btn.style.opacity = 1;
        btn.textContent = 'CHOC DÉLIVRÉ';
        gsap.to(overlay, {
            backgroundColor: 'rgba(255,255,255,0.8)', duration: 0.1, yoyo: true, repeat: 1, onComplete: () => {
                overlay.classList.add('hidden');
                renderStep('post_shock');
            }
        });
    };
}


async function finishMission(success) {
    endScreen.classList.remove('hidden');
    qs('#end-score').textContent = currentState.score;
    // Save progress
    if (success) {
        try {
            await fetch(`/api/progress/${MISSION_CONTEXT.levelId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'terminee', score: currentState.score }),
            });
        } catch (e) { console.error(e); }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Resume or Start
    renderStep('intro');
    // Preload images
    SCENARIO.forEach(s => {
        if (s.img) {
            const i = new Image();
            i.src = `/static/img/mission_acr/${s.img}`;
        }
    });
});
