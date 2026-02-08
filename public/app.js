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

const OTHER_VALUE = '__other__';

function getPlayerValue(selectId, otherInputId) {
  const select = document.getElementById(selectId);
  const otherInput = document.getElementById(otherInputId);
  if (!select) return '';
  if (select.value === OTHER_VALUE) return otherInput ? otherInput.value.trim() : '';
  return select.value || '';
}

function setPlayerSelect(selectEl, otherInput, value) {
  if (!selectEl || !otherInput) return;
  const list = Array.from(selectEl.options).map((o) => o.value).filter((v) => v && v !== OTHER_VALUE);
  if (value && list.includes(value)) {
    selectEl.value = value;
    otherInput.setAttribute('hidden', '');
    otherInput.value = '';
  } else if (value) {
    selectEl.value = OTHER_VALUE;
    otherInput.removeAttribute('hidden');
    otherInput.value = value;
  } else {
    selectEl.value = '';
    otherInput.setAttribute('hidden', '');
    otherInput.value = '';
  }
}

function resetPlayerSelect(selectId, otherInputId) {
  const select = document.getElementById(selectId);
  const otherInput = document.getElementById(otherInputId);
  if (select) select.value = '';
  if (otherInput) {
    otherInput.setAttribute('hidden', '');
    otherInput.value = '';
  }
}

async function loadPlayers() {
  const res = await fetch(API.players);
  if (!res.ok) throw new Error('Failed to load players');
  const list = await res.json();

  const sel1 = document.getElementById('player1-select');
  const sel2 = document.getElementById('player2-select');
  if (sel1 && sel2) {
    const keep1 = getPlayerValue('player1-select', 'player1-other');
    const keep2 = getPlayerValue('player2-select', 'player2-other');

    const opts =
      '<option value="">Select player...</option>' +
      list.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('') +
      `<option value="${OTHER_VALUE}">Other (not in list)</option>`;
    sel1.innerHTML = opts;
    sel2.innerHTML = opts;

    setPlayerSelect(sel1, document.getElementById('player1-other'), keep1);
    setPlayerSelect(sel2, document.getElementById('player2-other'), keep2);
  }
  return list;
}

function setupPlayerSelectListeners() {
  [
    ['player1-select', 'player1-other'],
    ['player2-select', 'player2-other'],
    ['edit-player1-select', 'edit-player1-other'],
    ['edit-player2-select', 'edit-player2-other'],
  ].forEach(([selectId, otherId]) => {
    const select = document.getElementById(selectId);
    const otherInput = document.getElementById(otherId);
    if (!select || !otherInput) return;
    select.addEventListener('change', () => {
      if (select.value === OTHER_VALUE) {
        otherInput.removeAttribute('hidden');
        otherInput.value = '';
        otherInput.focus();
      } else {
        otherInput.setAttribute('hidden', '');
        otherInput.value = '';
      }
    });
  });
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
  Promise.all([fetch(API.players).then((r) => r.json()), fetch(API.matches).then((r) => r.json())]).then(
    ([players, matches]) => {
      const m = matches.find((x) => x.id === matchId);
      if (!m) return;
      document.getElementById('edit-match-id').value = m.id;
      document.getElementById('edit-score1').value = m.score1;
      document.getElementById('edit-score2').value = m.score2;
      document.getElementById('edit-date').value = m.date || m.submittedAt?.slice(0, 10) || '';

      const names = [...new Set([...players, m.player1, m.player2])].sort((a, b) => a.localeCompare(b));
      const opts =
        '<option value="">Select player...</option>' +
        names.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('') +
        `<option value="${OTHER_VALUE}">Other (not in list)</option>`;
      const editSel1 = document.getElementById('edit-player1-select');
      const editSel2 = document.getElementById('edit-player2-select');
      editSel1.innerHTML = opts;
      editSel2.innerHTML = opts;
      setPlayerSelect(editSel1, document.getElementById('edit-player1-other'), m.player1);
      setPlayerSelect(editSel2, document.getElementById('edit-player2-other'), m.player2);

      setMessage('edit-form-message', '');
      document.getElementById('edit-modal').hidden = false;
    }
  );
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
  const player1 = getPlayerValue('edit-player1-select', 'edit-player1-other');
  const player2 = getPlayerValue('edit-player2-select', 'edit-player2-other');
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
  const player1 = getPlayerValue('player1-select', 'player1-other');
  const player2 = getPlayerValue('player2-select', 'player2-other');
  const score1 = document.getElementById('score1').value;
  const score2 = document.getElementById('score2').value;
  const date = document.getElementById('match-date').value;

  if (!player1 || !player2) {
    setMessage('form-message', 'Select or enter both players.', 'error');
    return;
  }
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
    resetPlayerSelect('player1-select', 'player1-other');
    resetPlayerSelect('player2-select', 'player2-other');
    document.getElementById('score1').value = '0';
    document.getElementById('score2').value = '0';
    setTodayDate();
    loadPlayers();
    loadMatches();
  } catch (err) {
    setMessage('form-message', 'Network error. Is the server running?', 'error');
  }
});

setupPlayerSelectListeners();
setTodayDate();
loadPlayers();
loadMatches();
