document.addEventListener('DOMContentLoaded', () => {
    // --- Game State & Constants ---
    const MISSION_DATA = {
        phases: [
            {
                id: 1,
                name: "Sécurisation",
                scene: "scene_1_securisation.jpg",
                speaker: "Chef d'équipe",
                dialogue: "Situation : Victime au sol sur la voie publique. Témoins présents. Quelle est votre priorité absolue ?",
                choices: [
                    { text: "Sécuriser la zone (Balisage)", correct: true, points: 10, feedback: "Exact ! La protection permet d'éviter le sur-accident." },
                    { text: "Courir vers la victime", correct: false, points: 0, feedback: "Danger ! Vous devez d'abord assurer votre sécurité et celle de la victime." },
                    { text: "Interroger les témoins", correct: false, points: 5, feedback: "C'est utile, mais la sécurité prime sur tout le reste." },
                    { text: "Appeler le SAMU immédiatement", correct: false, points: 0, feedback: "Pas encore. Il faut d'abord sécuriser et faire un bilan." }
                ]
            },
            {
                id: 2,
                name: "Bilan de Conscience",
                scene: "scene_2_approche.jpg",
                speaker: "Équipier Secouriste",
                dialogue: "La zone est sécurisée. Vous approchez de la victime. Elle ne bouge pas. Comment évaluez-vous sa conscience ?",
                choices: [
                    { text: "Lui secouer les épaules et lui parler fort", correct: true, points: 10, feedback: "Oui : 'Monsieur, m'entendez-vous ? Serrez-moi la main !'" },
                    { text: "Lui donner des petites claques", correct: false, points: 0, feedback: "Interdit ! Cela peut aggraver des lésions." },
                    { text: "Vérifier le pouls carotidien", correct: false, points: 0, feedback: "Ce n'est pas la priorité pour la conscience." },
                    { text: "Regarder si elle respire", correct: false, points: 0, feedback: "C'est l'étape suivante (LVA/VES), pas la conscience." }
                ]
            },
            {
                id: 3,
                name: "LVA",
                scene: "scene_3_lva.jpg",
                speaker: "Formateur",
                dialogue: "La victime est inconsciente (ne répond pas). Elle est sur le dos. Risque d'obstruction des voies aériennes.",
                minigame: "lva",
                points: 20
            },
            {
                id: 4,
                name: "Contrôle Respiration (VES)",
                scene: "scene_4_ves.jpg",
                speaker: "Formateur",
                dialogue: "Voies aériennes libres. Vous devez maintenant vérifier la respiration pendant 10 secondes.",
                minigame: "ves",
                points: 20
            },
            {
                id: 5,
                name: "Position Latérale de Sécurité",
                scene: "scene_5_pls.jpg",
                speaker: "Chef d'équipe",
                dialogue: "La victime respire ! Elle est inconsciente. Il faut la mettre en PLS pour protéger ses voies aériennes.",
                minigame: "pls",
                points: 30
            },
            {
                id: 6,
                name: "Surveillance",
                scene: "scene_6_surveillance.jpg",
                speaker: "Régulation SAMU",
                dialogue: "Bilan transmis : Victime inconsciente qui respire, mise en PLS. Que faites-vous en attendant l'ambulance ?",
                choices: [
                    { text: "Surveiller la respiration en continu et couvrir la victime", correct: true, points: 10, feedback: "Parfait. La surveillance est vitale car l'état peut se dégrader." },
                    { text: "Laisser la victime et gérer les témoins", correct: false, points: 0, feedback: "Ne jamais laisser une victime inconsciente seule." },
                    { text: "Lui donner un peu d'eau", correct: false, points: 0, feedback: "Jamais rien par la bouche à une victime inconsciente !" },
                    { text: "La remettre sur le dos", correct: false, points: 0, feedback: "Non, la PLS est la position de sécurité." }
                ]
            }
        ],
        items: {
            lvaImg: 'lva_diagram.png'
        }
    };

    let gameState = {
        currentPhase: 0,
        score: 0,
        startTime: Date.now(),
        isInteractive: false
    };

    // --- Initialisation ---
    const init = () => {
        console.log("Mission initialized");
        loadPhase(0);

        // GSAP Intro
        gsap.from(".hud-top", { y: -50, opacity: 0, duration: 1, ease: "power2.out" });
    };

    // --- Audio System (Placeholder) ---
    const playSound = (type) => {
        // Future audio implementation
        console.log(`Playing sound: ${type}`);
    };

    // --- Core Game Logic ---
    const loadPhase = (phaseIndex) => {
        if (phaseIndex >= MISSION_DATA.phases.length) {
            endMission();
            return;
        }

        gameState.currentPhase = phaseIndex;
        gameState.isInteractive = true;
        const phase = MISSION_DATA.phases[phaseIndex];

        // Update HUD
        document.getElementById('phase-display').textContent = `Phase ${phase.id} : ${phase.name}`;
        updateScene(phase.scene);

        // Reset Overlays
        hideAllOverlays();

        // Check content type
        if (phase.minigame) {
            setTimeout(() => startMinigame(phase.minigame), 1000);
        } else {
            setTimeout(() => showDialogue(phase), 1000);
        }
    };

    const updateScene = (imageName) => {
        const wrapper = document.getElementById('scenes-wrapper');
        const existingImg = wrapper.querySelector('.scene-image.active');

        // Create new image
        const newImg = document.createElement('img');
        newImg.src = `/static/img/mission_bilan_inconscient/${imageName}`;
        newImg.className = 'scene-image';
        newImg.alt = `Phase ${gameState.currentPhase + 1}`;

        wrapper.appendChild(newImg);

        // Transition
        // Wait for load to ensure smooth transition
        newImg.onload = () => {
            newImg.classList.add('active');
            if (existingImg) {
                setTimeout(() => existingImg.remove(), 1000); // Remove old after transition
            }
        };
    };

    const hideAllOverlays = () => {
        document.querySelectorAll('.minigame-overlay').forEach(el => el.classList.add('hidden'));
        document.getElementById('dialogue-container').style.opacity = '0';
        document.getElementById('dialogue-container').style.transform = 'translateY(20px)';
    };

    // --- Dialogue System ---
    const showDialogue = (phase) => {
        const container = document.getElementById('dialogue-container');
        const speaker = document.getElementById('speaker-name');
        const text = document.getElementById('dialogue-text');
        const choices = document.getElementById('choices-container');

        speaker.textContent = phase.speaker;
        text.textContent = phase.dialogue;

        // Clear choices
        choices.innerHTML = '';
        phase.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = () => handleChoice(choice, btn);
            choices.appendChild(btn);
        });

        // Animate In using GSAP
        gsap.to(container, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
            pointerEvents: "auto"
        });

        // Stagger choices
        gsap.from(".choice-btn", {
            y: 20,
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.3
        });
    };

    const handleChoice = (choice, btnElement) => {
        if (!gameState.isInteractive) return;
        gameState.isInteractive = false;

        // Visual Feedback
        if (choice.correct) {
            btnElement.classList.add('correct');
            gameState.score += choice.points;
            updateScoreHUD(true);

            // Delay then next phase
            setTimeout(() => {
                loadPhase(gameState.currentPhase + 1);
            }, 1500);
        } else {
            btnElement.classList.add('incorrect');
            // Shake animation
            gsap.to(btnElement, { x: 5, duration: 0.1, yoyo: true, repeat: 5 });

            // Allow retry after delay or game over? let's allow retry for educational purpose but reduce points?
            // For now, simple retry logic
            setTimeout(() => {
                btnElement.classList.remove('incorrect');
                gameState.isInteractive = true;
            }, 1000);
        }
    };

    const updateScoreHUD = (animate = false) => {
        const display = document.getElementById('score-display');
        display.textContent = `${gameState.score} XP`;
        if (animate) {
            gsap.from(display, { scale: 1.5, color: "#00ff88", duration: 0.5 });
        }
    };

    // --- Minigame Router ---
    const startMinigame = (type) => {
        switch (type) {
            case 'lva': startLVA(); break;
            case 'ves': startVES(); break;
            case 'pls': startPLS(); break;
        }
    };

    // --- LVA Minigame ---
    const startLVA = () => {
        const overlay = document.getElementById('lva-overlay');
        overlay.classList.remove('hidden');
        gsap.from(overlay.children[0], { scale: 0.8, opacity: 0, duration: 0.5 });

        let clickedZones = new Set();
        const requiredZones = ['lva-zone-1', 'lva-zone-2'];
        const feedback = document.getElementById('lva-feedback');

        requiredZones.forEach(id => {
            const zone = document.getElementById(id);
            zone.classList.remove('clicked'); // Reset

            // Clone to remove old listeners
            const newZone = zone.cloneNode(true);
            zone.parentNode.replaceChild(newZone, zone);

            newZone.onclick = () => {
                if (!clickedZones.has(id)) {
                    newZone.classList.add('clicked');
                    clickedZones.add(id);
                    playSound('success_short');

                    if (clickedZones.size === requiredZones.length) {
                        feedback.textContent = "✓ Voies aériennes libérées !";
                        gameState.score += 20;
                        updateScoreHUD(true);
                        setTimeout(() => loadPhase(gameState.currentPhase + 1), 2000);
                    }
                }
            };
        });
    };

    // --- VES Minigame ---
    const startVES = () => {
        const overlay = document.getElementById('ves-overlay');
        overlay.classList.remove('hidden');
        gsap.from(overlay.children[0], { scale: 0.8, opacity: 0, duration: 0.5 });

        const timerDisplay = document.getElementById('ves-timer');
        const countDisplay = document.getElementById('breath-count');
        const btn = document.getElementById('breath-btn');
        const ring = document.getElementById('timer-ring');
        const chestZone = document.getElementById('chest-zone');
        const breathHint = document.getElementById('breath-hint');

        let timeLeft = 10;
        let breaths = 0;
        let isActive = true;

        countDisplay.textContent = "0";
        timerDisplay.textContent = "10";

        // Reset Ring Animation
        ring.style.background = `conic-gradient(#FF6B00 100%, transparent 100%)`;

        // --- Breathing Animation Loop ---
        // Simulate ~3 breaths in 10s (approx 18/min, realistic)
        // Using GSAP to pulse the chest zone and hint
        const breathAnimation = gsap.timeline({ repeat: 2, delay: 1 });

        breathAnimation
            .to([chestZone, breathHint], {
                opacity: 0.6,
                scale: 1.05,
                duration: 1.5,
                ease: "sine.inOut"
            })
            .to([chestZone, breathHint], {
                opacity: 0,
                scale: 1,
                duration: 2.0,
                ease: "sine.inOut"
            })
            .to({}, { duration: 0.5 }); // Pause between breaths

        btn.onclick = () => {
            if (!isActive) return;
            breaths++;
            countDisplay.textContent = breaths;

            // Visual feedback
            gsap.to(countDisplay, { scale: 1.5, duration: 0.1, yoyo: true, repeat: 1 });
            playSound('breath_tap');
        };

        const timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            // Update Ring
            const percentage = (timeLeft / 10) * 100;
            ring.style.background = `conic-gradient(#FF6B00 ${percentage}%, transparent ${percentage}%)`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                breathAnimation.kill(); // Stop animation
                isActive = false;
                evaluateVES(breaths);
            }
        }, 1000);
    };

    const evaluateVES = (count) => {
        // Normal rate: 12-20 / min => 2-4 in 10s
        let points = 0;
        let message = "";
        const btn = document.getElementById('breath-btn');

        if (count >= 2 && count <= 4) {
            points = 20;
            message = "✓ Respiration Normale";
            btn.style.borderColor = "#00ff88";
            btn.style.color = "#00ff88";
        } else {
            points = 10; // Partial points
            message = count < 2 ? "⚠️ Trop lent (Pause ?)" : "⚠️ Trop rapide (Polypnée)";
            btn.style.borderColor = "#ff9900";
        }

        btn.textContent = message;
        btn.style.fontSize = "1rem";

        gameState.score += points;
        updateScoreHUD(true);
        setTimeout(() => loadPhase(gameState.currentPhase + 1), 2500);
    };

    // --- PLS Minigame ---
    const startPLS = () => {
        const overlay = document.getElementById('pls-overlay');
        overlay.classList.remove('hidden');
        gsap.from(overlay.children[0], { scale: 0.8, opacity: 0, duration: 0.5 });

        const grid = document.getElementById('pls-grid');
        grid.innerHTML = ''; // Reset

        const steps = [
            { id: 1, text: "Bras côté sauveteur à angle droit", icon: "💪" },
            { id: 2, text: "Saisir la main opposée paume contre paume", icon: "✋" },
            { id: 3, text: "Saisir genou opposé", icon: "🦵" },
            { id: 4, text: "Retourner la victime", icon: "🔄" },
            { id: 5, text: "Ouvrir la bouche (stabilité)", icon: "👄" }
        ];

        // Shuffle visually but keep logic ordered
        // Actually for learning, let's keep them ordered for simplicity or present multiple choice?
        // Let's make it a sequence clicker. All displayed, must click in order.

        steps.forEach(step => {
            const card = document.createElement('div');
            card.className = 'pls-card';
            card.innerHTML = `<div class="pls-icon">${step.icon}</div><div>${step.text}</div>`;
            card.dataset.id = step.id;
            grid.appendChild(card);
        });

        let currentStepNeeded = 1;

        const cards = document.querySelectorAll('.pls-card');
        cards.forEach(card => {
            card.onclick = () => {
                const id = parseInt(card.dataset.id);

                if (id === currentStepNeeded) {
                    card.classList.add('selected');
                    card.onclick = null; // Disable click
                    currentStepNeeded++;
                    playSound('success_short');

                    if (currentStepNeeded > steps.length) {
                        // Success
                        setTimeout(() => {
                            gameState.score += 30;
                            updateScoreHUD(true);
                            loadPhase(gameState.currentPhase + 1);
                        }, 1000);
                    }
                } else {
                    card.classList.add('wrong');
                    setTimeout(() => card.classList.remove('wrong'), 500);
                    playSound('error');
                }
            };
        });
    };

    // --- End Mission ---
    const endMission = () => {
        hideAllOverlays();
        const endScreen = document.getElementById('end-screen');
        endScreen.classList.remove('hidden');
        gsap.from(endScreen.children[0], { scale: 0.8, opacity: 0, duration: 0.8 });

        // Calculate Time Bonus
        const duration = (Date.now() - gameState.startTime) / 1000;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        let timeBonus = 0;
        if (duration < 180) timeBonus = 20; // < 3 mins
        else if (duration < 300) timeBonus = 10; // < 5 mins

        let finalScore = gameState.score + timeBonus;

        document.getElementById('end-score').textContent = finalScore;
        document.getElementById('end-time').textContent = timeString;

        // Send to Backend
        saveProgress(finalScore);
    };

    const saveProgress = async (score) => {
        try {
            if (!window.MISSION_CONTEXT) return;
            const response = await fetch(`/api/progress/${window.MISSION_CONTEXT.levelId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    completed: true,
                    score: score,
                    details: { time: document.getElementById('end-time').textContent }
                })
            });
            if (response.ok) {
                console.log("Score saved successfully");
            }
        } catch (e) {
            console.error("Error saving score:", e);
        }
    };

    // Start
    init();
});
