/**
 * planning-insights.js
 *
 * Pure planning heuristics for RamblerRegistrar. Zero React / Firebase imports.
 *
 * Two concerns:
 *  1. fillWarning(fillStats, classYear) — turn a course's empirical fill-speed
 *     stats (computed from last term's registration snapshots, Fall 2026 /
 *     term 1266) into a scarcity warning, tuned by the student's class year.
 *     Registration windows open one class level per day (seniors first), so
 *     underclassmen face real lockout risk on fast-filling courses.
 *  2. requirementCoverage(...) — given planned course codes, report which
 *     remaining requirements (major, additional programs, incomplete core
 *     areas) each planned course would satisfy.
 *
 * HONESTY RULES baked into fillWarning:
 *  - 'steady' / 'open' / missing stats -> NO warning (null). Open courses are
 *    often freshman-reserved cores that fill at summer orientation; a scarcity
 *    warning there would be misinformation.
 *  - capChanged -> soften with an estimate disclaimer (seat counts moved >20%
 *    during the term, so fill speed is approximate).
 */

const DAY12_HIGH_TEXT =
  'Filled before sophomore registration opened last term — have a backup plan.';
const DAY12_INFO_TEXT =
  'Fills on day one of registration — register the moment your window opens.';
const FIRST_WEEK_WARN_TEXT =
  'Filled during registration week last term — register the moment your window opens.';
const FIRST_WEEK_INFO_TEXT =
  'Fills within the first week of registration.';
const CAP_CHANGED_SUFFIX =
  ' (seat counts changed last term, so treat as an estimate)';
const ATHLETE_PRIORITY_TEXT =
  'Your athlete priority window opens before general registration — register early and you should be fine.';
const HONORS_PRIORITY_TEXT =
  'You have Honors priority — register right when your window opens.';

/**
 * @param {object|null} fillStats - { class: 'day1-2'|'first-week'|'steady'|'open',
 *   capChanged?: boolean, termCode?: string } or null/undefined.
 * @param {string|null} [classYear] - 'Freshman'|'Sophomore'|'Junior'|'Senior'
 *   (case-insensitive); ''/null/unknown values get the general 'info' variants.
 * @param {{ isHonors?: boolean, isAthlete?: boolean }} [priority] - registration
 *   priority flags. When the 2-arg result would be 'high' or 'warn':
 *   isAthlete === true downgrades to an 'info' athlete message (athletes
 *   register the Friday before registration week, ahead of everyone);
 *   otherwise isHonors === true downgrades to an 'info' Honors message
 *   (front of the line on their class day only — Honors does NOT let an
 *   underclassman beat earlier class days, so the message stays modest).
 *   Athlete takes precedence when both are true. 'info' and null results
 *   are never changed by priority flags.
 * @returns {{ level: 'high'|'warn'|'info', text: string }|null}
 */
export function fillWarning(fillStats, classYear, priority = {}) {
  if (!fillStats || typeof fillStats !== 'object') return null;
  const cls = typeof fillStats.class === 'string' ? fillStats.class : null;
  if (cls !== 'day1-2' && cls !== 'first-week') return null;

  const year = typeof classYear === 'string' ? classYear.trim().toLowerCase() : '';
  const isUnderclass = year === 'freshman' || year === 'sophomore';

  let level;
  let text;
  if (cls === 'day1-2') {
    if (isUnderclass) {
      level = 'high';
      text = DAY12_HIGH_TEXT;
    } else {
      level = 'info';
      text = DAY12_INFO_TEXT;
    }
  } else {
    if (isUnderclass) {
      level = 'warn';
      text = FIRST_WEEK_WARN_TEXT;
    } else {
      level = 'info';
      text = FIRST_WEEK_INFO_TEXT;
    }
  }

  if (level === 'high' || level === 'warn') {
    const p = priority && typeof priority === 'object' ? priority : {};
    if (p.isAthlete === true) {
      level = 'info';
      text = ATHLETE_PRIORITY_TEXT;
    } else if (p.isHonors === true) {
      level = 'info';
      text = HONORS_PRIORITY_TEXT;
    }
  }

  if (fillStats.capChanged === true) text += CAP_CHANGED_SUFFIX;
  return { level, text };
}

/** Normalize a course code for matching: trim, uppercase, collapse whitespace. */
function normalizeCode(code) {
  if (typeof code !== 'string') return null;
  const norm = code.trim().replace(/\s+/g, ' ').toUpperCase();
  return norm === '' ? null : norm;
}

/**
 * Add code -> requirement entry to the universe map (dedups by requirement
 * identity per code). `id` is a stable requirement-unit identity (e.g.
 * 'major:COMP 271', 'prog0:MATH 212', 'core:2') so coverage can count
 * distinct requirement units rather than planned courses.
 */
function addToUniverse(universe, code, id, label) {
  const norm = normalizeCode(code);
  if (!norm) return;
  let entries = universe.get(norm);
  if (!entries) {
    entries = [];
    universe.set(norm, entries);
  }
  if (!entries.some((e) => e.id === id)) entries.push({ id, label });
}

function remainingCodes(progress) {
  if (!progress || !Array.isArray(progress.remaining)) return [];
  return progress.remaining
    .map((r) => (r && r.code) || null)
    .filter(Boolean);
}

/**
 * Which remaining requirements do the planned courses cover?
 *
 * Universe of remaining requirements:
 *  - degreeProgress.remaining[].code, labeled with the program name (or
 *    'Major requirement').
 *  - each additionalDegreeProgress entry's remaining[].code, labeled with its
 *    program name (or '2nd program').
 *  - for each coreProgress area with status 'incomplete', every
 *    courseOptions[].course_code, labeled 'Core: <area name>'.
 *
 * remainingTotal uses the SAME definition as computeGraduationOutlook's
 * remainingUnits: degreeProgress.remainingCount + additional remainingCounts
 * + count of incomplete core areas.
 *
 * coveredCount counts DISTINCT requirement units covered (same per-unit
 * definition as remainingTotal): a core area is 1 unit no matter how many of
 * its options are planned, and one course satisfying both a major requirement
 * and a core area covers 2 units.
 *
 * @param {object} params
 * @param {object|null} params.degreeProgress
 * @param {Array<object|null>} [params.additionalDegreeProgress]
 * @param {object|null} [params.coreProgress]
 * @param {Array<string>|null} [params.plannedCourseCodes]
 * @returns {{ coveredCount: number,
 *             planned: Array<{ code: string, satisfies: string[] }>,
 *             remainingTotal: number }}
 */
export function requirementCoverage({
  degreeProgress,
  additionalDegreeProgress = [],
  coreProgress,
  plannedCourseCodes,
} = {}) {
  const universe = new Map(); // normalized code -> [{ id, label }]

  // Primary major. Each remaining course code is one requirement unit.
  const majorLabel =
    (degreeProgress && degreeProgress.program && degreeProgress.program.name) ||
    'Major requirement';
  for (const code of remainingCodes(degreeProgress)) {
    const norm = normalizeCode(code);
    addToUniverse(universe, code, `major:${norm}`, majorLabel);
  }

  // Additional programs (second major / minors). Units are per-program, so a
  // course remaining in two programs covers two units (matches remainingTotal).
  const additional = Array.isArray(additionalDegreeProgress) ? additionalDegreeProgress : [];
  additional.forEach((prog, progIndex) => {
    if (!prog) return;
    const label = (prog.program && prog.program.name) || '2nd program';
    for (const code of remainingCodes(prog)) {
      const norm = normalizeCode(code);
      addToUniverse(universe, code, `prog${progIndex}:${norm}`, label);
    }
  });

  // Incomplete core areas. The WHOLE area is one requirement unit, shared by
  // all of its course options.
  const areas = (coreProgress && Array.isArray(coreProgress.areas)) ? coreProgress.areas : [];
  let incompleteCoreAreas = 0;
  areas.forEach((area, areaIndex) => {
    if (!area || area.status !== 'incomplete') return;
    incompleteCoreAreas += 1;
    const label = area.name ? `Core: ${area.name}` : 'Core requirement';
    const options = Array.isArray(area.courseOptions) ? area.courseOptions : [];
    for (const opt of options) {
      addToUniverse(universe, opt && opt.course_code, `core:${areaIndex}`, label);
    }
    // School overrides: a 'double-count' area is also satisfiable by its
    // substitute course (progress.js checks it before the regular options) —
    // planning that course must count as covering this area too.
    if (
      area.override &&
      area.override.override_type === 'double-count' &&
      area.override.substitute_course
    ) {
      addToUniverse(universe, area.override.substitute_course, `core:${areaIndex}`, label);
    }
  });

  // Planned courses (dedup on normalized code, first occurrence wins).
  // coveredCount = distinct requirement units satisfied across all planned
  // courses (union of identities), NOT a count of planned courses.
  const planned = [];
  const seen = new Set();
  const coveredIds = new Set();
  const codes = Array.isArray(plannedCourseCodes) ? plannedCourseCodes : [];
  for (const raw of codes) {
    const norm = normalizeCode(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    const entries = universe.get(norm) || [];
    const satisfies = [];
    for (const entry of entries) {
      coveredIds.add(entry.id);
      if (!satisfies.includes(entry.label)) satisfies.push(entry.label);
    }
    planned.push({ code: norm, satisfies });
  }

  const coveredCount = coveredIds.size;

  const majorRemaining =
    degreeProgress && Number.isFinite(degreeProgress.remainingCount)
      ? degreeProgress.remainingCount
      : 0;
  const additionalRemaining = additional.reduce(
    (sum, p) => sum + (p && Number.isFinite(p.remainingCount) ? p.remainingCount : 0),
    0
  );
  const remainingTotal = majorRemaining + additionalRemaining + incompleteCoreAreas;

  return { coveredCount, planned, remainingTotal };
}

/**
 * One-line summary for the pacing strip.
 *
 * @param {object} params
 * @param {number} params.coveredCount
 * @param {number} params.plannedCount
 * @param {number|null} [params.neededPerSemester] - nullable; when absent the
 *   pace clause is omitted.
 * @returns {string} e.g. "Covers 2 of your remaining requirements — you need
 *   ~5/semester to stay on pace." Empty string when nothing is planned.
 */
export function coverageSummaryLine({ coveredCount, plannedCount, neededPerSemester } = {}) {
  const plannedN = Number.isFinite(plannedCount) ? plannedCount : 0;
  if (plannedN <= 0) return '';

  const coveredN = Number.isFinite(coveredCount) ? coveredCount : 0;
  const base = coveredN === 0
    ? `None of your ${plannedN} planned ${plannedN === 1 ? 'course covers' : 'courses cover'} a remaining requirement`
    : `Covers ${coveredN} of your remaining requirements`;

  if (Number.isFinite(neededPerSemester)) {
    // "about", not "~": the tilde renders like a minus sign in the brand serif
    // font ("~13/semester" read as "-13/semester" — caught in a visual check).
    return `${base} — you need about ${neededPerSemester}/semester to stay on pace.`;
  }
  return `${base}.`;
}
