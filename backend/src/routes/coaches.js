const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getCoachProfile, upsertCoachProfile, getUserById } = require('../db/index');

// GET /api/coaches/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [user, profile] = await Promise.all([
      getUserById(req.user.userId),
      getCoachProfile(req.user.userId),
    ]);
    res.json({ user, profile: profile ?? null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coach profile' });
  }
});

// PUT /api/coaches/me
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { school_name, division, position } = req.body;
    await upsertCoachProfile(req.user.userId, { school_name, division, position });
    const profile = await getCoachProfile(req.user.userId);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coach profile' });
  }
});

module.exports = router;
