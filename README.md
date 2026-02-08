# Veckospel – Badminton app

Select two players, enter their match result, and save it. Data is stored in JSON files so you can parse it later.

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser.

## Data files

- **`data/players.json`** – Array of player names (strings).
- **`data/matches.json`** – Array of match objects, e.g.:

```json
{
  "id": "1739020800000",
  "player1": "Anna",
  "player2": "Erik",
  "score1": 21,
  "score2": 19,
  "date": "2025-02-08",
  "submittedAt": "2025-02-08T12:00:00.000Z"
}
```

You can read these files with any script or tool to analyze results, standings, or history.

## Usage

1. **Add players** (optional) – Use “Add player” to build a list. You can also type any name when recording a match; new names are added automatically.
2. **Record match** – Choose or type Player 1 and Player 2, enter scores, set the date, then click “Save result”.
3. **Recent matches** – The last matches are shown on the page; full history is in `data/matches.json`.
