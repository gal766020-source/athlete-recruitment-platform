const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSearchHistory, getSearchById } = require('../db/index');

const router = express.Router();

// GET /api/history
router.get('/', requireAuth, (req, res) => {
  const history = getSearchHistory(req.user.userId, 30);
  res.json({ history });
});

// GET /api/history/:id
router.get('/:id', requireAuth, (req, res) => {
  const search = getSearchById(Number(req.params.id), req.user.userId);
  if (!search) return res.status(404).json({ error: 'Search not found' });
  res.json(search);
});

module.exports = router;
