const express = require('express');
const { requireAuth } = require('../middleware/auth');
const itfPlayers = require('../data/itfPlayers');

const router = express.Router();

// GET /api/itf?gender=boys|girls|all&nationality=France&search=ivan&limit=100
router.get('/', requireAuth, (req, res) => {
  const { gender, nationality, search, limit = '200' } = req.query;

  let results = [...itfPlayers];

  if (gender && gender !== 'all') {
    results = results.filter((p) => p.gender === gender);
  }
  if (nationality) {
    const lower = nationality.toLowerCase();
    results = results.filter((p) => p.nationality.toLowerCase().includes(lower));
  }
  if (search) {
    const lower = search.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.nationality.toLowerCase().includes(lower)
    );
  }

  results = results.slice(0, parseInt(limit, 10));

  res.json({ players: results, total: results.length, ranking_date: '2026-04-13' });
});

module.exports = router;
