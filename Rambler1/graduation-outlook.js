/**
 * graduation-outlook.js
 *
 * Pure graduation-pacing heuristic for RamblerRegistrar. Zero React / Firebase imports.
 *
 * HEURISTIC (v1 spec):
 * - semestersLeft: count remaining Fall + Spring semesters from `now` through Spring of
 *   graduationYear, inclusive. Fall = Aug–Dec, Spring = Jan–May. If `now` falls in
 *   June or July (summer), the next semester is that year's Fall. A semester currently
 *   IN PROGRESS counts as remaining (e.g. in October, the current Fall still counts —
 *   you can still complete courses in it). gradYear means graduating in Spring of that
 *   year. Result is clamped at 0.
 * - remainingUnits = degreeProgress.remainingCount + sum of remainingCount over
 *   additionalDegreeProgress (second major / minors, when provided) + (coreProgress ?
 *   number of core areas with status 'incomplete' : 0). NOTE: this DOUBLE-COUNTS
 *   courses that satisfy requirements in more than one program (or a program
 *   requirement and a core area). That is accepted as a conservative (pessimistic)
 *   estimate.
 * - pace = remainingUnits / max(semestersLeft, 1), rounded to 1 decimal.
 * - status:
 *     'unknown'   — no degreeProgress, or no valid graduationYear.
 *     'off-track' — pace > 5, OR (semestersLeft === 0 && remainingUnits > 0).
 *     'at-risk'   — 4 < pace <= 5.
 *     'on-track'  — pace <= 4.
 * - unitsOverPace = max(0, remainingUnits - 4 * semestersLeft): course units
 *   beyond a sustainable 4-per-semester load — the size of the student's gap.
 * - fifthYear (at-risk/off-track only, else null): the same pacing recomputed
 *   with 2 extra semesters (graduating one Spring later). wouldBeOnTrack tells
 *   the UI whether that extra year clears the risk.
 *
 * This is a heuristic only — see OUTLOOK_DISCLAIMER.
 */

export const OUTLOOK_DISCLAIMER =
  'This outlook is an estimate. It does not model electives, GPA requirements, ' +
  'credit-hour minimums, or transfer credit. The official degree audit in LOCUS ' +
  'is authoritative. Always confirm your graduation plan with your advisor.';

/**
 * Parse a graduation year that may arrive as a string or number.
 * Returns an integer year, or null if invalid.
 */
function parseGradYear(graduationYear) {
  if (graduationYear === null || graduationYear === undefined || graduationYear === '') {
    return null;
  }
  const year = typeof graduationYear === 'string'
    ? Number(graduationYear.trim())
    : Number(graduationYear);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) return null;
  return year;
}

/**
 * Count remaining Fall + Spring semesters from `now` through Spring of graduationYear
 * (inclusive). A semester currently in progress counts. Clamped at 0.
 *
 * @param {string|number} graduationYear - graduating in Spring of this year
 * @param {Date} [now]
 * @returns {number|null} integer >= 0, or null if graduationYear is invalid
 */
export function semestersUntilGraduation(graduationYear, now = new Date()) {
  const gradYear = parseGradYear(graduationYear);
  if (gradYear === null) return null;
  if (!(now instanceof Date) || isNaN(now.getTime())) return null;

  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Index semesters on a linear scale: Spring Y = Y*2, Fall Y = Y*2 + 1.
  // Jan–May (0–4): Spring of `year` is in progress -> it counts.
  // Jun–Dec (5–11): next/current countable semester is Fall of `year`
  //   (Jun/Jul = summer, Fall is next; Aug–Dec = Fall in progress, it counts).
  const startIndex = month <= 4 ? year * 2 : year * 2 + 1;
  const targetIndex = gradYear * 2; // Spring of gradYear

  return Math.max(targetIndex - startIndex + 1, 0);
}

function countIncompleteCoreAreas(coreProgress) {
  if (!coreProgress || !Array.isArray(coreProgress.areas)) return 0;
  return coreProgress.areas.filter((a) => a && a.status === 'incomplete').length;
}

function plural(n, singular, pluralWord) {
  return n === 1 ? singular : (pluralWord || singular + 's');
}

/**
 * Compute the graduation outlook.
 *
 * @param {object} params
 * @param {object|null} params.degreeProgress - from getDegreeProgress() for the
 *   primary major. Anchors the outlook: if null, status is 'unknown'.
 * @param {Array<object|null>} [params.additionalDegreeProgress] - getDegreeProgress()
 *   results for any second major / minors. Their remainingCount adds to
 *   remainingUnits (conservative — overlap double-counts). Nulls (failed or
 *   unavailable fetches) are tolerated and contribute 0.
 * @param {object|null} [params.coreProgress] - from getUserCoreProgress()
 * @param {string|number|null} params.graduationYear
 * @param {Date} [params.now]
 * @returns {{ status: string, semestersLeft: number|null, remainingUnits: number|null,
 *            pace: number|null, message: string, gradLabel: string|null }}
 */
export function computeGraduationOutlook({ degreeProgress, additionalDegreeProgress, coreProgress, graduationYear, now } = {}) {
  const gradYear = parseGradYear(graduationYear);
  const gradLabel = gradYear !== null ? `Spring ${gradYear}` : null;
  const semestersLeft = gradYear !== null
    ? semestersUntilGraduation(gradYear, now || new Date())
    : null;

  // 'unknown': no program progress, or no valid graduation year.
  if (!degreeProgress || semestersLeft === null) {
    return {
      status: 'unknown',
      semestersLeft,
      remainingUnits: null,
      pace: null,
      unitsOverPace: null,
      fifthYear: null,
      message: !degreeProgress
        ? 'Select your program to see your graduation outlook.'
        : 'Set your graduation year to see your graduation outlook.',
      gradLabel,
    };
  }

  const remainingCount = Number.isFinite(degreeProgress.remainingCount)
    ? degreeProgress.remainingCount
    : 0;
  const additionalRemaining = (Array.isArray(additionalDegreeProgress) ? additionalDegreeProgress : [])
    .reduce((sum, p) => sum + (p && Number.isFinite(p.remainingCount) ? p.remainingCount : 0), 0);
  const remainingUnits = remainingCount + additionalRemaining + countIncompleteCoreAreas(coreProgress);

  const rawPace = remainingUnits / Math.max(semestersLeft, 1);
  const pace = Math.round(rawPace * 10) / 10;

  let status;
  if (rawPace > 5 || (semestersLeft === 0 && remainingUnits > 0)) {
    status = 'off-track';
  } else if (rawPace > 4) {
    status = 'at-risk';
  } else {
    status = 'on-track';
  }

  // The gap, in course units, past a sustainable 4-per-semester load. 0 when
  // on-track; with 0 semesters left every remaining unit is over pace.
  const ON_TRACK_PACE = 4;
  const unitsOverPace = Math.max(0, remainingUnits - ON_TRACK_PACE * semestersLeft);

  // Fifth-year projection: same load spread over 2 extra semesters (one more
  // Spring). Only computed when there is a risk for it to relieve.
  let fifthYear = null;
  if (status !== 'on-track') {
    const fifthYearSemesters = semestersLeft + 2;
    const fifthYearRawPace = remainingUnits / fifthYearSemesters;
    fifthYear = {
      gradLabel: `Spring ${gradYear + 1}`,
      semestersLeft: fifthYearSemesters,
      pace: Math.round(fifthYearRawPace * 10) / 10,
      wouldBeOnTrack: fifthYearRawPace <= ON_TRACK_PACE,
    };
  }

  // B12 honesty: programs whose requirements aren't loaded contribute 0 to
  // remainingUnits, silently flattering the outlook. Name them so the UI can
  // say so instead of overpromising.
  const unknownPrograms = [degreeProgress, ...(Array.isArray(additionalDegreeProgress) ? additionalDegreeProgress : [])]
    .filter((p) => p && p.requirementsUnknown === true)
    .map((p) => (p.program && p.program.name) || 'a selected program');

  let message;
  if (status === 'off-track') {
    if (semestersLeft === 0) {
      message =
        `${remainingUnits} ${plural(remainingUnits, 'requirement')} still remaining ` +
        `with no semesters left before ${gradLabel}. Talk to your advisor.`;
    } else {
      message =
        `${remainingUnits} ${plural(remainingUnits, 'requirement')} left with ` +
        `${semestersLeft} ${plural(semestersLeft, 'semester')} to go. That's ` +
        // "about", not "~" — the tilde renders like a minus sign in the serif.
        `about ${pace} courses/semester. Talk to your advisor.`;
    }
  } else if (status === 'at-risk') {
    message =
      `${remainingUnits} ${plural(remainingUnits, 'requirement')} left with ` +
      `${semestersLeft} ${plural(semestersLeft, 'semester')} to go. That's ` +
      (semestersLeft === 1
        ? 'a full 5-course load next semester.'
        : 'close to a full 5-course load every semester.');
  } else {
    // A grad year already behind us with nothing left to model isn't "on pace"
    // (future tense about a past date) — phrase it as complete instead.
    message = semestersLeft === 0
      ? `All modeled requirements complete for ${gradLabel}.`
      : `On pace to graduate ${gradLabel}.`;
  }

  if (status === 'at-risk' || status === 'off-track') {
    message +=
      ` You're ${unitsOverPace} ${plural(unitsOverPace, 'course unit')} beyond an on-track pace ` +
      `of 4 per semester. Without more time, that means overload semesters or summer terms.`;
    if (fifthYear.wouldBeOnTrack) {
      message +=
        ` Planning a fifth year (graduating ${fifthYear.gradLabel}) would bring you to ` +
        `about ${fifthYear.pace} courses/semester, no longer at risk.`;
    }
  }

  if (unknownPrograms.length > 0) {
    message += ` Requirements for ${unknownPrograms.join(', ')} aren't loaded yet and aren't counted.`;
  }

  return { status, semestersLeft, remainingUnits, pace, unitsOverPace, fifthYear, message, gradLabel, unknownPrograms };
}
