const API = { matches: '/api/matches' };

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMatchDate(m) {
  return m.date || (m.submittedAt && m.submittedAt.slice(0, 10)) || '';
}

function getPlayerNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  return name ? decodeURIComponent(name) : '';
}

function renderPlayerDetail(playerName, matches) {
  const playerMatches = matches
    .filter((m) => m.player1 === playerName || m.player2 === playerName)
    .map((m) => ({ ...m, dateStr: getMatchDate(m) }))
    .sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));

  document.getElementById('player-page-title').textContent = playerName;
  document.getElementById('player-loading').hidden = true;
  document.getElementById('player-no-name').hidden = true;

  const sectionMatches = document.getElementById('section-matches');
  const sectionVs = document.getElementById('section-vs');
  const listEl = document.getElementById('player-detail-matches-list');
  const vsTable = document.getElementById('player-detail-vs-table');

  if (playerMatches.length === 0) {
    sectionMatches.hidden = false;
    sectionVs.hidden = true;
    listEl.innerHTML = '<p class="empty-hint">No matches recorded.</p>';
    return;
  }

  sectionMatches.hidden = false;
  sectionVs.hidden = false;

  listEl.innerHTML = `
    <table class="stats-table player-detail-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Opponent</th>
          <th>Score</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        ${playerMatches
          .map((m) => {
            const isP1 = m.player1 === playerName;
            const opponent = isP1 ? m.player2 : m.player1;
            const myScore = isP1 ? m.score1 : m.score2;
            const oppScore = isP1 ? m.score2 : m.score1;
            const won = Number(myScore) > Number(oppScore);
            return `
              <tr>
                <td>${escapeHtml(formatDate(m.dateStr))}</td>
                <td>${escapeHtml(opponent)}</td>
                <td>${myScore} – ${oppScore}</td>
                <td class="${won ? 'stats-wins' : 'stats-losses'}">${won ? 'W' : 'L'}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  const vsByOpponent = new Map();
  playerMatches.forEach((m) => {
    const isP1 = m.player1 === playerName;
    const opponent = isP1 ? m.player2 : m.player1;
    const myScore = Number(isP1 ? m.score1 : m.score2) || 0;
    const oppScore = Number(isP1 ? m.score2 : m.score1) || 0;
    if (!vsByOpponent.has(opponent)) {
      vsByOpponent.set(opponent, { name: opponent, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, dates: [] });
    }
    const v = vsByOpponent.get(opponent);
    v.pointsFor += myScore;
    v.pointsAgainst += oppScore;
    v.dates.push(m.dateStr);
    if (myScore > oppScore) v.wins += 1;
    else v.losses += 1;
  });

  const vsSorted = Array.from(vsByOpponent.values()).sort(
    (a, b) => b.wins - a.wins || b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst)
  );

  vsTable.innerHTML = `
    <table class="stats-table player-detail-table">
      <thead>
        <tr>
          <th>Opponent</th>
          <th>W</th>
          <th>L</th>
          <th>PF</th>
          <th>PA</th>
          <th>Diff</th>
          <th>Last played</th>
        </tr>
      </thead>
      <tbody>
        ${vsSorted
          .map((v) => {
            const lastDate = v.dates.length ? v.dates[v.dates.length - 1] : '';
            return `
          <tr>
            <td class="stats-player">${escapeHtml(v.name)}</td>
            <td class="stats-wins">${v.wins}</td>
            <td class="stats-losses">${v.losses}</td>
            <td>${v.pointsFor}</td>
            <td>${v.pointsAgainst}</td>
            <td class="stats-diff">${v.pointsFor - v.pointsAgainst >= 0 ? '+' : ''}${v.pointsFor - v.pointsAgainst}</td>
            <td>${escapeHtml(formatDate(lastDate))} <span class="text-muted">(${v.dates.length})</span></td>
          </tr>
        `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function init() {
  const playerName = getPlayerNameFromUrl();

  if (!playerName.trim()) {
    document.getElementById('player-loading').hidden = true;
    document.getElementById('player-no-name').hidden = false;
    return;
  }

  fetch(API.matches)
    .then((r) => r.json())
    .then((matches) => renderPlayerDetail(playerName, matches))
    .catch(() => {
      document.getElementById('player-loading').textContent = 'Could not load matches.';
    });
}

init();
