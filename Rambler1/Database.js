import * as SQLite from 'expo-sqlite';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db as firestore } from './firebaseConfig';

let db = null;

// SQL ids were integers; Firestore doc ids are strings. Numeric-looking ids
// are stored as integers (sqlite INTEGER affinity), others as-is, so program
// ids stay identical to the Firestore doc ids screens later save/fetch with.
const normalizeId = (v) => {
  if (v === null || v === undefined) return v;
  const s = String(v);
  return /^-?\d+$/.test(s) ? parseInt(s, 10) : s;
};

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

  // Try to sync from Firestore on startup
  await syncFromServer();

  return db;
};

// =============================================================================
// SYNC FROM FIRESTORE
// =============================================================================
// Reads the catalog straight from Firestore (courses, programs + their
// requiredCourses subcollections; prerequisites come from the course docs)
// and repopulates the SAME sqlite tables/columns as before, so
// ProgramSelect / CourseSelect / instant search keep working unchanged.

export const syncFromServer = async () => {
  try {
    // Catalog reads require auth (anonymous counts). If auth isn't ready yet
    // (e.g. offline first launch), keep whatever is in the cache.
    if (!auth.currentUser) {
      console.log('Catalog sync skipped (not signed in yet)');
      return;
    }

    // Version gate: meta/catalog may not exist yet — in that case only run
    // the (expensive, ~3.6k reads) full sync when the local cache is empty.
    // Prefer catalogDataVersion — a fingerprint of the data this sync actually
    // caches, which only changes on a real catalog change. The legacy `version`
    // field is a scrape timestamp that bumps DAILY and used to force a full
    // re-download on every device every day (Phase 3.5 quota fix).
    let serverVersion = null;
    try {
      const metaSnap = await getDoc(doc(firestore, 'meta', 'catalog'));
      if (metaSnap.exists()) {
        const md = metaSnap.data();
        const v = md.catalogDataVersion != null ? md.catalogDataVersion : md.version;
        if (v != null) serverVersion = String(v);
      }
    } catch (e) {
      // Treat a failed version read like a missing version doc
    }

    const localVersion = await getLocalCatalogVersion();
    if (serverVersion && localVersion === serverVersion) return; // Up to date
    if (!serverVersion) {
      const row = await db.getFirstAsync('SELECT COUNT(*) AS n FROM courses');
      if (row && row.n > 0) return; // No version doc — sync only when cache empty
    }

    // ---- Bulk read from Firestore ----
    const [courseSnap, programSnap] = await Promise.all([
      getDocs(collection(firestore, 'courses')),
      getDocs(collection(firestore, 'programs')),
    ]);
    if (courseSnap.empty && programSnap.empty) return; // Nothing to cache

    // Sequential integer ids for courses: courses.id is INTEGER PRIMARY KEY
    // (a rowid alias — non-integer values are rejected by sqlite), so map
    // course codes to synthetic integers for the id column and the
    // program_courses join.
    const courseIdByCode = new Map();
    courseSnap.docs.forEach((c, i) => {
      const code = c.data().code || c.id;
      courseIdByCode.set(code, i + 1);
    });

    // requiredCourses subcollections (no collection-group rule exists, so read
    // per program)
    const programCourses = [];
    await Promise.all(
      programSnap.docs.map(async (p) => {
        const programId = normalizeId(p.id);
        if (typeof programId !== 'number') return; // programs.id is also INTEGER PK
        const rcSnap = await getDocs(collection(firestore, 'programs', p.id, 'requiredCourses'));
        for (const rc of rcSnap.docs) {
          const d = rc.data();
          const courseId = courseIdByCode.get(d.courseCode || rc.id);
          if (courseId === undefined) continue; // required course missing from catalog
          programCourses.push({
            program_id: programId,
            course_id: courseId,
            requirement_type: d.requirementType || 'required',
          });
        }
      })
    );

    // ---- Clear and repopulate cache (single transaction for speed) ----
    await db.execAsync('BEGIN');
    try {
      await db.execAsync('DELETE FROM program_courses');
      await db.execAsync('DELETE FROM prerequisites');
      await db.execAsync('DELETE FROM courses');
      await db.execAsync('DELETE FROM programs');

      // Programs — id preserved from the Firestore doc id (numeric doc ids
      // only: programs.id is INTEGER PRIMARY KEY, and the id must round-trip
      // to programs/{id} in Firestore when the profile is saved later)
      for (const p of programSnap.docs) {
        const programId = normalizeId(p.id);
        if (typeof programId !== 'number') {
          console.log(`Catalog sync: skipping program with non-numeric id "${p.id}"`);
          continue;
        }
        const d = p.data();
        await db.runAsync(
          `INSERT OR REPLACE INTO programs (id, name, type, degree, school, min_credits, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            programId,
            d.name ?? '',
            d.type ?? '',
            d.degree ?? null,
            d.school ?? null,
            d.minCredits ?? null,
            d.description ?? null,
          ]
        );
      }

      // Courses — synthetic sequential integer id (courses.id is INTEGER PK).
      // Selection identity is only ever compared within one data source, so
      // this does not clash with the adapter's code-string ids.
      // Prerequisites come from each course doc's `prerequisites` array.
      for (const c of courseSnap.docs) {
        const d = c.data();
        const code = d.code || c.id;
        await db.runAsync(
          `INSERT OR REPLACE INTO courses (id, code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type, description, semester)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            courseIdByCode.get(code),
            code,
            d.name ?? '',
            d.credits ?? 3,
            d.department ?? '',
            d.subjectArea ?? '',
            d.learningStyle ?? '',
            d.workStyle ?? '',
            d.teachingStyle ?? '',
            d.assessmentType ?? '',
            d.description ?? null,
            d.semester ?? null,
          ]
        );
        if (Array.isArray(d.prerequisites)) {
          for (const prereq of d.prerequisites) {
            await db.runAsync(
              'INSERT OR REPLACE INTO prerequisites (course_code, prerequisite_code) VALUES (?, ?)',
              [code, prereq]
            );
          }
        }
      }

      // Program courses
      for (const pc of programCourses) {
        await db.runAsync(
          'INSERT OR REPLACE INTO program_courses (program_id, course_id, requirement_type) VALUES (?, ?, ?)',
          [pc.program_id, pc.course_id, pc.requirement_type]
        );
      }

      // Update local version (synthesize one when meta/catalog is missing so
      // the empty-cache check keeps future launches cheap)
      const versionToStore = serverVersion || `firestore-${new Date().toISOString()}`;
      await db.runAsync(
        `INSERT OR REPLACE INTO cache_metadata (key, value) VALUES ('catalog_version', ?)`,
        [versionToStore]
      );

      await db.execAsync('COMMIT');
      console.log(`Catalog synced from Firestore (version: ${versionToStore})`);
    } catch (error) {
      await db.execAsync('ROLLBACK').catch(() => {});
      throw error;
    }
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
