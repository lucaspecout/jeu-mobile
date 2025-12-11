const STORAGE_KEYS = {
  users: 'protec-rescue-38-users',
  session: 'protec-rescue-38-session',
};

const levels = [
  {
    id: 'evaluation-initiale',
    title: 'Évaluation initiale',
    description: 'Sécuriser, observer, déclencher l\'alerte — premières minutes déterminantes.',
    tips: 'Protéger la zone, se présenter, vérifier la conscience et la respiration.',
    scenario: {
      question: 'Vous arrivez sur un accident de circulation. Quelle est la toute première action ?',
      options: [
        'Installer un périmètre de sécurité et couper le contact du véhicule si possible',
        'Prendre le pouls de la victime immédiatement',
        'Déplacer la victime hors de la route sans évaluation',
        'Commencer le massage cardiaque sans vérifier la respiration'
      ],
      answer: 0,
      rationale: 'La protection prime : sécuriser la zone évite le sur-accident et permet un examen serein.',
    }
  },
  {
    id: 'bilan-vital',
    title: 'Bilan vital',
    description: 'Analyser conscience, ventilation, circulation pour orienter l\'alerte.',
    tips: 'Comparer les deux côtés, rechercher les signes de détresse vitale et informer le 15/112.',
    scenario: {
      question: 'La victime ne parle pas mais respire. Quelle priorité ?',
      options: [
        'Mettre en PLS en contrôlant régulièrement la respiration',
        'Commencer les compressions thoraciques',
        'Donner à boire pour la rassurer',
        'La placer assise pour faciliter la respiration'
      ],
      answer: 0,
      rationale: 'Une victime inconsciente qui respire doit être placée en PLS pour maintenir la perméabilité des voies aériennes.',
    }
  },
  {
    id: 'gestes-de-secours',
    title: 'Gestes de secours',
    description: 'Mettre en œuvre les gestes adaptés en attendant les secours spécialisés.',
    tips: 'Utiliser le matériel adapté, surveiller la victime et réévaluer après chaque geste.',
    scenario: {
      question: 'Un adulte présente un arrêt cardiaque. Quel enchaînement appliquer ?',
      options: [
        '30 compressions / 2 insufflations, défibrillation dès que disponible',
        '15 compressions / 2 insufflations en continu',
        'Massage cardiaque uniquement',
        'Ventiler pendant 1 minute puis masser'
      ],
      answer: 0,
      rationale: 'Le cycle adulte PSE suit la séquence 30/2 et l’utilisation précoce du DAE.',
    }
  }
];

const selectors = {
  authSection: document.getElementById('auth-section'),
  dashboard: document.getElementById('dashboard'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  logoutBtn: document.getElementById('logout-btn'),
  levels: document.getElementById('levels'),
  scenarioArea: document.getElementById('scenario-area'),
  leaderboard: document.getElementById('leaderboard'),
  userGreeting: document.getElementById('user-greeting'),
  userStatus: document.getElementById('user-status'),
  statUsers: document.getElementById('stat-users'),
  statSuccess: document.getElementById('stat-success'),
};

function loadUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function setSession(email) {
  localStorage.setItem(STORAGE_KEYS.session, email);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function currentUser() {
  const email = localStorage.getItem(STORAGE_KEYS.session);
  const users = loadUsers();
  return users.find(u => u.email === email);
}

function updateHeroStats() {
  const users = loadUsers();
  selectors.statUsers.textContent = users.length;
  const successCount = users.reduce((acc, user) => acc + Object.values(user.progress || {}).filter(l => l.status === 'Réussi').length, 0);
  selectors.statSuccess.textContent = successCount;
}

function showDashboard(user) {
  selectors.authSection.classList.add('hidden');
  selectors.dashboard.classList.remove('hidden');
  selectors.userGreeting.textContent = `Bonjour ${user.username}`;

  const completed = Object.values(user.progress || {}).filter(p => p.status === 'Réussi').length;
  selectors.userStatus.textContent = completed === levels.length
    ? 'Parcours validé ! Continuez à réviser les scénarios.'
    : `Modules validés : ${completed}/${levels.length}`;

  renderLevels(user);
  renderScenario(user);
  renderLeaderboard();
  updateHeroStats();
}

function showAuth() {
  selectors.dashboard.classList.add('hidden');
  selectors.authSection.classList.remove('hidden');
}

function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const username = form.get('username').trim();
  const email = form.get('email').trim().toLowerCase();
  const password = form.get('password').trim();

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    alert('Un compte existe déjà avec cet e-mail.');
    return;
  }

  const newUser = {
    username,
    email,
    password,
    progress: {},
    points: 0,
  };

  users.push(newUser);
  saveUsers(users);
  setSession(email);
  selectors.registerForm.reset();
  showDashboard(newUser);
}

function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get('email').trim().toLowerCase();
  const password = form.get('password').trim();
  const user = loadUsers().find(u => u.email === email && u.password === password);
  if (!user) {
    alert('Identifiants invalides.');
    return;
  }
  setSession(email);
  selectors.loginForm.reset();
  showDashboard(user);
}

function logout() {
  clearSession();
  showAuth();
}

function renderLevels(user) {
  selectors.levels.innerHTML = '';
  levels.forEach(level => {
    const progress = user.progress[level.id] || { status: 'Non commencé', score: 0 };
    const container = document.createElement('div');
    container.className = 'level';
    const statusClass = progress.status === 'Réussi'
      ? 'status-done'
      : progress.status === 'En cours'
        ? 'status-active'
        : 'status-pending';

    container.innerHTML = `
      <div class="level__header">
        <div>
          <h4>${level.title}</h4>
          <small class="muted">${level.tips}</small>
        </div>
        <span class="level__status ${statusClass}">${progress.status}</span>
      </div>
      <p>${level.description}</p>
    `;

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Lancer la simulation';
    playBtn.className = 'btn primary';
    playBtn.addEventListener('click', () => startScenario(level, user));

    container.appendChild(playBtn);
    selectors.levels.appendChild(container);
  });
}

function renderScenario(user) {
  selectors.scenarioArea.innerHTML = '';
  const activeLevel = levels.find(level => (user.progress[level.id]?.status === 'En cours')) || levels[0];
  const progress = user.progress[activeLevel.id] || { status: 'Non commencé', score: 0 };

  const scenario = document.createElement('div');
  scenario.className = 'scenario';
  scenario.innerHTML = `
    <p class="badge">${activeLevel.title}</p>
    <h4>${activeLevel.scenario.question}</h4>
    <p class="muted">Situation rapide : appliquez la chaîne PSE (protection, examen, alerte, gestes).</p>
  `;

  const options = document.createElement('div');
  options.className = 'options';

  activeLevel.scenario.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.type = 'button';
    btn.textContent = option;
    btn.addEventListener('click', () => evaluateAnswer(activeLevel, user, index));
    options.appendChild(btn);
  });

  scenario.appendChild(options);

  const statusLine = document.createElement('p');
  statusLine.className = 'muted';
  statusLine.textContent = `Score actuel : ${progress.score}/100 — Statut : ${progress.status}`;
  scenario.appendChild(statusLine);

  selectors.scenarioArea.appendChild(scenario);
}

function evaluateAnswer(level, user, selectedIndex) {
  const isCorrect = selectedIndex === level.scenario.answer;
  const users = loadUsers();
  const storedUser = users.find(u => u.email === user.email);
  storedUser.progress = storedUser.progress || {};

  const previous = storedUser.progress[level.id] || { status: 'Non commencé', score: 0 };
  const baseScore = Math.max(previous.score, isCorrect ? 100 : 40);
  const status = isCorrect ? 'Réussi' : 'En cours';
  storedUser.progress[level.id] = { status, score: baseScore };
  storedUser.points = Object.values(storedUser.progress).reduce((acc, l) => acc + l.score, 0);
  saveUsers(users);

  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  feedback.textContent = isCorrect
    ? 'Bravo ! La séquence PSE est respectée.'
    : 'À revoir : pensez toujours à sécuriser, examiner puis alerter avant d\'agir.';

  const rationale = document.createElement('p');
  rationale.className = 'muted';
  rationale.textContent = `Référence PSE : ${level.scenario.rationale}`;

  selectors.scenarioArea.innerHTML = '';
  selectors.scenarioArea.appendChild(feedback);
  selectors.scenarioArea.appendChild(rationale);

  setTimeout(() => showDashboard(storedUser), 1200);
}

function startScenario(level, user) {
  const users = loadUsers();
  const storedUser = users.find(u => u.email === user.email);
  storedUser.progress = storedUser.progress || {};
  if (!storedUser.progress[level.id]) {
    storedUser.progress[level.id] = { status: 'En cours', score: 20 };
    saveUsers(users);
  }
  showDashboard(storedUser);
}

function renderLeaderboard() {
  const users = loadUsers();
  const sorted = users
    .map(u => ({ username: u.username, score: Object.values(u.progress || {}).reduce((acc, l) => acc + l.score, 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  selectors.leaderboard.innerHTML = '';
  if (sorted.length === 0) {
    selectors.leaderboard.innerHTML = '<li class="muted">Aucune progression enregistrée pour le moment.</li>';
    return;
  }

  sorted.forEach((user, index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>#${index + 1} — ${user.username}</span><strong>${user.score} pts</strong>`;
    selectors.leaderboard.appendChild(item);
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(btn => btn.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
      document.getElementById(tab.dataset.target).classList.remove('hidden');
    });
  });
}

function init() {
  initTabs();
  selectors.loginForm.addEventListener('submit', handleLogin);
  selectors.registerForm.addEventListener('submit', handleRegister);
  selectors.logoutBtn.addEventListener('click', logout);

  updateHeroStats();

  const user = currentUser();
  if (user) {
    showDashboard(user);
  }
}

init();
