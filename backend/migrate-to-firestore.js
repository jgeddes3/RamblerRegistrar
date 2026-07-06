// =============================================================================
// Phase 0.5 — one-time (idempotent) migration: SQLite (locus.db) -> Firestore.
//
// Uses the Firebase Admin SDK, which BYPASSES security rules — so it can write
// the locked-down catalog + user collections directly. Re-runnable: every write
// is a set() on a deterministic doc id, so re-running overwrites (no dupes).
//
// Usage (from backend/):
//   GOOGLE_APPLICATION_CREDENTIALS not needed — uses serviceAccountKey.json.
//   node migrate-to-firestore.js            # migrate everything
//   node migrate-to-firestore.js --catalog  # catalog only
//   node migrate-to-firestore.js --users    # user data only
// =============================================================================

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const fdb = admin.firestore();
const { Timestamp, FieldValue } = admin.firestore;

const args = process.argv.slice(2);
const doCatalog = args.length === 0 || args.includes('--catalog');
const doUsers = args.length === 0 || args.includes('--users');

// ---- helpers ----------------------------------------------------------------
function sanitizeId(s) {
  return String(s).replace(/\//g, '_').replace(/^\.+$/, '_').trim().slice(0, 400) || '_';
}
function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 120) || 'unknown';
}
// Remove null/undefined/'' so optional fields are simply absent (cleaner + passes rules).
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}
// SQLite datetime ("YYYY-MM-DD HH:MM:SS", UTC) -> Firestore Timestamp.
function parseTs(str) {
  if (!str) return FieldValue.serverTimestamp();
  const d = new Date(String(str).replace(' ', 'T') + (String(str).includes('Z') ? '' : 'Z'));
  return isNaN(d.getTime()) ? FieldValue.serverTimestamp() : Timestamp.fromDate(d);
}
function safeParse(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}
function buildKeywords(code, name) {
  const toks = (String(code || '') + ' ' + String(name || '')).toLowerCase()
    .split(/[^a-z0-9]+/).filter((t) => t && t.length >= 2);
  return Array.from(new Set(toks)).slice(0, 30);
}

// Batched writer (Firestore hard limit is 500 ops/commit; stay under).
class Batcher {
  constructor(db) { this.db = db; this.b = db.batch(); this.n = 0; this.total = 0; }
  async set(ref, data) {
    this.b.set(ref, data);
    if (++this.n >= 450) await this.commit();
    this.total++;
  }
  async commit() { if (this.n > 0) { await this.b.commit(); this.b = this.db.batch(); this.n = 0; } }
}

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(path.join(__dirname, 'locus.db')));
  const q = (sql) => {
    const r = db.exec(sql);
    if (!r[0]) return [];
    const cols = r[0].columns;
    return r[0].values.map((row) => Object.fromEntries(row.map((v, i) => [cols[i], v])));
  };
  const b = new Batcher(fdb);
  const counts = {};
  const bump = (k, d = 1) => { counts[k] = (counts[k] || 0) + d; };

  // course_id -> code (program_courses references course_id)
  const courses = q('SELECT * FROM courses');
  const idToCode = {};
  courses.forEach((c) => { idToCode[c.id] = c.code; });

  if (doCatalog) {
    // --- courses (+ denormalized prerequisites) ---
    const prereqMap = {};
    q('SELECT * FROM prerequisites').forEach((p) => {
      (prereqMap[p.course_code] = prereqMap[p.course_code] || []).push(p.prerequisite_code);
    });
    for (const c of courses) {
      if (!c.code) continue;
      await b.set(fdb.collection('courses').doc(sanitizeId(c.code)), clean({
        code: c.code, name: c.name, credits: c.credits, department: c.department,
        subjectArea: c.subject_area, learningStyle: c.learning_style, workStyle: c.work_style,
        teachingStyle: c.teaching_style, assessmentType: c.assessment_type,
        description: c.description, semester: c.semester,
        prerequisites: prereqMap[c.code] || [], searchKeywords: buildKeywords(c.code, c.name),
      }));
      bump('courses');
    }

    // --- programs (+ requiredCourses subcollection) ---
    const progCourses = q('SELECT * FROM program_courses');
    for (const p of q('SELECT * FROM programs')) {
      await b.set(fdb.collection('programs').doc(String(p.id)), clean({
        name: p.name, type: p.type, degree: p.degree, school: p.school,
        minCredits: p.min_credits, description: p.description,
      }));
      bump('programs');
    }
    for (const pc of progCourses) {
      const code = idToCode[pc.course_id];
      if (!code) continue;
      await b.set(
        fdb.collection('programs').doc(String(pc.program_id))
          .collection('requiredCourses').doc(sanitizeId(code)),
        clean({ courseCode: code, requirementType: pc.requirement_type })
      );
      bump('requiredCourses');
    }

    // --- sections (terms/{term}/sections/{classNumber}) + instructors set ---
    const instructors = new Map();
    for (const s of q('SELECT * FROM sections')) {
      const cap = s.enrollment_cap || 0, total = s.enrollment_total || 0;
      const instructorId = s.instructor ? slug(s.instructor) : null;
      if (instructorId) instructors.set(instructorId, s.instructor);
      await b.set(
        fdb.collection('terms').doc(String(s.term_code))
          .collection('sections').doc(sanitizeId(s.class_number)),
        clean({
          termCode: s.term_code, subject: s.subject, catalogNumber: s.catalog_number,
          courseCode: s.subject && s.catalog_number ? `${s.subject} ${s.catalog_number}` : null,
          sectionNumber: s.section_number, classNumber: s.class_number, title: s.title,
          instructorName: s.instructor, instructorId,
          meetingDays: s.meeting_days, meetingTimeStart: s.meeting_time_start,
          meetingTimeEnd: s.meeting_time_end, room: s.room, building: s.building,
          enrollment: {
            cap, total, waitlistCap: s.waitlist_cap || 0, waitlistTotal: s.waitlist_total || 0,
            percentFull: cap > 0 ? Math.round((100 * total) / cap) : 0,
          },
          instructionMode: s.instruction_mode, component: s.component, status: s.status,
          startDate: s.start_date, endDate: s.end_date,
        })
      );
      bump('sections');
    }
    // --- instructors (normalized; RMP cache filled later by the scraper) ---
    for (const [id, name] of instructors) {
      await b.set(fdb.collection('instructors').doc(id), clean({ name, rmp: null, lastRmpSync: null }));
      bump('instructors');
    }

    // --- buildings ---
    for (const bl of q('SELECT * FROM buildings')) {
      await b.set(fdb.collection('buildings').doc(sanitizeId(bl.name)), clean({
        name: bl.name, address: bl.address, latitude: bl.latitude, longitude: bl.longitude,
        campus: bl.campus,
      }));
      bump('buildings');
    }

    // --- core curriculum ---
    const coreOptions = {};
    q('SELECT * FROM core_course_options').forEach((o) => {
      (coreOptions[o.core_area_id] = coreOptions[o.core_area_id] || []).push({ courseCode: o.course_code, isRequired: !!o.is_required });
    });
    for (const a of q('SELECT * FROM core_areas')) {
      await b.set(fdb.collection('coreAreas').doc(String(a.id)), clean({
        name: a.name, category: a.category, tier: a.tier, parentAreaId: a.parent_area_id,
        coursesRequired: a.courses_required, credits: a.credits, description: a.description,
        options: coreOptions[a.id] || [],
      }));
      bump('coreAreas');
    }
    for (const o of q('SELECT * FROM core_school_overrides')) {
      await b.set(
        fdb.collection('coreSchoolOverrides').doc(`${slug(o.school)}_${o.core_area_id}`),
        clean({ school: o.school, coreAreaId: o.core_area_id, overrideType: o.override_type,
          substituteCourse: o.substitute_course, notes: o.notes })
      );
      bump('coreSchoolOverrides');
    }

    // --- RIASEC recommendations (grouped by code) ---
    const riasec = {};
    q('SELECT * FROM riasec_recommendations').forEach((r) => {
      (riasec[r.code] = riasec[r.code] || []).push({ programId: String(r.program_id), rank: r.rank, rationale: r.rationale || null });
    });
    for (const [code, recs] of Object.entries(riasec)) {
      recs.sort((a, c) => (a.rank || 99) - (c.rank || 99));
      await b.set(fdb.collection('riasecRecommendations').doc(sanitizeId(code)), { recommendations: recs.map(clean) });
      bump('riasecRecommendations');
    }

    // --- focus areas (+ embedded riasec weights + course codes) ---
    const faRiasec = {}, faCourses = {};
    q('SELECT * FROM focus_area_riasec').forEach((r) => { (faRiasec[r.focus_area_id] = faRiasec[r.focus_area_id] || {})[r.dimension] = r.weight; });
    q('SELECT * FROM focus_area_courses').forEach((r) => { (faCourses[r.focus_area_id] = faCourses[r.focus_area_id] || []).push(r.course_code); });
    for (const fa of q('SELECT * FROM major_focus_areas')) {
      await b.set(fdb.collection('focusAreas').doc(String(fa.id)), clean({
        programId: String(fa.program_id), name: fa.name, description: fa.description,
        riasec: faRiasec[fa.id] || {}, courses: faCourses[fa.id] || [],
      }));
      bump('focusAreas');
    }
  }

  if (doUsers) {
    // --- user profiles ---
    for (const p of q('SELECT * FROM user_profiles')) {
      await b.set(fdb.collection('users').doc(String(p.user_id)), clean({
        selectedProgramId: p.selected_program_id != null ? String(p.selected_program_id) : null,
        selectedProgram2Id: p.selected_program2_id != null ? String(p.selected_program2_id) : null,
        selectedMinors: (safeParse(p.selected_minors, []) || []).map(String),
        graduationYear: p.graduation_year, classYear: p.class_year,
        createdAt: parseTs(p.updated_at), updatedAt: parseTs(p.updated_at),
      }));
      bump('users');
    }
    // --- user courses (grades) ---
    for (const c of q('SELECT * FROM user_courses')) {
      await b.set(
        fdb.collection('users').doc(String(c.user_id)).collection('courses').doc(sanitizeId(c.course_code)),
        clean({ courseCode: c.course_code, status: c.status, grade: c.grade, semester: c.semester })
      );
      bump('userCourses');
    }
    // --- user locations (home GPS) ---
    for (const l of q('SELECT * FROM user_locations')) {
      await b.set(
        fdb.collection('users').doc(String(l.user_id)).collection('locations').doc(sanitizeId(l.label)),
        clean({ label: l.label, address: l.address, latitude: l.latitude, longitude: l.longitude, isPrimary: !!l.is_primary })
      );
      bump('userLocations');
    }
    // --- quiz results (users/{uid}/private/quiz) ---
    for (const qr of q('SELECT * FROM quiz_results')) {
      await b.set(
        fdb.collection('users').doc(String(qr.user_id)).collection('private').doc('quiz'),
        clean({
          scores: safeParse(qr.scores, {}), code: qr.code, profileName: qr.profile_name,
          answers: safeParse(qr.answers, {}), schedulingPrefs: safeParse(qr.scheduling_prefs, {}),
          createdAt: parseTs(qr.created_at),
        })
      );
      bump('quizResults');
    }
  }

  await b.commit();
  console.log('Migration complete. Documents written:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(20)} ${v}`));
  console.log(`  ${'TOTAL'.padEnd(20)} ${b.total}`);
  db.close();
}

main().then(() => process.exit(0)).catch((err) => { console.error('Migration failed:', err); process.exit(1); });
