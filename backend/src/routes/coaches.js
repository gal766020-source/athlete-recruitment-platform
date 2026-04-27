const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getCoachProfile, upsertCoachProfile, getUserById } = require('../db/index');

// GET /api/coaches/me
router.get('/me', requireAuth, (req, res) => {
  const user    = getUserById(req.user.userId);
  const profile = getCoachProfile(req.user.userId);
  res.json({ user, profile: profile ?? null });
});

// PUT /api/coaches/me
router.put('/me', requireAuth, (req, res) => {
  const { school_name, division, position } = req.body;
  upsertCoachProfile(req.user.userId, { school_name, division, position });
  const profile = getCoachProfile(req.user.userId);
  res.json({ profile });
});

module.exports = router;
