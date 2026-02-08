const API = { players: '/api/players' };

function setMessage(el, text, type = '') {
  const msg = document.getElementById(el);
  if (!msg) return;
  msg.textContent = text;
  msg.className = 'message' + (type ? ' ' + type : '');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function loadPlayers() {
  const res = await fetch(API.players);
  if (!res.ok) throw new Error('Failed to load players');
  const list = await res.json();
  const ul = document.getElementById('players-ul');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-hint">No players yet. Add one above.</li>';
  } else {
    ul.innerHTML = list.map((name, index) => `
      <li data-player-index="${index}">
        <span class="player-name">${escapeHtml(name)}</span>
        <span class="match-actions">
          <button type="button" class="btn btn-icon edit-player" title="Edit">Edit</button>
          <button type="button" class="btn btn-icon delete delete-player" title="Delete">Delete</button>
        </span>
      </li>
    `).join('');
    ul.querySelectorAll('.edit-player').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.closest('li').dataset.playerIndex, 10)));
    });
    ul.querySelectorAll('.delete-player').forEach((btn) => {
      btn.addEventListener('click', () => deletePlayer(parseInt(btn.closest('li').dataset.playerIndex, 10)));
    });
  }
  return list;
}

function openEditModal(index) {
  fetch(API.players)
    .then((r) => r.json())
    .then((players) => {
      if (index < 0 || index >= players.length) return;
      document.getElementById('edit-player-index').value = index;
      document.getElementById('edit-player-name').value = players[index];
      setMessage('edit-player-message', '');
      document.getElementById('edit-player-modal').hidden = false;
    });
}

function closeEditModal() {
  document.getElementById('edit-player-modal').hidden = true;
}

document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', closeEditModal);
});

document.getElementById('player-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('new-player');
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetch(API.players, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage('player-message', data.error || 'Could not add player.', 'error');
      return;
    }
    setMessage('player-message', 'Player added.', 'success');
    input.value = '';
    loadPlayers();
  } catch (err) {
    setMessage('player-message', 'Network error. Is the server running?', 'error');
  }
});

document.getElementById('edit-player-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const index = document.getElementById('edit-player-index').value;
  const name = document.getElementById('edit-player-name').value.trim();
  if (!name) return;

  try {
    const res = await fetch(`${API.players}/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage('edit-player-message', data.error || 'Could not update player.', 'error');
      return;
    }
    setMessage('edit-player-message', 'Player updated.', 'success');
    closeEditModal();
    loadPlayers();
  } catch (err) {
    setMessage('edit-player-message', 'Network error. Is the server running?', 'error');
  }
});

async function deletePlayer(index) {
  if (!confirm('Delete this player? Their name will still appear in past matches.')) return;
  try {
    const res = await fetch(`${API.players}/${index}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage('player-message', data.error || 'Could not delete player.', 'error');
      return;
    }
    loadPlayers();
  } catch (err) {
    setMessage('player-message', 'Network error. Is the server running?', 'error');
  }
}

loadPlayers();
