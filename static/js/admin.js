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
        <select class="role-select">
          ${Object.keys(ROLE_LABELS)
            .map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${ROLE_LABELS[role]}</option>`)
            .join('')}
        </select>
      </td>
      <td><button class="btn secondary save-role" type="button">Mettre à jour</button></td>
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
      adminTableBody.innerHTML = '<tr><td colspan="4" class="muted">Aucun compte enregistré pour le moment.</td></tr>';
      return;
    }
    adminTableBody.innerHTML = data.users
      .map((user) => renderAdminRow({ ...user, avatar_emoji: (window.AVATAR_EMOJIS || {})[user.avatar] }))
      .join('');
  } catch (err) {
    setAdminAlert(err.message);
  }
}

async function updateUserRole(userId, role, triggerBtn) {
  try {
    triggerBtn?.setAttribute('disabled', 'true');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Mise à jour impossible');
    }
    await refreshAdminUsers();
    setAdminAlert('Rôle mis à jour avec succès', false);
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
    if (!target.classList.contains('save-role')) return;
    const row = target.closest('tr');
    const select = row?.querySelector('.role-select');
    const userId = row?.dataset.userId;
    if (!select || !userId) return;
    clearAdminAlert();
    updateUserRole(userId, select.value, target);
  });
}

document.addEventListener('DOMContentLoaded', setupAdminPanel);
