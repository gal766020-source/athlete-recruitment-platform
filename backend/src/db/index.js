const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'arp.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    migrateSchema();
    seedAdmin();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email         TEXT,
      full_name     TEXT,
      role          TEXT NOT NULL DEFAULT 'athlete',
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS athlete_profiles (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER UNIQUE NOT NULL,
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
      updated_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coach_profiles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER UNIQUE NOT NULL,
      school_name TEXT,
      division    TEXT,
      position    TEXT,
      updated_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS searches (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id               INTEGER NOT NULL,
      athlete_name          TEXT NOT NULL,
      athlete_data          TEXT NOT NULL,
      preferences           TEXT NOT NULL,
      results               TEXT NOT NULL,
      player_strength_score REAL NOT NULL,
      match_count           INTEGER NOT NULL DEFAULT 0,
      created_at            TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS colleges_cache (
      school_id  TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      fetched_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_searches_user    ON searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_athlete_utr      ON athlete_profiles(utr DESC);
    CREATE INDEX IF NOT EXISTS idx_athlete_public   ON athlete_profiles(is_public);
  `);
}

function migrateSchema() {
  // Add new columns to users if upgrading an existing DB
  const addCol = (table, col, def) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
  };
  addCol('users', 'email',     'TEXT');
  addCol('users', 'full_name', 'TEXT');
  addCol('users', 'role',      "TEXT NOT NULL DEFAULT 'athlete'");
}

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)'
    ).run(username, hash, 'admin', 'Admin');
    console.log(`[db] Seeded admin user: ${username}`);
  }
}

// ── User helpers ──────────────────────────────────────────────────────────────

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function getUserById(id) {
  return db.prepare('SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?').get(id);
}

function createUser({ username, password, email, fullName, role }) {
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(username, hash, email || null, fullName || null, role || 'athlete');
  return info.lastInsertRowid;
}

// ── Athlete profile helpers ───────────────────────────────────────────────────

function getAthleteProfile(userId) {
  return db.prepare('SELECT * FROM athlete_profiles WHERE user_id = ?').get(userId);
}

function getAthleteProfileByUsername(username) {
  return db.prepare(`
    SELECT ap.*, u.username, u.full_name, u.created_at as member_since
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE u.username = ? AND ap.is_public = 1 AND u.role = 'athlete'
  `).get(username);
}

function upsertAthleteProfile(userId, data) {
  const existing = db.prepare('SELECT id FROM athlete_profiles WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare(`
      UPDATE athlete_profiles SET
        age = ?, nationality = ?, utr = ?, itf_rank = ?, atp_rank = ?,
        gpa = ?, sat = ?, graduation_year = ?, video_url = ?, bio = ?,
        is_public = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      data.age, data.nationality, data.utr, data.itf_rank, data.atp_rank,
      data.gpa, data.sat, data.graduation_year, data.video_url, data.bio,
      data.is_public ?? 1, userId
    );
  } else {
    db.prepare(`
      INSERT INTO athlete_profiles
        (user_id, age, nationality, utr, itf_rank, atp_rank, gpa, sat, graduation_year, video_url, bio, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, data.age, data.nationality, data.utr, data.itf_rank, data.atp_rank,
      data.gpa, data.sat, data.graduation_year, data.video_url, data.bio,
      data.is_public ?? 1
    );
  }
}

function searchAthletes({ utrMin, utrMax, nationality, gradYear, tier, search, limit = 50 }) {
  const { normalizePlayer } = require('../services/normalizationService');

  let sql = `
    SELECT ap.*, u.username, u.full_name
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    WHERE ap.is_public = 1 AND u.role = 'athlete' AND ap.utr IS NOT NULL
  `;
  const params = [];

  if (utrMin)      { sql += ' AND ap.utr >= ?';         params.push(Number(utrMin)); }
  if (utrMax)      { sql += ' AND ap.utr <= ?';         params.push(Number(utrMax)); }
  if (nationality) { sql += ' AND LOWER(ap.nationality) = LOWER(?)'; params.push(nationality); }
  if (gradYear)    { sql += ' AND ap.graduation_year = ?'; params.push(Number(gradYear)); }
  if (search) {
    sql += ' AND (LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(ap.nationality) LIKE ?)';
    const q = `%${search.toLowerCase()}%`;
    params.push(q, q, q);
  }

  sql += ' ORDER BY ap.utr DESC LIMIT ?';
  params.push(Number(limit));

  const rows = db.prepare(sql).all(...params);

  return rows.map((r) => {
    const { score, components } = normalizePlayer(r.utr, r.itf_rank, r.atp_rank);
    const tier = score >= 0.80 ? 'Elite' : score >= 0.55 ? 'High' : 'Emerging';
    return { ...r, player_strength_score: score, normalization_components: components, recruitment_tier: tier };
  }).filter((r) => !tier || r.recruitment_tier === tier);
}

// ── Coach profile helpers ─────────────────────────────────────────────────────

function getCoachProfile(userId) {
  return db.prepare('SELECT * FROM coach_profiles WHERE user_id = ?').get(userId);
}

function upsertCoachProfile(userId, data) {
  const existing = db.prepare('SELECT id FROM coach_profiles WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare(`
      UPDATE coach_profiles SET school_name = ?, division = ?, position = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(data.school_name, data.division, data.position, userId);
  } else {
    db.prepare(
      'INSERT INTO coach_profiles (user_id, school_name, division, position) VALUES (?, ?, ?, ?)'
    ).run(userId, data.school_name, data.division, data.position);
  }
}

// ── Search helpers ────────────────────────────────────────────────────────────

function saveSearch({ userId, athlete, preferences, results, playerStrengthScore }) {
  const info = db.prepare(`
    INSERT INTO searches (user_id, athlete_name, athlete_data, preferences, results, player_strength_score, match_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, athlete.name, JSON.stringify(athlete),
    JSON.stringify(preferences), JSON.stringify(results),
    playerStrengthScore, results.length
  );
  return info.lastInsertRowid;
}

function getSearchHistory(userId, limit = 20) {
  return db.prepare(`
    SELECT id, athlete_name, player_strength_score, match_count, preferences, created_at
    FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
  `).all(userId, limit).map((row) => ({
    ...row,
    preferences: JSON.parse(row.preferences),
  }));
}

function getSearchById(id, userId) {
  const row = db.prepare('SELECT * FROM searches WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) return null;
  return {
    ...row,
    athlete_data: JSON.parse(row.athlete_data),
    preferences:  JSON.parse(row.preferences),
    results:      JSON.parse(row.results),
  };
}

// ── College cache helpers ─────────────────────────────────────────────────────

function getCachedCollege(schoolId) {
  const row = db.prepare('SELECT data, fetched_at FROM colleges_cache WHERE school_id = ?').get(schoolId);
  if (!row) return null;
  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age > 7 * 24 * 60 * 60 * 1000) return null;
  return JSON.parse(row.data);
}

function setCachedCollege(schoolId, data) {
  db.prepare(`
    INSERT INTO colleges_cache (school_id, data) VALUES (?, ?)
    ON CONFLICT(school_id) DO UPDATE SET data = excluded.data, fetched_at = datetime('now')
  `).run(schoolId, JSON.stringify(data));
}

module.exports = {
  getDb,
  getUserByUsername, getUserById, createUser,
  getAthleteProfile, getAthleteProfileByUsername, upsertAthleteProfile, searchAthletes,
  getCoachProfile, upsertCoachProfile,
  saveSearch, getSearchHistory, getSearchById,
  getCachedCollege, setCachedCollege,
};
