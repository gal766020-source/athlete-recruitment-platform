const express = require('express');
const { generateOutreachEmail, generateCoachOutreachEmail } = require('../services/aiService');
const { getCollegeByName } = require('../services/dataService');
const { requireAuth }      = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { athlete, school: schoolName, sender, coach } = req.body;

    if (!athlete || !athlete.name || typeof athlete.utr !== 'number') {
      return res.status(400).json({ error: 'athlete.name and athlete.utr are required' });
    }

    let result;
    if (sender === 'coach') {
      if (!coach) return res.status(400).json({ error: 'coach is required when sender is coach' });
      result = await generateCoachOutreachEmail(coach, athlete);
    } else {
      if (!schoolName) return res.status(400).json({ error: 'school is required' });
      const schoolRecord = getCollegeByName(schoolName) ?? { name: schoolName, division: 'N/A', location: 'N/A' };
      result = await generateOutreachEmail(athlete, schoolRecord);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
