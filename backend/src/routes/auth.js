const express = require('express');
const bcrypt = require('bcryptjs');
const { getUserByUsername, getUserById, createUser, getAthleteProfile, getCoachProfile } = require('../db/index');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, email, fullName, role, schoolName, division, position } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'Username must be 3–32 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!['athlete', 'coach'].includes(role)) {
    return res.status(400).json({ error: 'Role must be athlete or coach' });
  }
  if (getUserByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  try {
    const userId = createUser({ username, password, email, fullName, role });

    // Create empty coach profile if registering as coach
    if (role === 'coach') {
      const { upsertCoachProfile } = require('../db/index');
      upsertCoachProfile(userId, {
        school_name: schoolName || null,
        division:    division   || null,
        position:    position   || null,
      });
    }

    const token = signToken({ userId, username, role });
    res.status(201).json({ token, username, role });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role || 'admin' });
  res.json({ token, username: user.username, role: user.role || 'admin' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = null;
  if (user.role === 'athlete') profile = getAthleteProfile(user.id);
  if (user.role === 'coach')   profile = getCoachProfile(user.id);

  res.json({ ...user, profile });
});

module.exports = router;
