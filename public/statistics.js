const API = { matches: '/api/matches' };

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computePlayerStats(matches) {
  const byPlayer = new Map();
  matches.forEach((m) => {
    const p1 = m.player1;
    const p2 = m.player2;
    const s1 = Number(m.score1) || 0;
    const s2 = Number(m.score2) || 0;
    if (!byPlayer.has(p1)) byPlayer.set(p1, { name: p1, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    if (!byPlayer.has(p2)) byPlayer.set(p2, { name: p2, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    const stat1 = byPlayer.get(p1);
    const stat2 = byPlayer.get(p2);
    stat1.pointsFor += s1;
    stat1.pointsAgainst += s2;
    stat2.pointsFor += s2;
    stat2.pointsAgainst += s1;
    if (s1 > s2) {
      stat1.wins += 1;
      stat2.losses += 1;
    } else if (s2 > s1) {
      stat2.wins += 1;
      stat1.losses += 1;
    }
  });
  return Array.from(byPlayer.values())
    .map((s) => ({ ...s, pointsDiff: s.pointsFor - s.pointsAgainst }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointsDiff - a.pointsDiff;
    });
}

function loadAllTimeStats() {
  const hint = document.getElementById('alltime-stats-hint');
  const wrapper = document.getElementById('alltime-stats-table-wrapper');
  const tbody = document.getElementById('alltime-stats-tbody');
  if (!hint || !wrapper || !tbody) return;

  fetch(API.matches)
    .then((r) => r.json())
    .then((matches) => {
      const stats = computePlayerStats(matches);
      if (stats.length === 0) {
        hint.hidden = false;
        wrapper.hidden = true;
      } else {
        hint.hidden = true;
        wrapper.hidden = false;
        tbody.innerHTML = stats
          .map(
            (s) => `
          <tr>
            <td class="stats-player">
              <a href="player.html?name=${encodeURIComponent(s.name)}" class="stats-player-link">${escapeHtml(s.name)}</a>
            </td>
            <td class="stats-wins">${s.wins}</td>
            <td class="stats-losses">${s.losses}</td>
            <td>${s.pointsFor}</td>
            <td>${s.pointsAgainst}</td>
            <td class="stats-diff">${s.pointsDiff >= 0 ? '+' : ''}${s.pointsDiff}</td>
          </tr>
        `
          )
          .join('');
      }
    })
    .catch(() => {
      hint.textContent = 'Could not load matches.';
      hint.hidden = false;
      wrapper.hidden = true;
    });
}

loadAllTimeStats();
