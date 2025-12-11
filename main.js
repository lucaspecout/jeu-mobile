const STORAGE_KEYS = {
  users: 'protec-rescue-38-users',
  session: 'protec-rescue-38-session',
};

const SECURITY = {
  iterations: 200000,
  lockThreshold: 3,
  lockDuration: 30_000,
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

const quickQuizzes = [
  {
    id: 'reflex-securite',
    title: 'Réflexe sécurité',
    difficulty: 'Rapide',
    duration: '45s',
    question: 'Avant de toucher la victime, quelle vérification rapide éviterait un sur-accident ?',
    options: [
      'Repérer les dangers électriques, circulation et produits dangereux',
      'Vérifier le pouls radial immédiatement',
      'Mettre la victime assise pour parler',
      'Chercher l’identité sur les papiers',
    ],
    answer: 0,
    reward: { points: 60, badge: 'Éclaireur' },
    rationale: 'La protection de la zone est prioritaire : se protéger et sécuriser l’environnement.',
  },
  {
    id: 'alerte-efficace',
    title: "Alerte efficace",
    difficulty: 'Intermédiaire',
    duration: '1 min',
    question: "Que doit absolument contenir votre message d'alerte au 15/112 ?",
    options: [
      'Nom, localisation précise, nombre de victimes, état et gestes commencés',
      'Seulement le nombre de victimes',
      'Le modèle du véhicule impliqué',
      'Les coordonnées GPS approximatives uniquement',
    ],
    answer: 0,
    reward: { points: 80, badge: 'Voix calme' },
    rationale: 'Un message structuré permet un envoi de moyens adaptés et un guidage sécurisé.',
  },
  {
    id: 'gestes-vital',
    title: 'Gestes vitaux',
    difficulty: 'Difficile',
    duration: '90s',
    question: 'Sur un arrêt cardiaque, quelle séquence garantit la meilleure survie ?',
    options: [
      'Appel 112/15, DAE dès que possible, 30 compressions / 2 insufflations',
      'Recherche du pouls pendant 30 secondes',
      'Ventilation seule jusqu’à reprise respiratoire',
      'Transporter la victime vers un endroit calme',
    ],
    answer: 0,
    reward: { points: 120, badge: 'Réflexe DAE' },
    rationale: 'La chaîne survie PSE : alerte, massage 30/2, défibrillation précoce.',
  },
];

const challengeBoard = [
  {
    id: 'double-validation',
    title: 'Validation double',
    description: 'Réussir 2 modules PSE au moins.',
    threshold: 2,
    reward: { points: 150, badge: 'Régularité' },
    progress: user => Object.values(user.progress || {}).filter(p => p.status === 'Réussi').length,
  },
  {
    id: 'quizz-du-jour',
    title: 'Quizz du jour',
    description: 'Répondre correctement à un quizz éclair.',
    threshold: 1,
    reward: { points: 90, badge: 'Instinct' },
    progress: user => user.challengeHistory?.quizzCorrect || 0,
  },
  {
    id: 'score-elite',
    title: 'Score élite',
    description: 'Cumuler 250 points ou plus.',
    threshold: 250,
    reward: { points: 200, badge: 'Expert PSE' },
    progress: user => Object.values(user.progress || {}).reduce((acc, l) => acc + l.score, 0),
  },
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
  quizArea: document.getElementById('quiz-area'),
  challengeBoard: document.getElementById('challenge-board'),
  rewardBoard: document.getElementById('reward-board'),
  authAlert: document.getElementById('auth-alert'),
  passwordField: document.getElementById('password-field'),
  passwordMeter: document.getElementById('password-strength'),
  passwordLabel: document.getElementById('password-strength-label'),
};

function encodeBase64(uint8array) {
  return btoa(String.fromCharCode(...uint8array));
}

function decodeBase64(str) {
  return Uint8Array.from(atob(str), char => char.charCodeAt(0));
}

function createSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

async function deriveKey(password, salt, iterations = SECURITY.iterations) {
  const encoder = new TextEncoder();
  if (!crypto?.subtle) {
    return encoder.encode(password + encodeBase64(salt));
  }

  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  return new Uint8Array(derivedBits);
}

async function hashPassword(password, salt, iterations = SECURITY.iterations) {
  try {
    const derived = await deriveKey(password, salt, iterations);
    return encodeBase64(derived);
  } catch (error) {
    console.warn('Fallback hash utilisé (contexte non sécurisé).', error);
    const encoder = new TextEncoder();
    const payload = encoder.encode(`${password}-${encodeBase64(salt)}`);
    if (crypto?.subtle?.digest) {
      const digest = await crypto.subtle.digest('SHA-256', payload);
      return encodeBase64(new Uint8Array(digest));
    }
    return encodeBase64(payload);
  }
}

function loadUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function setSession(email) {
  const token = crypto.randomUUID ? crypto.randomUUID() : encodeBase64(createSalt());
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ email, token, createdAt: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function currentSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
}

function currentUser() {
  const session = currentSession();
  if (!session) return null;
  const users = loadUsers();
  const user = users.find(u => u.email === session.email) || null;
  return user ? ensureUserDefaults(user) : null;
}

function loadLocks() {
  return JSON.parse(localStorage.getItem('protec-rescue-38-locks') || '{}');
}

function saveLocks(locks) {
  localStorage.setItem('protec-rescue-38-locks', JSON.stringify(locks));
}

function ensureUserDefaults(user) {
  return {
    badges: [],
    challengeHistory: { quizzCorrect: 0, lastQuizDay: null, lastRewarded: {} },
    rewards: { chests: 0 },
    ...user,
    progress: user.progress || {},
    points: user.points || 0,
  };
}

function showAlert(message, type = 'info') {
  selectors.authAlert.textContent = message;
  selectors.authAlert.className = `alert ${type}`;
  selectors.authAlert.classList.remove('hidden');
  setTimeout(() => selectors.authAlert.classList.add('hidden'), 4200);
}

function updateHeroStats() {
  const users = loadUsers();
  selectors.statUsers.textContent = users.length;
  const successCount = users.reduce((acc, user) => acc + Object.values(user.progress || {}).filter(l => l.status === 'Réussi').length, 0);
  selectors.statSuccess.textContent = successCount;
}

function evaluatePasswordStrength(value) {
  const rules = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value), value.length >= 12];
  const score = rules.filter(Boolean).length;
  const level = Math.min(3, Math.max(1, Math.ceil(score / 2)));
  const label = level === 1 ? 'Sécurité faible' : level === 2 ? 'Sécurité moyenne' : 'Solide et prêt';
  return { level, label };
}

function updatePasswordMeter(value) {
  if (!selectors.passwordMeter) return;
  const { level, label } = evaluatePasswordStrength(value);
  const bars = selectors.passwordMeter.querySelectorAll('.password-meter__bar');
  bars.forEach((bar, index) => {
    bar.classList.toggle('active', index < level);
  });
  selectors.passwordLabel.textContent = label;
}

function validatePassword(password) {
  const { level } = evaluatePasswordStrength(password);
  return level >= 2;
}

function checkLock(email) {
  const locks = loadLocks();
  const lock = locks[email];
  if (!lock) return 0;
  if (lock.until && lock.until > Date.now()) {
    return Math.ceil((lock.until - Date.now()) / 1000);
  }
  delete locks[email];
  saveLocks(locks);
  return 0;
}

function recordFailedLogin(email) {
  const locks = loadLocks();
  const entry = locks[email] || { count: 0, until: 0 };
  entry.count += 1;
  if (entry.count >= SECURITY.lockThreshold) {
    entry.until = Date.now() + SECURITY.lockDuration;
    entry.count = 0;
  }
  locks[email] = entry;
  saveLocks(locks);
  return entry.until && entry.until > Date.now() ? entry.until : 0;
}

function clearLock(email) {
  const locks = loadLocks();
  if (locks[email]) {
    delete locks[email];
    saveLocks(locks);
  }
}

async function verifyPassword(password, user, users) {
  if (user.passwordHash && user.salt) {
    const salt = decodeBase64(user.salt);
    const hashed = await hashPassword(password, salt, user.iterations || SECURITY.iterations);
    return hashed === user.passwordHash;
  }

  if (user.password) {
    const isValid = user.password === password;
    if (isValid) {
      const salt = createSalt();
      user.passwordHash = await hashPassword(password, salt);
      user.salt = encodeBase64(salt);
      user.iterations = SECURITY.iterations;
      delete user.password;
      saveUsers(users);
    }
    return isValid;
  }

  return false;
}

function showDashboard(user) {
  const hydrated = ensureUserDefaults(user);
  selectors.authSection.classList.add('hidden');
  selectors.dashboard.classList.remove('hidden');
  selectors.userGreeting.textContent = `Bonjour ${hydrated.username}`;

  const completed = Object.values(hydrated.progress || {}).filter(p => p.status === 'Réussi').length;
  selectors.userStatus.textContent = completed === levels.length
    ? 'Parcours validé ! Continuez à réviser les scénarios.'
    : `Modules validés : ${completed}/${levels.length}`;

  renderLevels(hydrated);
  renderScenario(hydrated);
  renderQuickQuiz(hydrated);
  renderChallenges(hydrated);
  renderRewards(hydrated);
  renderLeaderboard();
  updateHeroStats();
}

function showAuth() {
  selectors.dashboard.classList.add('hidden');
  selectors.authSection.classList.remove('hidden');
  selectors.authAlert.classList.add('hidden');
}

async function handleRegister(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const username = form.get('username').trim();
  const email = form.get('email').trim().toLowerCase();
  const password = form.get('password').trim();

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    showAlert('Un compte existe déjà avec cet e-mail.', 'error');
    return;
  }

  if (!validatePassword(password)) {
    showAlert('Choisissez un mot de passe plus robuste (majuscules, chiffres et symbole).', 'error');
    return;
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser = ensureUserDefaults({
    username,
    email,
    passwordHash,
    salt: encodeBase64(salt),
    iterations: SECURITY.iterations,
  });

  users.push(newUser);
  saveUsers(users);
  setSession(email);
  selectors.registerForm.reset();
  updatePasswordMeter('');
  showAlert('Compte créé avec chiffrement avancé. Bienvenue !', 'success');
  showDashboard(newUser);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = form.get('email').trim().toLowerCase();
  const password = form.get('password').trim();
  const remainingLock = checkLock(email);
  if (remainingLock > 0) {
    showAlert(`Compte verrouillé pendant ${remainingLock}s après plusieurs tentatives.`, 'error');
    return;
  }

  const users = loadUsers();
  const userIndex = users.findIndex(u => u.email === email);
  const user = userIndex >= 0 ? ensureUserDefaults(users[userIndex]) : null;
  if (!user) {
    recordFailedLogin(email);
    showAlert('Identifiants invalides.', 'error');
    return;
  }

  const valid = await verifyPassword(password, user, users);
  if (!valid) {
    const until = recordFailedLogin(email);
    const message = until
      ? 'Trop de tentatives : connexion verrouillée quelques secondes.'
      : 'Identifiants invalides.';
    showAlert(message, 'error');
    return;
  }

  clearLock(email);
  setSession(email);
  selectors.loginForm.reset();
  showAlert('Connexion sécurisée réussie.', 'success');
  users[userIndex] = user;
  saveUsers(users);
  showDashboard(user);
}

function logout() {
  clearSession();
  showAuth();
  showAlert('Session terminée en toute sécurité.', 'success');
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

function selectQuiz() {
  const index = Math.floor(Math.random() * quickQuizzes.length);
  return quickQuizzes[index];
}

function renderQuickQuiz(user) {
  if (!selectors.quizArea) return;
  const quiz = selectQuiz();
  selectors.quizArea.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'quiz-card';
  card.innerHTML = `
    <div class="quiz-meta">
      <span class="badge">Quizz éclair</span>
      <span>⏱ ${quiz.duration}</span>
      <span>⚡ ${quiz.difficulty}</span>
    </div>
    <h4>${quiz.title}</h4>
    <p class="muted">${quiz.question}</p>
  `;

  const options = document.createElement('div');
  options.className = 'options';
  quiz.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.type = 'button';
    btn.textContent = option;
    btn.addEventListener('click', () => evaluateQuickQuiz(quiz, user, index));
    options.appendChild(btn);
  });

  const rewardLine = document.createElement('p');
  rewardLine.className = 'muted';
  rewardLine.textContent = `Récompense : ${quiz.reward.points} pts ${quiz.reward.badge ? `• Badge ${quiz.reward.badge}` : ''}`;

  card.appendChild(options);
  card.appendChild(rewardLine);
  selectors.quizArea.appendChild(card);
}

function evaluateQuickQuiz(quiz, user, selectedIndex) {
  const isCorrect = selectedIndex === quiz.answer;
  const users = loadUsers();
  const storedUser = ensureUserDefaults(users.find(u => u.email === user.email));

  if (!storedUser.challengeHistory) {
    storedUser.challengeHistory = { quizzCorrect: 0, lastQuizDay: null, lastRewarded: {} };
  }

  if (isCorrect) {
    const today = new Date().toDateString();
    if (storedUser.challengeHistory.lastQuizDay !== today) {
      storedUser.challengeHistory.quizzCorrect += 1;
      storedUser.challengeHistory.lastQuizDay = today;
    }
    const rewarded = awardReward(storedUser, quiz.reward, 'Réponse parfaite !');
    renderDashboardState(rewarded);
    return;
  }

  showAlert('Réponse incorrecte, respirez et retentez.', 'error');
  persistUser(storedUser);
  renderQuickQuiz(storedUser);
}

function persistUser(updatedUser) {
  const users = loadUsers();
  const index = users.findIndex(u => u.email === updatedUser.email);
  if (index >= 0) {
    users[index] = updatedUser;
    saveUsers(users);
  }
  return updatedUser;
}

function awardReward(user, reward, reason) {
  const updated = ensureUserDefaults(user);
  updated.points = (updated.points || 0) + (reward.points || 0);
  if (reward.badge && !updated.badges.includes(reward.badge)) {
    updated.badges.push(reward.badge);
  }
  updated.rewards.chests = (updated.rewards?.chests || 0) + 1;
  persistUser(updated);
  showAlert(`${reason} ${reward.points ? `+${reward.points} pts` : ''}${reward.badge ? ` • Badge ${reward.badge}` : ''}`, 'success');
  return updated;
}

function renderDashboardState(user) {
  renderLevels(user);
  renderScenario(user);
  renderQuickQuiz(user);
  renderChallenges(user);
  renderRewards(user);
  renderLeaderboard();
  updateHeroStats();
}

function renderChallenges(user) {
  if (!selectors.challengeBoard) return;
  const hydrated = ensureUserDefaults(user);
  selectors.challengeBoard.innerHTML = '';

  challengeBoard.forEach(challenge => {
    const value = challenge.progress(hydrated);
    const isDone = value >= challenge.threshold;
    const alreadyRewarded = hydrated.challengeHistory?.lastRewarded?.[challenge.id] === new Date().toDateString();

    const card = document.createElement('div');
    card.className = 'challenge';
    card.innerHTML = `
      <strong>${challenge.title}</strong>
      <p class="muted">${challenge.description}</p>
      <div class="progress"><span style="width:${Math.min(100, (value / challenge.threshold) * 100)}%"></span></div>
      <p class="muted">${value}/${challenge.threshold}</p>
    `;

    if (isDone && !alreadyRewarded) {
      const button = document.createElement('button');
      button.className = 'btn secondary';
      button.textContent = 'Réclamer la récompense';
      button.addEventListener('click', () => claimChallengeReward(challenge, hydrated));
      card.appendChild(button);
    } else {
      const status = document.createElement('span');
      status.className = 'status-chip';
      status.textContent = isDone ? 'Objectif atteint' : 'En cours';
      card.appendChild(status);
    }

    selectors.challengeBoard.appendChild(card);
  });
}

function claimChallengeReward(challenge, user) {
  const hydrated = ensureUserDefaults(user);
  hydrated.challengeHistory.lastRewarded = hydrated.challengeHistory.lastRewarded || {};
  hydrated.challengeHistory.lastRewarded[challenge.id] = new Date().toDateString();
  const rewarded = awardReward(hydrated, challenge.reward, challenge.title);
  persistUser(rewarded);
  renderDashboardState(rewarded);
}

function renderRewards(user) {
  if (!selectors.rewardBoard) return;
  const hydrated = ensureUserDefaults(user);
  selectors.rewardBoard.innerHTML = '';

  const chest = document.createElement('div');
  chest.className = 'reward-badge';
  chest.innerHTML = `
    <div class="reward-icon">🎁</div>
    <div>
      <strong>Coffres gagnés</strong>
      <p class="muted">${hydrated.rewards?.chests || 0} coffres virtuels à ouvrir en session.</p>
    </div>
  `;
  selectors.rewardBoard.appendChild(chest);

  if (!hydrated.badges || hydrated.badges.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'Aucun badge pour le moment. Répondez aux quizz et validez des modules !';
    selectors.rewardBoard.appendChild(empty);
    return;
  }

  hydrated.badges.forEach((badge, index) => {
    const item = document.createElement('div');
    item.className = 'reward-badge';
    item.innerHTML = `
      <div class="reward-icon">${index + 1}</div>
      <div>
        <strong>${badge}</strong>
        <p class="muted">Badge obtenu grâce à vos réflexes PSE.</p>
      </div>
    `;
    selectors.rewardBoard.appendChild(item);
  });
}

function evaluateAnswer(level, user, selectedIndex) {
  const isCorrect = selectedIndex === level.scenario.answer;
  const users = loadUsers();
  const storedUser = ensureUserDefaults(users.find(u => u.email === user.email));
  storedUser.progress = storedUser.progress || {};

  const previous = storedUser.progress[level.id] || { status: 'Non commencé', score: 0 };
  const baseScore = Math.max(previous.score, isCorrect ? 100 : 40);
  const status = isCorrect ? 'Réussi' : 'En cours';
  storedUser.progress[level.id] = { status, score: baseScore };
  storedUser.points = Object.values(storedUser.progress).reduce((acc, l) => acc + l.score, 0);
  const index = users.findIndex(u => u.email === user.email);
  users[index] = storedUser;
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
  const storedUser = ensureUserDefaults(users.find(u => u.email === user.email));
  storedUser.progress = storedUser.progress || {};
  if (!storedUser.progress[level.id]) {
    storedUser.progress[level.id] = { status: 'En cours', score: 20 };
    const index = users.findIndex(u => u.email === user.email);
    users[index] = storedUser;
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

function playIntro() {
  const intro = document.getElementById('intro-screen');
  if (!intro) return Promise.resolve();

  const timerValue = document.getElementById('intro-timer-value');
  const meterBar = document.getElementById('intro-meter-bar');
  const timeline = document.getElementById('intro-timeline');
  const introDuration = 10_000;
  let remaining = introDuration / 1000;

  document.body.classList.add('intro-active');
  timerValue.textContent = remaining;

  const interval = setInterval(() => {
    remaining -= 1;
    timerValue.textContent = Math.max(remaining, 0);
    if (remaining <= 0) clearInterval(interval);
  }, 1_000);

  const start = performance.now();
  const animate = now => {
    const progress = Math.min((now - start) / introDuration, 1);
    meterBar.style.width = `${progress * 100}%`;
    timeline.style.transform = `scaleX(${progress})`;
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  return new Promise(resolve => {
    setTimeout(() => {
      intro.classList.add('intro-screen--closing');
      document.body.classList.remove('intro-active');
      setTimeout(() => {
        intro.remove();
        resolve();
      }, 650);
    }, introDuration);
  });
}

async function init() {
  await playIntro();
  requestAnimationFrame(() => document.body.classList.add('page-ready'));
  initTabs();
  selectors.loginForm.addEventListener('submit', handleLogin);
  selectors.registerForm.addEventListener('submit', handleRegister);
  selectors.logoutBtn.addEventListener('click', logout);
  selectors.passwordField?.addEventListener('input', (event) => updatePasswordMeter(event.target.value));
  updatePasswordMeter('');

  updateHeroStats();

  const user = currentUser();
  if (user) {
    showDashboard(user);
  } else {
    clearSession();
  }
}

init();
