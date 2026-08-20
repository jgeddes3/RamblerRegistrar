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
// then (F-HI4) optionally RE-RANKS by the user's quiz scheduling prefs — a
// small clamped adjustment so two students with the same courses see
// different orderings, never different feasibility.
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
// Personalization weights (F-HI4) — soft nudges from the scheduling-prefs quiz
// (quizResults.schedulingPrefs). Applied AFTER base scoring, and each
// candidate's total adjustment is clamped to +/-PERSONAL_CLAMP so hard filters,
// conflict-freeness, and the big WEIGHTS penalties still dominate: these
// reorder near-ties, they never rescue a bad schedule.
export const PERSONAL_WEIGHTS = {
  TIME_DAY: -3, // early/night: per day ending after 4 PM / starting before 10 AM
  TIME_MEETING: -2, // middle: per meeting outside 10 AM - 3 PM
  SHAPE_MATCH: 4, // mwf/tuth: per course meeting only on the preferred days
  SHAPE_MISS: -4, // mwf/tuth: per course meeting only on the mirror days
  FEWEST_DAY: -3, // fewest: per campus day beyond the first (stacks with EXTRA_DAY)
  SPREAD_DAY: 2, // spread: per campus day beyond the first (softens EXTRA_DAY)
  SIZE_MATCH: 3, // small/medium: per section with a cap in the preferred band
  SIZE_MISS: -3, // small: per section with cap over 50
  MODALITY_MATCH: 2, // in-person/online: per section in the preferred mode
  MODALITY_MISS: -3, // in-person/online: per section in the opposite mode
  CAMPUS_MATCH: 3, // lsc/wtc: per section resolving to the preferred campus
  CAMPUS_MISS: -5, // lsc/wtc: per section resolving to the other campus
};
export const PERSONAL_CLAMP = 25; // |total adjustment| never exceeds this

const TEN_AM = 10 * 60;
const THREE_PM = 15 * 60;
const FOUR_PM = 16 * 60;

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
// One course group's sections through the pref filter. reasons counts every
// rejection so notes can say exactly what blocked the course.
function filterGroup(sections, prefs) {
  const reasons = new Map(); // reason -> count
  const usable = [];
  for (const s of sections || []) {
    const reason = sectionFilterReason(s, prefs);
    if (reason) {
      reasons.set(reason, (reasons.get(reason) || 0) + 1);
      continue;
    }
    usable.push({ section: s, blocks: sectionsToBlocks([s]) });
  }
  return { usable, reasons };
}

// "3 end too late" — third-person reasons lose their -s when counted plural.
function countedReason(reason, n) {
  if (n === 1) return `1 ${reason}`;
  return `${n} ${reason.replace(/^(starts|ends|meets)\b/, (v) => v.slice(0, -1))}`;
}

function joinAnd(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const DAY_NAMES = {
  Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday',
  Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday',
};

// ---------------------------------------------------------------------------
// The DFS itself, shared by the main run and the failure probes so every
// probe searches exactly like the real thing. groups are copied before the
// fewest-options-first sort; occupancy is seeded fresh from seedBlocks.
function solve(groups, seedBlocks, { stepBudget, maxComplete }) {
  const ordered = [...groups].sort((a, b) => a.options.length - b.options.length);
  const occupied = new Map();
  place(seedBlocks, occupied);

  const complete = [];
  let steps = 0;
  let truncated = false;
  const chosen = [];

  const dfs = (i) => {
    if (complete.length >= maxComplete) { truncated = true; return; }
    if (i === ordered.length) {
      complete.push(chosen.map((c) => c.section));
      return;
    }
    for (const opt of ordered[i].options) {
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

  return { complete, truncated };
}

const PROBE_BUDGET = { stepBudget: 15000, maxComplete: 1 };
const solvable = (groups, seedBlocks) =>
  solve(groups, seedBlocks, PROBE_BUDGET).complete.length > 0;

// Re-filter every non-locked course under different prefs (probe input).
// Groups the main run dropped as empty can come back if the lift frees them.
function probeGroups(courseGroups, lockedCodes, prefs) {
  const out = [];
  for (const g of courseGroups) {
    const code = String(g.code || '').trim();
    if (lockedCodes.has(code.toUpperCase())) continue;
    const { usable } = filterGroup(g.sections, prefs);
    if (usable.length) out.push({ code, options: usable });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Why did the DFS come up empty? Deterministic probes, in blame order: a
// course whose removal unblocks, then a locked section whose removal
// unblocks, then a single filter whose lifting unblocks, else the courses
// simply overlap. Returned strings lead the notes array.
function diagnoseFailure({ groups, courseGroups, lockedCodes, lockedSections, lockedBlocks, prefs }) {
  const findings = [];

  // (a) leave-one-out: every group whose removal yields a solution is a blocker.
  const unblockers = groups
    .filter((g) => solvable(groups.filter((x) => x !== g), lockedBlocks))
    .map((g) => g.code);
  if (unblockers.length === 1) {
    findings.push(
      `${unblockers[0]} is the blocker. Every one of its sections that passes your filters ` +
      'collides with the rest. Drop it or relax a filter to free a schedule.'
    );
  } else if (unblockers.length > 1) {
    findings.push(
      `${joinAnd(unblockers)} each block the rest. Dropping any one of them would free a schedule.`
    );
  }

  // (b) locked-section probe, only when no course took the blame.
  if (!unblockers.length && lockedSections.length) {
    const lockedByCourse = new Map();
    for (const s of lockedSections) {
      const code = `${s.subject || ''} ${s.catalog_number || ''}`.trim();
      if (!lockedByCourse.has(code)) lockedByCourse.set(code, []);
      lockedByCourse.get(code).push(s);
    }
    for (const [code, secs] of lockedByCourse) {
      const otherBlocks = sectionsToBlocks(lockedSections.filter((s) => !secs.includes(s)));
      if (solvable(groups, otherBlocks)) {
        findings.push(`Your current ${code} section is the blocker. Every combination collides with it.`);
      }
    }
  }

  // (c) filter-relaxation probes: one active pref lifted at a time. Lifting a
  // pref only adds sections, so identical group shapes mean nothing changed.
  const baseline = new Map(groups.map((g) => [g.code, g.options.length]));
  const unchanged = (probed) =>
    probed.length === baseline.size &&
    probed.every((g) => baseline.get(g.code) === g.options.length);

  const lifts = [];
  if (prefs.openOnly !== false) {
    lifts.push([{ openOnly: false }, 'Allowing waitlisted and closed sections would free a schedule.']);
  }
  if (prefs.latestEnd != null) {
    lifts.push([{ latestEnd: null }, 'Relaxing your latest-class filter would free a schedule.']);
  }
  if (prefs.earliestStart != null) {
    lifts.push([{ earliestStart: null }, 'Relaxing your earliest-class filter would free a schedule.']);
  }
  if (Array.isArray(prefs.freeDays) && prefs.freeDays.length) {
    const days = joinAnd(prefs.freeDays.map((d) => DAY_NAMES[d] || d));
    lifts.push([{ freeDays: [] }, `Allowing classes on ${days} would free a schedule.`]);
  }
  for (const [lift, note] of lifts) {
    const probed = probeGroups(courseGroups, lockedCodes, { ...prefs, ...lift });
    if (unchanged(probed)) continue;
    if (solvable(probed, lockedBlocks)) findings.push(note);
  }

  // (d) nothing helped: check whether the courses can EVER coexist.
  if (!findings.length) {
    const noPrefs = { openOnly: false, earliestStart: null, latestEnd: null, freeDays: [] };
    const probed = probeGroups(courseGroups, lockedCodes, noPrefs);
    if (solvable(probed, lockedBlocks)) {
      findings.push(
        'Relaxing more than one filter at once would free a schedule. Loosen a couple of preferences together.'
      );
    } else {
      findings.push(
        'Even with every filter relaxed, these courses overlap in every combination. Try different courses.'
      );
      if (probed.length >= 2 && probed.length <= 6) {
        outer:
        for (let i = 0; i < probed.length; i++) {
          for (let j = i + 1; j < probed.length; j++) {
            if (!solvable([probed[i], probed[j]], [])) {
              findings.push(`${probed[i].code} and ${probed[j].code} overlap in every offered combination.`);
              break outer;
            }
          }
        }
      }
    }
  }

  return findings;
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
// personalizationAdjust (F-HI4) — quiz prefs nudge the RANKING of complete
// schedules. Pure; exported for tests and for explaining a candidate's order.
// sectionCampus is an optional (section) => 'LSC' | 'WTC' | null callback
// (campus data lives outside this pure module); when it is absent, throws, or
// returns anything else, the campus preference contributes nothing. Every
// heuristic skips sections that carry no signal (TBA times, missing cap or
// mode) rather than guessing.
export function personalizationAdjust(sections, schedulingPrefs, sectionCampus) {
  const p = schedulingPrefs || {};
  const list = Array.isArray(sections) ? sections : [];
  let delta = 0;
  const reasons = [];

  // Day envelope (first start / last end per day) drives the time prefs.
  const blocks = sectionsToBlocks(list);
  const byDay = new Map();
  for (const b of blocks) {
    const d = byDay.get(b.day);
    if (!d) byDay.set(b.day, { start: b.startMin, end: b.endMin });
    else {
      if (b.startMin < d.start) d.start = b.startMin;
      if (b.endMin > d.end) d.end = b.endMin;
    }
  }

  if (p.timePreference === 'early') {
    let n = 0;
    for (const d of byDay.values()) if (d.end > FOUR_PM) n++;
    if (n) {
      delta += n * PERSONAL_WEIGHTS.TIME_DAY;
      reasons.push(n === 1 ? '1 day ends after 4 PM' : `${n} days end after 4 PM`);
    }
  } else if (p.timePreference === 'night') {
    let n = 0;
    for (const d of byDay.values()) if (d.start < TEN_AM) n++;
    if (n) {
      delta += n * PERSONAL_WEIGHTS.TIME_DAY;
      reasons.push(n === 1 ? '1 day starts before 10 AM' : `${n} days start before 10 AM`);
    }
  } else if (p.timePreference === 'middle') {
    let n = 0;
    for (const b of blocks) if (b.startMin < TEN_AM || b.endMin > THREE_PM) n++;
    if (n) {
      delta += n * PERSONAL_WEIGHTS.TIME_MEETING;
      reasons.push(
        n === 1 ? '1 meeting outside 10 AM to 3 PM' : `${n} meetings outside 10 AM to 3 PM`
      );
    }
  }

  if (p.weekShape === 'mwf' || p.weekShape === 'tuth') {
    const mwfDays = ['Mo', 'We', 'Fr'];
    const tuthDays = ['Tu', 'Th'];
    const wantDays = p.weekShape === 'mwf' ? mwfDays : tuthDays;
    const avoidDays = p.weekShape === 'mwf' ? tuthDays : mwfDays;
    let hits = 0;
    let misses = 0;
    for (const s of list) {
      const days = new Set();
      for (const pat of parseMeetingPatterns(s)) for (const d of pat.days) days.add(d);
      if (!days.size) continue;
      if ([...days].every((d) => wantDays.includes(d))) hits++;
      else if ([...days].every((d) => avoidDays.includes(d))) misses++;
    }
    const wantLabel = p.weekShape === 'mwf' ? 'MoWeFr' : 'TuTh';
    const avoidLabel = p.weekShape === 'mwf' ? 'TuTh' : 'MoWeFr';
    if (hits) {
      delta += hits * PERSONAL_WEIGHTS.SHAPE_MATCH;
      reasons.push(
        hits === 1 ? `1 course meets only ${wantLabel}` : `${hits} courses meet only ${wantLabel}`
      );
    }
    if (misses) {
      delta += misses * PERSONAL_WEIGHTS.SHAPE_MISS;
      reasons.push(
        misses === 1
          ? `1 course meets only ${avoidLabel}`
          : `${misses} courses meet only ${avoidLabel}`
      );
    }
  } else if (p.weekShape === 'fewest') {
    const extra = Math.max(0, byDay.size - 1);
    if (extra) {
      delta += extra * PERSONAL_WEIGHTS.FEWEST_DAY;
      reasons.push(
        extra === 1 ? '1 campus day beyond the first' : `${extra} campus days beyond the first`
      );
    }
  } else if (p.weekShape === 'spread') {
    const extra = Math.max(0, byDay.size - 1);
    if (extra) {
      delta += extra * PERSONAL_WEIGHTS.SPREAD_DAY;
      reasons.push(`spread across ${byDay.size} days`);
    }
  }

  if (p.classSize === 'small' || p.classSize === 'medium') {
    let match = 0;
    let miss = 0;
    for (const s of list) {
      const cap = Number(s.enrollment_cap);
      if (!Number.isFinite(cap) || cap <= 0) continue;
      if (p.classSize === 'small') {
        if (cap <= 25) match++;
        else if (cap > 50) miss++;
      } else if (cap >= 25 && cap <= 50) match++;
    }
    if (match) {
      delta += match * PERSONAL_WEIGHTS.SIZE_MATCH;
      reasons.push(
        p.classSize === 'small'
          ? `${match} small section${match === 1 ? '' : 's'} (cap 25 or under)`
          : `${match} medium section${match === 1 ? '' : 's'} (cap 25 to 50)`
      );
    }
    if (miss) {
      delta += miss * PERSONAL_WEIGHTS.SIZE_MISS;
      reasons.push(`${miss} large section${miss === 1 ? '' : 's'} (cap over 50)`);
    }
  }

  if (p.modality === 'in-person' || p.modality === 'online') {
    let match = 0;
    let miss = 0;
    for (const s of list) {
      const mode = String(s.instruction_mode || '').toLowerCase();
      if (!mode) continue;
      const isOnline = mode.includes('online');
      if ((p.modality === 'online') === isOnline) match++;
      else miss++;
    }
    if (match) {
      delta += match * PERSONAL_WEIGHTS.MODALITY_MATCH;
      reasons.push(`${match} ${p.modality} section${match === 1 ? '' : 's'}`);
    }
    if (miss) {
      delta += miss * PERSONAL_WEIGHTS.MODALITY_MISS;
      const other = p.modality === 'online' ? 'in-person' : 'online';
      reasons.push(`${miss} ${other} section${miss === 1 ? '' : 's'}`);
    }
  }

  if ((p.campus === 'lsc' || p.campus === 'wtc') && typeof sectionCampus === 'function') {
    const want = p.campus === 'lsc' ? 'LSC' : 'WTC';
    let match = 0;
    let miss = 0;
    for (const s of list) {
      let campus = null;
      try { campus = sectionCampus(s); } catch (e) { campus = null; }
      if (campus !== 'LSC' && campus !== 'WTC') continue;
      if (campus === want) match++;
      else miss++;
    }
    if (match) {
      delta += match * PERSONAL_WEIGHTS.CAMPUS_MATCH;
      reasons.push(`${match} section${match === 1 ? '' : 's'} at ${want}`);
    }
    if (miss) {
      delta += miss * PERSONAL_WEIGHTS.CAMPUS_MISS;
      reasons.push(`${miss} section${miss === 1 ? '' : 's'} at ${want === 'LSC' ? 'WTC' : 'LSC'}`);
    }
  }

  delta = Math.max(-PERSONAL_CLAMP, Math.min(PERSONAL_CLAMP, Math.round(delta)));
  return { delta, reasons };
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
//   schedulingPrefs: quiz prefs (quizResults.schedulingPrefs) — re-ranks
//                   candidates via personalizationAdjust; score stays the
//                   universal base score, the delta rides in
//                   stats.personalization. Missing / all-"none" prefs leave
//                   the output identical to v1.
//   sectionCampus:  (section) => 'LSC' | 'WTC' | null, for the campus pref.
//
// Returns { candidates: [{ sections, score, stats }], notes: [string] }.
// When no schedule exists the notes LEAD with diagnoseFailure's findings —
// which course, locked section, or filter is to blame.
// Deterministic: no randomness, stable ordering (score desc, then insertion).
export function generateSchedules({
  courseGroups = [],
  lockedSections = [],
  prefs = {},
  walkMinutes = null,
  limit = 5,
  stepBudget = 50000,
  maxComplete = 400,
  schedulingPrefs = null,
  sectionCampus = null,
} = {}) {
  const notes = [];

  // Locked courses shouldn't also be generated — keep the locked section.
  const lockedCodes = new Set(
    lockedSections.map((s) => `${s.subject || ''} ${s.catalog_number || ''}`.trim().toUpperCase())
  );

  // Filter each group's sections by prefs; drop empty groups with a note
  // saying how many sections each filter took out.
  const groups = [];
  for (const g of courseGroups) {
    const code = String(g.code || '').trim();
    if (lockedCodes.has(code.toUpperCase())) {
      notes.push(`${code}: already on your schedule, so your current section was kept.`);
      continue;
    }
    const { usable, reasons } = filterGroup(g.sections, prefs);
    if (!usable.length) {
      const total = (g.sections || []).length;
      const why = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
      if (!total) {
        notes.push(`${code}: no sections found, so it was left out.`);
      } else if (total === 1) {
        notes.push(`${code}: its only section is blocked by your filters (${why[0][0]}).`);
      } else {
        notes.push(
          `${code}: all ${total} sections blocked by your filters ` +
          `(${why.map(([r, n]) => countedReason(r, n)).join(', ')}).`
        );
      }
      continue;
    }
    groups.push({ code, options: usable });
  }

  if (!groups.length) {
    return { candidates: [], notes };
  }

  // Seed occupancy with the locked sections (their internal conflicts, if any,
  // are the user's existing problem — we only guarantee new picks fit).
  const lockedBlocks = sectionsToBlocks(lockedSections);
  const { complete, truncated } = solve(groups, lockedBlocks, { stepBudget, maxComplete });

  if (!complete.length) {
    notes.unshift(
      ...diagnoseFailure({ groups, courseGroups, lockedCodes, lockedSections, lockedBlocks, prefs })
    );
    return { candidates: [], notes };
  }
  if (truncated) {
    notes.push('Lots of possibilities. Showing the best of the first few hundred found.');
  }

  const scored = complete.map((sectionSet, idx) => {
    const all = [...lockedSections, ...sectionSet];
    const { score, stats } = scoreSchedule(all, walkMinutes);
    return { sections: all, score, stats, idx, adjusted: score };
  });

  // Personalization (F-HI4): quiz prefs adjust the RANKING only — score stays
  // the universal base so the badge still means the same thing for everyone.
  // stats.personalization appears only when some candidate actually moved.
  if (schedulingPrefs) {
    let personalized = false;
    for (const c of scored) {
      const adj = personalizationAdjust(c.sections, schedulingPrefs, sectionCampus);
      c.adjusted = c.score + adj.delta;
      c.personalization = { applied: true, delta: adj.delta, reasons: adj.reasons };
      if (adj.delta !== 0) personalized = true;
    }
    if (personalized) {
      for (const c of scored) c.stats.personalization = c.personalization;
    }
  }
  scored.sort((a, b) => b.adjusted - a.adjusted || a.idx - b.idx);

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
