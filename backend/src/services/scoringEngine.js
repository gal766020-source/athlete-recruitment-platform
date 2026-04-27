/**
 * Scoring Engine
 *
 * Produces a deterministic Fit Score (0–100) for a player–school pairing.
 *
 * Formula:
 *   Fit Score = (Athletic Match × 0.4) + (Academic Match × 0.3)
 *             + (Affordability × 0.2)  + (Division Fit × 0.1)
 *
 * All sub-scores are computed on a [0, 1] scale before the weighted sum.
 *
 * Category thresholds:
 *   ≥ 85  → Target
 *   70–84 → Reach
 *   < 70  → Safety
 */

const UTR_MAX = 16;

/**
 * Athletic match: how well the player's strength compares to the school's
 * expected roster UTR benchmark.
 *
 * Being at or above the benchmark scores highest. Being below penalizes
 * more steeply because the player may not make the roster.
 */
function calcAthleticMatch(playerStrengthScore, school) {
  const benchmarkNorm = Math.min(1, school.tennis_utr_benchmark / UTR_MAX);
  const delta = playerStrengthScore - benchmarkNorm;

  let score;
  if (delta >= 0) {
    // Player meets or exceeds benchmark — slight discount for being overqualified
    score = Math.max(0.6, 1 - delta * 0.4);
  } else {
    // Player is below benchmark — penalize proportionally
    score = Math.max(0, 1 + delta * 3.5);
  }
  return parseFloat(score.toFixed(4));
}

/**
 * Academic match: GPA and SAT proximity to the school's academic profile.
 * Missing credentials default to a neutral 0.5 per dimension.
 */
function calcAcademicMatch(athlete, school) {
  // ── GPA component ──────────────────────────────────────────────────────────
  let gpaScore = 0.5;
  if (athlete.gpa != null) {
    const diff = athlete.gpa - school.gpa_min;
    if (diff >= 0) {
      gpaScore = Math.min(1.0, 0.75 + diff * 0.5);
    } else {
      gpaScore = Math.max(0, 0.75 + diff * 2.0);
    }
  }

  // ── SAT component ──────────────────────────────────────────────────────────
  let satScore = 0.5;
  if (athlete.sat != null) {
    const mid = (school.sat_min + school.sat_max) / 2;
    const range = school.sat_max - school.sat_min;
    const diff = athlete.sat - mid;

    if (diff >= 0) {
      // Above midpoint
      satScore = Math.min(1.0, 0.75 + (diff / range) * 0.5);
    } else if (athlete.sat >= school.sat_min) {
      // Within range, below midpoint
      satScore = 0.5 + (diff / range) * 0.5;
    } else {
      // Below minimum
      const deficit = school.sat_min - athlete.sat;
      satScore = Math.max(0, 0.5 - deficit / 300);
    }
  }

  return parseFloat(((gpaScore + satScore) / 2).toFixed(4));
}

/**
 * Affordability: how well the school's tuition fits within the stated budget.
 * If tuition ≤ max_tuition → full score. Penalizes linearly above that.
 */
function calcAffordability(school, maxTuition) {
  if (school.tuition <= maxTuition) return 1.0;
  const excess = school.tuition - maxTuition;
  const score = Math.max(0, 1 - excess / maxTuition);
  return parseFloat(score.toFixed(4));
}

/**
 * Division fit: whether the school's division aligns with the player's
 * expressed preference. Full score for a match; partial credit otherwise.
 */
function calcDivisionFit(school, preferredDivisions) {
  if (!preferredDivisions || preferredDivisions.length === 0) return 0.8;
  return preferredDivisions.includes(school.division) ? 1.0 : 0.2;
}

/**
 * Scholarship probability heuristic.
 * D1: merit-based athletic scholarships (full/partial)
 * D2: partial athletic scholarships
 * D3: academic/merit aid only (no athletic scholarships)
 */
function calcScholarshipProbability(athleticMatch, academicMatch, division) {
  const divisonFactor = { D1: 0.80, D2: 0.65, D3: 0.45 }[division] ?? 0.5;
  const base = athleticMatch * 0.65 + academicMatch * 0.35;
  return parseFloat(Math.min(0.92, base * divisonFactor).toFixed(3));
}

/**
 * Categorize a fit score.
 * @param {number} score - 0–100
 * @returns {"Target"|"Reach"|"Safety"}
 */
function categorize(score) {
  if (score >= 85) return 'Target';
  if (score >= 70) return 'Reach';
  return 'Safety';
}

/**
 * Score a single athlete–school pairing.
 *
 * @param {object} athlete           - Raw athlete profile
 * @param {number} playerStrengthScore - Normalized 0–1 score from normalizationService
 * @param {object} school            - College record from colleges dataset
 * @param {object} preferences       - User preferences (division[], locations[], max_tuition)
 * @returns {object} Scored result with sub-scores
 */
function scoreMatch(athlete, playerStrengthScore, school, preferences) {
  const athleticMatch = calcAthleticMatch(playerStrengthScore, school);
  const academicMatch = calcAcademicMatch(athlete, school);
  const affordability = calcAffordability(school, preferences.max_tuition);
  const divisionFit = calcDivisionFit(school, preferences.division);

  const rawScore =
    athleticMatch * 0.4 +
    academicMatch * 0.3 +
    affordability * 0.2 +
    divisionFit * 0.1;

  const fitScore = parseFloat((rawScore * 100).toFixed(1));
  const category = categorize(fitScore);
  const scholarshipProbability = calcScholarshipProbability(
    athleticMatch,
    academicMatch,
    school.division
  );

  return {
    school,
    fitScore,
    category,
    scholarshipProbability,
    subScores: {
      athleticMatch,
      academicMatch,
      affordability,
      divisionFit,
    },
  };
}

module.exports = { scoreMatch, categorize };
