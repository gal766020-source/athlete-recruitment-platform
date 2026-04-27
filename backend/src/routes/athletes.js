const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAthleteProfile,
  getAthleteProfileByUsername,
  upsertAthleteProfile,
  searchAthletes,
  getUserById,
} = require('../db/index');
const { normalizePlayer } = require('../services/normalizationService');

const PSS_ELITE = 0.80;
const PSS_HIGH  = 0.55;
function getTier(pss) {
  if (pss >= PSS_ELITE) return 'Elite';
  if (pss >= PSS_HIGH)  return 'High';
  return 'Emerging';
}

function buildRoadmap(utr, matches) {
  if (!matches || matches.length === 0) return null;

  // Find schools just out of reach (UTR gap between 0.5–2.0)
  const reachable = matches
    .filter((m) => m.tennis_utr_benchmark > utr && m.tennis_utr_benchmark - utr <= 2.0)
    .sort((a, b) => a.tennis_utr_benchmark - b.tennis_utr_benchmark)
    .slice(0, 3);

  if (reachable.length === 0) return null;

  return reachable.map((m) => ({
    school:    m.school,
    division:  m.division,
    gap:       parseFloat((m.tennis_utr_benchmark - utr).toFixed(1)),
    benchmark: m.tennis_utr_benchmark,
  }));
}

// GET /api/athletes/me — athlete views/refreshes own profile
router.get('/me', requireAuth, (req, res) => {
  const profile = getAthleteProfile(req.user.userId);
  const user = getUserById(req.user.userId);
  if (!profile) return res.json({ profile: null, user });

  const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
  return res.json({
    user,
    profile: {
      ...profile,
      player_strength_score:    score,
      normalization_components: components,
      recruitment_tier:         getTier(score),
    },
  });
});

// PUT /api/athletes/me — athlete updates own profile
router.put('/me', requireAuth, (req, res) => {
  const { age, nationality, utr, itf_rank, atp_rank, gpa, sat, graduation_year, video_url, bio, is_public } = req.body;

  if (utr != null && (utr < 1 || utr > 16)) {
    return res.status(400).json({ error: 'UTR must be 1–16' });
  }

  upsertAthleteProfile(req.user.userId, {
    age:             age ?? null,
    nationality:     nationality ?? null,
    utr:             utr ?? null,
    itf_rank:        itf_rank ?? null,
    atp_rank:        atp_rank ?? null,
    gpa:             gpa ?? null,
    sat:             sat ?? null,
    graduation_year: graduation_year ?? null,
    video_url:       video_url ?? null,
    bio:             bio ?? null,
    is_public:       is_public != null ? (is_public ? 1 : 0) : 1,
  });

  const profile = getAthleteProfile(req.user.userId);
  const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
  res.json({
    profile: { ...profile, player_strength_score: score, normalization_components: components, recruitment_tier: getTier(score) },
  });
});

// GET /api/athletes/search — coach searches athletes
router.get('/search', ...requireRole('coach', 'admin'), (req, res) => {
  const { utr_min, utr_max, nationality, grad_year, tier, search, limit } = req.query;
  const results = searchAthletes({
    utrMin: utr_min, utrMax: utr_max, nationality, gradYear: grad_year,
    tier, search, limit: limit ?? 50,
  });
  res.json({ athletes: results, total: results.length });
});

// GET /api/athletes/public/:username — public shareable profile (no auth)
router.get('/public/:username', (req, res) => {
  const profile = getAthleteProfileByUsername(req.params.username);
  if (!profile) return res.status(404).json({ error: 'Profile not found or set to private' });

  const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
  res.json({
    ...profile,
    player_strength_score:    score,
    normalization_components: components,
    recruitment_tier:         getTier(score),
  });
});

module.exports = router;
