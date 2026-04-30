const express = require('express');
const { normalizePlayer }    = require('../services/normalizationService');
const { scoreMatch }         = require('../services/scoringEngine');
const { getColleges }        = require('../services/dataService');
const { generateReasoning }  = require('../services/aiService');
const { requireAuth }        = require('../middleware/auth');
const { saveSearch }         = require('../db/index');

const PSS_ELITE = 0.80;
const PSS_HIGH  = 0.55;
function getRecruitmentTier(pss) {
  if (pss >= PSS_ELITE) return 'Elite';
  if (pss >= PSS_HIGH)  return 'High';
  return 'Emerging';
}

const router = express.Router();

function validateRequest(body) {
  const errors = [];
  const { athlete_profile, preferences } = body;
  if (!athlete_profile) { errors.push('athlete_profile is required'); return errors; }
  if (!athlete_profile.name)                                              errors.push('athlete_profile.name is required');
  if (typeof athlete_profile.age !== 'number' || athlete_profile.age <= 0) errors.push('athlete_profile.age must be a positive number');
  if (typeof athlete_profile.utr !== 'number' || athlete_profile.utr < 1 || athlete_profile.utr > 16) errors.push('athlete_profile.utr must be 1–16');
  if (!athlete_profile.nationality)                                        errors.push('athlete_profile.nationality is required');
  if (!preferences)                                                        errors.push('preferences is required');
  else if (typeof preferences.max_tuition !== 'number' || preferences.max_tuition <= 0) errors.push('preferences.max_tuition must be a positive number');
  return errors;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const errors = validateRequest(req.body);
    if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });

    const { athlete_profile: athlete, preferences } = req.body;

    const { score: playerStrengthScore, components } = normalizePlayer(
      athlete.utr, athlete.itf_rank ?? null, athlete.atp_rank ?? null
    );

    const colleges = await getColleges({ division: preferences.division ?? [] });

    const scored = colleges
      .map((school) => scoreMatch(athlete, playerStrengthScore, school, preferences))
      .sort((a, b) => b.fitScore - a.fitScore);

    const TOP_N = 10;
    const withReasoning = await Promise.all(
      scored.slice(0, TOP_N).map(async ({ school, fitScore, category, scholarshipProbability, subScores }) => {
        const reasoning = await generateReasoning(athlete, school, subScores, fitScore);
        return {
          school:                  school.name,
          school_id:               school.id,
          division:                school.division,
          location:                school.location,
          tuition:                 school.tuition,
          acceptance_rate:         school.acceptance_rate,
          tennis_utr_benchmark:    school.tennis_utr_benchmark,
          fit_score:               fitScore,
          category,
          scholarship_probability: scholarshipProbability,
          reasoning,
          sub_scores:              subScores,
          data_source:             school._source ?? 'local',
        };
      })
    );

    // Persist to DB
    const searchId = await saveSearch({
      userId:              req.user.userId,
      athlete,
      preferences,
      results:             withReasoning,
      playerStrengthScore,
    });

    // UTR improvement roadmap — schools just out of reach
    const roadmap = scored
      .filter((s) => s.school.tennis_utr_benchmark > athlete.utr &&
                     s.school.tennis_utr_benchmark - athlete.utr <= 2.0)
      .sort((a, b) => a.school.tennis_utr_benchmark - b.school.tennis_utr_benchmark)
      .slice(0, 3)
      .map((s) => ({
        school:    s.school.name,
        division:  s.school.division,
        benchmark: s.school.tennis_utr_benchmark,
        gap:       parseFloat((s.school.tennis_utr_benchmark - athlete.utr).toFixed(1)),
      }));

    res.json({
      search_id:                searchId,
      player_strength_score:    playerStrengthScore,
      recruitment_tier:         getRecruitmentTier(playerStrengthScore),
      normalization_components: components,
      matches:                  withReasoning,
      utr_roadmap:              roadmap,
      fetched_at:               new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
