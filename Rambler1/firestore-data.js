// firestore-data.js — Firestore-backed drop-in replacement for the backend
// api.js client. Every function keeps the OLD api.js signature and returns the
// OLD response shape (snake_case keys) so screens change minimally; camelCase
// Firestore docs are mapped to the legacy shapes internally.
//
// - Auth-token parameters remain in signatures but are IGNORED (Firestore
//   security rules enforce ownership via request.auth instead).
// - Every function try/catches and resolves to null / [] exactly like the old
//   apiFetch, so offline failures degrade silently instead of crashing.
// - library hours / events / study rooms / health stay on the old api.js —
//   they are intentionally NOT implemented here.
// - Only single-field equality queries are used on sections (no composite
//   indexes exist); all sorting is done client-side.

import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import * as progressLib from './progress';

// =============================================================================
// SHARED HELPERS / MAPPERS
// =============================================================================

// SQL ids were integers; Firestore doc ids are strings. Keep numeric-looking
// ids numeric (ProgressScreen compares `p.id === parseInt(view)`).
const normalizeId = (v) => {
  if (v === null || v === undefined) return v;
  const s = String(v);
  return /^-?\d+$/.test(s) ? parseInt(s, 10) : s;
};

// Must match the backend's instructor slug exactly.
const instructorSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'unknown';

const logError = (fn, error) => {
  const msg = error.message || String(error);
  // Permission-denied during an auth transition (sign-out revokes the token
  // while reads for the old uid are in flight) is expected noise, not a bug —
  // every caller already handles the null/[] result. Log quietly.
  if (/insufficient permissions|permission-denied/i.test(msg)) {
    console.log(`Firestore ${fn} skipped (auth transition):`, msg);
    return;
  }
  console.error(`Firestore fetch failed for ${fn}:`, msg);
};

// programs/{id} -> legacy program row
function mapProgram(docId, d) {
  return {
    id: normalizeId(docId),
    name: d.name ?? '',
    type: d.type ?? '',
    degree: d.degree ?? null,
    school: d.school ?? null,
    min_credits: d.minCredits ?? null,
    description: d.description ?? null,
  };
}

// courses/{code}.fillStats (per-term registration fill history written by the
// backend Admin SDK) -> legacy snake_case fill_stats; null when absent.
function mapFillStats(fs) {
  if (!fs || typeof fs !== 'object') return null;
  return {
    term_code: fs.termCode ?? null,
    class: fs.class ?? null,
    days_to_90: fs.daysTo90 ?? null,
    date_at_90: fs.dateAt90 ?? null,
    final_pct: fs.finalPct ?? null,
    cap_changed: !!fs.capChanged,
  };
}

// courses/{code} -> legacy course row (synthetic stable id = course code;
// screens use `id` for selection identity, so it must always be present)
function mapCourse(docId, d) {
  const code = d.code || docId;
  return {
    id: code,
    code,
    name: d.name ?? '',
    credits: d.credits ?? 3,
    department: d.department ?? '',
    subject_area: d.subjectArea ?? '',
    learning_style: d.learningStyle ?? '',
    work_style: d.workStyle ?? '',
    teaching_style: d.teachingStyle ?? '',
    assessment_type: d.assessmentType ?? '',
    description: d.description ?? null,
    semester: d.semester ?? null,
    fill_stats: mapFillStats(d.fillStats),
  };
}

// terms/{t}/sections/{classNumber} -> legacy section row.
// NOTE the legacy key is `instructor` (NOT instructor_name), and the meeting
// time fields stay "H:MMAM/PM" strings — screens parseInt() + .includes('PM').
function mapSection(docId, d) {
  const enr = d.enrollment || {};
  const classNumber = d.classNumber ?? docId;
  return {
    id: classNumber,
    term_code: d.termCode ?? '',
    subject: d.subject ?? '',
    catalog_number: d.catalogNumber ?? '',
    section_number: d.sectionNumber ?? '',
    class_number: classNumber,
    title: d.title ?? '',
    instructor: d.instructorName ?? '',
    meeting_days: d.meetingDays ?? '',
    meeting_time_start: d.meetingTimeStart ?? '',
    meeting_time_end: d.meetingTimeEnd ?? '',
    room: d.room ?? '',
    building: d.building ?? '',
    enrollment_cap: Number(enr.cap) || 0,
    enrollment_total: Number(enr.total) || 0,
    waitlist_cap: Number(enr.waitlistCap) || 0,
    waitlist_total: Number(enr.waitlistTotal) || 0,
    instruction_mode: d.instructionMode ?? '',
    component: d.component ?? '',
    status: d.status ?? '',
    start_date: d.startDate ?? '',
    end_date: d.endDate ?? '',
    // 30-point enrollment time series written by firestore-sync
    // ([{date,total,cap,waitlist?}]) — waitlist absent on older points.
    recent_history: Array.isArray(d.recentHistory) ? d.recentHistory : [],
  };
}

// firestore-sync.js keeps sections that vanished from LOCUS and marks them
// status:'removed' instead of deleting. The legacy backend hard-deleted those
// rows, so screens never saw them — filter them out here too.
function isRemovedSection(row) {
  return String(row.status).toLowerCase() === 'removed';
}

// buildings/{name} -> legacy building row
function mapBuilding(docId, d) {
  return {
    id: docId,
    name: d.name || docId,
    address: d.address ?? '',
    latitude: d.latitude,
    longitude: d.longitude,
    campus: d.campus ?? '',
  };
}

const bySectionNumber = (a, b) =>
  String(a.section_number).localeCompare(String(b.section_number));
const bySubjectCatalog = (a, b) =>
  String(a.subject).localeCompare(String(b.subject)) ||
  String(a.catalog_number).localeCompare(String(b.catalog_number)) ||
  String(a.section_number).localeCompare(String(b.section_number));

const sectionsCol = (termCode) => collection(db, 'terms', String(termCode), 'sections');

// ---- module-memory caches (catalog data is immutable within a session) ----
let _coursesPromise = null; // -> { list: [rows], byCode: Map }
async function loadCourses() {
  if (!_coursesPromise) {
    _coursesPromise = (async () => {
      const snap = await getDocs(collection(db, 'courses'));
      const list = snap.docs.map((d) => mapCourse(d.id, d.data()));
      list.sort((a, b) => String(a.code).localeCompare(String(b.code))); // ORDER BY code
      const byCode = new Map(list.map((c) => [c.code, c]));
      return { list, byCode };
    })().catch((e) => {
      _coursesPromise = null; // allow retry after a failure
      throw e;
    });
  }
  return _coursesPromise;
}

let _instructorsPromise = null; // -> [{ id: slug, name }]
async function loadInstructors() {
  if (!_instructorsPromise) {
    _instructorsPromise = (async () => {
      const snap = await getDocs(collection(db, 'instructors'));
      return snap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id }));
    })().catch((e) => {
      _instructorsPromise = null;
      throw e;
    });
  }
  return _instructorsPromise;
}

let _buildingsPromise = null; // -> [building rows]
async function loadBuildings() {
  if (!_buildingsPromise) {
    _buildingsPromise = (async () => {
      const snap = await getDocs(collection(db, 'buildings'));
      const list = snap.docs.map((d) => mapBuilding(d.id, d.data()));
      list.sort((a, b) => String(a.name).localeCompare(String(b.name))); // ORDER BY name
      return list;
    })().catch((e) => {
      _buildingsPromise = null;
      throw e;
    });
  }
  return _buildingsPromise;
}

// Backend building lookup was `name LIKE %q%` and took the first match.
async function findBuilding(name) {
  if (!name) return null;
  const buildings = await loadBuildings();
  const q = String(name).toLowerCase();
  return buildings.find((b) => String(b.name).toLowerCase().includes(q)) || null;
}

// =============================================================================
// WALK TIME (verbatim port of backend/walktime.js)
// =============================================================================

// Haversine formula: distance in meters between two GPS coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate walk time between two places — returns { from, to, distance_m, walk_minutes }
function calculateWalkTime(buildingA, buildingB) {
  if (!buildingA || !buildingB) return null;

  const straightLine = haversineDistance(
    buildingA.latitude, buildingA.longitude,
    buildingB.latitude, buildingB.longitude
  );

  // Walking factor: paths aren't straight lines, multiply by 1.3
  const walkingDistance = straightLine * 1.3;

  // Average walking speed: 80 meters per minute
  const walkMinutes = Math.ceil(walkingDistance / 80);

  return {
    from: buildingA.name,
    to: buildingB.name,
    distance_m: Math.round(walkingDistance),
    walk_minutes: walkMinutes,
  };
}

// =============================================================================
// CATALOG
// =============================================================================

// Get programs, optionally filtered by type ('major' or 'minor')
export const fetchPrograms = async (type) => {
  try {
    const colRef = collection(db, 'programs');
    const snap = type
      ? await getDocs(query(colRef, where('type', '==', type)))
      : await getDocs(colRef);
    const rows = snap.docs.map((d) => mapProgram(d.id, d.data()));
    rows.sort((a, b) => String(a.name).localeCompare(String(b.name))); // ORDER BY name
    return rows;
  } catch (error) {
    logError('fetchPrograms', error);
    return null;
  }
};

// Get a single program with its required courses ({ ...program, courses })
export const fetchProgramDetail = async (programId) => {
  try {
    if (programId === null || programId === undefined || programId === '') return null;
    const snap = await getDoc(doc(db, 'programs', String(programId)));
    if (!snap.exists()) return null; // old apiFetch returned null on 404
    const program = mapProgram(snap.id, snap.data());
    const courses = await progressLib.getProgramCourses(programId);
    return { ...program, courses };
  } catch (error) {
    logError('fetchProgramDetail', error);
    return null;
  }
};

// api.js exposed the same endpoint under both names
export const fetchProgramById = fetchProgramDetail;

// Get all courses
export const fetchCourses = async () => {
  try {
    const { list } = await loadCourses();
    return [...list];
  } catch (error) {
    logError('fetchCourses', error);
    return null;
  }
};

// Search courses by name or code (backend: LIKE %q% on name OR code)
export const searchCourses = async (q) => {
  try {
    if (!q) return [];
    const { list } = await loadCourses();
    const needle = String(q).toLowerCase();
    return list.filter(
      (c) =>
        String(c.name).toLowerCase().includes(needle) ||
        String(c.code).toLowerCase().includes(needle)
    );
  } catch (error) {
    logError('searchCourses', error);
    return null;
  }
};

// Get a single course by code
export const fetchCourseDetail = async (code) => {
  try {
    if (!code) return null;
    if (_coursesPromise) {
      const { byCode } = await loadCourses();
      if (byCode.has(code)) return byCode.get(code);
    }
    const snap = await getDoc(doc(db, 'courses', code));
    return snap.exists() ? mapCourse(snap.id, snap.data()) : null;
  } catch (error) {
    logError('fetchCourseDetail', error);
    return null;
  }
};

// Courses that filled fastest in the last registration cycle (F-QW1
// fastest-filling screen). fillStats is written per term by
// backend/fill-stats.js; 'day1-2' and 'first-week' are the vetted classes.
// Sorted by days-to-90%-full ascending. ~200 docs — fine as a one-shot read.
export const fetchFastestFilling = async (limitN = 100) => {
  try {
    const snap = await getDocs(query(
      collection(db, 'courses'),
      where('fillStats.class', 'in', ['day1-2', 'first-week'])
    ));
    const rows = snap.docs.map((d) => mapCourse(d.id, d.data()));
    rows.sort((a, b) =>
      ((a.fill_stats && a.fill_stats.days_to_90) ?? 999) -
      ((b.fill_stats && b.fill_stats.days_to_90) ?? 999) ||
      String(a.code).localeCompare(String(b.code))
    );
    return rows.slice(0, limitN);
  } catch (error) {
    logError('fetchFastestFilling', error);
    return [];
  }
};

// Get prerequisites for a course -> [{ prerequisite_code }]
export const fetchPrerequisites = async (code) => {
  try {
    if (!code) return [];
    const snap = await getDoc(doc(db, 'courses', code));
    if (!snap.exists()) return [];
    const prereqs = snap.data().prerequisites;
    return Array.isArray(prereqs)
      ? prereqs.map((p) => ({ prerequisite_code: p }))
      : [];
  } catch (error) {
    logError('fetchPrerequisites', error);
    return null;
  }
};

// =============================================================================
// TERMS & LIVE SECTIONS
// =============================================================================

// Get available terms -> [{ code, name, last_scraped }] sorted code DESC.
// Term parent docs may not exist yet — fall back to the registration term.
const FALLBACK_TERMS = [{ code: '1266', name: 'Fall 2026' }];
export const getTerms = async () => {
  try {
    const snap = await getDocs(collection(db, 'terms'));
    if (snap.empty) return [...FALLBACK_TERMS];
    const rows = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        code: d.id,
        name: data.name || d.id,
        last_scraped: data.lastScraped ?? null,
      };
    });
    rows.sort((a, b) => String(b.code).localeCompare(String(a.code))); // ORDER BY code DESC
    return rows;
  } catch (error) {
    logError('getTerms', error);
    return [...FALLBACK_TERMS];
  }
};

// Get all sections for a specific course in a term
export const getCourseSections = async (termCode, courseCode) => {
  try {
    const [subject, catalogNumber] = String(courseCode || '').split(' ');
    if (!subject || !catalogNumber) return [];
    const snap = await getDocs(
      query(
        sectionsCol(termCode),
        where('courseCode', '==', `${subject.toUpperCase()} ${catalogNumber}`)
      )
    );
    const rows = snap.docs
      .map((d) => mapSection(d.id, d.data()))
      .filter((r) => !isRemovedSection(r));
    rows.sort(bySectionNumber); // ORDER BY section_number
    return rows;
  } catch (error) {
    logError('getCourseSections', error);
    return [];
  }
};

// Get all sections for a department in a term
export const getDepartmentSections = async (termCode, subject) => {
  try {
    if (!subject) return [];
    const snap = await getDocs(
      query(sectionsCol(termCode), where('subject', '==', String(subject).toUpperCase()))
    );
    const rows = snap.docs
      .map((d) => mapSection(d.id, d.data()))
      .filter((r) => !isRemovedSection(r));
    rows.sort(bySubjectCatalog); // ORDER BY catalog_number, section_number
    return rows;
  } catch (error) {
    logError('getDepartmentSections', error);
    return [];
  }
};

// Get instructors who teach a specific course -> [{ instructor }]
export const getCourseInstructors = async (termCode, courseCode) => {
  try {
    const sections = await getCourseSections(termCode, courseCode);
    const names = [...new Set(sections.map((s) => s.instructor).filter(Boolean))];
    names.sort((a, b) => a.localeCompare(b)); // ORDER BY instructor
    return names.map((instructor) => ({ instructor }));
  } catch (error) {
    logError('getCourseInstructors', error);
    return [];
  }
};

// Search for sections by instructor name. Backend did LIKE %name% over
// sections.instructor; here: substring-match the cached instructors list
// locally, then equality-query sections by instructorId.
const MAX_INSTRUCTOR_MATCHES = 15;
export const searchByInstructor = async (termCode, name) => {
  try {
    if (!name) return [];
    const instructors = await loadInstructors();
    const needle = String(name).toLowerCase();
    const matches = instructors
      .filter((i) => String(i.name).toLowerCase().includes(needle))
      .slice(0, MAX_INSTRUCTOR_MATCHES);
    if (matches.length === 0) return [];

    const snaps = await Promise.all(
      matches.map((i) =>
        getDocs(query(sectionsCol(termCode), where('instructorId', '==', i.id)))
      )
    );
    const seen = new Set();
    const rows = [];
    for (const snap of snaps) {
      for (const d of snap.docs) {
        const row = mapSection(d.id, d.data());
        if (isRemovedSection(row)) continue;
        const key = String(row.class_number);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(row);
      }
    }
    rows.sort(bySubjectCatalog); // ORDER BY subject, catalog_number
    return rows;
  } catch (error) {
    logError('searchByInstructor', error);
    return [];
  }
};

// Get enrollment stats for a course
export const getCourseEnrollment = async (termCode, courseCode) => {
  try {
    const sections = await getCourseSections(termCode, courseCode);
    return sections.map((s) => ({
      section_number: s.section_number,
      enrollment_cap: s.enrollment_cap,
      enrollment_total: s.enrollment_total,
      waitlist_cap: s.waitlist_cap,
      waitlist_total: s.waitlist_total,
      status: s.status,
      instructor: s.instructor,
    }));
  } catch (error) {
    logError('getCourseEnrollment', error);
    return [];
  }
};

// Get specific sections by class number via direct doc gets (section doc id
// IS the class number string — no queries, no composite indexes). Missing and
// removed sections drop out; input order is preserved for the survivors.
export const getSectionsByClassNumbers = async (termCode, classNumbers) => {
  try {
    if (!termCode || !Array.isArray(classNumbers) || classNumbers.length === 0) return [];
    const ids = [...new Set(classNumbers.map((n) => String(n)).filter(Boolean))];
    const snaps = await Promise.all(ids.map((id) => getDoc(doc(sectionsCol(termCode), id))));
    return snaps
      .filter((snap) => snap.exists())
      .map((snap) => mapSection(snap.id, snap.data()))
      .filter((row) => !isRemovedSection(row));
  } catch (error) {
    logError('getSectionsByClassNumbers', error);
    return [];
  }
};

// =============================================================================
// BUILDINGS & WALK TIME
// =============================================================================

export const fetchBuildings = async () => {
  try {
    const buildings = await loadBuildings();
    return [...buildings];
  } catch (error) {
    logError('fetchBuildings', error);
    return [];
  }
};

export const fetchWalkTime = async (fromBuilding, toBuilding) => {
  try {
    const [a, b] = await Promise.all([findBuilding(fromBuilding), findBuilding(toBuilding)]);
    if (!a || !b) return null;
    return calculateWalkTime(a, b);
  } catch (error) {
    logError('fetchWalkTime', error);
    return null;
  }
};

export const fetchWalkTimeFromHome = async (uid, buildingName) => {
  try {
    const home = await fetchUserPrimaryLocation(uid);
    if (!home || home.error) return null;
    const building = await findBuilding(buildingName);
    if (!building) return null;
    return calculateWalkTime(
      { name: home.label, latitude: home.latitude, longitude: home.longitude },
      building
    );
  } catch (error) {
    logError('fetchWalkTimeFromHome', error);
    return null;
  }
};

// =============================================================================
// USER PROFILE
// =============================================================================

const resolveUid = (uid) => uid || (auth.currentUser ? auth.currentUser.uid : null);

export const fetchUserProfile = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return { error: 'No profile found' }; // legacy server shape
    const d = snap.data();
    const minorsIds = Array.isArray(d.selectedMinors) ? d.selectedMinors : [];

    const profile = {
      user_id: userId,
      selected_program_id: d.selectedProgramId ?? null,
      selected_program2_id: d.selectedProgram2Id ?? null,
      selected_minors: minorsIds,
      selected_minors_parsed: minorsIds,
      graduation_year: d.graduationYear ?? '',
      class_year: d.classYear ?? '',
      is_honors: d.isHonors === true,
      is_athlete: d.isAthlete === true,
      selected_focus_id: d.selectedFocusId ?? null,
      privacy_policy_version: d.privacyPolicyVersion ?? null,
      privacy_policy_accepted_at: d.privacyPolicyAcceptedAt ?? null,
      terms_version: d.termsVersion ?? null,
      terms_accepted_at: d.termsAcceptedAt ?? null,
    };

    // Hydrate full program objects like the backend did (skip 'undecided' —
    // there is no such program doc; AppContext handles the sentinel itself)
    const [program, program2, minors] = await Promise.all([
      profile.selected_program_id && profile.selected_program_id !== 'undecided'
        ? progressLib.getProgramById(profile.selected_program_id)
        : Promise.resolve(null),
      profile.selected_program2_id
        ? progressLib.getProgramById(profile.selected_program2_id)
        : Promise.resolve(null),
      Promise.all(minorsIds.map((id) => progressLib.getProgramById(id))),
    ]);
    if (program) profile.program = program;
    if (program2) profile.program2 = program2;
    profile.minors = minors.filter(Boolean);
    return profile;
  } catch (error) {
    logError('fetchUserProfile', error);
    return null;
  }
};

// Save user profile. Sends ONLY fields the firestore.rules profile validator
// allows; graduationYear/classYear are coerced to strings (rules: optStr).
export const saveUserProfile = async (uid, profileData, _authToken) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    const data = profileData || {};
    const payload = {
      updatedAt: serverTimestamp(),
    };
    // Program selections are include-when-provided: a partial save (e.g. the
    // push-token-only write from push.js) must NOT null the user's programs or
    // empty their minors under merge:true. Full-profile callers (AccountSetup,
    // ProfileScreen) always pass all three keys, so their writes are unchanged.
    if ('selectedProgramId' in data) {
      payload.selectedProgramId = data.selectedProgramId ?? null; // idRefOk allows null
    }
    if ('selectedProgram2Id' in data) {
      payload.selectedProgram2Id = data.selectedProgram2Id ?? null;
    }
    if ('selectedMinors' in data) {
      payload.selectedMinors = Array.isArray(data.selectedMinors) ? data.selectedMinors.slice(0, 20) : [];
    }
    // graduationYear/classYear are optional strings in the rules. Include them
    // ONLY when the caller provided the key — otherwise merge:true must leave
    // the stored value alone (callers that omit classYear must not wipe it).
    if (data.graduationYear !== undefined) {
      payload.graduationYear = String(data.graduationYear ?? '').slice(0, 10);
    }
    if (data.classYear !== undefined) {
      payload.classYear = String(data.classYear ?? '').slice(0, 12);
    }
    // Priority flags: rules type-check these as booleans. Include ONLY when the
    // caller passed a real boolean — `false` must be written (toggle OFF), but
    // undefined must be omitted so merge:true leaves the stored value alone.
    if (typeof data.isHonors === 'boolean') payload.isHonors = data.isHonors;
    if (typeof data.isAthlete === 'boolean') payload.isAthlete = data.isAthlete;
    // expoPushToken: optional string (rules: optStr <=300). Include ONLY when
    // provided as a non-empty string so merge:true leaves stored tokens alone.
    if (typeof data.expoPushToken === 'string' && data.expoPushToken) {
      payload.expoPushToken = data.expoPushToken.slice(0, 300);
    }
    // selectedFocusId: optional string (rules: optStr <=120 — a string when
    // present, so clearing must REMOVE the key via deleteField(), not write
    // null). Include when the key is present; undefined leaves the stored
    // value alone under merge:true.
    if ('selectedFocusId' in data) {
      payload.selectedFocusId = data.selectedFocusId == null
        ? deleteField()
        : String(data.selectedFocusId).slice(0, 120);
    }
    // privacyPolicyVersion: optional string (rules: optStr <=20). Include ONLY
    // when provided as a non-empty string, and stamp the acceptance moment
    // server-side — consent records must not trust the device clock.
    if (typeof data.privacyPolicyVersion === 'string' && data.privacyPolicyVersion) {
      payload.privacyPolicyVersion = data.privacyPolicyVersion.slice(0, 20);
      payload.privacyPolicyAcceptedAt = serverTimestamp();
    }
    // termsVersion: the Terms of Service acceptance stamp — identical
    // semantics to privacyPolicyVersion above.
    if (typeof data.termsVersion === 'string' && data.termsVersion) {
      payload.termsVersion = data.termsVersion.slice(0, 20);
      payload.termsAcceptedAt = serverTimestamp();
    }
    const ref = doc(db, 'users', userId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(ref, payload, { merge: true });
    return { success: true };
  } catch (error) {
    logError('saveUserProfile', error);
    return null;
  }
};

// =============================================================================
// USER COURSES
// =============================================================================

export const fetchUserCourses = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return [];
    return await progressLib.getUserCourses(userId);
  } catch (error) {
    logError('fetchUserCourses', error);
    return [];
  }
};

export const addUserCourse = async (uid, courseCode, grade, semester, _authToken) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !courseCode) return null;
    // Rules reject nulls and unknown keys — send only string fields present.
    const payload = { courseCode, status: 'completed' }; // backend always set 'completed'
    if (grade != null && grade !== '') payload.grade = String(grade);
    if (semester != null && semester !== '') payload.semester = String(semester);
    await setDoc(doc(db, 'users', userId, 'courses', courseCode), payload);
    return { success: true };
  } catch (error) {
    logError('addUserCourse', error);
    return null;
  }
};

export const removeUserCourse = async (uid, courseCode, _authToken) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !courseCode) return null;
    await deleteDoc(doc(db, 'users', userId, 'courses', courseCode));
    return { success: true };
  } catch (error) {
    logError('removeUserCourse', error);
    return null;
  }
};

// =============================================================================
// USER SCHEDULES (v1: ONE schedule per term — doc id IS the termCode)
// =============================================================================

// users/{uid}/schedules/{termCode} -> legacy schedule shape, or null when the
// user has no saved schedule for that term. THROWS on read errors so callers
// can distinguish "no schedule" from "couldn't read" — returning null on error
// let a later save silently overwrite an existing schedule.
export const fetchSchedule = async (uid, termCode) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode) return null;
    const snap = await getDoc(doc(db, 'users', userId, 'schedules', String(termCode)));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      name: d.name ?? '',
      term_code: d.termCode ?? String(termCode),
      section_ids: Array.isArray(d.sectionIds) ? d.sectionIds.map((s) => String(s)) : [],
    };
  } catch (error) {
    logError('fetchSchedule', error);
    throw error;
  }
};

// Save the term's schedule. Sends ONLY fields the firestore.rules schedule
// validator allows (name/termCode/sectionIds/createdAt/updatedAt). Rules
// reject null values — `name` is OMITTED when falsy, never sent as null;
// createdAt is only written on create (mirrors saveUserProfile).
export const saveSchedule = async (uid, termCode, sectionIds, name) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode || !Array.isArray(sectionIds)) return null;
    // firestore.rules cap: sectionIds list <= 40. Fail loudly instead of
    // silently truncating — callers must enforce the cap with a user message.
    if (sectionIds.length > 40) return null;
    const payload = {
      termCode: String(termCode).slice(0, 12),
      sectionIds: sectionIds.slice(0, 40).map((s) => String(s)), // rules backstop: list <= 40
      updatedAt: serverTimestamp(),
    };
    if (name) payload.name = String(name).slice(0, 80);
    const ref = doc(db, 'users', userId, 'schedules', String(termCode));
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(ref, payload, { merge: true });
    return { success: true };
  } catch (error) {
    logError('saveSchedule', error);
    return null;
  }
};

export const deleteSchedule = async (uid, termCode) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode) return null;
    await deleteDoc(doc(db, 'users', userId, 'schedules', String(termCode)));
    return { success: true };
  } catch (error) {
    logError('deleteSchedule', error);
    return null;
  }
};

// Add one section to the term's saved schedule (used by CourseDetailModal's
// quick-add, F-P3). Returns { added } | { already } | { full } | null (error).
export const addSectionToSchedule = async (uid, termCode, classNumber) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode || classNumber == null) return null;
    const current = (await fetchSchedule(userId, termCode)) || { section_ids: [] };
    const ids = current.section_ids.map(String);
    const num = String(classNumber);
    if (ids.includes(num)) return { already: true };
    if (ids.length >= 40) return { full: true };
    const res = await saveSchedule(userId, termCode, [...ids, num], current.name);
    return res ? { added: true } : null;
  } catch (error) {
    logError('addSectionToSchedule', error);
    return null;
  }
};

// =============================================================================
// WHAT-IF EXPLORER (lean program-requirement reads)
// =============================================================================

// Requirement rows WITHOUT the per-course doc joins — the what-if explorer
// sweeps 200+ programs and only needs codes + requirement structure for
// requirement-progress math (matching is by code; credits default to 3).
// getProgramCourses' full join would fire thousands of doc reads here.
// Session-cached: requirements only change on an admin ETL.
const _programReqCache = new Map();
export const fetchProgramRequirementRowsLean = async (programId) => {
  const key = String(programId);
  if (_programReqCache.has(key)) return _programReqCache.get(key);
  try {
    const snap = await getDocs(collection(db, 'programs', key, 'requiredCourses'));
    const rows = snap.docs.map((d) => {
      const data = d.data();
      if (data.requirementType === 'subject_elective') {
        return {
          requirement_type: 'subject_elective',
          subject: data.subject || '',
          min_level: data.minLevel ?? null,
          count: data.count ?? 1,
        };
      }
      return {
        code: data.courseCode || d.id,
        credits: 3,
        requirement_type: data.requirementType || 'required',
        choice_group: data.choiceGroup ?? null,
        choose_count: data.chooseCount ?? null,
      };
    });
    _programReqCache.set(key, rows);
    return rows;
  } catch (error) {
    logError('fetchProgramRequirementRowsLean', error);
    return [];
  }
};

// =============================================================================
// FEEDBACK (write-only mailbox; rules: create-only, uid must match caller)
// =============================================================================

// type: 'bug' | 'data' | 'idea'; context: free-form origin tag (e.g. course
// code or screen name). Anonymous users may submit too — auth.currentUser is
// the source of truth for uid, matching the rules check.
export const submitFeedback = async ({ type, message, context } = {}) => {
  try {
    const uid = auth.currentUser?.uid;
    const msg = String(message || '').trim();
    if (!uid || msg.length < 3) return null;
    await addDoc(collection(db, 'feedback'), {
      uid,
      type: String(type || 'bug').slice(0, 20),
      message: msg.slice(0, 2000),
      context: String(context || '').slice(0, 200),
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logError('submitFeedback', error);
    return null;
  }
};

// =============================================================================
// MULTI-YEAR PLANS (users/{uid}/plans/{termCode}) — F-P1
// =============================================================================
// firestore.rules validPlan: hasOnly ['termCode','courseCodes','createdAt',
// 'updatedAt'], courseCodes list <= 15. Course codes only — no sections; the
// schedule builder owns section-level choices for the registration term.

export const PLAN_TERM_CAP = 15;

// All plan docs -> { [termCode]: [courseCodes] }.
export const fetchPlans = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return {};
    const snap = await getDocs(collection(db, 'users', userId, 'plans'));
    const out = {};
    for (const d of snap.docs) {
      const data = d.data();
      out[data.termCode || d.id] = Array.isArray(data.courseCodes)
        ? data.courseCodes.map(String)
        : [];
    }
    return out;
  } catch (error) {
    logError('fetchPlans', error);
    return {};
  }
};

export const savePlan = async (uid, termCode, courseCodes) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode || !Array.isArray(courseCodes)) return null;
    if (courseCodes.length > PLAN_TERM_CAP) return null; // rules cap — caller messages
    const ref = doc(db, 'users', userId, 'plans', String(termCode));
    const payload = {
      termCode: String(termCode).slice(0, 12),
      courseCodes: courseCodes.slice(0, PLAN_TERM_CAP).map((c) => String(c).slice(0, 20)),
      updatedAt: serverTimestamp(),
    };
    const existing = await getDoc(ref);
    if (!existing.exists()) payload.createdAt = serverTimestamp();
    await setDoc(ref, payload, { merge: true });
    return { success: true };
  } catch (error) {
    logError('savePlan', error);
    return null;
  }
};

// Returns { added } | { already } | { full } | null.
export const addCourseToPlan = async (uid, termCode, courseCode) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode || !courseCode) return null;
    const plans = await fetchPlans(userId);
    const codes = plans[String(termCode)] || [];
    const norm = String(courseCode).trim().replace(/\s+/g, ' ').toUpperCase();
    if (codes.some((c) => c.toUpperCase() === norm)) return { already: true };
    if (codes.length >= PLAN_TERM_CAP) return { full: true };
    const res = await savePlan(userId, termCode, [...codes, norm]);
    return res ? { added: true } : null;
  } catch (error) {
    logError('addCourseToPlan', error);
    return null;
  }
};

export const removeCourseFromPlan = async (uid, termCode, courseCode) => {
  try {
    const userId = resolveUid(uid);
    if (!userId || !termCode || !courseCode) return null;
    const plans = await fetchPlans(userId);
    const codes = plans[String(termCode)] || [];
    const norm = String(courseCode).trim().replace(/\s+/g, ' ').toUpperCase();
    const next = codes.filter((c) => c.toUpperCase() !== norm);
    if (next.length === codes.length) return { success: true }; // nothing to remove
    const res = await savePlan(userId, termCode, next);
    return res ? { success: true } : null;
  } catch (error) {
    logError('removeCourseFromPlan', error);
    return null;
  }
};

// =============================================================================
// SEAT WATCHES (users/{uid}/watches/{classNumber})
// =============================================================================
// firestore.rules validWatch is keys().hasOnly(['termCode','classNumber',
// 'createdAt']) — NEVER send any other key, and NEVER null (optStr rejects it).
// Backend poller state lives in the separate admin-only watchPoller collection,
// so these docs stay exactly this shape and client re-writes always validate.

// All of the user's seat watches -> [{ class_number, term_code }], optionally
// narrowed to one term. Legacy docs without a termCode are kept (better a
// stale bell than a silently invisible watch).
export const fetchWatches = async (uid, termCode) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return [];
    const snap = await getDocs(collection(db, 'users', userId, 'watches'));
    const rows = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        class_number: String(data.classNumber ?? d.id),
        term_code: data.termCode != null ? String(data.termCode) : '',
      };
    });
    return termCode
      ? rows.filter((r) => !r.term_code || r.term_code === String(termCode))
      : rows;
  } catch (error) {
    logError('fetchWatches', error);
    return [];
  }
};

// Watch a section for open seats. Doc id IS the class number (same convention
// as terms/{t}/sections). Payload is EXACTLY the validator's allowlist.
export const addWatch = async (uid, termCode, classNumber) => {
  try {
    const userId = resolveUid(uid);
    const classNum = String(classNumber ?? '').slice(0, 12);
    if (!userId || !classNum || !termCode) return null;
    await setDoc(doc(db, 'users', userId, 'watches', classNum), {
      termCode: String(termCode).slice(0, 12),
      classNumber: classNum,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    logError('addWatch', error);
    return null;
  }
};

export const removeWatch = async (uid, classNumber) => {
  try {
    const userId = resolveUid(uid);
    const classNum = String(classNumber ?? '');
    if (!userId || !classNum) return null;
    await deleteDoc(doc(db, 'users', userId, 'watches', classNum));
    return { success: true };
  } catch (error) {
    logError('removeWatch', error);
    return null;
  }
};

// =============================================================================
// USER LOCATIONS (home, dorm, custom)
// =============================================================================

const mapLocation = (uid, docId, d) => ({
  user_id: uid,
  label: d.label || docId,
  address: d.address ?? '',
  latitude: d.latitude,
  longitude: d.longitude,
  is_primary: d.isPrimary ? 1 : 0,
});

export const fetchUserLocations = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return [];
    const snap = await getDocs(collection(db, 'users', userId, 'locations'));
    const rows = snap.docs.map((d) => mapLocation(userId, d.id, d.data()));
    // ORDER BY is_primary DESC, label
    rows.sort(
      (a, b) => b.is_primary - a.is_primary || String(a.label).localeCompare(String(b.label))
    );
    return rows;
  } catch (error) {
    logError('fetchUserLocations', error);
    return [];
  }
};

export const fetchUserPrimaryLocation = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    const snap = await getDocs(
      query(collection(db, 'users', userId, 'locations'), where('isPrimary', '==', true))
    );
    if (snap.empty) return { error: 'No primary location set' }; // legacy server shape
    const d = snap.docs[0];
    return mapLocation(userId, d.id, d.data());
  } catch (error) {
    logError('fetchUserPrimaryLocation', error);
    return null;
  }
};

export const setUserLocation = async (uid, label, address, latitude, longitude, isPrimary, _authToken) => {
  try {
    const userId = resolveUid(uid);
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!userId || !label || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    // If setting as primary, unset any existing primary first (like backend)
    if (isPrimary) {
      const primaries = await getDocs(
        query(collection(db, 'users', userId, 'locations'), where('isPrimary', '==', true))
      );
      await Promise.all(
        primaries.docs
          .filter((d) => d.id !== label)
          .map((d) => updateDoc(d.ref, { isPrimary: false }))
      );
    }

    await setDoc(doc(db, 'users', userId, 'locations', label), {
      label: String(label).slice(0, 60),
      address: String(address ?? '').slice(0, 300),
      latitude: lat,
      longitude: lon,
      isPrimary: !!isPrimary,
    });
    return { success: true };
  } catch (error) {
    logError('setUserLocation', error);
    return null;
  }
};

export const setUserDorm = async (uid, dormName, _authToken) => {
  try {
    const dorm = await findBuilding(dormName);
    if (!dorm) return { error: 'Dorm not found' }; // legacy server shape
    const result = await setUserLocation(uid, 'My Dorm', dorm.address, dorm.latitude, dorm.longitude, true);
    if (!result) return null;
    return { success: true, dorm };
  } catch (error) {
    logError('setUserDorm', error);
    return null;
  }
};

// =============================================================================
// RIASEC QUIZ
// =============================================================================

export const saveQuizResults = async (uid, quizData, _authToken) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    const data = quizData || {};
    if (!data.scores || typeof data.scores !== 'object') return null; // server 400'd
    const payload = {
      scores: data.scores,
      profileName: String(data.profileName ?? '').slice(0, 60),
      answers: data.answers && typeof data.answers === 'object' && !Array.isArray(data.answers)
        ? data.answers
        : {},
      schedulingPrefs:
        data.schedulingPrefs && typeof data.schedulingPrefs === 'object' ? data.schedulingPrefs : {},
      createdAt: serverTimestamp(),
    };
    if (typeof data.code === 'string') payload.code = data.code.slice(0, 12);
    await setDoc(doc(db, 'users', userId, 'private', 'quiz'), payload);
    return { success: true };
  } catch (error) {
    logError('saveQuizResults', error);
    return null;
  }
};

export const fetchQuizResults = async (uid) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    const snap = await getDoc(doc(db, 'users', userId, 'private', 'quiz'));
    if (!snap.exists()) return { error: 'No quiz results found' }; // legacy server shape
    const d = snap.data();
    return {
      user_id: userId,
      scores: d.scores || {},
      code: d.code ?? null,
      profile_name: d.profileName ?? '',
      answers: d.answers || {},
      scheduling_prefs: d.schedulingPrefs || {},
      created_at: d.createdAt ?? null,
    };
  } catch (error) {
    logError('fetchQuizResults', error);
    return null;
  }
};

// Base recommendations for a RIASEC code
export const fetchQuizRecommendations = async (code) => {
  try {
    return await progressLib.getRecommendationsForCode(String(code || '').toUpperCase());
  } catch (error) {
    logError('fetchQuizRecommendations', error);
    return [];
  }
};

// Single focus-area doc by id — restores the saved selection at boot (B10).
// Same legacy shape as getFocusAreasForProgram rows; null when missing.
export const fetchFocusAreaById = async (focusId) => {
  try {
    if (focusId == null || focusId === '') return null;
    const snap = await getDoc(doc(db, 'focusAreas', String(focusId)));
    if (!snap.exists()) return null;
    const data = snap.data();
    const riasecMap = data.riasec && typeof data.riasec === 'object' ? data.riasec : {};
    return {
      id: snap.id,
      program_id: data.programId ?? null,
      name: data.name ?? '',
      description: data.description ?? null,
      riasec: Object.entries(riasecMap).map(([dimension, weight]) => ({ dimension, weight })),
      courses: Array.isArray(data.courses) ? data.courses : [],
    };
  } catch (error) {
    logError('fetchFocusAreaById', error);
    return null;
  }
};

// Ranked focus areas for a program. Server behavior: no uid, or no quiz
// results -> unranked list (no fitScore key); else ranked by RIASEC fit.
export const fetchQuizFocusAreas = async (programId, uid) => {
  try {
    if (!uid) return await progressLib.getFocusAreasForProgram(programId);
    const quiz = await fetchQuizResults(uid);
    if (!quiz || quiz.error || !quiz.scores) {
      return await progressLib.getFocusAreasForProgram(programId);
    }
    return await progressLib.getRankedFocusAreas(programId, quiz.scores);
  } catch (error) {
    logError('fetchQuizFocusAreas', error);
    return [];
  }
};

// Enriched recommendations with feasibility data (replicates the server-side
// sort: feasible first, then original rank)
export const fetchEnrichedRecommendations = async (code, uid, gradYear) => {
  try {
    const enriched = await progressLib.getEnrichedRecommendations(
      String(code || '').toUpperCase(),
      resolveUid(uid),
      gradYear || ''
    );
    enriched.sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      return (a.rank || 99) - (b.rank || 99);
    });
    return enriched;
  } catch (error) {
    logError('fetchEnrichedRecommendations', error);
    return [];
  }
};

// =============================================================================
// DEGREE / CORE PROGRESS
// =============================================================================

export const fetchDegreeProgress = async (uid, programId) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    return await progressLib.getDegreeProgress(userId, programId);
  } catch (error) {
    logError('fetchDegreeProgress', error);
    return null;
  }
};

export const fetchUserCoreProgress = async (uid, school) => {
  try {
    const userId = resolveUid(uid);
    if (!userId) return null;
    return await progressLib.getUserCoreProgress(userId, school || null);
  } catch (error) {
    logError('fetchUserCoreProgress', error);
    return null;
  }
};

export const fetchCoreAreas = async (school) => {
  try {
    return school
      ? await progressLib.getCoreAreasForSchool(school)
      : await progressLib.getCoreAreas();
  } catch (error) {
    logError('fetchCoreAreas', error);
    return null;
  }
};
