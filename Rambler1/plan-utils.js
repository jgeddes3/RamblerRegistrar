// plan-utils.js — PURE multi-year planning helpers (F-P1). Zero react/firebase.
//
// Loyola term codes: '1' + two-digit year + semester digit (2 = Spring,
// 6 = Fall). Fall 2026 -> '1266', Spring 2027 -> '1272'. (J-term/Summer are
// deliberately not planned — the planner covers Fall/Spring.)

export function termCodeFor(season, year) {
  const yy = String(year % 100).padStart(2, '0');
  return `1${yy}${season === 'Spring' ? 2 : 6}`;
}

export function termLabelFor(code) {
  const s = String(code);
  if (!/^1\d{3}$/.test(s)) return s;
  const year = 2000 + parseInt(s.slice(1, 3), 10);
  const sem = s[3] === '2' ? 'Spring' : s[3] === '6' ? 'Fall' : `Term ${s[3]}`;
  // Spring '1272' means Spring of 2027: the year digits already encode the
  // calendar year of the semester (Spring 27 -> '27').
  return `${sem} ${year}`;
}

/**
 * Upcoming plannable semesters, in order, from `now` through Spring of
 * graduationYear (inclusive). A semester currently in progress still counts
 * (same convention as graduation-outlook.semestersUntilGraduation).
 * Invalid/missing graduationYear falls back to the next `fallbackCount`
 * semesters so the planner still works pre-onboarding.
 *
 * Returns [{ code, label, season, year }].
 */
export function planSemesters(graduationYear, now = new Date(), fallbackCount = 8) {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // First plannable semester: Jan–May -> Spring of this year (in progress);
  // Jun–Dec -> Fall of this year.
  let season = month <= 4 ? 'Spring' : 'Fall';
  let y = year;

  const gradYear = Number(graduationYear);
  const validGrad = Number.isInteger(gradYear) && gradYear >= year && gradYear <= year + 10;

  const out = [];
  const cap = validGrad ? 24 : fallbackCount;
  while (out.length < cap) {
    out.push({ code: termCodeFor(season, y), label: `${season} ${y}`, season, year: y });
    if (validGrad && season === 'Spring' && y === gradYear) break;
    if (season === 'Spring') {
      season = 'Fall'; // same calendar year
    } else {
      season = 'Spring';
      y += 1;
    }
  }
  return out;
}

// Normalize a course code the same way planning-insights does.
export const normCode = (code) => String(code || '').trim().replace(/\s+/g, ' ').toUpperCase();

// Sustainable full load — mirrors graduation-outlook's "at-risk above 4,
// off-track above 5" thresholds: 5/semester is the ceiling, not the plan.
export const MAX_PACE_PER_SEMESTER = 5;

/**
 * What adding/switching to a program does to time-to-graduation (what-if
 * explorer). All unit counts use the same per-unit definition as the outlook.
 *
 * @param {object} p
 * @param {number} p.programRemainingCount - units this program still needs
 *   AFTER credit for the user's completed + planned courses
 * @param {number} p.baseRemainingCount - units still unplanned across the
 *   user's CURRENT programs + core
 * @param {number} p.semestersLeft - through Spring of graduationYear
 * @returns {{ fitsTimeline: boolean, addedSemesters: number,
 *             totalSemestersNeeded: number }}
 *  - fitsTimeline: can still graduate on time at <= maxPace
 *  - addedSemesters: marginal semesters vs. what they already needed
 */
export function programImpact({
  programRemainingCount,
  baseRemainingCount,
  semestersLeft,
  maxPace = MAX_PACE_PER_SEMESTER,
} = {}) {
  const base = Math.max(0, Number(baseRemainingCount) || 0);
  const addl = Math.max(0, Number(programRemainingCount) || 0);
  const sems = Math.max(1, Number(semestersLeft) || 1);
  const neededNow = Math.max(sems, Math.ceil(base / maxPace));
  const neededWith = Math.max(sems, Math.ceil((base + addl) / maxPace));
  return {
    fitsTimeline: neededWith <= sems,
    addedSemesters: neededWith - neededNow,
    totalSemestersNeeded: neededWith,
  };
}

/**
 * Prerequisite-ordering check across the multi-year plan (planner v2).
 * A planned course's prereq is satisfied when it's already completed OR
 * planned in an EARLIER semester. Otherwise:
 *   'same'    — prereq planned in the same semester (can't take concurrently*)
 *   'later'   — prereq planned after the course that needs it
 *   'missing' — prereq neither completed nor planned
 * (*LOCUS sometimes allows concurrent enrollment; we warn, not block.)
 *
 * @param {object} p
 * @param {Object<string,string[]>} p.planByTerm - {termCode: [courseCodes]}
 * @param {string[]} p.termOrder - termCodes in chronological order
 * @param {Object<string,string[]>} p.prereqsByCode - {courseCode: [prereqCodes]}
 * @param {Iterable<string>} p.completedCodes
 * @returns {Array<{code, term, prereq, reason}>}
 */
export function planOrderingIssues({ planByTerm, termOrder, prereqsByCode, completedCodes } = {}) {
  const done = new Set([...(completedCodes || [])].map(normCode));
  const order = new Map((termOrder || []).map((t, i) => [String(t), i]));
  const plannedIn = new Map(); // normCode -> earliest term index it's planned in
  for (const [term, codes] of Object.entries(planByTerm || {})) {
    const idx = order.has(String(term)) ? order.get(String(term)) : Infinity;
    for (const c of codes || []) {
      const n = normCode(c);
      if (!plannedIn.has(n) || idx < plannedIn.get(n)) plannedIn.set(n, idx);
    }
  }

  const issues = [];
  for (const [term, codes] of Object.entries(planByTerm || {})) {
    const idx = order.has(String(term)) ? order.get(String(term)) : Infinity;
    for (const c of codes || []) {
      const n = normCode(c);
      for (const prereqRaw of (prereqsByCode || {})[n] || []) {
        const prereq = normCode(prereqRaw);
        if (done.has(prereq)) continue;
        const pIdx = plannedIn.get(prereq);
        if (pIdx === undefined) {
          issues.push({ code: n, term: String(term), prereq, reason: 'missing' });
        } else if (pIdx === idx) {
          issues.push({ code: n, term: String(term), prereq, reason: 'same' });
        } else if (pIdx > idx) {
          issues.push({ code: n, term: String(term), prereq, reason: 'later' });
        }
      }
    }
  }
  return issues;
}

/**
 * Flatten a {termCode: [codes]} plan map into a de-duplicated list of codes
 * (for requirementCoverage / fill warnings). Later semesters keep the first
 * occurrence's position.
 */
export function allPlannedCodes(planByTerm) {
  const seen = new Set();
  const out = [];
  for (const codes of Object.values(planByTerm || {})) {
    for (const c of codes || []) {
      const n = normCode(c);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
