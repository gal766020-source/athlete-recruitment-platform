const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
}

async function connectDb() {
  const p = getPool();
  await initSchema(p);
  await seedAdmin(p);
  console.log('[db] PostgreSQL connected');
}

async function initSchema(p) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email         TEXT,
      full_name     TEXT,
      role          TEXT NOT NULL DEFAULT 'athlete',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS athlete_profiles (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      age             INTEGER,
      nationality     TEXT,
      utr             REAL,
      itf_rank        INTEGER,
      atp_rank        INTEGER,
      gpa             REAL,
      sat             INTEGER,
      graduation_year INTEGER,
      video_url       TEXT,
      bio             TEXT,
      is_public       INTEGER DEFAULT 1,
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS coach_profiles (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      school_name TEXT,
      division    TEXT,
      position    TEXT,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS searches (
      id                    SERIAL PRIMARY KEY,
      user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      athlete_name          TEXT NOT NULL,
      athlete_data          TEXT NOT NULL,
      preferences           TEXT NOT NULL,
      results               TEXT NOT NULL,
      player_strength_score REAL NOT NULL,
      match_count           INTEGER NOT NULL DEFAULT 0,
      created_at            TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS colleges_cache (
      school_id  TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      fetched_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_searches_user    ON searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_athlete_utr      ON athlete_profiles(utr DESC);
    CREATE INDEX IF NOT EXISTS idx_athlete_public   ON athlete_profiles(is_public);
  `);
}

async function seedAdmin(p) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const { rows } = await p.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows.length === 0) {
    const hash = bcrypt.hashSync(password, 10);
    await p.query(
      'INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4)',
      [username, hash, 'admin', 'Admin']
    );
    console.log(`[db] Seeded admin user: ${username}`);
  }
}

// ── User helpers ──────────────────────────────────────────────────────────────

async function getUserByUsername(username) {
  const { rows } = await getPool().query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] || null;
}

async function getUserById(id) {
  const { rows } = await getPool().query(
    'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = $1', [id]
  );
  return rows[0] || null;
}

async function createUser({ username, password, email, fullName, role }) {
  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await getPool().query(
    'INSERT INTO users (username, password_hash, email, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [username, hash, email || null, fullName || null, role || 'athlete']
  );
  return rows[0].id;
}

// ── Athlete profile helpers ───────────────────────────────────────────────────

async function getAthleteProfile(userId) {
  const { rows } = await getPool().query('SELECT * FROM athlete_profiles WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function getAthleteProfileByUsername(username) {
  const { rows } = await getPool().query(`
    SELECT ap.*, u.username, u.full_name, u.created_at as member_since
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE u.username = $1 AND ap.is_public = 1 AND u.role = 'athlete'
  `, [username]);
  return rows[0] || null;
}

async function upsertAthleteProfile(userId, data) {
  const { rows } = await getPool().query('SELECT id FROM athlete_profiles WHERE user_id = $1', [userId]);
  if (rows.length > 0) {
    await getPool().query(`
      UPDATE athlete_profiles SET
        age = $1, nationality = $2, utr = $3, itf_rank = $4, atp_rank = $5,
        gpa = $6, sat = $7, graduation_year = $8, video_url = $9, bio = $10,
        is_public = $11, updated_at = NOW()
      WHERE user_id = $12
    `, [
      data.age, data.nationality, data.utr, data.itf_rank, data.atp_rank,
      data.gpa, data.sat, data.graduation_year, data.video_url, data.bio,
      data.is_public ?? 1, userId,
    ]);
  } else {
    await getPool().query(`
      INSERT INTO athlete_profiles
        (user_id, age, nationality, utr, itf_rank, atp_rank, gpa, sat, graduation_year, video_url, bio, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      userId, data.age, data.nationality, data.utr, data.itf_rank, data.atp_rank,
      data.gpa, data.sat, data.graduation_year, data.video_url, data.bio,
      data.is_public ?? 1,
    ]);
  }
}

async function searchAthletes({ utrMin, utrMax, nationality, gradYear, tier, search, limit = 50 }) {
  const { normalizePlayer } = require('../services/normalizationService');

  let sql = `
    SELECT ap.*, u.username, u.full_name
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.is_public = 1 AND u.role = 'athlete' AND ap.utr IS NOT NULL
  `;
  const params = [];
  let n = 0;

  if (utrMin)      { n++; sql += ` AND ap.utr >= $${n}`;                              params.push(Number(utrMin)); }
  if (utrMax)      { n++; sql += ` AND ap.utr <= $${n}`;                              params.push(Number(utrMax)); }
  if (nationality) { n++; sql += ` AND LOWER(ap.nationality) = LOWER($${n})`;         params.push(nationality); }
  if (gradYear)    { n++; sql += ` AND ap.graduation_year = $${n}`;                   params.push(Number(gradYear)); }
  if (search) {
    n++;
    sql += ` AND (LOWER(u.full_name) LIKE $${n} OR LOWER(u.username) LIKE $${n} OR LOWER(ap.nationality) LIKE $${n})`;
    params.push(`%${search.toLowerCase()}%`);
  }

  n++;
  sql += ` ORDER BY ap.utr DESC LIMIT $${n}`;
  params.push(Number(limit));

  const { rows } = await getPool().query(sql, params);

  return rows.map((r) => {
    const { score, components } = normalizePlayer(r.utr, r.itf_rank, r.atp_rank);
    const rowTier = score >= 0.80 ? 'Elite' : score >= 0.55 ? 'High' : 'Emerging';
    return { ...r, player_strength_score: score, normalization_components: components, recruitment_tier: rowTier };
  }).filter((r) => !tier || r.recruitment_tier === tier);
}

// ── Coach profile helpers ─────────────────────────────────────────────────────

async function getCoachProfile(userId) {
  const { rows } = await getPool().query('SELECT * FROM coach_profiles WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

async function upsertCoachProfile(userId, data) {
  const { rows } = await getPool().query('SELECT id FROM coach_profiles WHERE user_id = $1', [userId]);
  if (rows.length > 0) {
    await getPool().query(
      'UPDATE coach_profiles SET school_name = $1, division = $2, position = $3, updated_at = NOW() WHERE user_id = $4',
      [data.school_name, data.division, data.position, userId]
    );
  } else {
    await getPool().query(
      'INSERT INTO coach_profiles (user_id, school_name, division, position) VALUES ($1, $2, $3, $4)',
      [userId, data.school_name, data.division, data.position]
    );
  }
}

// ── Search helpers ────────────────────────────────────────────────────────────

async function saveSearch({ userId, athlete, preferences, results, playerStrengthScore }) {
  const { rows } = await getPool().query(`
    INSERT INTO searches (user_id, athlete_name, athlete_data, preferences, results, player_strength_score, match_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    userId, athlete.name, JSON.stringify(athlete),
    JSON.stringify(preferences), JSON.stringify(results),
    playerStrengthScore, results.length,
  ]);
  return rows[0].id;
}

async function getSearchHistory(userId, limit = 20) {
  const { rows } = await getPool().query(`
    SELECT id, athlete_name, player_strength_score, match_count, preferences, created_at
    FROM searches WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
  `, [userId, limit]);
  return rows.map((row) => ({ ...row, preferences: JSON.parse(row.preferences) }));
}

async function getSearchById(id, userId) {
  const { rows } = await getPool().query(
    'SELECT * FROM searches WHERE id = $1 AND user_id = $2', [id, userId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    athlete_data: JSON.parse(row.athlete_data),
    preferences:  JSON.parse(row.preferences),
    results:      JSON.parse(row.results),
  };
}

// ── College cache helpers ─────────────────────────────────────────────────────

async function getCachedCollege(schoolId) {
  const { rows } = await getPool().query(
    'SELECT data, fetched_at FROM colleges_cache WHERE school_id = $1', [schoolId]
  );
  if (rows.length === 0) return null;
  const age = Date.now() - new Date(rows[0].fetched_at).getTime();
  if (age > 7 * 24 * 60 * 60 * 1000) return null;
  return JSON.parse(rows[0].data);
}

async function setCachedCollege(schoolId, data) {
  await getPool().query(`
    INSERT INTO colleges_cache (school_id, data) VALUES ($1, $2)
    ON CONFLICT (school_id) DO UPDATE SET data = EXCLUDED.data, fetched_at = NOW()
  `, [schoolId, JSON.stringify(data)]);
}

module.exports = {
  connectDb,
  getPool,
  getUserByUsername, getUserById, createUser,
  getAthleteProfile, getAthleteProfileByUsername, upsertAthleteProfile, searchAthletes,
  getCoachProfile, upsertCoachProfile,
  saveSearch, getSearchHistory, getSearchById,
  getCachedCollege, setCachedCollege,
};
