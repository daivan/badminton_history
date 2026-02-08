const API = {
  players: '/api/players',
  matches: '/api/matches',
};

function setMessage(el, text, type = '') {
  const msg = document.getElementById(el);
  msg.textContent = text;
  msg.className = 'message' + (type ? ' ' + type : '');
}

function setTodayDate() {
  const dateInput = document.getElementById('match-date');
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

async function loadPlayers() {
  const res = await fetch(API.players);
  if (!res.ok) throw new Error('Failed to load players');
  const list = await res.json();
  const datalist = document.getElementById('players-list');
  datalist.innerHTML = list.map((p) => `<option value="${escapeHtml(p)}">`).join('');
  const ul = document.getElementById('players-ul');
  if (list.length === 0) {
    ul.innerHTML = '<li class="empty-hint">No players yet. Add one below.</li>';
  } else {
    ul.innerHTML = list.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  }
  return list;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function loadMatches() {
  const res = await fetch(API.matches);
  if (!res.ok) throw new Error('Failed to load matches');
  const matches = await res.json();
  const ul = document.getElementById('matches-ul');
  const recent = matches.slice(-15).reverse();
  if (recent.length === 0) {
    ul.innerHTML = '<li class="empty-hint">No matches recorded yet.</li>';
  } else {
    ul.innerHTML = recent.map((m) => {
      const date = m.date || m.submittedAt?.slice(0, 10) || '';
      return `<li data-match-id="${escapeHtml(m.id)}">
        <span class="match-row-info">
          <span>${escapeHtml(m.player1)} vs ${escapeHtml(m.player2)}</span>
          <span class="match-score">${m.score1} – ${m.score2}</span>
          <span class="match-date">${escapeHtml(date)}</span>
        </span>
        <span class="match-actions">
          <button type="button" class="btn btn-icon edit-match" title="Edit">Edit</button>
          <button type="button" class="btn btn-icon delete delete-match" title="Delete">Delete</button>
        </span>
      </li>`;
    }).join('');
    ul.querySelectorAll('.edit-match').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(btn.closest('li').dataset.matchId));
    });
    ul.querySelectorAll('.delete-match').forEach((btn) => {
      btn.addEventListener('click', () => deleteMatch(btn.closest('li').dataset.matchId));
    });
  }
  return matches;
}

function openEditModal(matchId) {
  fetch(API.matches)
    .then((r) => r.json())
    .then((matches) => {
      const m = matches.find((x) => x.id === matchId);
      if (!m) return;
      document.getElementById('edit-match-id').value = m.id;
      document.getElementById('edit-player1').value = m.player1;
      document.getElementById('edit-player2').value = m.player2;
      document.getElementById('edit-score1').value = m.score1;
      document.getElementById('edit-score2').value = m.score2;
      document.getElementById('edit-date').value = m.date || m.submittedAt?.slice(0, 10) || '';
      setMessage('edit-form-message', '');
      document.getElementById('edit-modal').hidden = false;
    });
}

function closeEditModal() {
  document.getElementById('edit-modal').hidden = true;
}

document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', closeEditModal);
});

document.getElementById('edit-match-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-match-id').value;
  const player1 = document.getElementById('edit-player1').value.trim();
  const player2 = document.getElementById('edit-player2').value.trim();
  const score1 = document.getElementById('edit-score1').value;
  const score2 = document.getElementById('edit-score2').value;
  const date = document.getElementById('edit-date').value;

  if (player1 === player2) {
    setMessage('edit-form-message', 'Choose two different players.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API.matches}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1, player2, score1, score2, date }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage('edit-form-message', data.error || 'Could not update match.', 'error');
      return;
    }
    setMessage('edit-form-message', 'Match updated.', 'success');
    closeEditModal();
    loadMatches();
    loadPlayers();
  } catch (err) {
    setMessage('edit-form-message', 'Network error. Is the server running?', 'error');
  }
});

async function deleteMatch(matchId) {
  if (!confirm('Delete this match?')) return;
  try {
    const res = await fetch(`${API.matches}/${matchId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage('form-message', data.error || 'Could not delete match.', 'error');
      return;
    }
    loadMatches();
  } catch (err) {
    setMessage('form-message', 'Network error. Is the server running?', 'error');
  }
}

document.getElementById('match-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const player1 = document.getElementById('player1').value.trim();
  const player2 = document.getElementById('player2').value.trim();
  const score1 = document.getElementById('score1').value;
  const score2 = document.getElementById('score2').value;
  const date = document.getElementById('match-date').value;

  if (player1 === player2) {
    setMessage('form-message', 'Choose two different players.', 'error');
    return;
  }

  try {
    const res = await fetch(API.matches, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1, player2, score1, score2, date }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage('form-message', data.error || 'Could not save match.', 'error');
      return;
    }
    setMessage('form-message', 'Match saved.', 'success');
    document.getElementById('player1').value = '';
    document.getElementById('player2').value = '';
    document.getElementById('score1').value = '0';
    document.getElementById('score2').value = '0';
    setTodayDate();
    loadPlayers();
    loadMatches();
  } catch (err) {
    setMessage('form-message', 'Network error. Is the server running?', 'error');
  }
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

setTodayDate();
loadPlayers();
loadMatches();
