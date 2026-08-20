// schedule-utils.js — PURE schedule logic for the Schedule Builder.
// Zero react/firebase/expo imports. Works on the LEGACY snake_case section
// rows returned by firestore-data.js (meeting_days, meeting_time_start, ...).

// Stable 8-color palette assigned per courseCode (hash-based, order-independent).
// Categorical block colors, anchored on Loyola maroon. Validated (CVD-safe
// adjacent pairs, chroma floor, >=3:1 contrast on the white grid) — blocks are
// also always direct-labeled with the course code, so identity never rides on
// color alone. Greens deliberately never sit next to warm hues in this order.
export const COURSE_COLORS = [
  '#217A46', // green
  '#2E5E9E', // steel blue
  '#B07A21', // ochre
  '#A30046', // Loyola maroon
  '#0A87A8', // teal
  '#B5542B', // rust
  '#6B4E8E', // plum
  '#6E7C1F', // olive
];

const DAY_TOKENS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_SET = new Set(DAY_TOKENS);
const DAY_ORDER = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 7 };
// JS Date.getDay(): Sun=0 .. Sat=6
const DAY_TO_JS_DOW = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_TO_ICS = { Mo: 'MO', Tu: 'TU', We: 'WE', Th: 'TH', Fr: 'FR', Sa: 'SA', Su: 'SU' };

// ---------------------------------------------------------------------------
// 1. parseTimeToMinutes('8:15AM') -> 495 ; noon-safe ('12:35PM' -> 755,
//    '12:10AM' -> 10). Returns null for empty/garbage input.
export function parseTimeToMinutes(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === 'PM';
  if (hour < 1 || hour > 12 || min > 59) return null;
  if (hour === 12) hour = 0; // 12:xxAM -> 00:xx, 12:xxPM -> 12:xx after +12
  if (pm) hour += 12;
  return hour * 60 + min;
}

// ---------------------------------------------------------------------------
// 3. splitDays('MoWeFr') -> ['Mo','We','Fr']. Strict 2-char tokens; unknown
//    characters/tokens dropped; 'TBA' -> []. Result is de-duplicated.
export function splitDays(str) {
  if (typeof str !== 'string') return [];
  const out = [];
  let i = 0;
  while (i < str.length - 1) {
    const tok = str.slice(i, i + 2);
    if (DAY_SET.has(tok)) {
      if (!out.includes(tok)) out.push(tok);
      i += 2;
    } else {
      i += 1; // drop unknown char and keep scanning
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. parseMeetingPatterns(section) -> [{days:['Tu','Th'], startMin, endMin}].
//    - Simple rows: meeting_days + meeting_time_start/end.
//    - TBA / empty / unparseable days or times -> contributes nothing.
//    - MULTI-LINE meeting_days: first line = days for the primary times;
//      each later line matching 'DaysToken H:MMAM - H:MMPM' is an extra
//      pattern; later lines that are days-only are ignored. Identical
//      patterns are de-duplicated (theatre rows repeat lines).
const EXTRA_LINE_RE = /^((?:Mo|Tu|We|Th|Fr|Sa|Su)+)\s+(\S+)\s*-\s*(\S+)$/;

export function parseMeetingPatterns(section) {
  if (!section || typeof section !== 'object') return [];
  const raw = typeof section.meeting_days === 'string' ? section.meeting_days : '';
  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const patterns = [];
  const seen = new Set();
  const push = (days, startMin, endMin) => {
    // endMin <= startMin is bad LOCUS data — placing it would draw a block
    // outside the grid column and break overlap math. Treat as unscheduled.
    if (!days.length || startMin == null || endMin == null || endMin <= startMin) return;
    const key = days.join('') + '|' + startMin + '|' + endMin;
    if (seen.has(key)) return;
    seen.add(key);
    patterns.push({ days, startMin, endMin });
  };

  if (lines.length > 0) {
    // Primary pattern: first line's days + the row's meeting_time_start/end.
    push(
      splitDays(lines[0]),
      parseTimeToMinutes(section.meeting_time_start),
      parseTimeToMinutes(section.meeting_time_end)
    );
    // Extra embedded meetings on subsequent lines.
    for (let i = 1; i < lines.length; i++) {
      const m = lines[i].match(EXTRA_LINE_RE);
      if (!m) continue; // days-only or junk lines are ignored
      push(splitDays(m[1]), parseTimeToMinutes(m[2]), parseTimeToMinutes(m[3]));
    }
  }
  return patterns;
}

// ---------------------------------------------------------------------------
// Stable, order-independent color per courseCode via string hash.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; // djb2, unsigned
  }
  return h;
}

export function courseColor(courseCode) {
  return COURSE_COLORS[hashString(String(courseCode)) % COURSE_COLORS.length];
}

// ---------------------------------------------------------------------------
// 4. sectionsToBlocks(sections) -> flat [{key, day, startMin, endMin,
//    section, color, label}] — one block per (pattern x day).
export function sectionsToBlocks(sections) {
  const blocks = [];
  for (const section of sections || []) {
    const patterns = parseMeetingPatterns(section);
    if (!patterns.length) continue;
    const courseCode = `${section.subject || ''} ${section.catalog_number || ''}`.trim();
    const color = courseColor(courseCode);
    const label = courseCode;
    patterns.forEach((p, pi) => {
      for (const day of p.days) {
        blocks.push({
          key: `${section.class_number}:${pi}:${day}:${p.startMin}-${p.endMin}`,
          day,
          startMin: p.startMin,
          endMin: p.endMin,
          section,
          color,
          label,
        });
      }
    });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// 5. unscheduledSections(sections) -> sections with no placeable patterns.
export function unscheduledSections(sections) {
  return (sections || []).filter((s) => parseMeetingPatterns(s).length === 0);
}

// ---------------------------------------------------------------------------
// 6. findConflicts(blocks) -> [{a, b}] pairs overlapping on the same day.
//    Touching endpoints (a.endMin === b.startMin) are NOT conflicts.
//    Blocks from the SAME section never conflict with themselves (multi-line
//    meeting_days rows can put two overlapping blocks on one day).
function sameSection(a, b) {
  if (a.section === b.section) return true;
  const aId = a.section && a.section.class_number;
  const bId = b.section && b.section.class_number;
  return aId != null && bId != null && String(aId) === String(bId);
}

export function findConflicts(blocks) {
  const conflicts = [];
  const byDay = new Map();
  for (const b of blocks || []) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }
  for (const dayBlocks of byDay.values()) {
    const sorted = [...dayBlocks].sort((x, y) => x.startMin - y.startMin || x.endMin - y.endMin);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (b.startMin >= a.endMin) break; // sorted: no later block can overlap a
        if (sameSection(a, b)) continue; // a section never conflicts with itself
        if (a.startMin < b.endMin && b.startMin < a.endMin) {
          conflicts.push({ a, b });
        }
      }
    }
  }
  return conflicts;
}

// ---------------------------------------------------------------------------
// 7. findTightGaps(blocks, walkMinutes) -> [{from, to, gapMin, walkMin}] for
//    consecutive same-day blocks where 0 <= gap < walkMinutes(fromBuilding,
//    toBuilding). walkMinutes may return null -> pair skipped.
export function findTightGaps(blocks, walkMinutes) {
  const results = [];
  if (typeof walkMinutes !== 'function') return results;
  const byDay = new Map();
  for (const b of blocks || []) {
    if (!byDay.has(b.day)) byDay.set(b.day, []);
    byDay.get(b.day).push(b);
  }
  for (const dayBlocks of byDay.values()) {
    const sorted = [...dayBlocks].sort((x, y) => x.startMin - y.startMin || x.endMin - y.endMin);
    // Track the block with the LATEST end seen so far (not just the previous
    // block) so an overlapping pair doesn't hide a genuine tight transfer to
    // the class after it (e.g. A 9:00-10:45 overlapped by B 9:30-9:55, then
    // C at 10:50 — the real transfer is A→C, 5 minutes).
    let latest = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const to = sorted[i];
      const from = latest;
      const gapMin = to.startMin - from.endMin;
      if (gapMin >= 0) {
        const walkMin = walkMinutes(
          from.section && from.section.building,
          to.section && to.section.building
        );
        if (walkMin != null && gapMin < walkMin) results.push({ from, to, gapMin, walkMin });
      }
      if (to.endMin > latest.endMin) latest = to;
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 8. gridBounds(blocks) -> {startHour, endHour, days}.
//    startHour = floor(minStart/60) capped at most 8; endHour = ceil(maxEnd/60)
//    at least 17. days = Mo-Fr always, plus Sa/Su only when a block lands there.
export function gridBounds(blocks) {
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  if (!blocks || !blocks.length) {
    return { startHour: 8, endHour: 17, days: weekdays };
  }
  let minStart = Infinity;
  let maxEnd = -Infinity;
  let hasSa = false;
  let hasSu = false;
  for (const b of blocks) {
    if (b.startMin < minStart) minStart = b.startMin;
    if (b.endMin > maxEnd) maxEnd = b.endMin;
    if (b.day === 'Sa') hasSa = true;
    if (b.day === 'Su') hasSu = true;
  }
  const days = [...weekdays];
  if (hasSa) days.push('Sa');
  if (hasSu) days.push('Su');
  return {
    startHour: Math.min(8, Math.floor(minStart / 60)),
    endHour: Math.max(17, Math.ceil(maxEnd / 60)),
    days,
  };
}

// ---------------------------------------------------------------------------
// 9. buildIcs(sections, termEndDate, fromDate?) -> RFC 5545 ICS string.
//    One VEVENT per meeting pattern per section, weekly RRULE with BYDAY,
//    UNTIL = termEndDate end-of-day. DTSTART = next occurrence of the
//    pattern's first day on/after fromDate (defaults to new Date(); passed as
//    a parameter so tests are deterministic). Floating local times. CRLF EOLs.
function pad2(n) {
  return String(n).padStart(2, '0');
}

function icsLocalStamp(date) {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildIcs(sections, termEndDate, fromDate = new Date()) {
  const end = termEndDate instanceof Date ? termEndDate : new Date(termEndDate);
  const until =
    `${end.getFullYear()}${pad2(end.getMonth() + 1)}${pad2(end.getDate())}T235959`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RamblerRegistrar//Schedule Builder//EN',
    'CALSCALE:GREGORIAN',
  ];

  const dtstamp = icsLocalStamp(fromDate);

  for (const section of sections || []) {
    const patterns = parseMeetingPatterns(section);
    const courseCode = `${section.subject || ''} ${section.catalog_number || ''}`.trim();
    const summary = [courseCode, section.title].filter(Boolean).join(' ');
    const location = section.room || section.building || '';

    patterns.forEach((p, pi) => {
      // Next occurrence of ANY of the pattern's days on/after fromDate, so
      // DTSTART lands on the nearest upcoming meeting (BYDAY covers the rest).
      const delta = Math.min(
        ...p.days.map((d) => (DAY_TO_JS_DOW[d] - fromDate.getDay() + 7) % 7)
      );
      const start = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate() + delta,
        Math.floor(p.startMin / 60),
        p.startMin % 60,
        0
      );
      const endDt = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        Math.floor(p.endMin / 60),
        p.endMin % 60,
        0
      );
      const byday = [...p.days]
        .sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b])
        .map((d) => DAY_TO_ICS[d])
        .join(',');

      lines.push(
        'BEGIN:VEVENT',
        `UID:${section.class_number}-${pi}@ramblerregistrar`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${icsLocalStamp(start)}`,
        `DTEND:${icsLocalStamp(endDt)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`,
        `SUMMARY:${icsEscape(summary)}`,
        `LOCATION:${icsEscape(location)}`,
        'END:VEVENT'
      );
    });
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
