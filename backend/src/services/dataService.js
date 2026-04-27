/**
 * Data Service
 *
 * Resolves college data. When COLLEGE_SCORECARD_API_KEY is set, enriches
 * local records with live tuition/SAT/acceptance data and caches results
 * in SQLite (7-day TTL). Falls back to hardcoded values on any failure.
 *
 * Tennis-specific fields (division, UTR benchmark) always come from the
 * local dataset — the federal API has no knowledge of athletic programs.
 */

const https = require('https');
const colleges = require('../data/colleges');
const { getCachedCollege, setCachedCollege } = require('../db/index');

const SCORECARD_BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

// ── Scorecard fetch ───────────────────────────────────────────────────────────

async function fetchScorecardData(schoolName) {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    'school.name': schoolName,
    fields: [
      'school.name',
      'latest.cost.tuition.out_of_state',
      'latest.admissions.sat_scores.midpoint.critical_reading',
      'latest.admissions.sat_scores.midpoint.math',
      'latest.admissions.admission_rate.overall',
    ].join(','),
    api_key: apiKey,
    per_page: 1,
  });

  return new Promise((resolve) => {
    https.get(`${SCORECARD_BASE}?${params}`, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const result = JSON.parse(raw)?.results?.[0];
          if (!result) return resolve(null);
          const crRead = result['latest.admissions.sat_scores.midpoint.critical_reading'];
          const crMath = result['latest.admissions.sat_scores.midpoint.math'];
          resolve({
            tuition:         result['latest.cost.tuition.out_of_state'] ?? null,
            acceptance_rate: result['latest.admissions.admission_rate.overall'] ?? null,
            sat_midpoint:    crRead && crMath ? crRead + crMath : null,
          });
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function enrichCollege(college) {
  // Try cache first
  const cached = getCachedCollege(college.id);
  if (cached) return { ...college, ...cached, _source: 'scorecard_cached' };

  // Fetch live
  const live = await fetchScorecardData(college.name);
  if (!live) return college;

  const enriched = {};
  if (live.tuition)         enriched.tuition = live.tuition;
  if (live.acceptance_rate) enriched.acceptance_rate = live.acceptance_rate;
  if (live.sat_midpoint) {
    const delta = 60;
    enriched.sat_min = Math.round(live.sat_midpoint - delta);
    enriched.sat_max = Math.round(live.sat_midpoint + delta);
  }

  setCachedCollege(college.id, enriched);
  return { ...college, ...enriched, _source: 'scorecard_live' };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function getColleges(filters = {}) {
  let pool = [...colleges];

  if (filters.division && filters.division.length > 0) {
    pool = pool.filter((c) => filters.division.includes(c.division));
  }

  // Enrich in parallel (cached after first run — stays fast)
  const enriched = await Promise.all(pool.map(enrichCollege));
  return enriched;
}

function getCollegeById(id) {
  return colleges.find((c) => c.id === id) ?? null;
}

function getCollegeByName(name) {
  const lower = name.toLowerCase();
  return colleges.find((c) => c.name.toLowerCase().includes(lower)) ?? null;
}

module.exports = { getColleges, getCollegeById, getCollegeByName };
