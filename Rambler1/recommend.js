// recommend.js — PURE course-recommendation ordering (device-pass batch
// 2026-07-09). Zero react/firebase imports.
//
// One rule shared by every "Recommended for you" surface (Schedule add modal,
// Generate modal, Planning add modal, Fills Fast "for you"):
//   1. FOCUS-AREA courses first (the user picked a specialization — its key
//      courses get pushed hardest), tagged isFocus for a badge.
//   2. Then the remaining degree requirements in their natural order.
//   3. Placeholders (subject-elective rows) and excluded codes (already
//      scheduled/planned) never appear.

export const normCode = (code) => String(code || '').trim().replace(/\s+/g, ' ').toUpperCase();

/**
 * @param {object} p
 * @param {Array<{code, name?, is_placeholder?}>} p.remaining - degreeProgress.remaining rows
 * @param {Array<string>} [p.focusCourses] - selectedFocus.courses (codes)
 * @param {Iterable<string>} [p.excludeCodes] - codes to hide (scheduled/planned)
 * @param {number} [p.limit]
 * @returns {Array<{code, name, isFocus}>}
 */
export function buildRecommendations({ remaining, focusCourses, excludeCodes, limit = 6 } = {}) {
  const exclude = new Set([...(excludeCodes || [])].map(normCode));
  const focus = new Set((focusCourses || []).map(normCode));

  const seen = new Set();
  const focusFirst = [];
  const rest = [];
  for (const c of remaining || []) {
    if (!c || c.is_placeholder || !c.code) continue;
    const code = normCode(c.code);
    if (seen.has(code) || exclude.has(code)) continue;
    seen.add(code);
    const row = { code: c.code, name: c.name || '', isFocus: focus.has(code) };
    (row.isFocus ? focusFirst : rest).push(row);
  }

  // Focus courses that aren't in `remaining` (e.g. electives the focus values
  // beyond hard requirements) still deserve a slot — append after the
  // requirement-backed focus rows, before generic requirements.
  for (const raw of focusCourses || []) {
    const code = normCode(raw);
    if (!code || seen.has(code) || exclude.has(code)) continue;
    seen.add(code);
    focusFirst.push({ code: raw, name: '', isFocus: true });
  }

  return [...focusFirst, ...rest].slice(0, Math.max(1, limit));
}
