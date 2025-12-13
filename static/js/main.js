const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const levelMenu = qs('#level-menu');
const appAlert = qs('#app-alert');
const statusTitle = qs('#status-title');
const statusSub = qs('#status-sub');
const statusUser = qs('#status-user');
const statusProgress = qs('#status-progress');
const profileBtn = qs('#profile-btn');
const profileMenu = qs('#profile-menu');
const profileMenuRoot = qs('#profile-menu-root');
const topbar = qs('.topbar');
const topbarToggle = qs('#topbar-toggle');
const menuProfileBtn = qs('#menu-profile');
const menuLogoutBtn = qs('#menu-logout');
const menuUsername = qs('#menu-username');
const menuEmail = qs('#menu-email');
const menuAvatar = qs('#menu-avatar');
const profileDrawer = qs('#profile-drawer');
const closeProfile = qs('#close-profile');
const profileForm = qs('#profile-form');
const profileUsername = qs('#profile-username');
const profileEmail = qs('#profile-email');
const profilePassword = qs('#profile-password');
const profileAvatarValue = qs('#profile-avatar-value');
const profileAvatar = qs('#profile-avatar');
const profileAlert = qs('#profile-alert');
const profileDeleteBtn = qs('#profile-delete');
const profileTotalPoints = qs('#profile-total-points');
const profileQuizPoints = qs('#profile-quiz-points');
const profileMissionPoints = qs('#profile-mission-points');
const profileMinigamePoints = qs('#profile-minigame-points');
const profileBadges = qs('#profile-badges');
const avatarChips = qsa('#profile-avatars .avatar-chip');
const wizardStepper = qs('#wizard-stepper');
const wizardBody = qs('#wizard-body');
const wizardNext = qs('#wizard-next');
const wizardPrev = qs('#wizard-prev');
const wizardTitle = qs('#wizard-title');
const wizardDescription = qs('#wizard-description');
const wizardCategory = qs('#wizard-category');
const wizardIcons = qsa('#wizard-icons .icon-chip');
const questionBuilder = qs('#question-builder');
const addQuestionBtn = qs('#add-question');
const saveQuestionnaireBtn = qs('#save-questionnaire');
const wizardAlert = qs('#wizard-alert');
const previewTitle = qs('#preview-title');
const previewDescription = qs('#preview-description');
const previewIcon = qs('#preview-icon');
const previewMeta = qs('#preview-meta');
const previewQuestions = qs('#preview-questions');
const questionnaireCards = qs('#questionnaire-cards');
const wizardSummary = qs('#wizard-summary');
const playerModal = qs('#questionnaire-player');
const playerOverlay = qs('#player-overlay');
const closePlayerBtn = qs('#close-player');
const playerProgress = qs('#player-progress');
const playerProgressText = qs('#player-progress-text');
const playerScore = qs('#player-score');
const playerQuestion = qs('#player-question');
const playerStep = qs('#player-step');
const playerNext = qs('#player-next');
const playerPrev = qs('#player-prev');
const playerCategory = qs('#player-category');
const playerTitle = qs('#player-title');
const playerDescription = qs('#player-description');
const playerResult = qs('#player-result');
const resultStars = qs('#result-stars');
const resultLabel = qs('#result-label');
const resultDetail = qs('#result-detail');
const AVATAR_EMOJIS = {
  alpha: '🛰️',
  bravo: '🚑',
  charlie: '🛟',
  delta: '🧭',
};
const ICON_EMOJIS = {
  sparkles: '✨',
  shield: '🛡️',
  pulse: '⚡',
  target: '🎯',
  compass: '🧭',
  medkit: '🧰',
  default: '✨',
};
const QUESTION_TYPES = {
  single: 'Réponse unique',
  multiple: 'Choix multiples',
  text: 'Réponse libre',
};
let wizardStep = 1;
let currentUser = null;
let profileData = null;
const logPanel = qs('#log-panel');
let questionIdCounter = 1;
let wizardState = {
  editingId: null,
  title: 'Brief PSE terrain',
  description: 'Ton aperçu évolue en direct : points, types de réponses et icône du formulaire.',
  category: 'Général',
  icon: 'sparkles',
  questions: [],
};
let playerState = {
  questionnaire: null,
  answers: {},
  index: 0,
  score: 0,
  totalPoints: 0,
};

const FEATURED_MISSION_SLUG = 'mission';

function clearAuthState() {
  localStorage.removeItem('isAuthenticated');
}

function setAlert(message, isError = true) {
  if (!appAlert) return;
  appAlert.textContent = message;
  appAlert.classList.remove('hidden');
  appAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function clearAlert() {
  if (appAlert) appAlert.classList.add('hidden');
}

function applyAvatar(target, avatar) {
  if (!target) return;
  const variant = avatar || 'alpha';
  target.classList.remove('avatar--alpha', 'avatar--bravo', 'avatar--charlie', 'avatar--delta');
  target.classList.add(`avatar--${variant}`);
  target.dataset.avatar = variant;
  target.textContent = AVATAR_EMOJIS[variant] || AVATAR_EMOJIS.alpha;
}

function updateStatus(user, progressCount) {
  if (!statusTitle || !statusSub || !statusUser || !statusProgress) return;
  if (user) {
    statusTitle.textContent = 'Connecté';
    statusSub.textContent = 'Votre session est synchronisée avec la base de données.';
    statusUser.textContent = user.username;
    statusProgress.textContent = `${progressCount} mission(s)`;
  } else {
    statusTitle.textContent = 'Non connecté';
    statusSub.textContent = 'Rejoignez la salle de commande pour synchroniser vos missions.';
    statusUser.textContent = '—';
    statusProgress.textContent = '—';
  }
}

async function postJson(url, payload, method = 'POST') {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur serveur');
  }
  return res.json();
}

function showProfileDrawer() {
  closeProfileMenu();
  profileDrawer?.classList.remove('hidden');
}

function hideProfileDrawer() {
  profileDrawer?.classList.add('hidden');
  if (profilePassword) profilePassword.value = '';
}

function fillProfileForm(user) {
  if (!user) return;
  if (profileUsername) profileUsername.value = user.username || '';
  if (profileEmail) profileEmail.value = user.email || '';
  if (profileAvatarValue) profileAvatarValue.value = user.avatar || 'alpha';
  avatarChips.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.avatar === profileAvatarValue.value);
  });
  applyAvatar(profileAvatar, user.avatar);
  applyAvatar(menuAvatar, user.avatar);
  if (menuUsername) menuUsername.textContent = user.username || '—';
  if (menuEmail) menuEmail.textContent = user.email || '—';
}

function updateProfileMetrics(data) {
  if (!data) return;
  if (profileTotalPoints) profileTotalPoints.textContent = `Points totaux : ${data.total_points ?? 0}`;
  if (profileQuizPoints) profileQuizPoints.textContent = `Questionnaires : ${data.quiz_points ?? 0}`;
  if (profileMissionPoints) profileMissionPoints.textContent = `Missions : ${data.mission_points ?? 0}`;
  if (profileMinigamePoints) profileMinigamePoints.textContent = `Mini-jeux : ${data.minigame_points ?? 0}`;

  if (profileBadges) {
    profileBadges.innerHTML = '';
    if (data.badges && data.badges.length > 0) {
      data.badges.forEach(b => {
        const span = document.createElement('span');
        span.className = 'badge';
        span.textContent = b.icon;
        span.title = b.label;
        profileBadges.appendChild(span);
      });
      profileBadges.classList.remove('hidden');
    } else {
      profileBadges.classList.add('hidden');
    }
  }
}

async function loadProfileData() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Impossible de charger le profil');
    profileData = await res.json();
    fillProfileForm(profileData);
    updateProfileMetrics(profileData);
    return profileData;
  } catch (err) {
    setProfileAlert(err.message);
    return null;
  }
}

function toggleProfileMenu(force) {
  if (!profileMenu || !profileBtn) return;
  const shouldOpen = typeof force === 'boolean' ? force : profileMenu.classList.contains('hidden');
  profileMenu.classList.toggle('hidden', !shouldOpen);
  profileBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function closeProfileMenu() {
  toggleProfileMenu(false);
}

function setupProfileChips() {
  avatarChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      avatarChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (profileAvatarValue) profileAvatarValue.value = chip.dataset.avatar;
      applyAvatar(profileAvatar, chip.dataset.avatar);
    });
  });
}

function setProfileAlert(message, isError = true) {
  if (!profileAlert) return;
  profileAlert.textContent = message;
  profileAlert.classList.remove('hidden');
  profileAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function clearProfileAlert() {
  if (profileAlert) profileAlert.classList.add('hidden');
}

function renderLevel(level) {
  const wrapper = document.createElement('article');
  const isFeatured = level.slug === FEATURED_MISSION_SLUG;
  const isLocked = level.is_locked;
  const isAdmin = currentUser?.role === 'admin';

  wrapper.className = `menu-card mission-${level.slug} ${isFeatured ? 'menu-card--featured' : ''} ${isLocked ? 'locked' : ''}`;

  let adminControls = '';
  if (isAdmin) {
    adminControls = `
        <div class="admin-actions">
           <button class="btn ghost small toggle-lock" data-id="${level.id}">
              ${isLocked ? '🔓 Déverrouiller' : '🔒 Verrouiller'}
           </button>
        </div>
      `;
  }

  wrapper.innerHTML = `
    <div class="icon">${iconFor(level.icon)}</div>
    ${isLocked ? '<div style="position:absolute;top:1rem;right:1rem;font-size:1.5rem;">🔒</div>' : ''}
    <p class="eyebrow">${level.slug}</p>
    <h3>${level.name}</h3>
    <p class="desc">${level.description}</p>
    <p class="difficulty">${level.difficulty.toUpperCase()}</p>
    <div class="launch">
      ${isFeatured ? '<span class="chip chip--ghost">Mission mise en avant</span>' : ''}
      <button class="btn primary" data-level="${level.id}" data-slug="${level.slug}" ${isLocked && !isAdmin ? 'disabled' : ''}>
        ${isLocked ? (isAdmin ? 'Force (Admin)' : 'Verrouillé') : 'Lancer'}
      </button>
      <span class="chip">${level.progress ? level.progress.status : 'Nouveau'}</span>
    </div>
    ${adminControls}
  `;
  return wrapper;
}

function iconFor(icon) {
  switch (icon) {
    case 'pulse': return '⚡';
    case 'target': return '🎯';
    case 'joystick': return '🕹️';
    case 'shield':
    default: return '🛡️';
  }
}

async function refreshMenu() {
  const res = await fetch('/api/menu');
  if (res.status === 401) {
    clearAuthState();
    window.location.href = '/auth';
    return;
  }
  const data = await res.json();
  currentUser = data.user;
  if (levelMenu) {
    levelMenu.innerHTML = '';
    const categoryFilter = levelMenu.dataset.category;
    // Render filtered levels
    data.levels.forEach((lvl) => {
      // Filter logic: if no category is filtering, show all (or default behavior), 
      // if filtering is active, strictly match.
      // Default category for old levels is 'mission'.
      const levelCategory = lvl.category || 'mission';
      if (categoryFilter && levelCategory !== categoryFilter) return;

      levelMenu.appendChild(renderLevel(lvl));
    });
  }
  updateStatus(currentUser, data.levels.filter((l) => l.progress).length);
  fillProfileForm(currentUser);
}

async function handleLogout() {
  try {
    await postJson('/api/logout', {});
    clearAuthState();
    window.location.href = '/auth';
  } catch (err) {
    setAlert(err.message);
  }
}

function setupProfileDrawer() {
  if (closeProfile) closeProfile.addEventListener('click', hideProfileDrawer);

  if (profileForm) {
    profileForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      clearProfileAlert();
      const payload = Object.fromEntries(new FormData(profileForm));
      if (!payload.password) delete payload.password;

      try {
        const updated = await postJson('/api/profile', payload);
        currentUser = updated;
        profileData = { ...profileData, ...updated };
        fillProfileForm(updated);
        updateProfileMetrics(profileData);
        updateStatus(updated, parseInt(statusProgress.textContent, 10) || 0);
        setProfileAlert('Profil mis à jour', false);
      } catch (err) {
        setProfileAlert(err.message);
      }
    });
  }

  if (profileDeleteBtn) {
    profileDeleteBtn.addEventListener('click', async () => {
      clearProfileAlert();
      const confirmDelete = window.confirm('Supprimer définitivement le compte et les missions associées ?');
      if (!confirmDelete) return;

      try {
        const res = await fetch('/api/profile', { method: 'DELETE' });
        if (!res.ok) throw new Error();
        clearAuthState();
        window.location.href = '/auth';
      } catch (err) {
        setProfileAlert('Impossible de supprimer le compte.');
      }
    });
  }
}

function setupProfileMenu() {
  if (profileBtn) {
    profileBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      toggleProfileMenu();
    });
  }

  if (menuProfileBtn) {
    menuProfileBtn.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      await loadProfileData();
      showProfileDrawer();
    });
  }

  if (menuLogoutBtn) {
    menuLogoutBtn.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      closeProfileMenu();
      await handleLogout();
    });
  }

  document.addEventListener('click', (evt) => {
    if (!profileMenuRoot) return;
    if (!profileMenuRoot.contains(evt.target)) closeProfileMenu();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') closeProfileMenu();
  });
}

function setupMenuActions() {
  if (!levelMenu) return;
  levelMenu.addEventListener('click', async (evt) => {
    const lockBtn = evt.target.closest('.toggle-lock');
    if (lockBtn) {
      const levelId = lockBtn.dataset.id;
      try {
        await postJson(`/api/admin/levels/${levelId}/toggle_lock`, {});
        await refreshMenu();
      } catch (err) {
        setAlert(err.message);
      }
      return;
    }

    // Launch Mission
    const btn = evt.target.closest('button[data-level]');
    if (!btn || btn.disabled) return;

    const levelId = parseInt(btn.dataset.level, 10);
    const slug = btn.dataset.slug;
    animateSuccess(`Mission ${levelId} lancée`);
    try {
      await postJson(`/api/progress/${levelId}`, { status: 'en_cours', score: Math.floor(Math.random() * 100) });
      await refreshMenu();
      if (slug) {
        window.location.href = `/mission/${slug}`;
      }
    } catch (err) {
      setAlert(err.message);
    }
  });
}

function setupTopbarToggle() {
  if (!topbar || !topbarToggle || !profileMenuRoot) return;

  topbarToggle.addEventListener('click', () => {
    const isOpen = topbar.classList.toggle('topbar--open');
    topbarToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (evt) => {
    if (!topbar.classList.contains('topbar--open')) return;
    const withinTopbar = topbar.contains(evt.target);
    if (!withinTopbar) {
      topbar.classList.remove('topbar--open');
      topbarToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function animateSuccess(message) {
  if (qs('#beam')) {
    gsap.fromTo('#beam', { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: 'power2.out' });
  }
  if (qs('#scanner')) {
    gsap.fromTo('#scanner', { xPercent: -100 }, { xPercent: 120, duration: 1.4, ease: 'power2.inOut' });
  }
  if (qs('#pulse-line')) {
    gsap.fromTo('#pulse-line', { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 0', duration: 0.8, ease: 'expo.out' });
  }
  log(message);
}

function log(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  if (!logPanel) return;
  logPanel.prepend(entry);
  while (logPanel.children.length > 6) logPanel.removeChild(logPanel.lastChild);
}

function defaultOptions(type) {
  if (type === 'text') return [{ id: `${Date.now()}-text`, label: '', is_correct: true }];
  return [
    { id: `${Date.now()}-a`, label: 'Réponse A', is_correct: true },
    { id: `${Date.now()}-b`, label: 'Réponse B', is_correct: false },
  ];
}

function createQuestion(type = 'single') {
  const question = {
    id: `q-${questionIdCounter++}`,
    text: 'Nouvelle question',
    type,
    points: 5,
    options: defaultOptions(type),
  };
  return question;
}

function setWizardAlert(message, isError = true) {
  if (!wizardAlert) return;
  wizardAlert.textContent = message;
  wizardAlert.classList.toggle('hidden', !message);
  wizardAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function setWizardStep(step) {
  wizardStep = step;
  if (wizardStepper) {
    wizardStepper.querySelectorAll('.wizard__step').forEach((el) => {
      const index = Number(el.dataset.step);
      el.classList.toggle('wizard__step--active', index === wizardStep);
      el.classList.toggle('wizard__step--done', index < wizardStep);
    });
  }
  if (wizardBody) {
    wizardBody.querySelectorAll('.wizard__panel').forEach((panel) => {
      panel.classList.toggle('hidden', Number(panel.dataset.step) !== wizardStep);
    });
  }
  if (wizardPrev) wizardPrev.disabled = wizardStep === 1;
  if (wizardNext) wizardNext.classList.toggle('hidden', wizardStep === 3);
  if (saveQuestionnaireBtn) saveQuestionnaireBtn.classList.toggle('hidden', wizardStep !== 3);
}

function updatePreview() {
  if (!previewTitle || !previewDescription) return;
  const totalPoints = wizardState.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  previewTitle.textContent = wizardState.title || 'Questionnaire sans titre';
  previewDescription.textContent = wizardState.description || 'Prépare un parcours interactif pour tes équipes.';
  if (previewIcon) previewIcon.textContent = ICON_EMOJIS[wizardState.icon] || ICON_EMOJIS.default;
  if (previewMeta) {
    previewMeta.innerHTML = '';
    const categoryChip = document.createElement('span');
    categoryChip.className = 'chip';
    categoryChip.textContent = `Catégorie : ${wizardState.category}`;
    const pointsChip = document.createElement('span');
    pointsChip.className = 'chip';
    pointsChip.textContent = `${totalPoints} point${totalPoints > 1 ? 's' : ''}`;
    previewMeta.append(categoryChip, pointsChip);
  }

  if (previewQuestions) {
    previewQuestions.innerHTML = '';
    wizardState.questions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'preview-card';
      card.innerHTML = `
        <div class="preview-card__header">
          <span class="chip chip--ghost">Q${index + 1}</span>
          <span class="chip chip--ghost">${QUESTION_TYPES[q.type] || 'Libre'}</span>
          <span class="chip chip--ghost">${q.points} pt</span>
        </div>
        <p class="label">${q.text || 'Question en attente'}</p>
      `;
      if (q.type !== 'text' && q.options?.length) {
        const list = document.createElement('ul');
        list.className = 'preview-card__options';
        q.options.forEach((opt) => {
          const li = document.createElement('li');
          li.textContent = `${opt.is_correct ? '✅ ' : ''}${opt.label}`;
          list.appendChild(li);
        });
        card.appendChild(list);
      }
      previewQuestions.appendChild(card);
    });
  }
}

function renderQuestion(question) {
  const optionsHtml = question.options
    .map(
      (opt) => `
        <div class="option-row" data-option="${opt.id}">
          <input type="text" class="option-text" value="${opt.label || ''}" placeholder="Proposition">
          <label class="option-check">
            ${question.type === 'multiple'
          ? `<input type="checkbox" class="option-correct" ${opt.is_correct ? 'checked' : ''}> Bonne réponse`
          : `<input type="radio" name="correct-${question.id}" class="option-correct" ${opt.is_correct ? 'checked' : ''}> Bonne réponse`}
          </label>
          <button class="icon-btn remove-option" type="button" aria-label="Supprimer l'option">✖</button>
        </div>
      `,
    )
    .join('');

  const optionsBlock = `
    <div class="option-list" ${question.type === 'text' ? 'hidden' : ''}>
      ${optionsHtml}
      <button class="btn ghost add-option" type="button">Ajouter une option</button>
    </div>
    ${question.type === 'text'
      ? `<div class="text-expected">
            <label>Réponse attendue
              <input class="text-expected__input" value="${question.options?.[0]?.label || ''}" placeholder="Réponse correcte" />
            </label>
          </div>`
      : ''
    }`;

  return `
    <article class="question-card" data-question="${question.id}">
      <div class="question-card__header">
        <div>
          <p class="eyebrow">Question</p>
          <input class="question-text" value="${question.text}" />
        </div>
        <div class="question-card__actions">
          <label class="chips-inline">
            <span class="chip">Points</span>
            <input class="question-points" type="number" min="0" value="${question.points}" />
          </label>
          <select class="question-type">
            ${Object.entries(QUESTION_TYPES)
      .map(([value, label]) => `<option value="${value}" ${question.type === value ? 'selected' : ''}>${label}</option>`)
      .join('')}
          </select>
          <button class="icon-btn remove-question" type="button" aria-label="Supprimer">🗑️</button>
        </div>
      </div>
      ${optionsBlock}
    </article>
  `;
}

function renderQuestions() {
  if (!questionBuilder) return;
  questionBuilder.innerHTML = wizardState.questions.map((q) => renderQuestion(q)).join('');
  updatePreview();
}

function addQuestion() {
  wizardState.questions.push(createQuestion('single'));
  renderQuestions();
}

function updateQuestionnaireSummary() {
  if (!wizardSummary) return;
  const totalPoints = wizardState.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  wizardSummary.innerHTML = `
    <ul class="summary__list">
      <li><strong>Titre :</strong> ${wizardState.title || '—'}</li>
      <li><strong>Catégorie :</strong> ${wizardState.category}</li>
      <li><strong>Icône :</strong> ${ICON_EMOJIS[wizardState.icon] || '✨'}</li>
      <li><strong>Questions :</strong> ${wizardState.questions.length}</li>
      <li><strong>Points cumulés :</strong> ${totalPoints}</li>
    </ul>
  `;
}

function handleWizardNavigation() {
  if (wizardNext) {
    wizardNext.addEventListener('click', () => {
      if (wizardStep < 3) setWizardStep(wizardStep + 1);
      if (wizardStep === 3) updateQuestionnaireSummary();
    });
  }

  if (wizardPrev) {
    wizardPrev.addEventListener('click', () => {
      if (wizardStep > 1) setWizardStep(wizardStep - 1);
    });
  }
}

function handleWizardInputs() {
  if (wizardTitle) {
    wizardTitle.addEventListener('input', (evt) => {
      wizardState.title = evt.target.value;
      updatePreview();
    });
  }
  if (wizardDescription) {
    wizardDescription.addEventListener('input', (evt) => {
      wizardState.description = evt.target.value;
      updatePreview();
    });
  }
  if (wizardCategory) {
    wizardCategory.addEventListener('change', (evt) => {
      wizardState.category = evt.target.value;
      updatePreview();
    });
  }
  wizardIcons.forEach((btn) => {
    btn.addEventListener('click', () => {
      wizardIcons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      wizardState.icon = btn.dataset.icon;
      updatePreview();
    });
  });

  if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => addQuestion());

  if (questionBuilder) {
    questionBuilder.addEventListener('input', (evt) => {
      const card = evt.target.closest('.question-card');
      if (!card) return;
      const id = card.dataset.question;
      const question = wizardState.questions.find((q) => q.id === id);
      if (!question) return;

      if (evt.target.classList.contains('question-text')) {
        question.text = evt.target.value;
      }
      if (evt.target.classList.contains('question-points')) {
        question.points = Math.max(0, Number(evt.target.value) || 0);
        evt.target.value = question.points;
      }
      if (evt.target.classList.contains('question-type')) {
        question.type = evt.target.value;
        question.options = defaultOptions(question.type);
        renderQuestions();
        return;
      }
      if (evt.target.classList.contains('option-text')) {
        const optRow = evt.target.closest('.option-row');
        const optId = optRow?.dataset.option;
        const opt = question.options.find((o) => `${o.id}` === `${optId}`);
        if (opt) opt.label = evt.target.value;
      }
      if (evt.target.classList.contains('text-expected__input')) {
        const expected = question.options?.[0];
        if (expected) expected.label = evt.target.value;
      }
      updatePreview();
    });

    questionBuilder.addEventListener('change', (evt) => {
      if (!evt.target.classList.contains('option-correct')) return;
      const card = evt.target.closest('.question-card');
      const id = card?.dataset.question;
      const question = wizardState.questions.find((q) => q.id === id);
      if (!question) return;
      const optRow = evt.target.closest('.option-row');
      const optId = optRow?.dataset.option;
      if (question.type === 'single') {
        question.options.forEach((o) => { o.is_correct = false; });
        const opt = question.options.find((o) => `${o.id}` === `${optId}`);
        if (opt) opt.is_correct = true;
      } else {
        const opt = question.options.find((o) => `${o.id}` === `${optId}`);
        if (opt) opt.is_correct = evt.target.checked;
      }
      updatePreview();
    });

    questionBuilder.addEventListener('click', (evt) => {
      const card = evt.target.closest('.question-card');
      if (!card) return;
      const id = card.dataset.question;
      const questionIndex = wizardState.questions.findIndex((q) => q.id === id);
      if (questionIndex === -1) return;

      if (evt.target.classList.contains('remove-question')) {
        wizardState.questions.splice(questionIndex, 1);
        renderQuestions();
        return;
      }

      if (evt.target.classList.contains('add-option')) {
        wizardState.questions[questionIndex].options.push({
          id: `${Date.now()}-${Math.random()}`,
          label: 'Nouvelle option',
          is_correct: false,
        });
        renderQuestions();
        return;
      }

      if (evt.target.classList.contains('remove-option')) {
        const optRow = evt.target.closest('.option-row');
        const optId = optRow?.dataset.option;
        wizardState.questions[questionIndex].options = wizardState.questions[questionIndex].options.filter(
          (opt) => `${opt.id}` !== `${optId}`,
        );
        renderQuestions();
      }
    });
  }
}

async function saveQuestionnaire() {
  if (!saveQuestionnaireBtn) return;
  saveQuestionnaireBtn.addEventListener('click', async () => {
    try {
      const payload = {
        title: wizardState.title,
        description: wizardState.description,
        category: wizardState.category,
        icon: wizardState.icon,
        questions: wizardState.questions.map((q) => ({
          text: q.text,
          type: q.type,
          points: q.points,
          options: q.options,
        })),
      };
      const endpoint = wizardState.editingId ? `/api/questionnaires/${wizardState.editingId}` : '/api/questionnaires';
      const method = wizardState.editingId ? 'PUT' : 'POST';
      await postJson(endpoint, payload, method);
      setWizardAlert(
        wizardState.editingId
          ? 'Questionnaire mis à jour avec succès.'
          : 'Questionnaire publié et enregistré dans la bibliothèque.',
        false,
      );
      wizardState.editingId = wizardState.editingId || null;
      await refreshQuestionnaires();
    } catch (err) {
      setWizardAlert(err.message);
    }
  });
}

async function refreshQuestionnaires() {
  if (!questionnaireCards) return;
  try {
    const res = await fetch('/api/questionnaires');
    if (!res.ok) throw new Error();
    const data = await res.json();
    questionnaireCards.innerHTML = '';
    data.questionnaires.forEach((q) => {
      const card = document.createElement('article');
      card.className = 'questionnaire-card';
      card.dataset.id = q.id;
      const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'formateur';
      const bestScore = q.user_result?.score ?? 0;
      const bestMax = q.user_result?.max_score || q.total_points || q.questions?.reduce((acc, question) => acc + (question.points || 0), 0) || q.question_count;
      const statusLabel = q.user_result
        ? `Effectué · ${bestScore}/${bestMax || '?'} pts`
        : 'Jamais fait';
      card.innerHTML = `
        <div class="questionnaire-card__icon">${ICON_EMOJIS[q.icon] || ICON_EMOJIS.default}</div>
        <div class="questionnaire-card__body">
          <p class="eyebrow">${q.category}</p>
          <h4>${q.title}</h4>
          <p class="muted">${q.description || 'Pas de description'}</p>
          <div class="chip-row questionnaire-card__footer">
            <span class="chip">${q.question_count || (q.questions ? q.questions.length : 0)} question(s)</span>
            <span class="chip">${new Date(q.created_at).toLocaleDateString()}</span>
            <span class="chip ${q.user_result ? 'chip--success' : 'chip--ghost'}">${statusLabel}</span>
            ${currentUser?.role === 'admin' ? '<span class="admin-pill">Admin</span>' : ''}
            <button class="btn secondary play-questionnaire" data-id="${q.id}">Ouvrir</button>
            ${canEdit ? `<button class="btn ghost edit-questionnaire" data-id="${q.id}">Modifier</button>` : ''}
            ${currentUser?.role === 'admin' ? `<button class="btn danger delete-questionnaire" data-id="${q.id}">Supprimer</button>` : ''}
          </div>
        </div>
      `;
      questionnaireCards.appendChild(card);
    });
  } catch (err) {
    questionnaireCards.innerHTML = '<p class="muted">Impossible de charger les questionnaires.</p>';
  }
}

function setupQuestionnaireActions() {
  if (!questionnaireCards) return;
  questionnaireCards.addEventListener('click', async (evt) => {
    const playBtn = evt.target.closest('.play-questionnaire');
    const deleteBtn = evt.target.closest('.delete-questionnaire');
    const editBtn = evt.target.closest('.edit-questionnaire');
    if (playBtn) {
      try {
        const questionnaire = await fetchQuestionnaireDetail(playBtn.dataset.id);
        openPlayer(questionnaire);
      } catch (err) {
        setAlert(err.message);
      }
      return;
    }

    if (editBtn) {
      try {
        const questionnaire = await fetchQuestionnaireDetail(editBtn.dataset.id);
        loadQuestionnaireForEditing(questionnaire);
        setWizardStep(1);
        updatePreview();
        setWizardAlert('Questionnaire chargé pour modification.', false);
        document.querySelector('#wizard-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        setAlert("Impossible de charger ce questionnaire pour modification.");
      }
      return;
    }

    if (deleteBtn) {
      const confirmDelete = window.confirm('Supprimer définitivement ce questionnaire ?');
      if (!confirmDelete) return;
      try {
        const res = await fetch(`/api/questionnaires/${deleteBtn.dataset.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await refreshQuestionnaires();
      } catch (err) {
        setAlert('Impossible de supprimer le questionnaire.');
      }
    }
  });
}

function setupPlayerNavigation() {
  if (closePlayerBtn) closePlayerBtn.addEventListener('click', closePlayer);
  if (playerOverlay) playerOverlay.addEventListener('click', closePlayer);
  if (playerPrev) {
    playerPrev.addEventListener('click', () => {
      if (!playerState.questionnaire || playerState.index === 0) return;
      playerState.index -= 1;
      renderPlayerQuestion();
    });
  }
  if (playerNext) {
    playerNext.addEventListener('click', () => {
      if (!playerState.questionnaire) return;
      if (playerState.index >= total - 1) {
        showResult();
        setTimeout(() => closePlayer(), 1800);
        return;
      }
      playerState.index += 1;
      renderPlayerQuestion();
    });
  }
}

function setupSimulator() {
  const simulateBtn = qs('#simulate-btn');
  if (!simulateBtn) return;
  simulateBtn.addEventListener('click', () => animateSuccess('Simulation réussie : animation déclenchée.'));
}

async function fetchQuestionnaireDetail(id) {
  const res = await fetch(`/api/questionnaires/${id}`);
  if (!res.ok) throw new Error('Impossible de charger le questionnaire');
  return res.json();
}

function updatePlayerProgress() {
  if (!playerState.questionnaire) return;
  const total = playerState.questionnaire.questions.length;
  const percent = Math.round(((playerState.index + 1) / total) * 100);
  if (playerProgress) playerProgress.style.width = `${percent}%`;
  if (playerProgressText) playerProgressText.textContent = `${percent}%`;
  if (playerStep) playerStep.textContent = `Question ${playerState.index + 1} / ${total}`;
  if (playerScore) playerScore.textContent = `${playerState.score} / ${playerState.totalPoints} point(s)`;
  if (playerPrev) playerPrev.disabled = playerState.index === 0;
  if (playerNext) playerNext.textContent = playerState.index === total - 1 ? 'Terminer' : 'Suivant';
}

function updatePlayerNextState(question) {
  if (!playerNext) return;
  const answer = playerState.answers[playerState.index];
  playerNext.disabled = !isAnswerProvided(question, answer);
}

function isAnswerCorrect(question, answer) {
  if (question.type === 'text') {
    const expected = (question.options || []).find((opt) => opt.is_correct)?.label || question.options?.[0]?.label || '';
    if (!expected) return false;
    if (!answer || !`${answer}`.trim()) return false;
    return expected.trim().toLowerCase() === `${answer}`.trim().toLowerCase();
  }

  if (question.type === 'multiple') {
    const correctIds = (question.options || []).filter((opt) => opt.is_correct).map((opt) => `${opt.id}`);
    const selected = Array.isArray(answer) ? answer.map((id) => `${id}`) : [];
    if (!correctIds.length) return false;
    if (correctIds.length !== selected.length) return false;
    return correctIds.every((id) => selected.includes(id));
  }

  const correct = (question.options || []).find((opt) => opt.is_correct);
  return correct ? `${answer}` === `${correct.id}` : false;
}

function isAnswerProvided(question, answer) {
  if (question.type === 'text') return Boolean(`${answer || ''}`.trim());
  if (question.type === 'multiple') return Array.isArray(answer) && answer.length > 0;
  return answer !== undefined && answer !== null && `${answer}` !== '';
}

function getCorrectLabels(question) {
  if (question.type === 'text') return (question.options?.[0]?.label || '').trim() || 'Réponse libre attendue';
  const labels = (question.options || []).filter((opt) => opt.is_correct).map((opt) => opt.label || '—');
  return labels.length ? labels.join(', ') : 'Réponse attendue';
}

function renderStars(ratio) {
  if (!resultStars) return;
  const stars = 5;
  const filled = Math.round(ratio * stars);
  resultStars.innerHTML = '';
  for (let i = 0; i < stars; i += 1) {
    const span = document.createElement('span');
    span.textContent = i < filled ? '⭐' : '☆';
    resultStars.appendChild(span);
  }
}

function evaluateAnswers() {
  playerState.score = 0;
  playerState.totalPoints = playerState.questionnaire.questions.reduce((acc, q) => acc + (q.points || 0), 0);

  playerState.questionnaire.questions.forEach((question, idx) => {
    const answer = playerState.answers[idx];
    if (isAnswerCorrect(question, answer)) playerState.score += question.points || 0;
  });
}

function renderPlayerQuestion() {
  if (!playerQuestion || !playerState.questionnaire) return;
  const question = playerState.questionnaire.questions[playerState.index];
  const savedAnswer = playerState.answers[playerState.index];
  playerQuestion.innerHTML = `
    <div class="chips-inline">
      <span class="chip">${QUESTION_TYPES[question.type] || 'Réponse'}</span>
      <span class="chip">${question.points} point(s)</span>
    </div>
    <h4>${question.text}</h4>
    <div class="player-question__options"></div>
    <div class="player-feedback hidden" id="player-feedback"></div>
  `;

  const optionsContainer = playerQuestion.querySelector('.player-question__options');
  if (question.type === 'text') {
    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.placeholder = 'Ta réponse';
    textarea.value = savedAnswer || '';
    textarea.addEventListener('input', (evt) => {
      playerState.answers[playerState.index] = evt.target.value;
      updatePlayerNextState(question);
    });
    optionsContainer.appendChild(textarea);
  } else {
    (question.options || []).forEach((opt) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'option-tile';
      const input = document.createElement('input');
      input.type = question.type === 'multiple' ? 'checkbox' : 'radio';
      input.name = `question-${playerState.index}`;
      input.value = opt.id;
      if (question.type === 'multiple' && Array.isArray(savedAnswer)) {
        input.checked = savedAnswer.includes(opt.id) || savedAnswer.includes(`${opt.id}`);
      }
      if (question.type === 'single' && savedAnswer) {
        input.checked = `${savedAnswer}` === `${opt.id}`;
      }
      input.addEventListener('change', (evt) => {
        if (question.type === 'multiple') {
          const selected = playerState.answers[playerState.index] || [];
          if (evt.target.checked) {
            playerState.answers[playerState.index] = [...selected, opt.id];
          } else {
            playerState.answers[playerState.index] = selected.filter((id) => `${id}` !== `${opt.id}`);
          }
        } else {
          playerState.answers[playerState.index] = opt.id;
        }
        updatePlayerNextState(question);
      });
      wrapper.appendChild(input);
      const span = document.createElement('span');
      span.textContent = opt.label;
      wrapper.appendChild(span);
      optionsContainer.appendChild(wrapper);
    });
  }
  updatePlayerProgress();
  updatePlayerNextState(question);
}

function showAnswerFeedback() {
  if (!playerState.questionnaire) return { isCorrect: false };
  const question = playerState.questionnaire.questions[playerState.index];
  const answer = playerState.answers[playerState.index];
  if (!isAnswerProvided(question, answer)) {
    const feedback = qs('#player-feedback');
    if (feedback) {
      feedback.classList.remove('hidden');
      feedback.classList.remove('player-feedback--success');
      feedback.classList.add('player-feedback--error');
      feedback.textContent = 'Indique une réponse avant de continuer.';
    }
    return { isCorrect: false, skipped: true };
  }
  const options = playerQuestion?.querySelectorAll('.option-tile') || [];
  const correctIds = (question.options || []).filter((opt) => opt.is_correct).map((opt) => `${opt.id}`);

  options.forEach((wrapper) => {
    wrapper.classList.remove('option-tile--correct', 'option-tile--wrong', 'option-tile--celebrate');
    const input = wrapper.querySelector('input');
    if (!input) return;
    const id = `${input.value}`;
    if (correctIds.includes(id)) wrapper.classList.add('option-tile--correct');
    if (input.checked && !correctIds.includes(id)) wrapper.classList.add('option-tile--wrong');
  });

  const isCorrect = isAnswerCorrect(question, answer);
  if (isCorrect) {
    options.forEach((wrapper) => {
      const input = wrapper.querySelector('input');
      if (!input) return;
      if (correctIds.includes(`${input.value}`)) {
        wrapper.classList.add('option-tile--celebrate');
        setTimeout(() => wrapper.classList.remove('option-tile--celebrate'), 3000);
      }
    });
  }
  const feedback = qs('#player-feedback');
  if (feedback) {
    feedback.classList.remove('hidden');
    feedback.classList.toggle('player-feedback--success', isCorrect);
    feedback.classList.toggle('player-feedback--error', !isCorrect);
    if (question.type === 'text') {
      const trimmed = `${answer || ''}`.trim() || '—';
      feedback.textContent = isCorrect
        ? `Bonne réponse ! (Ta réponse : ${trimmed})`
        : `Réponse attendue : ${getCorrectLabels(question)} — Ta réponse : ${trimmed}`;
    } else {
      feedback.textContent = isCorrect
        ? 'Bonne réponse !'
        : `Réponse attendue : ${getCorrectLabels(question)}`;
    }
  }
  return { isCorrect };
}

async function persistQuestionnaireResult() {
  if (!playerState.questionnaire) return;
  try {
    await postJson(`/api/questionnaires/${playerState.questionnaire.id}/result`, {
      score: playerState.score,
      max_score: playerState.totalPoints,
    });
    await refreshQuestionnaires();
    await loadProfileData();
  } catch (err) {
    console.error('Impossible de sauvegarder le score', err);
  }
}

async function showResult() {
  evaluateAnswers();
  const ratio = playerState.totalPoints ? playerState.score / playerState.totalPoints : 0;
  renderStars(ratio);
  if (resultLabel) resultLabel.textContent = ratio >= 0.8 ? 'Excellente maîtrise' : ratio >= 0.5 ? 'Bien joué' : 'À retravailler';
  const recordScore = Math.max(playerState.bestScore || 0, playerState.score);
  const recordMax = Math.max(playerState.bestMax || playerState.totalPoints, playerState.totalPoints);
  if (resultDetail) resultDetail.textContent = `Score ${playerState.score} / ${playerState.totalPoints} points (record ${recordScore}/${recordMax}).`;
  if (playerResult) playerResult.classList.remove('hidden');
  updatePlayerProgress();
  await persistQuestionnaireResult();
}

function openPlayer(questionnaire) {
  playerState = {
    questionnaire,
    answers: {},
    index: 0,
    score: 0,
    totalPoints: questionnaire.questions.reduce((acc, q) => acc + (q.points || 0), 0),
    bestScore: questionnaire.user_result?.score || 0,
    bestMax: questionnaire.user_result?.max_score || questionnaire.total_points,
  };
  if (playerTitle) playerTitle.textContent = questionnaire.title;
  if (playerCategory) playerCategory.textContent = questionnaire.category;
  if (playerDescription) playerDescription.textContent = questionnaire.description || 'Réponds pour accumuler des points.';
  if (playerResult) playerResult.classList.add('hidden');
  renderPlayerQuestion();
  playerModal?.classList.remove('hidden');
}

function closePlayer() {
  playerModal?.classList.add('hidden');
  playerState = { questionnaire: null, answers: {}, index: 0, score: 0, totalPoints: 0 };
}

function normalizeOptions(question) {
  if (question.type === 'text') {
    const expected = question.options?.[0]?.label || '';
    return [{ id: `${question.id}-text`, label: expected, is_correct: true }];
  }
  return (question.options || []).map((opt, idx) => ({
    id: opt.id || `${question.id}-opt-${idx}`,
    label: opt.label,
    is_correct: Boolean(opt.is_correct),
  }));
}

function loadQuestionnaireForEditing(questionnaire) {
  wizardState.editingId = questionnaire.id;
  wizardState.title = questionnaire.title;
  wizardState.description = questionnaire.description;
  wizardState.category = questionnaire.category;
  wizardState.icon = questionnaire.icon;
  wizardState.questions = (questionnaire.questions || []).map((q) => ({
    id: `q-${q.id}`,
    text: q.text,
    type: q.type,
    points: q.points,
    options: normalizeOptions(q),
  }));
  if (!wizardState.questions.length) {
    wizardState.questions = [createQuestion('single')];
  }

  if (wizardTitle) wizardTitle.value = wizardState.title;
  if (wizardDescription) wizardDescription.value = wizardState.description;
  if (wizardCategory) wizardCategory.value = wizardState.category;
  wizardIcons.forEach((btn) => btn.classList.toggle('active', btn.dataset.icon === wizardState.icon));
  renderQuestions();
  updateQuestionnaireSummary();
}

function initQuestionnaireWizard() {
  if (!wizardBody) return;
  wizardState = {
    ...wizardState,
    editingId: null,
    questions: [createQuestion('single')],
  };
  if (wizardTitle) wizardTitle.value = wizardState.title;
  if (wizardDescription) wizardDescription.value = wizardState.description;
  if (wizardCategory) wizardCategory.value = wizardState.category;
  wizardIcons.forEach((btn) => btn.classList.toggle('active', btn.dataset.icon === wizardState.icon));
  setWizardStep(1);
  renderQuestions();
  handleWizardInputs();
  handleWizardNavigation();
  saveQuestionnaire();
  refreshQuestionnaires();
}

async function init() {
  setupMenuActions();
  setupProfileChips();
  setupProfileDrawer();
  setupProfileMenu();
  setupTopbarToggle();
  setupSimulator();
  initQuestionnaireWizard();
  await refreshMenu();
  await loadProfileData();
  await refreshQuestionnaires();
  setupQuestionnaireActions();
  setupPlayerNavigation();
  log('Interface initialisée avec GSAP et Flask.');
}

async function playSplashThenInit() {
  const splash = qs('#splash');
  const appShell = qs('#app-shell');

  try {
    // L'écran principal n'est accessible qu'une fois connecté :
    // on supprime donc l'animation et on force l'état authentifié
    // pour les prochains chargements.
    localStorage.setItem('isAuthenticated', 'true');
    splash?.classList.add('hidden');
    appShell?.classList.remove('hidden');
    await init();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    // En cas d'erreur, on affiche quand même l'app
    splash?.classList.add('hidden');
    appShell?.classList.remove('hidden');
  }
}

// --- ADMIN FUNCTIONS ---
async function loadAdminUsers() {
  const container = document.getElementById('admin-users-list');
  if (!container) return;

  container.innerHTML = 'Chargement...';

  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to load users');
    const users = await res.json();

    // Ensure users is an array
    if (!Array.isArray(users)) {
      container.innerHTML = 'Format de réponse invalide.';
      console.error('Expected array, got:', users);
      return;
    }

    container.innerHTML = '';
    users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'panel';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.innerHTML = `
                <div>
                    <strong>${u.username}</strong> (${u.email})
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <label style="font-size:12px;">Bonus:</label>
                    <input type="number" value="${u.bonus_points}" id="bonus-${u.id}" style="width:80px; padding:4px;" />
                    <button class="btn" onclick="saveBonusPoints(${u.id})">Sauver</button>
                </div>
            `;
      container.appendChild(div);
    });
  } catch (e) {
    container.innerHTML = 'Erreur lors du chargement des utilisateurs.';
    console.error(e);
  }
}

window.loadAdminUsers = loadAdminUsers;

async function saveBonusPoints(userId) {
  const input = document.getElementById(`bonus-${userId}`);
  const bonus = parseInt(input.value);

  try {
    const res = await fetch(`/api/admin/users/${userId}/bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus })
    });

    if (res.ok) {
      alert('Points bonus mis à jour !');
    } else {
      alert('Erreur lors de la mise à jour.');
    }
  } catch (e) {
    console.error(e);
    alert('Erreur technique.');
  }
}

window.saveBonusPoints = saveBonusPoints;

document.addEventListener('DOMContentLoaded', playSplashThenInit);
