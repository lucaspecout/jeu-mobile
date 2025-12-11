const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const levelMenu = qs('#level-menu');
const authAlert = qs('#auth-alert');
const logoutBtn = qs('#logout-btn');
const statusTitle = qs('#status-title');
const statusSub = qs('#status-sub');
const statusUser = qs('#status-user');
const statusProgress = qs('#status-progress');
const logPanel = qs('#log-panel');

function setAlert(message, isError = true) {
  authAlert.textContent = message;
  authAlert.classList.remove('hidden');
  authAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function clearAlert() {
  authAlert.classList.add('hidden');
}

function updateStatus(user, progressCount) {
  if (user) {
    statusTitle.textContent = 'Connecté';
    statusSub.textContent = 'Votre session est synchronisée avec la base de données.';
    statusUser.textContent = user;
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
  const data = await fetch('/api/menu').then((r) => r.json());
  levelMenu.innerHTML = '';
  data.levels.forEach((lvl) => levelMenu.appendChild(renderLevel(lvl)));
  updateStatus(data.user, data.levels.filter((l) => l.progress).length);
}

async function handleAuth(formId, endpoint) {
  const form = qs(formId);
  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    clearAlert();
    const payload = Object.fromEntries(new FormData(form));
    try {
      const result = await postJson(endpoint, payload);
      setAlert(`Bienvenue ${result.username}`, false);
      await refreshMenu();
    } catch (err) {
      setAlert(err.message);
    }
  });
}

function setupTabs() {
  const tabs = qsa('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      qsa('[data-panel]').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.panel !== target);
      });
    });
  });
}

function setupLogout() {
  logoutBtn.addEventListener('click', async () => {
    await postJson('/api/logout', {});
    await refreshMenu();
    setAlert('Session terminée', false);
  });
}

function setupMenuActions() {
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

function animateSuccess(message) {
  gsap.fromTo('#beam', { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: 'power2.out' });
  gsap.fromTo('#scanner', { xPercent: -100 }, { xPercent: 120, duration: 1.4, ease: 'power2.inOut' });
  gsap.fromTo('#pulse-line', { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 0', duration: 0.8, ease: 'expo.out' });
  log(message);
}

function log(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logPanel.prepend(entry);
  while (logPanel.children.length > 6) logPanel.removeChild(logPanel.lastChild);
}

function setupSimulator() {
  qs('#simulate-btn').addEventListener('click', () => animateSuccess('Simulation réussie : animation déclenchée.'));
}

async function init() {
  setupTabs();
  handleAuth('#login-form', '/api/login');
  handleAuth('#register-form', '/api/register');
  setupLogout();
  setupMenuActions();
  setupSimulator();
  await refreshMenu();
  log('Interface initialisée avec GSAP et Flask.');
}

function playSplashThenInit() {
  const splash = qs('#splash');
  const title = qs('#splash-title');
  const appShell = qs('#app-shell');

  if (!splash || !title || !appShell) {
    init();
    return;
  }

  const tl = gsap.timeline();
  tl.fromTo(title, { scale: 0.7, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 2.5, ease: 'expo.out' });
  tl.to(title, { scale: 1.35, duration: 2.5, ease: 'power2.inOut' }, 0);
  tl.fromTo('.splash__tagline', { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'sine.out' }, 0.6);

  setTimeout(() => {
    splash.classList.add('hidden');
    appShell.classList.remove('hidden');
    init();
  }, 5000);
}

document.addEventListener('DOMContentLoaded', playSplashThenInit);
