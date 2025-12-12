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
const avatarChips = qsa('#profile-avatars .avatar-chip');
const AVATAR_EMOJIS = {
  alpha: '🛰️',
  bravo: '🚑',
  charlie: '🛟',
  delta: '🧭',
};
let currentUser = null;
const logPanel = qs('#log-panel');

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

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
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
  wrapper.className = 'menu-card';
  wrapper.innerHTML = `
    <div class="icon">${iconFor(level.icon)}</div>
    <p class="eyebrow">${level.slug}</p>
    <h3>${level.name}</h3>
    <p class="desc">${level.description}</p>
    <p class="difficulty">${level.difficulty.toUpperCase()}</p>
    <div class="launch">
      <button class="btn primary" data-level="${level.id}">Lancer</button>
      <span class="chip">${level.progress ? level.progress.status : 'Nouveau'}</span>
    </div>
  `;
  return wrapper;
}

function iconFor(icon) {
  switch (icon) {
    case 'pulse': return '⚡';
    case 'target': return '🎯';
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
  if (levelMenu) {
    levelMenu.innerHTML = '';
    data.levels.forEach((lvl) => levelMenu.appendChild(renderLevel(lvl)));
  }
  currentUser = data.user;
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
        fillProfileForm(updated);
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
    menuProfileBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
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
    const btn = evt.target.closest('button[data-level]');
    if (!btn) return;
    const levelId = parseInt(btn.dataset.level, 10);
    animateSuccess(`Mission ${levelId} lancée`);
    try {
      await postJson(`/api/progress/${levelId}`, { status: 'en_cours', score: Math.floor(Math.random() * 100) });
      await refreshMenu();
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

function setupSimulator() {
  const simulateBtn = qs('#simulate-btn');
  if (!simulateBtn) return;
  simulateBtn.addEventListener('click', () => animateSuccess('Simulation réussie : animation déclenchée.'));
}

async function init() {
  setupMenuActions();
  setupProfileChips();
  setupProfileDrawer();
  setupProfileMenu();
  setupTopbarToggle();
  setupSimulator();
  await refreshMenu();
  log('Interface initialisée avec GSAP et Flask.');
}

function playSplashThenInit() {
  const splash = qs('#splash');
  const appShell = qs('#app-shell');

  // L'écran principal n'est accessible qu'une fois connecté :
  // on supprime donc l'animation et on force l'état authentifié
  // pour les prochains chargements.
  localStorage.setItem('isAuthenticated', 'true');
  splash?.classList.add('hidden');
  appShell?.classList.remove('hidden');
  init();
}

document.addEventListener('DOMContentLoaded', playSplashThenInit);
