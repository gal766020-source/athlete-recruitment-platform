const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSearchHistory, getSearchById } = require('../db/index');

const router = express.Router();

// GET /api/history
router.get('/', requireAuth, async (req, res) => {
  try {
    const history = await getSearchHistory(req.user.userId, 30);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/history/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const search = await getSearchById(Number(req.params.id), req.user.userId);
    if (!search) return res.status(404).json({ error: 'Search not found' });
    res.json(search);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch search' });
  }
});

module.exports = router;
