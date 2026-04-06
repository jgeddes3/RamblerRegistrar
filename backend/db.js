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
      PRIMARY KEY (program_id, course_id)
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

  // ---- User courses table ----

  db.run(`
    CREATE TABLE IF NOT EXISTS user_courses (
      user_id TEXT NOT NULL,
      course_code TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      grade TEXT,
      semester TEXT,
      PRIMARY KEY (user_id, course_code)
    )
  `);

  // ---- User locations table (home, dorm, custom) ----

  db.run(`
    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      address TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_primary INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, label)
    )
  `);

  // ---- User profiles table (onboarding selections) ----

  db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      selected_program_id INTEGER,
      selected_program2_id INTEGER,
      selected_minors TEXT,
      graduation_year TEXT,
      class_year TEXT,
      updated_at TEXT
    )
  `);

  // ---- RIASEC Quiz tables ----

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      user_id TEXT PRIMARY KEY,
      scores TEXT NOT NULL,
      code TEXT NOT NULL,
      profile_name TEXT,
      answers TEXT,
      scheduling_prefs TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

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

  // Indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_user_courses_user ON user_courses(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_enrollment_history_course ON enrollment_history(subject, catalog_number)');

  // ---- Seed buildings data ----

  const buildingCount = queryAll('SELECT COUNT(*) AS cnt FROM buildings');
  if (buildingCount[0].cnt === 0) {
    const buildingSeedData = [
      ['Cuneo Hall', '6430 N Kenmore Ave', 41.9990, -87.6570, 'LSC'],
      ['Information Commons', '6501 N Kenmore Ave', 42.0003, -87.6560, 'LSC'],
      ['Dumbach Hall', '6474 N Kenmore Ave', 42.0010, -87.6570, 'LSC'],
      ['Crown Center', '1001 W Loyola Ave', 42.0012, -87.6600, 'LSC'],
      ['Mundelein Center', '1032 W Sheridan Rd', 41.9994, -87.6600, 'LSC'],
      ['Life Science Building', '1032 W Sheridan Rd', 41.9990, -87.6580, 'LSC'],
      ['Cudahy Science Hall', '6460 N Kenmore Ave', 41.9992, -87.6580, 'LSC'],
      ['Sullivan Center', '6339 N Sheridan Rd', 41.9980, -87.6570, 'LSC'],
      ['Inst for Env Sust', '6349 N Kenmore Ave', 41.9982, -87.6570, 'LSC'],
      ['Damen Student Center', '6511 N Winthrop Ave', 42.0000, -87.6600, 'LSC'],
      ['Piper Hall', '970 W Sheridan Rd', 41.9990, -87.6560, 'LSC'],
      ['Coffey Hall', '1000 W Sheridan Rd', 41.9990, -87.6560, 'LSC'],
      ['Flanner Hall', '1068 W Sheridan Rd', 41.9990, -87.6580, 'LSC'],
      ['Cudahy Library', '6515 N Kenmore Ave', 42.0010, -87.6570, 'LSC'],
      ['Corboy Law Center', '25 E Pearson St', 41.8975, -87.6290, 'WTC'],
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

// Save database to disk
function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
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
    save();
  },

  clearSections(termCode) {
    db.run('DELETE FROM sections WHERE term_code = ?', [termCode]);
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
  // USER COURSES QUERY FUNCTIONS
  // ===========================================================================

  getUserCourses(userId) {
    return queryAll(
      'SELECT * FROM user_courses WHERE user_id = ? ORDER BY semester, course_code',
      [userId]
    );
  },

  addUserCourse(userId, courseCode, grade, semester) {
    db.run(
      `INSERT OR REPLACE INTO user_courses (user_id, course_code, status, grade, semester)
       VALUES (?, ?, 'completed', ?, ?)`,
      [userId, courseCode, grade || null, semester || null]
    );
    this.bumpVersion();
    save();
  },

  removeUserCourse(userId, courseCode) {
    db.run(
      'DELETE FROM user_courses WHERE user_id = ? AND course_code = ?',
      [userId, courseCode]
    );
    this.bumpVersion();
    save();
  },

  getDegreeProgress(userId, programId) {
    // 1. Get program info
    const program = this.getProgramById(programId);
    if (!program) return null;

    // 2. Get program's required courses
    const requiredCourses = this.getProgramCourses(programId);

    // 3. Get user's completed courses
    const userCourses = this.getUserCourses(userId);
    const completedCodes = new Set(userCourses.map(uc => uc.course_code));

    // 4. Compare: which required courses are completed vs remaining
    const completed = [];
    const remaining = [];
    for (const course of requiredCourses) {
      if (completedCodes.has(course.code)) {
        completed.push(course);
      } else {
        remaining.push(course);
      }
    }

    // 5. Calculate credits completed vs remaining
    const creditsCompleted = completed.reduce((sum, c) => sum + (c.credits || 3), 0);
    const creditsRemaining = remaining.reduce((sum, c) => sum + (c.credits || 3), 0);
    const totalCreditsRequired = program.min_credits || (creditsCompleted + creditsRemaining);

    // 6. Return structured progress object
    return {
      program,
      totalRequired: requiredCourses.length,
      completedCount: completed.length,
      remainingCount: remaining.length,
      creditsCompleted,
      creditsRemaining,
      totalCreditsRequired,
      percentComplete: requiredCourses.length > 0
        ? Math.round((completed.length / requiredCourses.length) * 100)
        : 0,
      completed,
      remaining,
    };
  },

  // ===========================================================================
  // USER LOCATIONS (home, dorm, custom places)
  // ===========================================================================

  getUserLocations(userId) {
    return queryAll('SELECT * FROM user_locations WHERE user_id = ? ORDER BY is_primary DESC, label', [userId]);
  },

  getUserPrimaryLocation(userId) {
    const rows = queryAll('SELECT * FROM user_locations WHERE user_id = ? AND is_primary = 1', [userId]);
    return rows[0] || null;
  },

  setUserLocation(userId, label, address, latitude, longitude, isPrimary) {
    // If setting as primary, unset any existing primary first
    if (isPrimary) {
      db.run('UPDATE user_locations SET is_primary = 0 WHERE user_id = ?', [userId]);
    }
    db.run(
      `INSERT OR REPLACE INTO user_locations (user_id, label, address, latitude, longitude, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, label, address || '', latitude, longitude, isPrimary ? 1 : 0]
    );
    save();
  },

  removeUserLocation(userId, label) {
    db.run('DELETE FROM user_locations WHERE user_id = ? AND label = ?', [userId, label]);
    save();
  },

  // Set a dorm as the user's home — copies building coords into user_locations
  setUserDorm(userId, dormName) {
    const dorms = queryAll('SELECT * FROM buildings WHERE name LIKE ?', [`%${dormName}%`]);
    if (dorms.length === 0) return null;
    const dorm = dorms[0];
    this.setUserLocation(userId, 'My Dorm', dorm.address, dorm.latitude, dorm.longitude, true);
    return dorm;
  },

  // ===========================================================================
  // USER PROFILE (onboarding selections persistence)
  // ===========================================================================

  getUserProfile(userId) {
    const rows = queryAll('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    if (rows.length === 0) return null;
    const profile = rows[0];
    // Parse minors JSON
    profile.selected_minors_parsed = profile.selected_minors ? JSON.parse(profile.selected_minors) : [];
    // Fetch full program objects
    if (profile.selected_program_id) {
      profile.program = this.getProgramById(profile.selected_program_id);
    }
    if (profile.selected_program2_id) {
      profile.program2 = this.getProgramById(profile.selected_program2_id);
    }
    // Fetch minor program objects
    profile.minors = profile.selected_minors_parsed.map(id => this.getProgramById(id)).filter(Boolean);
    return profile;
  },

  saveUserProfile(userId, data) {
    const minorsJson = data.selectedMinors ? JSON.stringify(data.selectedMinors) : '[]';
    db.run(
      `INSERT OR REPLACE INTO user_profiles (user_id, selected_program_id, selected_program2_id, selected_minors, graduation_year, class_year, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, data.selectedProgramId || null, data.selectedProgram2Id || null, minorsJson, data.graduationYear || '', data.classYear || '']
    );
    save();
  },

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

  getUserCoreProgress(userId, school) {
    const areas = school ? this.getCoreAreasForSchool(school) : this.getCoreAreas();
    const userCourses = this.getUserCourses(userId);
    const completedCodes = new Set(userCourses.map(uc => uc.course_code));

    let completedAreas = 0;
    let totalAreas = 0;
    let completedCredits = 0;
    let totalCredits = 0;

    const areaProgress = areas.map(area => {
      // Check if waived
      if (area.override && area.override.override_type === 'waived') {
        return { ...area, status: 'waived', satisfiedBy: area.override.notes };
      }

      totalAreas++;
      totalCredits += area.credits;

      // Check if any of the area's course options are in user's completed courses
      const completedOption = area.courseOptions.find(opt => completedCodes.has(opt.course_code));

      // Check double-count
      if (area.override && area.override.override_type === 'double-count' && area.override.substitute_course) {
        if (completedCodes.has(area.override.substitute_course)) {
          completedAreas++;
          completedCredits += area.credits;
          return { ...area, status: 'satisfied', satisfiedBy: area.override.substitute_course };
        }
      }

      if (completedOption) {
        completedAreas++;
        completedCredits += area.credits;
        return { ...area, status: 'completed', satisfiedBy: completedOption.course_code };
      }

      return { ...area, status: 'incomplete' };
    });

    return {
      totalAreas,
      completedAreas,
      totalCredits,
      completedCredits,
      percentComplete: totalAreas > 0 ? Math.round((completedAreas / totalAreas) * 100) : 0,
      areas: areaProgress,
    };
  },

  // ===========================================================================
  // ENROLLMENT HISTORY (tracking which courses fill up fast)
  // ===========================================================================

  // Take a snapshot of current enrollment for all sections in a term
  snapshotEnrollment(termCode) {
    const today = new Date().toISOString().split('T')[0];
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

  saveQuizResults(userId, data) {
    db.run(
      `INSERT OR REPLACE INTO quiz_results (user_id, scores, code, profile_name, answers, scheduling_prefs, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        userId,
        JSON.stringify(data.scores),
        data.code,
        data.profileName || '',
        JSON.stringify(data.answers || {}),
        JSON.stringify(data.schedulingPrefs || {}),
      ]
    );
    save();
  },

  getQuizResults(userId) {
    const rows = queryAll('SELECT * FROM quiz_results WHERE user_id = ?', [userId]);
    if (rows.length === 0) return null;
    const result = rows[0];
    result.scores = JSON.parse(result.scores);
    result.answers = result.answers ? JSON.parse(result.answers) : {};
    result.scheduling_prefs = result.scheduling_prefs ? JSON.parse(result.scheduling_prefs) : {};
    return result;
  },

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

  getEnrichedRecommendations(code, userId, gradYear) {
    const recs = this.getRecommendationsForCode(code);
    const currentYear = new Date().getFullYear();
    const gradYearNum = parseInt(gradYear) || (currentYear + 4);
    const semestersLeft = Math.max((gradYearNum - currentYear) * 2, 1);
    const coursesPerSemester = 5;

    return recs.map(rec => {
      const progress = this.getDegreeProgress(userId, rec.program_id);
      if (!progress) {
        return { ...rec, remainingCourses: null, feasible: null };
      }

      const remaining = progress.remainingCount;
      const estimatedSemesters = Math.ceil(remaining / coursesPerSemester);
      const feasible = remaining <= semestersLeft * coursesPerSemester;

      return {
        ...rec,
        remainingCourses: remaining,
        remainingCredits: progress.creditsRemaining,
        totalRequired: progress.totalRequired,
        completedCount: progress.completedCount,
        percentComplete: progress.percentComplete,
        estimatedSemesters,
        feasible,
        semestersLeft,
      };
    });
  },

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

  close() {
    if (db) {
      save();
      db.close();
    }
  },
};
