const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const players = require('../data/players');
const { normalizePlayer } = require('../services/normalizationService');

const PSS_ELITE = 0.80;
const PSS_HIGH  = 0.55;

function getRecruitmentTier(pss) {
  if (pss >= PSS_ELITE) return 'Elite';
  if (pss >= PSS_HIGH)  return 'High';
  return 'Emerging';
}

function enrichPlayer(p) {
  const { score, components } = normalizePlayer(p.utr, p.itf_rank, p.atp_rank);
  return {
    ...p,
    player_strength_score: score,
    normalization_components: components,
    recruitment_tier: getRecruitmentTier(score),
  };
}

// GET /api/players — list all with computed PSS + tier
router.get('/', requireAuth, (req, res) => {
  const { tier, nationality, search } = req.query;
  let list = players.map(enrichPlayer);

  if (tier) {
    list = list.filter((p) => p.recruitment_tier === tier);
  }
  if (nationality) {
    list = list.filter((p) => p.nationality.toLowerCase() === nationality.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.nationality.toLowerCase().includes(q));
  }

  res.json({ players: list, total: list.length });
});

// GET /api/players/:id — single player detail
router.get('/:id', requireAuth, (req, res) => {
  const player = players.find((p) => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(enrichPlayer(player));
});

module.exports = router;
