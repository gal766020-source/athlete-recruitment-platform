const express = require('express');
const bcrypt = require('bcryptjs');
const { getUserByUsername, getUserById, createUser, getAthleteProfile, getCoachProfile, upsertCoachProfile } = require('../db/index');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, email, fullName, role, schoolName, division, position } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });
  if (username.length < 3 || username.length > 32)
    return res.status(400).json({ error: 'Username must be 3–32 characters' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!['athlete', 'coach'].includes(role))
    return res.status(400).json({ error: 'Role must be athlete or coach' });

  try {
    if (await getUserByUsername(username))
      return res.status(409).json({ error: 'Username already taken' });

    const userId = await createUser({ username, password, email, fullName, role });

    if (role === 'coach') {
      await upsertCoachProfile(userId, {
        school_name: schoolName || null,
        division:    division   || null,
        position:    position   || null,
      });
    }

    const token = signToken({ userId, username, role });
    res.status(201).json({ token, username, role });
  } catch (err) {
    console.error('[auth] register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  try {
    const user = await getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user.id, username: user.username, role: user.role || 'admin' });
    res.json({ token, username: user.username, role: user.role || 'admin' });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'athlete') profile = await getAthleteProfile(user.id);
    if (user.role === 'coach')   profile = await getCoachProfile(user.id);

    res.json({ ...user, profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
