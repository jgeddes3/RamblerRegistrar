// progress.js — client-side port of the backend degree/core/recommendation
// logic (backend/db.js getDegreeProgress, getUserCoreProgress,
// getRecommendationsForCode, getEnrichedRecommendations,
// getFocusAreasForProgram, getRankedFocusAreas), reading from Firestore
// instead of sqlite but returning the EXACT legacy snake_case row shapes.
//
// NOTE (intentional, matches backend): none of these functions performs any
// prerequisite-satisfaction check, and a course "counts" as done if a doc
// simply exists in users/{uid}/courses — status/grade are never checked.
//
// This module is self-contained (Firestore only) so firestore-data.js can
// delegate to it without a circular import.

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { computeRequirementProgress } from './requirement-progress';

// =============================================================================
// SHARED HELPERS
// =============================================================================

// SQL ids were integers; Firestore doc ids are strings. Keep numeric-looking
// ids numeric so screens like ProgressScreen (`p.id === parseInt(view)`) work.
const normalizeId = (v) => {
  if (v === null || v === undefined) return v;
  const s = String(v);
  return /^-?\d+$/.test(s) ? parseInt(s, 10) : s;
};

// ORDER BY id (numeric when both numeric, else string compare)
const idCompare = (a, b) => {
  if (typeof a.id === 'number' && typeof b.id === 'number') return a.id - b.id;
  return String(a.id).localeCompare(String(b.id));
};

// courses/{code} doc (camelCase) -> legacy course row (snake_case)
function mapCourse(docId, d) {
  const code = d.code || docId;
  return {
    id: code, // stable synthetic id — screens use it for selection identity
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
  };
}

// programs/{id} doc (camelCase) -> legacy program row (snake_case)
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

// Module-level course cache (courses are immutable within a session)
const courseCache = new Map();
async function getCourseRow(code) {
  if (courseCache.has(code)) return courseCache.get(code);
  const snap = await getDoc(doc(db, 'courses', code));
  const row = snap.exists() ? mapCourse(snap.id, snap.data()) : null;
  courseCache.set(code, row);
  return row;
}

// =============================================================================
// BASE READS (ports of db.getProgramById / getProgramCourses / getUserCourses)
// =============================================================================

export async function getProgramById(programId) {
  if (programId === null || programId === undefined || programId === '') return null;
  const snap = await getDoc(doc(db, 'programs', String(programId)));
  return snap.exists() ? mapProgram(snap.id, snap.data()) : null;
}

// programs/{id}/requiredCourses/* joined with courses/{courseCode}.
// SQL INNER JOIN semantics: required courses missing from the catalog are dropped.
export async function getProgramCourses(programId) {
  const snap = await getDocs(
    collection(db, 'programs', String(programId), 'requiredCourses')
  );
  const rows = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      // Subject electives (B12 phase 2) are prose requirements ("any two
      // 300-level PHIL courses") — no course doc to join; pass through as-is.
      if (data.requirementType === 'subject_elective') {
        return {
          requirement_type: 'subject_elective',
          subject: data.subject || '',
          min_level: data.minLevel ?? null,
          count: data.count ?? 1,
          code: `${data.subject || ''} elective`,
        };
      }
      const code = data.courseCode || d.id;
      const course = await getCourseRow(code);
      if (!course) return null;
      return {
        ...course,
        requirement_type: data.requirementType || 'required',
        // Choice groups (B12): "pick chooseCount of the group's options".
        choice_group: data.choiceGroup ?? null,
        choose_count: data.chooseCount ?? null,
      };
    })
  );
  return rows
    .filter(Boolean)
    .sort((a, b) => String(a.code).localeCompare(String(b.code))); // ORDER BY c.code
}

export async function getUserCourses(uid) {
  if (!uid) return [];
  const snap = await getDocs(collection(db, 'users', uid, 'courses'));
  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      user_id: uid,
      course_code: data.courseCode || d.id,
      status: data.status ?? null,
      grade: data.grade ?? null,
      semester: data.semester ?? null,
    };
  });
  // ORDER BY semester, course_code
  rows.sort(
    (a, b) =>
      String(a.semester || '').localeCompare(String(b.semester || '')) ||
      String(a.course_code).localeCompare(String(b.course_code))
  );
  return rows;
}

// =============================================================================
// DEGREE PROGRESS (port of db.js getDegreeProgress — verbatim logic)
// =============================================================================

export async function getDegreeProgress(userId, programId) {
  // 1. Get program info
  const program = await getProgramById(programId);
  if (!program) return null;

  // 2 + 3. Program's required courses, and the user's completed courses
  const [requiredCourses, userCourses] = await Promise.all([
    getProgramCourses(programId),
    getUserCourses(userId),
  ]);
  const completedCodes = new Set(userCourses.map((uc) => uc.course_code));

  // 4. Compare required vs completed — choice-group aware (B12): a "pick N"
  // group counts as N units, not one unit per option. Pure math lives in
  // requirement-progress.js (unit-tested).
  const req = computeRequirementProgress(requiredCourses, completedCodes);
  const { completed, remaining } = req;

  // 5. Credits and unit counts come from the choice-aware math: an unmet
  // "pick 1 of 8" group is ONE remaining unit (~3 credits), not eight.
  const totalCreditsRequired = program.min_credits || (req.creditsCompleted + req.creditsRemaining);

  // 6. Return structured progress object
  return {
    program,
    // B12 honesty flag: many programs (all minors as of 2026-07) have no
    // requirement rows loaded yet. Zero requirements means "we don't know",
    // NOT "nothing left" — consumers must not read the zeros as progress.
    requirementsUnknown: requiredCourses.length === 0,
    totalRequired: req.totalRequired,
    completedCount: req.completedCount,
    remainingCount: req.remainingCount,
    creditsCompleted: req.creditsCompleted,
    creditsRemaining: req.creditsRemaining,
    totalCreditsRequired,
    percentComplete: req.percentComplete,
    completed,
    remaining,
  };
}

// =============================================================================
// CORE CURRICULUM (ports of getCoreAreas / getCoreAreasForSchool /
// getUserCoreProgress)
// =============================================================================

// coreAreas/{id} doc -> legacy core_areas row + embedded options re-exposed as
// the legacy core_course_options rows.
function mapCoreArea(docId, d) {
  const areaId = normalizeId(docId);
  const options = Array.isArray(d.options) ? d.options : [];
  return {
    id: areaId,
    name: d.name ?? '',
    category: d.category ?? '',
    tier: d.tier ?? null,
    parent_area_id: d.parentAreaId ?? null,
    courses_required: d.coursesRequired ?? 1,
    credits: d.credits ?? 3,
    description: d.description ?? null,
    courseOptions: options.map((o) => ({
      core_area_id: areaId,
      course_code: o.courseCode,
      is_required: o.isRequired ? 1 : 0,
    })),
  };
}

export async function getCoreAreas() {
  const snap = await getDocs(collection(db, 'coreAreas'));
  const areas = snap.docs.map((d) => mapCoreArea(d.id, d.data()));
  areas.sort(idCompare); // ORDER BY id
  return areas;
}

export async function getCoreAreasForSchool(school) {
  const [areas, ovSnap] = await Promise.all([
    getCoreAreas(),
    getDocs(query(collection(db, 'coreSchoolOverrides'), where('school', '==', school))),
  ]);
  const overrideMap = {};
  for (const d of ovSnap.docs) {
    const o = d.data();
    const coreAreaId = normalizeId(o.coreAreaId);
    overrideMap[String(coreAreaId)] = {
      school: o.school ?? school,
      core_area_id: coreAreaId,
      override_type: o.overrideType ?? null,
      substitute_course: o.substituteCourse ?? null,
      notes: o.notes ?? null,
    };
  }
  return areas.map((area) => ({
    ...area,
    override: overrideMap[String(area.id)] || null,
  }));
}

export async function getUserCoreProgress(userId, school) {
  // When school is falsy, areas carry NO `override` key at all (screens may
  // branch on presence) — exactly like the backend.
  const [areas, userCourses] = await Promise.all([
    school ? getCoreAreasForSchool(school) : getCoreAreas(),
    getUserCourses(userId),
  ]);
  const completedCodes = new Set(userCourses.map((uc) => uc.course_code));

  let completedAreas = 0;
  let totalAreas = 0;
  let completedCredits = 0;
  let totalCredits = 0;

  const areaProgress = areas.map((area) => {
    // Check if waived (excluded from all totals — early return)
    if (area.override && area.override.override_type === 'waived') {
      return { ...area, status: 'waived', satisfiedBy: area.override.notes };
    }

    totalAreas++;
    totalCredits += area.credits || 0;

    // Check if any of the area's course options are in user's completed courses
    const completedOption = area.courseOptions.find((opt) => completedCodes.has(opt.course_code));

    // Check double-count (wins the satisfiedBy label over the option match)
    if (area.override && area.override.override_type === 'double-count' && area.override.substitute_course) {
      if (completedCodes.has(area.override.substitute_course)) {
        completedAreas++;
        completedCredits += area.credits || 0;
        return { ...area, status: 'satisfied', satisfiedBy: area.override.substitute_course };
      }
    }

    if (completedOption) {
      completedAreas++;
      completedCredits += area.credits || 0;
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
}

// =============================================================================
// RIASEC RECOMMENDATIONS (ports of getRecommendationsForCode /
// getEnrichedRecommendations)
// =============================================================================

export async function getRecommendationsForCode(code) {
  if (!code) return [];
  // Try exact match first, then 2-letter prefix (same fallback as backend)
  let usedCode = code;
  let snap = await getDoc(doc(db, 'riasecRecommendations', code));
  if (!snap.exists() && code.length > 2) {
    usedCode = code.substring(0, 2);
    snap = await getDoc(doc(db, 'riasecRecommendations', usedCode));
  }
  if (!snap.exists()) return [];

  const data = snap.data();
  const recs = Array.isArray(data.recommendations) ? [...data.recommendations] : [];
  recs.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)); // ORDER BY r.rank ASC

  const rows = [];
  for (const r of recs) {
    // JOIN programs — recommendations whose program is missing are dropped
    const program = await getProgramById(r.programId);
    if (!program) continue;
    rows.push({
      id: rows.length + 1, // synthetic; screens never read it for identity
      code: usedCode,
      program_id: normalizeId(r.programId),
      rank: r.rank ?? null,
      rationale: r.rationale ?? null,
      program_name: program.name,
      degree: program.degree,
      school: program.school,
    });
  }
  return rows;
}

export async function getEnrichedRecommendations(code, userId, gradYear) {
  const recs = await getRecommendationsForCode(code);
  const currentYear = new Date().getFullYear();
  const gradYearNum = parseInt(gradYear) || (currentYear + 4);
  const semestersLeft = Math.max((gradYearNum - currentYear) * 2, 1);
  const coursesPerSemester = 5;

  const enriched = [];
  for (const rec of recs) {
    const progress = await getDegreeProgress(userId, rec.program_id);
    if (!progress) {
      enriched.push({ ...rec, remainingCourses: null, feasible: null });
      continue;
    }

    const remaining = progress.remainingCount;
    const estimatedSemesters = Math.ceil(remaining / coursesPerSemester);
    const feasible = remaining <= semestersLeft * coursesPerSemester;

    enriched.push({
      ...rec,
      remainingCourses: remaining,
      remainingCredits: progress.creditsRemaining,
      totalRequired: progress.totalRequired,
      completedCount: progress.completedCount,
      percentComplete: progress.percentComplete,
      estimatedSemesters,
      feasible,
      semestersLeft,
    });
  }
  return enriched;
}

// =============================================================================
// FOCUS AREAS (ports of getFocusAreasForProgram / getRankedFocusAreas)
// =============================================================================

// programId in Firestore may be stored as a number or a string — equality
// queries are type-sensitive, so try candidates until one matches.
async function queryFocusAreas(programId) {
  const colRef = collection(db, 'focusAreas');
  const candidates = [];
  const push = (v) => {
    if (v !== undefined && v !== null && !candidates.some((c) => c === v)) candidates.push(v);
  };
  push(programId);
  const n = Number(programId);
  if (Number.isFinite(n)) push(n);
  push(String(programId));

  for (const value of candidates) {
    const snap = await getDocs(query(colRef, where('programId', '==', value)));
    if (!snap.empty) return snap.docs;
  }
  return [];
}

export async function getFocusAreasForProgram(programId) {
  const docs = await queryFocusAreas(programId);
  const areas = docs.map((d) => {
    const data = d.data();
    const riasecMap = data.riasec && typeof data.riasec === 'object' ? data.riasec : {};
    return {
      id: normalizeId(d.id),
      program_id: normalizeId(data.programId),
      name: data.name ?? '',
      description: data.description ?? null,
      // Legacy shape: ARRAY of {dimension, weight} rows (Firestore stores a map)
      riasec: Object.entries(riasecMap).map(([dimension, weight]) => ({ dimension, weight })),
      courses: Array.isArray(data.courses) ? data.courses : [],
    };
  });
  areas.sort(idCompare); // ORDER BY id
  return areas;
}

export async function getRankedFocusAreas(programId, userScores) {
  const areas = await getFocusAreasForProgram(programId);
  // Score each focus area against user's RIASEC scores
  for (const area of areas) {
    area.fitScore = 0;
    for (const { dimension, weight } of area.riasec) {
      area.fitScore += ((userScores && userScores[dimension]) || 0) * (weight || 0);
    }
  }
  areas.sort((a, b) => b.fitScore - a.fitScore);
  return areas;
}
