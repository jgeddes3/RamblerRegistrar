// schedule-generator.js — PURE walk-time-aware schedule generation (F-HI2).
// Zero react/firebase/expo imports, like schedule-utils. Works on the legacy
// snake_case section rows returned by firestore-data.js.
//
// Model: pick exactly ONE section per requested course (plus any locked
// sections the user already has), never overlapping in time, then score each
// complete schedule on the things LOCUS can't see:
//   - tight transfers (gap between classes < walking time between buildings)
//   - days on campus (fewer is better)
//   - idle time stuck on campus between classes
//   - lunch-break existence, very-early starts, very-late ends
//
// Search is DFS over courses ordered fewest-sections-first (classic CSP
// heuristic) with conflict pruning, a step budget, and a completion cap, so
// pathological inputs (8 courses x 20 sections) stay fast and deterministic.

import {
  parseMeetingPatterns,
  sectionsToBlocks,
  findTightGaps,
} from './schedule-utils';

// ---------------------------------------------------------------------------
// Scoring weights — one place to tune. Score starts at 100 and clamps at 0.
export const WEIGHTS = {
  TIGHT_GAP: -12, // per transfer where gap < walk time
  EXTRA_DAY: -6, // per day on campus beyond the first
  IDLE_PER_30MIN: -1.5, // per 30 idle minutes between classes (gaps > 15 min)
  NON_OPEN_SECTION: -20, // per Closed/Wait List section (only when allowed in)
  NO_LUNCH_DAY: -3, // per day with 11a-2p classes and no >=30 min break
  EARLY_DAY: -2, // per day starting before 9:00 AM
  LATE_DAY: -2, // per day ending after 6:00 PM
};

const LUNCH_START = 11 * 60; // 11:00 AM
const LUNCH_END = 14 * 60; // 2:00 PM
const EARLY_MIN = 9 * 60; // 9:00 AM
const LATE_MIN = 18 * 60; // 6:00 PM

// ---------------------------------------------------------------------------
// Hard preference filter for one section. Returns null when the section
// passes, else a short human reason (used to explain empty courses).
export function sectionFilterReason(section, prefs = {}) {
  const status = String(section.status || '');
  if (status === 'removed') return 'no longer offered';
  if (prefs.openOnly !== false && status !== 'Open') return 'not open';

  const patterns = parseMeetingPatterns(section);
  for (const p of patterns) {
    if (prefs.earliestStart != null && p.startMin < prefs.earliestStart) {
      return 'starts too early';
    }
    if (prefs.latestEnd != null && p.endMin > prefs.latestEnd) {
      return 'ends too late';
    }
    if (Array.isArray(prefs.freeDays) && prefs.freeDays.length) {
      for (const d of p.days) {
        if (prefs.freeDays.includes(d)) return `meets on ${d}`;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fast conflict check for DFS: occupied is a Map(day -> [{startMin,endMin}]).
// Touching endpoints (end === start) do NOT conflict (same as findConflicts).
function fits(blocks, occupied) {
  for (const b of blocks) {
    const day = occupied.get(b.day);
    if (!day) continue;
    for (const o of day) {
      if (b.startMin < o.endMin && o.startMin < b.endMin) return false;
    }
  }
  return true;
}

function place(blocks, occupied) {
  for (const b of blocks) {
    if (!occupied.has(b.day)) occupied.set(b.day, []);
    occupied.get(b.day).push({ startMin: b.startMin, endMin: b.endMin });
  }
}

function unplace(blocks, occupied) {
  for (const b of blocks) {
    const day = occupied.get(b.day);
    if (day) day.length -= 1; // blocks were pushed last — pop them in reverse
  }
}

// ---------------------------------------------------------------------------
// Score one complete schedule. Exported for tests and for re-scoring the
// user's current schedule in the UI ("your schedule scores 82").
export function scoreSchedule(sections, walkMinutes) {
  const blocks = sectionsToBlocks(sections);
  const byDay = new Map();
  for (const b of blocks) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }

  let idleMinutes = 0;
  let noLunchDays = 0;
  let earlyDays = 0;
  let lateDays = 0;
  let earliest = null;
  let latest = null;

  for (const dayBlocks of byDay.values()) {
    const sorted = [...dayBlocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const first = sorted[0].startMin;
    let lastEnd = sorted[0].endMin;
    let lunchBreak = false;

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].startMin - lastEnd;
      if (gap > 15) idleMinutes += gap;
      if (gap >= 30 && lastEnd >= LUNCH_START && sorted[i].startMin <= LUNCH_END) {
        lunchBreak = true;
      }
      if (sorted[i].endMin > lastEnd) lastEnd = sorted[i].endMin;
    }

    if (first <= LUNCH_START && lastEnd >= LUNCH_END - 60 && sorted.length > 1 && !lunchBreak) {
      noLunchDays++;
    }
    if (first < EARLY_MIN) earlyDays++;
    if (lastEnd > LATE_MIN) lateDays++;
    if (earliest == null || first < earliest) earliest = first;
    if (latest == null || lastEnd > latest) latest = lastEnd;
  }

  const tightGaps = typeof walkMinutes === 'function' ? findTightGaps(blocks, walkMinutes) : [];
  const daysOnCampus = byDay.size;
  const nonOpenCount = sections.filter((s) => String(s.status || '') !== 'Open').length;
  const unscheduledCount = sections.filter((s) => parseMeetingPatterns(s).length === 0).length;

  let score = 100;
  score += tightGaps.length * WEIGHTS.TIGHT_GAP;
  score += Math.max(0, daysOnCampus - 1) * WEIGHTS.EXTRA_DAY;
  score += (idleMinutes / 30) * WEIGHTS.IDLE_PER_30MIN;
  score += nonOpenCount * WEIGHTS.NON_OPEN_SECTION;
  score += noLunchDays * WEIGHTS.NO_LUNCH_DAY;
  score += earlyDays * WEIGHTS.EARLY_DAY;
  score += lateDays * WEIGHTS.LATE_DAY;
  score = Math.max(0, Math.round(score));

  return {
    score,
    stats: {
      daysOnCampus,
      earliestStart: earliest,
      latestEnd: latest,
      idleMinutes,
      tightGaps,
      nonOpenCount,
      noLunchDays,
      unscheduledCount,
    },
  };
}

// ---------------------------------------------------------------------------
// generateSchedules — the entry point.
//
//   courseGroups:   [{ code, sections: [legacy rows] }] — one section will be
//                   picked per group.
//   lockedSections: legacy rows the schedule is built AROUND (always included;
//                   never filtered by prefs).
//   prefs:          { openOnly=true, earliestStart=null (min), latestEnd=null,
//                     freeDays=['Fr'] }
//   walkMinutes:    (fromBuildingRaw, toBuildingRaw) -> minutes | null
//   limit:          max candidates returned (default 5)
//
// Returns { candidates: [{ sections, score, stats }], notes: [string] }.
// Deterministic: no randomness, stable ordering (score desc, then insertion).
export function generateSchedules({
  courseGroups = [],
  lockedSections = [],
  prefs = {},
  walkMinutes = null,
  limit = 5,
  stepBudget = 50000,
  maxComplete = 400,
} = {}) {
  const notes = [];

  // Locked courses shouldn't also be generated — keep the locked section.
  const lockedCodes = new Set(
    lockedSections.map((s) => `${s.subject || ''} ${s.catalog_number || ''}`.trim().toUpperCase())
  );

  // Filter each group's sections by prefs; drop empty groups with a note.
  const groups = [];
  for (const g of courseGroups) {
    const code = String(g.code || '').trim();
    if (lockedCodes.has(code.toUpperCase())) {
      notes.push(`${code}: already on your schedule, so your current section was kept.`);
      continue;
    }
    const reasons = new Map(); // reason -> count
    const usable = [];
    for (const s of g.sections || []) {
      const reason = sectionFilterReason(s, prefs);
      if (reason) {
        reasons.set(reason, (reasons.get(reason) || 0) + 1);
        continue;
      }
      usable.push({ section: s, blocks: sectionsToBlocks([s]) });
    }
    if (!usable.length) {
      const why = [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
      notes.push(
        `${code}: no sections match your filters${why.length ? ` (${why.join(', ')})` : ''}, so it was left out.`
      );
      continue;
    }
    groups.push({ code, options: usable });
  }

  if (!groups.length) {
    return { candidates: [], notes };
  }

  // Fewest options first — prunes the search tree fastest.
  groups.sort((a, b) => a.options.length - b.options.length);

  // Seed occupancy with the locked sections (their internal conflicts, if any,
  // are the user's existing problem — we only guarantee new picks fit).
  const occupied = new Map();
  const lockedBlocks = sectionsToBlocks(lockedSections);
  place(lockedBlocks, occupied);

  const complete = [];
  let steps = 0;
  let truncated = false;

  const chosen = [];
  const dfs = (i) => {
    if (complete.length >= maxComplete) { truncated = true; return; }
    if (i === groups.length) {
      complete.push(chosen.map((c) => c.section));
      return;
    }
    for (const opt of groups[i].options) {
      if (++steps > stepBudget) { truncated = true; return; }
      if (!fits(opt.blocks, occupied)) continue;
      place(opt.blocks, occupied);
      chosen.push(opt);
      dfs(i + 1);
      chosen.pop();
      unplace(opt.blocks, occupied);
      if (complete.length >= maxComplete || steps > stepBudget) return;
    }
  };
  dfs(0);

  if (!complete.length) {
    notes.push(
      'No conflict-free combination exists for these courses with your filters. ' +
      'Try removing a course or relaxing a filter.'
    );
    return { candidates: [], notes };
  }
  if (truncated) {
    notes.push('Lots of possibilities. Showing the best of the first few hundred found.');
  }

  const scored = complete.map((sectionSet, idx) => {
    const all = [...lockedSections, ...sectionSet];
    const { score, stats } = scoreSchedule(all, walkMinutes);
    return { sections: all, score, stats, idx };
  });
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);

  return {
    candidates: scored.slice(0, Math.max(1, limit)).map(({ sections, score, stats }) => ({
      sections, score, stats,
    })),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Tiny formatter for the results UI ("9:25 AM"). Exported for reuse/tests.
export function formatMinutes(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
