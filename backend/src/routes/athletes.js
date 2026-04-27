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

// GET /api/athletes/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [profile, user] = await Promise.all([
      getAthleteProfile(req.user.userId),
      getUserById(req.user.userId),
    ]);
    if (!profile) return res.json({ profile: null, user });

    const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
    res.json({
      user,
      profile: {
        ...profile,
        player_strength_score:    score,
        normalization_components: components,
        recruitment_tier:         getTier(score),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/athletes/me
router.put('/me', requireAuth, async (req, res) => {
  const { age, nationality, utr, itf_rank, atp_rank, gpa, sat, graduation_year, video_url, bio, is_public } = req.body;

  if (utr != null && (utr < 1 || utr > 16))
    return res.status(400).json({ error: 'UTR must be 1–16' });

  try {
    await upsertAthleteProfile(req.user.userId, {
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

    const profile = await getAthleteProfile(req.user.userId);
    const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
    res.json({
      profile: { ...profile, player_strength_score: score, normalization_components: components, recruitment_tier: getTier(score) },
    });
  } catch (err) {
    console.error('[athletes] upsert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/athletes/search
router.get('/search', ...requireRole('coach', 'admin'), async (req, res) => {
  try {
    const { utr_min, utr_max, nationality, grad_year, tier, search, limit } = req.query;
    const results = await searchAthletes({
      utrMin: utr_min, utrMax: utr_max, nationality, gradYear: grad_year,
      tier, search, limit: limit ?? 50,
    });
    res.json({ athletes: results, total: results.length });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/athletes/public/:username
router.get('/public/:username', async (req, res) => {
  try {
    const profile = await getAthleteProfileByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'Profile not found or set to private' });

    const { score, components } = normalizePlayer(profile.utr, profile.itf_rank, profile.atp_rank);
    res.json({
      ...profile,
      player_strength_score:    score,
      normalization_components: components,
      recruitment_tier:         getTier(score),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

module.exports = router;
