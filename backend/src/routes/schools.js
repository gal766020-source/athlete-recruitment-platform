const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const colleges = require('../data/colleges');

// GET /api/schools — list all colleges with optional filters
router.get('/', requireAuth, (req, res) => {
  const { division, location, search } = req.query;
  let list = [...colleges];

  if (division) {
    list = list.filter((c) => c.division === division);
  }
  if (location) {
    list = list.filter((c) => c.location.toLowerCase() === location.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
  }

  res.json({ schools: list, total: list.length });
});

// GET /api/schools/:id — single school
router.get('/:id', requireAuth, (req, res) => {
  const school = colleges.find((c) => c.id === req.params.id);
  if (!school) return res.status(404).json({ error: 'School not found' });
  res.json(school);
});

module.exports = router;
