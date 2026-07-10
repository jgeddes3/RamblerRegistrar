const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'locus.db');
let db = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS terms (
      code TEXT PRIMARY KEY,
      name TEXT,
      last_scraped TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_code TEXT NOT NULL,
      subject TEXT NOT NULL,
      catalog_number TEXT,
      section_number TEXT,
      class_number TEXT,
      title TEXT,
      instructor TEXT,
      meeting_days TEXT,
      meeting_time_start TEXT,
      meeting_time_end TEXT,
      room TEXT,
      building TEXT,
      enrollment_cap INTEGER DEFAULT 0,
      enrollment_total INTEGER DEFAULT 0,
      waitlist_cap INTEGER DEFAULT 0,
      waitlist_total INTEGER DEFAULT 0,
      instruction_mode TEXT,
      component TEXT,
      status TEXT,
      start_date TEXT,
      end_date TEXT,
      raw_data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(term_code, class_number)
    )
  `);

  db.run('CREATE INDEX IF NOT EXISTS idx_sections_term ON sections(term_code)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sections_subject ON sections(subject)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sections_instructor ON sections(instructor)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(subject, catalog_number)');

  // ---- Catalog tables ----

  db.run(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      degree TEXT,
      school TEXT,
      min_credits INTEGER,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS program_courses (
      program_id INTEGER,
      course_id INTEGER,
      requirement_type TEXT DEFAULT 'required',
      choice_group INTEGER,
      choose_count INTEGER,
      PRIMARY KEY (program_id, course_id)
    )
  `);
  // Self-heal older DBs that predate the choice-group columns (B12).
  // "duplicate column name" on re-run is expected and harmless.
  for (const col of ['choice_group INTEGER', 'choose_count INTEGER']) {
    try { db.run(`ALTER TABLE program_courses ADD COLUMN ${col}`); } catch (e) { /* exists */ }
  }

  // Prose requirements like "Two PHIL 300-level Elective Courses" — no course
  // list exists, ANY course matching subject/level counts (B12 phase 2).
  db.run(`
    CREATE TABLE IF NOT EXISTS program_subject_electives (
      program_id INTEGER,
      subject TEXT NOT NULL,
      min_level INTEGER,
      count INTEGER DEFAULT 1,
      PRIMARY KEY (program_id, subject, min_level)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS prerequisites (
      course_code TEXT NOT NULL,
      prerequisite_code TEXT NOT NULL,
      PRIMARY KEY (course_code, prerequisite_code)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS catalog_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Catalog indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code)');
  db.run('CREATE INDEX IF NOT EXISTS idx_programs_name_type ON programs(name, type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_courses_subject_area ON courses(subject_area)');

  // ---- Buildings table ----

  db.run(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      address TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      campus TEXT DEFAULT 'LSC'
    )
  `);

  // ---- User tables: REMOVED (Phase 1 cleanup) ----
  // Per-user data (courses/grades, locations, profiles, quiz results) lives in
  // Firestore under users/{uid}/** with owner-only rules. Existing locus.db
  // files may still carry the old (empty) tables — harmless leftovers.

  // ---- RIASEC Quiz tables ----
  // (quiz_results table removed with the other user tables — quiz data lives in
  //  Firestore at users/{uid}/private/quiz)

  db.run(`
    CREATE TABLE IF NOT EXISTS riasec_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      program_id INTEGER NOT NULL,
      rank INTEGER DEFAULT 1,
      rationale TEXT,
      UNIQUE(code, program_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS major_focus_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS focus_area_riasec (
      focus_area_id INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      weight INTEGER DEFAULT 1,
      PRIMARY KEY (focus_area_id, dimension)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS focus_area_courses (
      focus_area_id INTEGER NOT NULL,
      course_code TEXT NOT NULL,
      PRIMARY KEY (focus_area_id, course_code)
    )
  `);

  // ---- Core Curriculum tables ----

  db.run(`
    CREATE TABLE IF NOT EXISTS core_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tier TEXT,
      parent_area_id INTEGER,
      courses_required INTEGER DEFAULT 1,
      credits INTEGER DEFAULT 3,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS core_course_options (
      core_area_id INTEGER REFERENCES core_areas(id),
      course_code TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      PRIMARY KEY (core_area_id, course_code)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS core_school_overrides (
      school TEXT NOT NULL,
      core_area_id INTEGER REFERENCES core_areas(id),
      override_type TEXT NOT NULL,
      substitute_course TEXT,
      notes TEXT,
      PRIMARY KEY (school, core_area_id)
    )
  `);

  // ---- Enrollment History (for tracking which courses fill up fast) ----

  db.run(`
    CREATE TABLE IF NOT EXISTS enrollment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_code TEXT NOT NULL,
      class_number TEXT NOT NULL,
      subject TEXT,
      catalog_number TEXT,
      section_number TEXT,
      enrollment_cap INTEGER,
      enrollment_total INTEGER,
      waitlist_total INTEGER,
      percent_full REAL,
      snapshot_date TEXT NOT NULL,
      UNIQUE(term_code, class_number, snapshot_date)
    )
  `);

  // Indexes (user-table indexes removed with the tables — an index CREATE on a
  // missing table throws even with IF NOT EXISTS, breaking fresh databases)
  db.run('CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_enrollment_history_course ON enrollment_history(subject, catalog_number)');

  // ---- Seed buildings data ----

  const buildingCount = queryAll('SELECT COUNT(*) AS cnt FROM buildings');
  if (buildingCount[0].cnt === 0) {
    // Coordinates are OSM building centroids (Nominatim, 2026-07) — the old
    // hand-rounded values stacked several pins on identical points. Names must
    // keep matching LOCUS `building` strings by substring (e.g. "BVM",
    // "Francis Hall 142"). Rooney Hall is the Mundelein auditorium wing;
    // Alfie Hall is the Norville practice facility.
    const buildingSeedData = [
      ['Cuneo Hall', '6430 N Kenmore Ave', 41.99922, -87.65732, 'LSC'],
      ['Information Commons', '6501 N Kenmore Ave', 42.00032, -87.65632, 'LSC'],
      ['Dumbach Hall', '6474 N Kenmore Ave', 42.00045, -87.65786, 'LSC'],
      ['Crown Center', '1001 W Loyola Ave', 42.00120, -87.65657, 'LSC'],
      ['Mundelein Center', '1032 W Sheridan Rd', 41.99866, -87.65657, 'LSC'],
      ['Life Science Building', '1050 W Sheridan Rd', 41.99859, -87.65769, 'LSC'],
      ['Cudahy Science Hall', '6460 N Kenmore Ave', 41.99979, -87.65773, 'LSC'],
      ['Sullivan Center', '6339 N Sheridan Rd', 41.99780, -87.65503, 'LSC'],
      ['Inst for Env Sust', '6349 N Kenmore Ave', 41.99758, -87.65663, 'LSC'],
      ['Damen Student Center', '6511 N Winthrop Ave', 42.00043, -87.65975, 'LSC'],
      ['Piper Hall', '970 W Sheridan Rd', 41.99867, -87.65555, 'LSC'],
      ['Coffey Hall', '1000 W Sheridan Rd', 41.99897, -87.65550, 'LSC'],
      ['Flanner Hall', '1068 W Sheridan Rd', 41.99860, -87.65831, 'LSC'],
      ['Cudahy Library', '6515 N Kenmore Ave', 42.00076, -87.65684, 'LSC'],
      ['BVM Hall', '6364 N Sheridan Rd', 41.99796, -87.65667, 'LSC'],
      ['Rooney Hall', '1020 W Sheridan Rd', 41.99831, -87.65667, 'LSC'],
      ['Alfie Hall', '1109 W Loyola Ave', 42.00128, -87.65909, 'LSC'],
      ['Francis Hall', '6314 N Winthrop Ave', 41.99706, -87.65885, 'LSC'],
      ['Ralph Arnold Annex', '1131 W Sheridan Rd', 41.99829, -87.65888, 'LSC'],
      ['6347 N Broadway', '6347 N Broadway', 41.99776, -87.66005, 'LSC'],
      ['Corboy Law Center', '25 E Pearson St', 41.89715, -87.62716, 'WTC'],
      ['Schreiber Center', '16 E Pearson St', 41.89778, -87.62784, 'WTC'],
      ['School of COMM', '51 E Pearson St', 41.89746, -87.62656, 'WTC'],
    ];

    for (const [name, address, latitude, longitude, campus] of buildingSeedData) {
      db.run(
        `INSERT OR IGNORE INTO buildings (name, address, latitude, longitude, campus)
         VALUES (?, ?, ?, ?, ?)`,
        [name, address, latitude, longitude, campus]
      );
    }
  }

  // Migrations — add columns to existing tables
  try {
    db.run('ALTER TABLE user_profiles ADD COLUMN class_year TEXT');
  } catch (e) {
    // Column already exists — ignore
  }

  save();
  return db;
}

// Safely parse a JSON string column; return fallback on null/empty/invalid
// instead of throwing (a bad row must not break every future read).
function safeJsonParse(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

// Save database to disk. Atomic: write to a temp file then rename over the
// live DB, so a crash mid-write can never leave locus.db half-written. (B5)
function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, DB_PATH); // MOVEFILE_REPLACE_EXISTING on Windows — atomic swap
}

// Helper: run a SELECT and return array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// =============================================================================
// OPERATIONS
// =============================================================================

module.exports = {
  initDb,

  insertSection(termCode, section) {
    db.run(`
      INSERT OR REPLACE INTO sections (
        term_code, subject, catalog_number, section_number, class_number,
        title, instructor, meeting_days, meeting_time_start, meeting_time_end,
        room, building, enrollment_cap, enrollment_total,
        waitlist_cap, waitlist_total, instruction_mode, component, status,
        start_date, end_date, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      termCode,
      section.subject || '',
      section.catalog_number || '',
      section.section_number || '',
      section.class_number || '',
      section.title || '',
      section.instructor || '',
      section.meeting_days || section.days_times || '',
      section.meeting_time_start || '',
      section.meeting_time_end || '',
      section.room || '',
      section.building || '',
      section.enrollment_cap || 0,
      section.enrollment_total || 0,
      section.waitlist_cap || 0,
      section.waitlist_total || 0,
      section.instruction_mode || '',
      section.component || '',
      section.status || '',
      section.start_date || section.dates || '',
      section.end_date || '',
      JSON.stringify(section.raw_data || section),
    ]);
    // No save() here (B5): a full scrape inserts ~2,500 sections and a full-DB
    // serialize per insert stalls the event loop for the whole run. Callers
    // batch: the scraper calls db.save() once per subject instead.
  },

  clearSections(termCode) {
    db.run('DELETE FROM sections WHERE term_code = ?', [termCode]);
    save();
  },

  // Delete rows for a subject that were NOT in its latest successful scrape.
  // A section absent from a fresh LOCUS result set was cancelled or renumbered;
  // INSERT OR REPLACE alone never removes it, so the ghost row would otherwise
  // be re-synced to Firestore as live every day (B3 root cause). Enrollment
  // history rows are deliberately kept — the time series stays valuable.
  // Returns the number of rows deleted; caller batches save().
  deleteStaleSections(termCode, subject, liveClassNumbers) {
    const live = new Set((liveClassNumbers || []).map(String));
    if (live.size === 0) return 0; // never wipe a subject on an empty result set
    const rows = queryAll(
      'SELECT class_number FROM sections WHERE term_code = ? AND subject = ?',
      [termCode, subject]
    );
    const stale = rows.filter((r) => !live.has(String(r.class_number)));
    // Plausibility guard: LOCUS sometimes renders a subject's results page
    // partially and the scrape comes back with a handful of sections (observed
    // 2026-07-06: CHEM returned 1 of ~156). A result set that would delete
    // more rows than it keeps is a partial-scrape artifact, not a mass
    // cancellation — keep everything and let a healthy later run prune.
    if (stale.length > live.size) {
      console.warn(
        `  [db] ${subject} ${termCode}: fresh scrape has ${live.size} section(s) but DB has ` +
        `${rows.length} — looks like a partial scrape, skipping stale prune.`
      );
      return 0;
    }
    for (const r of stale) {
      db.run(
        'DELETE FROM sections WHERE term_code = ? AND subject = ? AND class_number = ?',
        [termCode, subject, r.class_number]
      );
    }
    return stale.length;
  },

  clearSectionsForSubjects(termCode, subjects) {
    for (const subject of subjects) {
      db.run('DELETE FROM sections WHERE term_code = ? AND subject = ?', [termCode, subject]);
    }
    save();
  },

  recordScrape(termCode, termName) {
    db.run(
      `INSERT OR REPLACE INTO terms (code, name, last_scraped) VALUES (?, ?, datetime('now'))`,
      [termCode, termName || termCode]
    );
    save();
  },

  getSectionsForCourse(termCode, subject, catalogNumber) {
    return queryAll(
      'SELECT * FROM sections WHERE term_code = ? AND subject = ? AND catalog_number = ? ORDER BY section_number',
      [termCode, subject, catalogNumber]
    );
  },

  getSectionsForSubject(termCode, subject) {
    return queryAll(
      'SELECT * FROM sections WHERE term_code = ? AND subject = ? ORDER BY catalog_number, section_number',
      [termCode, subject]
    );
  },

  getAllSections(termCode) {
    return queryAll(
      'SELECT * FROM sections WHERE term_code = ? ORDER BY subject, catalog_number, section_number',
      [termCode]
    );
  },

  getTerms() {
    return queryAll('SELECT * FROM terms ORDER BY code DESC');
  },

  getInstructorsForCourse(termCode, subject, catalogNumber) {
    return queryAll(
      `SELECT DISTINCT instructor FROM sections
       WHERE term_code = ? AND subject = ? AND catalog_number = ?
       AND instructor != '' AND instructor IS NOT NULL
       ORDER BY instructor`,
      [termCode, subject, catalogNumber]
    );
  },

  searchByInstructor(termCode, instructorName) {
    return queryAll(
      'SELECT * FROM sections WHERE term_code = ? AND instructor LIKE ? ORDER BY subject, catalog_number',
      [termCode, `%${instructorName}%`]
    );
  },

  getEnrollmentStats(termCode, subject, catalogNumber) {
    return queryAll(
      `SELECT section_number, enrollment_cap, enrollment_total,
              waitlist_cap, waitlist_total, status, instructor
       FROM sections
       WHERE term_code = ? AND subject = ? AND catalog_number = ?
       ORDER BY section_number`,
      [termCode, subject, catalogNumber]
    );
  },

  // ===========================================================================
  // CATALOG QUERY FUNCTIONS
  // ===========================================================================

  getPrograms(type) {
    if (type) {
      return queryAll('SELECT * FROM programs WHERE type = ? ORDER BY name', [type]);
    }
    return queryAll('SELECT * FROM programs ORDER BY name');
  },

  getProgramById(id) {
    const rows = queryAll('SELECT * FROM programs WHERE id = ?', [id]);
    return rows[0] || null;
  },

  getCourses() {
    return queryAll('SELECT * FROM courses ORDER BY code');
  },

  getCourseByCode(code) {
    const rows = queryAll('SELECT * FROM courses WHERE code = ?', [code]);
    return rows[0] || null;
  },

  searchCourses(query) {
    const pattern = `%${query}%`;
    return queryAll(
      'SELECT * FROM courses WHERE name LIKE ? OR code LIKE ? ORDER BY code',
      [pattern, pattern]
    );
  },

  getProgramCourses(programId) {
    return queryAll(
      `SELECT c.*, pc.requirement_type
       FROM program_courses pc
       JOIN courses c ON c.id = pc.course_id
       WHERE pc.program_id = ?
       ORDER BY c.code`,
      [programId]
    );
  },

  getPrerequisites(courseCode) {
    return queryAll(
      'SELECT prerequisite_code FROM prerequisites WHERE course_code = ?',
      [courseCode]
    );
  },

  getCatalogVersion() {
    const rows = queryAll(
      "SELECT value FROM catalog_metadata WHERE key = 'version'"
    );
    return rows[0] ? rows[0].value : null;
  },

  setCatalogVersion(version) {
    db.run(
      "INSERT OR REPLACE INTO catalog_metadata (key, value) VALUES ('version', ?)",
      [version]
    );
    save();
  },

  getFullCatalog() {
    const versionRows = queryAll("SELECT value FROM catalog_metadata WHERE key = 'version'");
    return {
      programs: queryAll('SELECT * FROM programs ORDER BY name'),
      courses: queryAll('SELECT * FROM courses ORDER BY code'),
      prerequisites: queryAll('SELECT * FROM prerequisites ORDER BY course_code'),
      programCourses: queryAll('SELECT * FROM program_courses'),
      version: versionRows[0] ? versionRows[0].value : null,
    };
  },

  // ===========================================================================
  // LOW-LEVEL HELPERS (used by seed script)
  // ===========================================================================

  /** Execute raw SQL (INSERT, UPDATE, etc.) */
  runSql(sql) {
    db.run(sql);
  },

  /** Persist the in-memory database to disk */
  save() {
    save();
  },

  // ===========================================================================
  // ADMIN MUTATION FUNCTIONS (auto-bump catalog version)
  // ===========================================================================

  addCourse(courseData) {
    const { code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type, description, semester } = courseData;
    db.run(
      `INSERT OR IGNORE INTO courses (code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type, description, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, credits || 3, department || '', subject_area || '', learning_style || 'lecture-based', work_style || 'mixed', teaching_style || 'structured', assessment_type || 'exam', description || null, semester || null]
    );
    this.bumpVersion();
    return this.getCourseByCode(code);
  },

  updateCourse(code, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'credits', 'department', 'subject_area', 'learning_style', 'work_style', 'teaching_style', 'assessment_type', 'description', 'semester'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;
    values.push(code);
    db.run(`UPDATE courses SET ${fields.join(', ')} WHERE code = ?`, values);
    this.bumpVersion();
    return this.getCourseByCode(code);
  },

  updateProgram(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'type', 'degree', 'school', 'min_credits', 'description'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);
    db.run(`UPDATE programs SET ${fields.join(', ')} WHERE id = ?`, values);
    this.bumpVersion();
    return this.getProgramById(id);
  },

  bumpVersion() {
    const version = new Date().toISOString().split('T')[0] + 'T' + new Date().toISOString().split('T')[1].substring(0, 8);
    this.setCatalogVersion(version);
    return version;
  },

  // Stable hash over exactly the tables the mobile client caches (courses,
  // programs, program_courses, prerequisites). Unlike bumpVersion() — a
  // timestamp that changes every scrape — this only changes when the catalog
  // DATA changes (i.e. an ETL / requirements edit), so firestore-sync can use
  // it as the client's re-download gate. Sections/enrollment are deliberately
  // excluded: the client fetches those live, not from its bulk cache.
  getCatalogDataFingerprint() {
    const crypto = require('crypto');
    const payload = JSON.stringify({
      courses: queryAll(
        'SELECT code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type, description, semester FROM courses ORDER BY code'
      ),
      programs: queryAll(
        'SELECT id, name, type, degree, school, min_credits, description FROM programs ORDER BY id'
      ),
      programCourses: queryAll(
        'SELECT program_id, course_id, requirement_type, choice_group, choose_count FROM program_courses ORDER BY program_id, course_id, requirement_type'
      ),
      subjectElectives: queryAll(
        'SELECT program_id, subject, min_level, count FROM program_subject_electives ORDER BY program_id, subject, min_level'
      ),
      prerequisites: queryAll(
        'SELECT course_code, prerequisite_code FROM prerequisites ORDER BY course_code, prerequisite_code'
      ),
    });
    return crypto.createHash('sha1').update(payload).digest('hex').slice(0, 16);
  },

  // ===========================================================================
  // BUILDINGS QUERY FUNCTIONS
  // ===========================================================================

  getBuildings() {
    return queryAll('SELECT * FROM buildings ORDER BY name');
  },

  getBuildingByName(name) {
    return queryAll('SELECT * FROM buildings WHERE name LIKE ?', [`%${name}%`]);
  },

  // ===========================================================================
  // USER DATA — REMOVED (Phase 1 cleanup, 2026-07-05)
  // All per-user data (profiles, courses/grades, locations, quiz) lives in
  // Firestore under users/{uid}/** with owner-only security rules. The mobile
  // app reads/writes it via Rambler1/firestore-data.js. The SQLite copies and
  // their endpoints were dead code after the client cutover.
  // ===========================================================================

  // ===========================================================================
  // CORE CURRICULUM QUERY FUNCTIONS
  // ===========================================================================

  getCoreAreas() {
    const areas = queryAll('SELECT * FROM core_areas ORDER BY id');
    // For each area, attach its course options
    for (const area of areas) {
      area.courseOptions = queryAll('SELECT * FROM core_course_options WHERE core_area_id = ?', [area.id]);
    }
    return areas;
  },

  getCoreAreasForSchool(school) {
    const areas = this.getCoreAreas();
    const overrides = queryAll('SELECT * FROM core_school_overrides WHERE school = ?', [school]);
    const overrideMap = {};
    for (const o of overrides) overrideMap[o.core_area_id] = o;

    return areas.map(area => ({
      ...area,
      override: overrideMap[area.id] || null,
    }));
  },

  // getUserCoreProgress — removed; ported to Rambler1/progress.js over Firestore data.

  // ===========================================================================
  // ENROLLMENT HISTORY (tracking which courses fill up fast)
  // ===========================================================================

  // Take a snapshot of current enrollment for all sections in a term
  snapshotEnrollment(termCode) {
    const now = new Date();
    const today = now.toISOString().split('T')[0] + 'T' + String(now.getUTCHours()).padStart(2, '0');
    const sections = this.getAllSections(termCode);
    let count = 0;
    for (const s of sections) {
      const cap = parseInt(s.enrollment_cap) || 0;
      const total = parseInt(s.enrollment_total) || 0;
      const percentFull = cap > 0 ? Math.round((total / cap) * 100) : 0;
      db.run(
        `INSERT OR REPLACE INTO enrollment_history (term_code, class_number, subject, catalog_number, section_number, enrollment_cap, enrollment_total, waitlist_total, percent_full, snapshot_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [termCode, s.class_number, s.subject, s.catalog_number, s.section_number, cap, total, parseInt(s.waitlist_total) || 0, percentFull, today]
      );
      count++;
    }
    save();
    return count;
  },

  // Get courses that fill up fastest (highest percent_full earliest)
  getFastestFillingCourses(termCode, limit) {
    return queryAll(
      `SELECT subject, catalog_number, section_number, class_number,
              enrollment_cap, enrollment_total, percent_full, snapshot_date
       FROM enrollment_history
       WHERE term_code = ? AND enrollment_cap > 0
       ORDER BY percent_full DESC, snapshot_date ASC
       LIMIT ?`,
      [termCode, limit || 50]
    );
  },

  // Get enrollment history for a specific course over time
  getCourseEnrollmentHistory(termCode, subject, catalogNumber) {
    return queryAll(
      `SELECT section_number, enrollment_cap, enrollment_total, waitlist_total, percent_full, snapshot_date
       FROM enrollment_history
       WHERE term_code = ? AND subject = ? AND catalog_number = ?
       ORDER BY snapshot_date, section_number`,
      [termCode, subject, catalogNumber]
    );
  },

  // Get courses that are currently full or nearly full (>90%)
  getFullCourses(termCode) {
    return queryAll(
      `SELECT DISTINCT subject, catalog_number,
              MAX(percent_full) as max_percent,
              SUM(enrollment_total) as total_enrolled,
              SUM(enrollment_cap) as total_capacity
       FROM enrollment_history
       WHERE term_code = ? AND enrollment_cap > 0
       AND snapshot_date = (SELECT MAX(snapshot_date) FROM enrollment_history WHERE term_code = ?)
       GROUP BY subject, catalog_number
       HAVING max_percent >= 90
       ORDER BY max_percent DESC`,
      [termCode, termCode]
    );
  },

  // ===========================================================================
  // RIASEC QUIZ
  // ===========================================================================

  // saveQuizResults / getQuizResults — removed; quiz data lives in Firestore
  // (users/{uid}/private/quiz), written by the app via firestore-data.js.

  getRecommendationsForCode(code) {
    // Try exact match first, then 2-letter prefix
    let rows = queryAll(
      `SELECT r.*, p.name as program_name, p.degree, p.school
       FROM riasec_recommendations r
       JOIN programs p ON p.id = r.program_id
       WHERE r.code = ?
       ORDER BY r.rank ASC`,
      [code]
    );
    if (rows.length === 0 && code.length > 2) {
      rows = queryAll(
        `SELECT r.*, p.name as program_name, p.degree, p.school
         FROM riasec_recommendations r
         JOIN programs p ON p.id = r.program_id
         WHERE r.code = ?
         ORDER BY r.rank ASC`,
        [code.substring(0, 2)]
      );
    }
    return rows;
  },

  getFocusAreasForProgram(programId) {
    const areas = queryAll(
      `SELECT * FROM major_focus_areas WHERE program_id = ? ORDER BY id`,
      [programId]
    );
    for (const area of areas) {
      area.riasec = queryAll(
        `SELECT dimension, weight FROM focus_area_riasec WHERE focus_area_id = ?`,
        [area.id]
      );
      area.courses = queryAll(
        `SELECT course_code FROM focus_area_courses WHERE focus_area_id = ?`,
        [area.id]
      ).map(r => r.course_code);
    }
    return areas;
  },

  // getEnrichedRecommendations — removed; ported to Rambler1/progress.js.

  getRankedFocusAreas(programId, userScores) {
    const areas = this.getFocusAreasForProgram(programId);
    // Score each focus area against user's RIASEC scores
    for (const area of areas) {
      area.fitScore = 0;
      for (const { dimension, weight } of area.riasec) {
        area.fitScore += (userScores[dimension] || 0) * weight;
      }
    }
    areas.sort((a, b) => b.fitScore - a.fitScore);
    return areas;
  },

  // Recent enrollment history grouped by class_number, newest-last, capped at
  // maxPoints per section. Used to build the Firestore `recentHistory` sparkline.
  getRecentHistoryByClass(termCode, maxPoints = 30) {
    const rows = queryAll(
      `SELECT class_number, snapshot_date, enrollment_total, enrollment_cap, waitlist_total
       FROM enrollment_history WHERE term_code = ?
       ORDER BY class_number, snapshot_date DESC`,
      [termCode]
    );
    const map = {};
    for (const r of rows) {
      const key = String(r.class_number);
      if (!map[key]) map[key] = [];
      if (map[key].length < maxPoints) {
        map[key].push({
          date: r.snapshot_date,
          total: r.enrollment_total,
          cap: r.enrollment_cap,
          // Waitlist series powers the F-HI3 movement chart. Older Firestore
          // recentHistory points lack this field — clients must tolerate that.
          waitlist: r.waitlist_total || 0,
        });
      }
    }
    for (const k in map) map[k].reverse();
    return map;
  },

  close() {
    if (db) {
      save();
      db.close();
    }
  },
};
