const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const authAlert = qs('#auth-alert');

function setAlert(message, isError = true) {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.classList.remove('hidden');
  authAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function clearAlert() {
  if (authAlert) authAlert.classList.add('hidden');
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

function setupAvatarPicker() {
  const chips = qsa('.avatar-chip');
  const hidden = qs('#avatar-choice');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (hidden) hidden.value = chip.dataset.avatar;
    });
  });
}

function persistAuthState() {
  localStorage.setItem('isAuthenticated', 'true');
}

async function handleAuth(formId, endpoint) {
  const form = qs(formId);
  if (!form) return;
  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    clearAlert();
    const payload = Object.fromEntries(new FormData(form));
    try {
      await postJson(endpoint, payload);
      persistAuthState();
      setAlert('Connexion réussie, redirection en cours…', false);
      window.location.href = '/';
    } catch (err) {
      setAlert(err.message);
    }
  });
}

async function ensureLoggedOut() {
  try {
    const profile = await fetch('/api/profile').then((r) => r.json());
    if (profile && profile.username) {
      window.location.href = '/';
    }
  } catch (err) {
    console.error('Impossible de vérifier la session', err);
  }
}

function playSplashThenInit() {
  const splash = qs('#splash');
  const title = qs('#splash-title');
  const shell = qs('#auth-shell');

  if (localStorage.getItem('isAuthenticated') === 'true') {
    splash?.classList.add('hidden');
    shell?.classList.remove('hidden');
    init();
    return;
  }

  if (!splash || !title || !shell) {
    init();
    return;
  }

  const tl = gsap.timeline();
  tl.fromTo(title, { scale: 0.7, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 2.5, ease: 'expo.out' });
  tl.to(title, { scale: 1.35, duration: 2.5, ease: 'power2.inOut' }, 0);
  tl.fromTo('.splash__tagline', { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'sine.out' }, 0.6);

  setTimeout(() => {
    splash.classList.add('hidden');
    shell.classList.remove('hidden');
    init();
  }, 4000);
}

async function init() {
  setupTabs();
  setupAvatarPicker();
  handleAuth('#login-form', '/api/login');
  handleAuth('#register-form', '/api/register');
  await ensureLoggedOut();
}

document.addEventListener('DOMContentLoaded', playSplashThenInit);
