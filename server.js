const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

// Ensure data directory and JSON files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PLAYERS_FILE)) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(MATCHES_FILE)) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify([], null, 2));
}

function readJson(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all players
app.get('/api/players', (req, res) => {
  try {
    const players = readJson(PLAYERS_FILE);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a player
app.post('/api/players', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    const players = readJson(PLAYERS_FILE);
    const trimmed = name.trim();
    if (players.includes(trimmed)) {
      return res.status(400).json({ error: 'Player already exists' });
    }
    players.push(trimmed);
    players.sort((a, b) => a.localeCompare(b));
    writeJson(PLAYERS_FILE, players);
    res.status(201).json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all matches
app.get('/api/matches', (req, res) => {
  try {
    const matches = readJson(MATCHES_FILE);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a match result
app.post('/api/matches', (req, res) => {
  try {
    const { player1, player2, score1, score2, date } = req.body;
    if (!player1 || !player2) {
      return res.status(400).json({ error: 'Both players are required' });
    }
    const s1 = Number(score1);
    const s2 = Number(score2);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
      return res.status(400).json({ error: 'Valid scores (numbers >= 0) are required' });
    }

    const match = {
      id: Date.now().toString(),
      player1: player1.trim(),
      player2: player2.trim(),
      score1: s1,
      score2: s2,
      date: date || new Date().toISOString().slice(0, 10),
      submittedAt: new Date().toISOString(),
    };

    const matches = readJson(MATCHES_FILE);
    matches.push(match);
    writeJson(MATCHES_FILE, matches);

    // Ensure both players exist in players list
    const players = readJson(PLAYERS_FILE);
    [match.player1, match.player2].forEach((p) => {
      if (!players.includes(p)) {
        players.push(p);
      }
    });
    players.sort((a, b) => a.localeCompare(b));
    writeJson(PLAYERS_FILE, players);

    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Badminton app running at http://localhost:${PORT}`);
});
