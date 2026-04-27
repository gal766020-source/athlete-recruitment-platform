const express = require('express');
const { generateOutreachEmail } = require('../services/aiService');
const { getCollegeByName }      = require('../services/dataService');
const { requireAuth }           = require('../middleware/auth');

const router = express.Router();

function validateRequest(body) {
  const errors = [];
  if (!body.athlete)            errors.push('athlete is required');
  else {
    if (!body.athlete.name)           errors.push('athlete.name is required');
    if (typeof body.athlete.utr !== 'number') errors.push('athlete.utr is required');
    if (!body.athlete.nationality)    errors.push('athlete.nationality is required');
  }
  if (!body.school) errors.push('school is required');
  return errors;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const errors = validateRequest(req.body);
    if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

    const { athlete, school: schoolName } = req.body;
    const schoolRecord = getCollegeByName(schoolName) ?? { name: schoolName, division: 'N/A', location: 'N/A' };

    const { subject, body } = await generateOutreachEmail(athlete, schoolRecord);
    res.json({ subject, body });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
