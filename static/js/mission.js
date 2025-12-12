const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const missionGrid = qs('#mission-grid');
const launchBtn = qs('#launch-mission');
const resetBtn = qs('#reset-mission');
const progressLabel = qs('#progress-label');
const phaseLabel = qs('#phase-label');
const phaseChip = qs('#phase-chip');
const progressBar = qs('#mission-progress-bar');
const missionStatus = qs('#mission-status');
const missionScore = qs('#mission-score');
const summaryScore = qs('#summary-score');
const summaryChip = qs('#summary-chip');
const validationText = qs('#validation-text');
const priorityList = qs('#priority-list');
const timeline = qs('#pulse-timeline');

const initialContext = window.MISSION_CONTEXT || { levelId: null, savedScore: 0, status: 'non_commence' };

const missionPhases = [
  {
    id: 'approche',
    title: 'Approche sécurisée',
    phase: 'PSE1',
    color: 'var(--accent)',
    actions: [
      { id: 'gants', label: 'Protection individuelle (gants, visibilité, zone sécurisée)', points: 10 },
      { id: 'danger', label: 'Repérage des dangers immédiats et sécurisation du public', points: 8 },
      { id: 'victime', label: 'Présentation et demande de consentement', points: 5 },
    ],
  },
  {
    id: 'bilan',
    title: 'Bilan vital',
    phase: 'PSE1',
    color: '#5BE0E8',
    actions: [
      { id: 'conscience', label: 'Évaluation conscience / ventilation / circulation', points: 12 },
      { id: 'hemorragie', label: "Contrôle d'hémorragie ou garrot si nécessaire", points: 12 },
      { id: 'alerte', label: "Message d'alerte structuré au centre 15", points: 8 },
    ],
  },
  {
    id: 'gestes',
    title: 'Gestes techniques',
    phase: 'PSE2',
    color: '#FF6B3D',
    actions: [
      { id: 'oxygene', label: 'Installation O2 (sur prescription), surveillance du débit', points: 10 },
      { id: 'immobilisation', label: 'Immobilisation tête-cou-rachis ou membre atteint', points: 12 },
      { id: 'rechauffement', label: "Couverture, confort et prévention de l'hypothermie", points: 6 },
    ],
  },
  {
    id: 'transmission',
    title: 'Transmission & suivi',
    phase: 'PSE2',
    color: '#8E7CFF',
    actions: [
      { id: 'reaeval', label: 'Réévaluation régulière du bilan et des constantes', points: 8 },
      { id: 'trace', label: 'Traçabilité : heure, actions, matériel utilisé', points: 6 },
      { id: 'handover', label: "Passage de consignes à l'équipe médicale entrante", points: 7 },
    ],
  },
];

let state = {
  started: false,
  completed: false,
  score: initialContext.savedScore || 0,
  status: initialContext.status || 'non_commence',
  actionsDone: new Set(),
};

function createAction(action) {
  const item = document.createElement('label');
  item.className = 'mission-action';
  item.innerHTML = `
    <input type="checkbox" data-action="${action.id}" data-points="${action.points}" />
    <div class="mission-action__content">
      <div class="mission-action__title">${action.label}</div>
      <div class="mission-action__meta">${action.points} pts</div>
    </div>
  `;
  return item;
}

function createPhaseCard(phase) {
  const card = document.createElement('article');
  card.className = 'mission-card';
  card.innerHTML = `
    <div class="mission-card__header">
      <div>
        <p class="eyebrow">${phase.phase}</p>
        <h3>${phase.title}</h3>
      </div>
      <span class="chip" style="border-color:${phase.color}; color:${phase.color}">${phase.actions.length} actions</span>
    </div>
    <div class="mission-actions"></div>
  `;
  const list = card.querySelector('.mission-actions');
  phase.actions.forEach((action) => list.appendChild(createAction(action)));
  return card;
}

function renderPhases() {
  if (!missionGrid) return;
  missionGrid.innerHTML = '';
  missionPhases.forEach((phase) => missionGrid.appendChild(createPhaseCard(phase)));
}

function renderTimeline() {
  if (!timeline) return;
  timeline.innerHTML = '';
  missionPhases.forEach((phase, idx) => {
    const dot = document.createElement('div');
    dot.className = 'timeline__dot';
    dot.dataset.phase = phase.id;
    dot.innerHTML = `<span>${idx + 1}</span><small>${phase.title}</small>`;
    timeline.appendChild(dot);
  });
}

function updateStatus(status) {
  state.status = status;
  missionStatus.textContent = status.replace('_', ' ');
}

function updateScoreboard() {
  const maxScore = missionPhases.flatMap((p) => p.actions).reduce((sum, a) => sum + a.points, 0);
  const percent = Math.min(100, Math.round((state.score / maxScore) * 100));
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressLabel) progressLabel.textContent = `${state.score} / ${maxScore} pts`;
  summaryScore.textContent = `${state.score} pts`;
  missionScore.textContent = `${state.score} pts`;
}

function updatePhaseFeedback() {
  const completedPhases = missionPhases.filter((phase) => phase.actions.every((a) => state.actionsDone.has(a.id)));
  const currentPhase = missionPhases[completedPhases.length] || missionPhases[missionPhases.length - 1];
  const phaseName = completedPhases.length === missionPhases.length ? 'Validation' : currentPhase.title;
  if (phaseChip) phaseChip.textContent = phaseName;
  if (phaseLabel) phaseLabel.textContent = `Phase : ${phaseName}`;
  if (summaryChip) summaryChip.textContent = completedPhases.length === missionPhases.length ? 'Mission terminée' : `${completedPhases.length}/${missionPhases.length} phase(s)`;
  timeline?.querySelectorAll('.timeline__dot').forEach((dot) => {
    dot.classList.toggle('timeline__dot--done', completedPhases.some((p) => p.id === dot.dataset.phase));
    dot.classList.toggle('timeline__dot--active', dot.dataset.phase === currentPhase.id);
  });
}

function updatePriorityList() {
  if (!priorityList) return;
  priorityList.innerHTML = '';
  const critical = [
    'Protection individuelle',
    "Contrôle d'hémorragie",
    "Message d'alerte",
    'Immobilisation adaptée',
    'Traçabilité des gestes',
  ];
  critical.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `✔️ ${item}`;
    priorityList.appendChild(li);
  });
}

async function syncProgress(status) {
  if (!initialContext.levelId) return;
  try {
    await fetch(`/api/progress/${initialContext.levelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, score: state.score }),
    });
  } catch (err) {
    console.error('syncProgress', err);
  }
}

function celebrate() {
  gsap.fromTo('.mission-card', { scale: 0.98 }, { scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(2)' });
  gsap.fromTo('#mission-progress-bar', { boxShadow: '0 0 0 rgba(255,107,61,0)' }, { boxShadow: '0 0 22px rgba(255,107,61,0.4)', duration: 0.6 });
}

function handleActionToggle(evt) {
  if (!evt.target.matches('input[data-action]')) return;
  if (!state.started) {
    validationText.textContent = 'Appuie sur « Lancer la mission » pour activer le scoring.';
    evt.preventDefault();
    return;
  }
  const checkbox = evt.target;
  const points = Number(checkbox.dataset.points) || 0;
  const id = checkbox.dataset.action;
  if (checkbox.checked) {
    state.actionsDone.add(id);
    state.score += points;
  } else {
    state.actionsDone.delete(id);
    state.score = Math.max(0, state.score - points);
  }
  updateScoreboard();
  updatePhaseFeedback();
  celebrate();
  if (state.actionsDone.size === missionPhases.flatMap((p) => p.actions).length) {
    validationText.textContent = 'Parcours complet ! Tu peux valider la mission et enregistrer le score.';
    state.completed = true;
    updateStatus('terminee');
    syncProgress('terminee');
  } else {
    validationText.textContent = 'Continue les phases PSE1 puis PSE2 pour sécuriser le patient.';
    syncProgress('en_cours');
  }
}

function resetMission() {
  state = { started: false, completed: false, score: 0, status: 'non_commence', actionsDone: new Set() };
  qsa('input[data-action]').forEach((input) => { input.checked = false; });
  validationText.textContent = 'Lance la mission puis complète chaque phase pour obtenir le badge « terrain ».';
  updateScoreboard();
  updatePhaseFeedback();
  updateStatus('non commencée');
  syncProgress('non_commence');
}

function startMission() {
  state.started = true;
  state.completed = false;
  validationText.textContent = 'Mission active : enchaîne les gestes PSE1 puis PSE2, chaque case vaut des points.';
  updateStatus('en cours');
  syncProgress('en_cours');
}

function hydrateSavedScore() {
  if (!initialContext.savedScore) return;
  state.score = initialContext.savedScore;
  updateScoreboard();
}

function hydrateStatus() {
  if (!initialContext.status) return;
  const friendly = initialContext.status.replace('_', ' ');
  missionStatus.textContent = friendly;
  if (friendly.includes('term')) summaryChip.textContent = 'Mission terminée';
}

function init() {
  renderPhases();
  renderTimeline();
  hydrateSavedScore();
  hydrateStatus();
  updateScoreboard();
  updatePhaseFeedback();
  updatePriorityList();
  missionGrid?.addEventListener('change', handleActionToggle);
  launchBtn?.addEventListener('click', startMission);
  resetBtn?.addEventListener('click', resetMission);
}

document.addEventListener('DOMContentLoaded', init);
