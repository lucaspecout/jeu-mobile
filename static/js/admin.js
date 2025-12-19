const adminTableBody = document.querySelector('#admin-users-body');
const adminAlert = document.querySelector('#admin-alert');
const ROLE_LABELS = {
  participant: 'Participant',
  formateur: 'Formateur',
  admin: 'Admin',
};

function setAdminAlert(message, isError = true) {
  if (!adminAlert) return;
  adminAlert.textContent = message;
  adminAlert.classList.remove('hidden');
  adminAlert.style.background = isError ? 'rgba(255,63,171,0.12)' : 'rgba(58,242,255,0.15)';
}

function clearAdminAlert() {
  if (adminAlert) adminAlert.classList.add('hidden');
}

function renderAdminRow(user) {
  return `
    <tr data-user-id="${user.id}">
      <td class="scoreboard__user">
        <span class="avatar" data-avatar="${user.avatar}">${user.avatar_emoji || '🛰️'}</span>
        <span>${user.username}</span>
      </td>
      <td>${user.email}</td>
      <td>
        <input class="score-input" type="number" value="${user.total_score || 0}" placeholder="Score" style="width: 100px; font-weight: bold; color: var(--primary);" aria-label="Score Total">
      </td>
      <td>
        <select class="role-select">
          ${Object.keys(ROLE_LABELS)
      .map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${ROLE_LABELS[role]}</option>`)
      .join('')}
        </select>
      </td>
      <td>
        <input class="password-input" type="password" placeholder="Nouveau mot de passe" minlength="8" aria-label="Nouveau mot de passe">
      </td>
      <td class="admin-actions">
        <button class="btn secondary save-role" type="button">Sauvegarder</button>
        <button class="btn danger delete-user" type="button">Supprimer</button>
      </td>
    </tr>
  `;
}

async function refreshAdminUsers() {
  if (!adminTableBody) return;
  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Impossible de charger les utilisateurs');
    }
    const data = await res.json();
    if (!data.users.length) {
      adminTableBody.innerHTML = '<tr><td colspan="5" class="muted">Aucun compte enregistré pour le moment.</td></tr>';
      return;
    }
    adminTableBody.innerHTML = data.users
      .map((user) => renderAdminRow({ ...user, avatar_emoji: (window.AVATAR_EMOJIS || {})[user.avatar] }))
      .join('');
  } catch (err) {
    setAdminAlert(err.message);
  }
}

async function updateUser(userId, role, password, totalScore, triggerBtn) {
  try {
    triggerBtn?.setAttribute('disabled', 'true');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, password, total_score: parseInt(totalScore) || 0 }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Mise à jour impossible');
    }
    await refreshAdminUsers();
    setAdminAlert('Informations mises à jour', false);
  } catch (err) {
    setAdminAlert(err.message);
  } finally {
    triggerBtn?.removeAttribute('disabled');
  }
}

async function deleteUser(userId, triggerBtn) {
  const confirmed = window.confirm('Supprimer ce compte ?');
  if (!confirmed) return;
  try {
    triggerBtn?.setAttribute('disabled', 'true');
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Suppression impossible');
    }
    await refreshAdminUsers();
    setAdminAlert('Compte supprimé', false);
  } catch (err) {
    setAdminAlert(err.message);
  } finally {
    triggerBtn?.removeAttribute('disabled');
  }
}

function setupAdminPanel() {
  if (!adminTableBody) return;
  refreshAdminUsers();

  adminTableBody.addEventListener('click', (evt) => {
    const target = evt.target;
    if (target.classList.contains('save-role')) {
      const row = target.closest('tr');
      const select = row?.querySelector('.role-select');
      const passwordInput = row?.querySelector('.password-input');
      const scoreInput = row?.querySelector('.score-input');
      const userId = row?.dataset.userId;
      if (!select || !userId) return;
      clearAdminAlert();
      updateUser(userId, select.value, passwordInput?.value, scoreInput?.value, target);
      if (passwordInput) passwordInput.value = '';
    }

    if (target.classList.contains('delete-user')) {
      const row = target.closest('tr');
      const userId = row?.dataset.userId;
      if (!userId) return;
      clearAdminAlert();
      deleteUser(userId, target);
    }
  });
}

document.addEventListener('DOMContentLoaded', setupAdminPanel);
