import * as SQLite from 'expo-sqlite';
import * as api from './api';

let db = null;

// =============================================================================
// DATABASE INITIALIZATION — Cache-only (source of truth is the backend)
// =============================================================================

export const initDatabase = async () => {
  db = await SQLite.openDatabaseAsync('rambler_cache.db');

  // Create cache tables (same schema as backend, but populated via API sync)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      degree TEXT,
      school TEXT,
      min_credits INTEGER,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      department TEXT,
      subject_area TEXT,
      learning_style TEXT,
      work_style TEXT,
      teaching_style TEXT,
      assessment_type TEXT,
      description TEXT,
      semester TEXT
    );

    CREATE TABLE IF NOT EXISTS program_courses (
      program_id INTEGER,
      course_id INTEGER,
      requirement_type TEXT DEFAULT 'required',
      PRIMARY KEY (program_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS prerequisites (
      course_code TEXT NOT NULL,
      prerequisite_code TEXT NOT NULL,
      PRIMARY KEY (course_code, prerequisite_code)
    );

    CREATE TABLE IF NOT EXISTS professors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rmp_id TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      department TEXT,
      avg_rating REAL,
      avg_difficulty REAL,
      would_take_again REAL,
      num_ratings INTEGER,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS professor_courses (
      professor_id INTEGER REFERENCES professors(id),
      course_code TEXT,
      PRIMARY KEY (professor_id, course_code)
    );

    CREATE TABLE IF NOT EXISTS cache_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Try to sync from backend on startup
  await syncFromServer();

  return db;
};

// =============================================================================
// SYNC FROM BACKEND
// =============================================================================

export const syncFromServer = async () => {
  try {
    // Check if we need to sync
    const serverVersion = await api.checkCatalogVersion();
    if (!serverVersion) return; // Backend unreachable — use cache

    const localVersion = await getLocalCatalogVersion();
    if (localVersion === serverVersion) return; // Already up to date

    // Full sync needed
    const catalog = await api.syncCatalog();
    if (!catalog) return; // Failed to fetch

    // Clear and repopulate cache
    await db.execAsync('DELETE FROM program_courses');
    await db.execAsync('DELETE FROM prerequisites');
    await db.execAsync('DELETE FROM courses');
    await db.execAsync('DELETE FROM programs');

    // Insert programs
    if (catalog.programs) {
      for (const p of catalog.programs) {
        await db.runAsync(
          `INSERT OR REPLACE INTO programs (id, name, type, degree, school, min_credits, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.type, p.degree, p.school, p.min_credits, p.description]
        );
      }
    }

    // Insert courses
    if (catalog.courses) {
      for (const c of catalog.courses) {
        await db.runAsync(
          `INSERT OR REPLACE INTO courses (id, code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type, description, semester)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.code, c.name, c.credits, c.department, c.subject_area, c.learning_style, c.work_style, c.teaching_style, c.assessment_type, c.description, c.semester]
        );
      }
    }

    // Insert program_courses
    if (catalog.programCourses) {
      for (const pc of catalog.programCourses) {
        await db.runAsync(
          'INSERT OR REPLACE INTO program_courses (program_id, course_id, requirement_type) VALUES (?, ?, ?)',
          [pc.program_id, pc.course_id, pc.requirement_type]
        );
      }
    }

    // Insert prerequisites
    if (catalog.prerequisites) {
      for (const pr of catalog.prerequisites) {
        await db.runAsync(
          'INSERT OR REPLACE INTO prerequisites (course_code, prerequisite_code) VALUES (?, ?)',
          [pr.course_code, pr.prerequisite_code]
        );
      }
    }

    // Update local version
    await db.runAsync(
      `INSERT OR REPLACE INTO cache_metadata (key, value) VALUES ('catalog_version', ?)`,
      [serverVersion]
    );

    console.log(`Catalog synced from server (version: ${serverVersion})`);
  } catch (error) {
    console.log('Catalog sync skipped (offline or error):', error.message);
    // App will use whatever is in the local cache
  }
};

const getLocalCatalogVersion = async () => {
  const row = await db.getFirstAsync(
    "SELECT value FROM cache_metadata WHERE key = 'catalog_version'"
  );
  return row ? row.value : null;
};

// =============================================================================
// QUERY FUNCTIONS — Read from local cache (populated by sync)
// =============================================================================

export const fetchPrograms = async (type) => {
  if (type) {
    return await db.getAllAsync('SELECT * FROM programs WHERE type = ? ORDER BY name', [type]);
  }
  return await db.getAllAsync('SELECT * FROM programs ORDER BY name');
};

export const fetchCourses = async () => {
  return await db.getAllAsync('SELECT * FROM courses ORDER BY code');
};

export const fetchProgramCourses = async (programId) => {
  return await db.getAllAsync(
    `SELECT c.*, pc.requirement_type FROM courses c
     JOIN program_courses pc ON c.id = pc.course_id
     WHERE pc.program_id = ?
     ORDER BY c.code`,
    [programId]
  );
};

export const fetchPrerequisites = async (courseCode) => {
  return await db.getAllAsync(
    'SELECT prerequisite_code FROM prerequisites WHERE course_code = ?',
    [courseCode]
  );
};

// =============================================================================
// PROFESSOR CACHE — Stays local (fed by RMP API)
// =============================================================================

export const cacheProfessor = async (prof) => {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO professors (rmp_id, first_name, last_name, department, avg_rating, avg_difficulty, would_take_again, num_ratings, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(rmp_id) DO UPDATE SET
       avg_rating = excluded.avg_rating,
       avg_difficulty = excluded.avg_difficulty,
       would_take_again = excluded.would_take_again,
       num_ratings = excluded.num_ratings,
       last_updated = excluded.last_updated`,
    [prof.rmpId, prof.firstName, prof.lastName, prof.department,
     prof.avgRating, prof.avgDifficulty, prof.wouldTakeAgainPercent,
     prof.numRatings, now]
  );

  const row = await db.getFirstAsync(
    'SELECT id FROM professors WHERE rmp_id = ?', [prof.rmpId]
  );

  if (prof.courseCodes && row) {
    for (const course of prof.courseCodes) {
      await db.runAsync(
        'INSERT OR IGNORE INTO professor_courses (professor_id, course_code) VALUES (?, ?)',
        [row.id, course.name]
      );
    }
  }

  return row ? row.id : null;
};

export const getCachedProfessorsForCourse = async (courseCode) => {
  return await db.getAllAsync(
    `SELECT p.* FROM professors p
     JOIN professor_courses pc ON p.id = pc.professor_id
     WHERE pc.course_code = ?
     ORDER BY p.avg_rating DESC`,
    [courseCode]
  );
};

export const isCacheStale = async (rmpId) => {
  const row = await db.getFirstAsync(
    'SELECT last_updated FROM professors WHERE rmp_id = ?', [rmpId]
  );
  if (!row || !row.last_updated) return true;
  const lastUpdated = new Date(row.last_updated);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return lastUpdated < sevenDaysAgo;
};
