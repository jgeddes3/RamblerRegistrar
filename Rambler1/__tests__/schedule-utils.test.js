// Tests for schedule-utils.js — pure logic, real LOCUS fixtures.
import {
  COURSE_COLORS,
  parseTimeToMinutes,
  splitDays,
  parseMeetingPatterns,
  courseColor,
  sectionsToBlocks,
  unscheduledSections,
  findConflicts,
  findTightGaps,
  gridBounds,
  buildIcs,
} from '../schedule-utils';

// --- Real fixture rows (verified against live DB shapes) --------------------
const COMP170 = {
  subject: 'COMP',
  catalog_number: '170',
  section_number: '004',
  class_number: '4410',
  title: 'Introduction to Object-Oriented Programming',
  instructor: 'To be Announced',
  meeting_days: 'TuTh',
  meeting_time_start: '4:15PM',
  meeting_time_end: '5:30PM',
  building: 'Cuneo Hall',
  room: 'Cuneo Hall - Room 202',
  status: 'Open',
};

const HIST342C = {
  subject: 'HIST',
  catalog_number: '342C',
  class_number: '5588',
  title: 'History Seminar',
  meeting_days: 'TuTh',
  meeting_time_start: '11:30AM',
  meeting_time_end: '12:45PM',
  building: 'Crown Center',
  room: '',
  status: 'Open',
};

const HIST378 = {
  subject: 'HIST',
  catalog_number: '378',
  class_number: '5695',
  title: 'History of Something',
  meeting_days: 'TuTh',
  meeting_time_start: '8:30AM',
  meeting_time_end: '9:45AM',
  building: 'Life Science Building-Room 412',
  room: '',
  status: 'Open',
};

const TBA_SECTION = {
  subject: 'ENGL',
  catalog_number: '100',
  class_number: '9001',
  title: 'Independent Study',
  meeting_days: 'TBA',
  meeting_time_start: '',
  meeting_time_end: '',
  building: '',
  room: '',
  status: 'Open',
};

// Pathological multi-line row: first line uses the row's own times,
// second line embeds its own meeting.
const MULTILINE = {
  subject: 'CHEM',
  catalog_number: '212',
  class_number: '7777',
  title: 'Multi Pattern Course',
  meeting_days: 'MoWe\nTuTh 4:15PM - 5:45PM',
  meeting_time_start: '2:45PM',
  meeting_time_end: '4:00PM',
  building: 'Cudahy Science Hall',
  room: '',
  status: 'Open',
};

// Theatre monster: repeated lines (must dedupe), days-only later line ignored.
const THEATRE = {
  subject: 'THTR',
  catalog_number: '320',
  class_number: '8888',
  title: 'Production Practicum',
  meeting_days:
    'Mo\nWe 6:30PM - 10:00PM\nTh 5:45PM - 10:30PM\nWe 6:30PM - 10:00PM\nFr\nTh 5:45PM - 10:30PM',
  meeting_time_start: '6:30PM',
  meeting_time_end: '10:00PM',
  building: 'Mundelein Center',
  room: '',
  status: 'Open',
};

// --- parseTimeToMinutes ------------------------------------------------------
describe('parseTimeToMinutes', () => {
  test('parses morning times', () => {
    expect(parseTimeToMinutes('8:15AM')).toBe(495);
    expect(parseTimeToMinutes('11:30AM')).toBe(690);
  });
  test('noon edge: 12:35PM is 12h35m, not 24h', () => {
    expect(parseTimeToMinutes('12:35PM')).toBe(755);
    expect(parseTimeToMinutes('12:45PM')).toBe(765);
  });
  test('midnight edge: 12:10AM -> 10', () => {
    expect(parseTimeToMinutes('12:10AM')).toBe(10);
  });
  test('afternoon times', () => {
    expect(parseTimeToMinutes('4:15PM')).toBe(975);
    expect(parseTimeToMinutes('5:30PM')).toBe(1050);
  });
  test('garbage/empty/non-string -> null', () => {
    expect(parseTimeToMinutes('')).toBeNull();
    expect(parseTimeToMinutes('TBA')).toBeNull();
    expect(parseTimeToMinutes('25:99XM')).toBeNull();
    expect(parseTimeToMinutes(null)).toBeNull();
    expect(parseTimeToMinutes(undefined)).toBeNull();
    expect(parseTimeToMinutes(495)).toBeNull();
  });
});

// --- splitDays ---------------------------------------------------------------
describe('splitDays', () => {
  test('splits real patterns', () => {
    expect(splitDays('MoWeFr')).toEqual(['Mo', 'We', 'Fr']);
    expect(splitDays('TuTh')).toEqual(['Tu', 'Th']);
    expect(splitDays('MoWe')).toEqual(['Mo', 'We']);
    expect(splitDays('MoFr')).toEqual(['Mo', 'Fr']);
    expect(splitDays('Sa')).toEqual(['Sa']);
    expect(splitDays('We')).toEqual(['We']);
  });
  test('TBA and empty -> []', () => {
    expect(splitDays('TBA')).toEqual([]);
    expect(splitDays('')).toEqual([]);
    expect(splitDays(null)).toEqual([]);
  });
  test('unknown tokens dropped', () => {
    expect(splitDays('MoXxWe')).toEqual(['Mo', 'We']);
  });
});

// --- parseMeetingPatterns ----------------------------------------------------
describe('parseMeetingPatterns', () => {
  test('simple TuTh section -> one pattern with correct minutes', () => {
    expect(parseMeetingPatterns(COMP170)).toEqual([
      { days: ['Tu', 'Th'], startMin: 975, endMin: 1050 },
    ]);
  });
  test('noon-crossing section (11:30AM-12:45PM)', () => {
    expect(parseMeetingPatterns(HIST342C)).toEqual([
      { days: ['Tu', 'Th'], startMin: 690, endMin: 765 },
    ]);
  });
  test('TBA days -> []', () => {
    expect(parseMeetingPatterns(TBA_SECTION)).toEqual([]);
  });
  test('valid days but empty times -> []', () => {
    expect(
      parseMeetingPatterns({ ...COMP170, meeting_time_start: '', meeting_time_end: '' })
    ).toEqual([]);
  });
  test('missing meeting_days -> []', () => {
    expect(parseMeetingPatterns({ ...COMP170, meeting_days: '' })).toEqual([]);
    expect(parseMeetingPatterns({ ...COMP170, meeting_days: undefined })).toEqual([]);
  });
  test('multi-line: first line uses primary times, later line embeds its own', () => {
    expect(parseMeetingPatterns(MULTILINE)).toEqual([
      { days: ['Mo', 'We'], startMin: 885, endMin: 960 }, // 2:45PM-4:00PM
      { days: ['Tu', 'Th'], startMin: 975, endMin: 1065 }, // 4:15PM-5:45PM
    ]);
  });
  test('theatre monster: dedupes repeated lines, ignores days-only later lines', () => {
    expect(parseMeetingPatterns(THEATRE)).toEqual([
      { days: ['Mo'], startMin: 1110, endMin: 1320 }, // primary 6:30PM-10:00PM
      { days: ['We'], startMin: 1110, endMin: 1320 },
      { days: ['Th'], startMin: 1065, endMin: 1350 }, // 5:45PM-10:30PM
    ]);
  });
});

// --- sectionsToBlocks --------------------------------------------------------
describe('sectionsToBlocks', () => {
  test('one block per pattern-day with label and section reference', () => {
    const blocks = sectionsToBlocks([COMP170]);
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.day)).toEqual(['Tu', 'Th']);
    for (const b of blocks) {
      expect(b.startMin).toBe(975);
      expect(b.endMin).toBe(1050);
      expect(b.label).toBe('COMP 170');
      expect(b.section).toBe(COMP170);
      expect(COURSE_COLORS).toContain(b.color);
    }
    expect(new Set(blocks.map((b) => b.key)).size).toBe(2); // unique keys
  });

  test('multi-line MoWe\\nTuTh section produces 2+2=4 day-blocks with correct times', () => {
    const blocks = sectionsToBlocks([MULTILINE]);
    expect(blocks).toHaveLength(4);
    const byDay = Object.fromEntries(blocks.map((b) => [b.day, b]));
    expect(byDay.Mo.startMin).toBe(885);
    expect(byDay.We.endMin).toBe(960);
    expect(byDay.Tu.startMin).toBe(975);
    expect(byDay.Th.endMin).toBe(1065);
  });

  test('multi-line MoWeFr\\nTuTh section produces 3+2=5 day-blocks', () => {
    const threeTwo = { ...MULTILINE, meeting_days: 'MoWeFr\nTuTh 4:15PM - 5:45PM' };
    const blocks = sectionsToBlocks([threeTwo]);
    expect(blocks).toHaveLength(5);
    const byDay = Object.fromEntries(blocks.map((b) => [b.day, b]));
    expect(byDay.Fr.startMin).toBe(885); // primary times apply to all first-line days
    expect(byDay.Fr.endMin).toBe(960);
    expect(byDay.Tu.startMin).toBe(975);
    expect(byDay.Th.endMin).toBe(1065);
  });

  test('TBA sections produce no blocks', () => {
    expect(sectionsToBlocks([TBA_SECTION])).toEqual([]);
  });

  test('colors are stable per courseCode and order-independent', () => {
    const forward = sectionsToBlocks([COMP170, HIST342C, HIST378, MULTILINE]);
    const backward = sectionsToBlocks([MULTILINE, HIST378, HIST342C, COMP170]);
    const colorOf = (blocks, label) => blocks.find((b) => b.label === label).color;
    for (const label of ['COMP 170', 'HIST 342C', 'HIST 378', 'CHEM 212']) {
      expect(colorOf(forward, label)).toBe(colorOf(backward, label));
      expect(colorOf(forward, label)).toBe(courseColor(label));
    }
    // Two sections of the SAME course share a color regardless of section data.
    const other170 = { ...COMP170, class_number: '9999', section_number: '005' };
    const mixed = sectionsToBlocks([other170, HIST378, COMP170]);
    const comp = mixed.filter((b) => b.label === 'COMP 170');
    expect(new Set(comp.map((b) => b.color)).size).toBe(1);
  });
});

// --- unscheduledSections -----------------------------------------------------
describe('unscheduledSections', () => {
  test('returns only sections with no placeable patterns', () => {
    const noTimes = { ...HIST378, meeting_time_start: '', meeting_time_end: '' };
    const result = unscheduledSections([COMP170, TBA_SECTION, MULTILINE, noTimes]);
    expect(result).toEqual([TBA_SECTION, noTimes]);
  });
  test('empty input -> []', () => {
    expect(unscheduledSections([])).toEqual([]);
  });
});

// --- findConflicts -----------------------------------------------------------
describe('findConflicts', () => {
  test('overlapping same-day blocks conflict', () => {
    const clash = {
      ...HIST342C,
      subject: 'PHIL',
      catalog_number: '181',
      class_number: '6001',
      meeting_days: 'TuTh',
      meeting_time_start: '12:00PM', // overlaps 11:30AM-12:45PM
      meeting_time_end: '1:15PM',
    };
    const conflicts = findConflicts(sectionsToBlocks([HIST342C, clash]));
    expect(conflicts).toHaveLength(2); // Tu and Th
    for (const { a, b } of conflicts) {
      expect(a.day).toBe(b.day);
      expect(a.startMin < b.endMin && b.startMin < a.endMin).toBe(true);
    }
  });

  test('touching endpoints are NOT a conflict', () => {
    const backToBack = {
      ...COMP170,
      class_number: '6002',
      subject: 'MATH',
      catalog_number: '161',
      meeting_time_start: '5:30PM', // starts exactly when COMP 170 ends
      meeting_time_end: '6:45PM',
    };
    expect(findConflicts(sectionsToBlocks([COMP170, backToBack]))).toEqual([]);
  });

  test('same times on different days do not conflict', () => {
    const otherDays = {
      ...COMP170,
      class_number: '6003',
      meeting_days: 'MoWeFr',
    };
    expect(findConflicts(sectionsToBlocks([COMP170, otherDays]))).toEqual([]);
  });

  test('no blocks -> no conflicts', () => {
    expect(findConflicts([])).toEqual([]);
  });

  test('multi-line section with self-overlapping same-day blocks does NOT conflict with itself', () => {
    // Real theatre-style row: primary We 6:30-8:00PM plus embedded We 7:00-9:00PM.
    const selfOverlap = {
      subject: 'THTR',
      catalog_number: '324',
      class_number: '8990',
      title: 'Rehearsal & Performance',
      meeting_days: 'MoWe\nWe 7:00PM - 9:00PM',
      meeting_time_start: '6:30PM',
      meeting_time_end: '8:00PM',
      building: 'Mundelein Center',
      room: '',
      status: 'Open',
    };
    expect(findConflicts(sectionsToBlocks([selfOverlap]))).toEqual([]);
    // But it still conflicts with a DIFFERENT overlapping section.
    const other = {
      ...HIST342C,
      class_number: '6004',
      meeting_days: 'We',
      meeting_time_start: '7:30PM',
      meeting_time_end: '8:30PM',
    };
    const conflicts = findConflicts(sectionsToBlocks([selfOverlap, other]));
    expect(conflicts.length).toBeGreaterThan(0);
    for (const { a, b } of conflicts) {
      expect(String(a.section.class_number)).not.toBe(String(b.section.class_number));
    }
  });
});

// --- findTightGaps -----------------------------------------------------------
describe('findTightGaps', () => {
  // HIST378 ends 9:45AM Tu/Th; make a next class at 9:55AM in Cuneo (10-min gap).
  const NEXT = {
    ...COMP170,
    class_number: '6100',
    meeting_time_start: '9:55AM',
    meeting_time_end: '11:10AM',
  };

  test('flags gaps shorter than the walk time (building strings passed through)', () => {
    const seen = [];
    const walk = (fromB, toB) => {
      seen.push([fromB, toB]);
      return 15;
    };
    const gaps = findTightGaps(sectionsToBlocks([HIST378, NEXT]), walk);
    expect(gaps).toHaveLength(2); // Tu and Th
    for (const g of gaps) {
      expect(g.gapMin).toBe(10);
      expect(g.walkMin).toBe(15);
      expect(g.from.section).toBe(HIST378);
      expect(g.to.section).toBe(NEXT);
    }
    // Raw building strings (incl. embedded room) are handed to walkMinutes.
    expect(seen).toContainEqual(['Life Science Building-Room 412', 'Cuneo Hall']);
  });

  test('gap >= walk time is fine', () => {
    const gaps = findTightGaps(sectionsToBlocks([HIST378, NEXT]), () => 10);
    expect(gaps).toEqual([]); // gap 10 is not < 10
  });

  test('walkMinutes returning null skips the pair', () => {
    expect(findTightGaps(sectionsToBlocks([HIST378, NEXT]), () => null)).toEqual([]);
  });

  test('overlapping blocks (negative gap) are not gaps', () => {
    const overlap = { ...NEXT, meeting_time_start: '9:30AM' };
    expect(findTightGaps(sectionsToBlocks([HIST378, overlap]), () => 60)).toEqual([]);
  });
});

// --- gridBounds --------------------------------------------------------------
describe('gridBounds', () => {
  test('empty blocks -> default 8-17 Mo-Fr', () => {
    expect(gridBounds([])).toEqual({
      startHour: 8,
      endHour: 17,
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
    });
  });

  test('startHour capped at 8 even for late-starting schedules', () => {
    const { startHour, endHour } = gridBounds(sectionsToBlocks([COMP170])); // 4:15-5:30PM
    expect(startHour).toBe(8);
    expect(endHour).toBe(18); // ceil(1050/60)
  });

  test('early class lowers startHour; endHour floor of 17 holds', () => {
    const early = { ...HIST378, meeting_time_start: '7:30AM', meeting_time_end: '8:45AM' };
    const b = gridBounds(sectionsToBlocks([early]));
    expect(b.startHour).toBe(7);
    expect(b.endHour).toBe(17);
  });

  test('Saturday block adds Sa to days', () => {
    const sat = { ...COMP170, class_number: '6200', meeting_days: 'Sa' };
    expect(gridBounds(sectionsToBlocks([COMP170, sat])).days).toEqual([
      'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa',
    ]);
  });
});

// --- buildIcs ----------------------------------------------------------------
describe('buildIcs', () => {
  const FROM = new Date(2026, 7, 24); // Mon Aug 24 2026 (deterministic)
  const TERM_END = new Date(2026, 11, 12); // Dec 12 2026

  test('fixture sanity: fromDate is a Monday', () => {
    expect(FROM.getDay()).toBe(1);
  });

  test('wraps events in VCALENDAR with CRLF line endings', () => {
    const ics = buildIcs([COMP170], TERM_END, FROM);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    // No bare \n anywhere once CRLFs are removed.
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  test('TuTh section: DTSTART on next Tuesday, BYDAY=TU,TH, UNTIL term end', () => {
    const ics = buildIcs([COMP170], TERM_END, FROM);
    expect(ics).toContain('DTSTART:20260825T161500'); // Tue Aug 25, 4:15PM
    expect(ics).toContain('DTEND:20260825T173000'); // 5:30PM
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261212T235959');
    expect(ics).toContain('SUMMARY:COMP 170 Introduction to Object-Oriented Programming');
    expect(ics).toContain('LOCATION:Cuneo Hall - Room 202'); // room preferred
  });

  test('falls back to building when room is empty', () => {
    const ics = buildIcs([HIST378], TERM_END, FROM);
    expect(ics).toContain('LOCATION:Life Science Building-Room 412');
  });

  test('multi-line section emits one VEVENT per pattern', () => {
    const ics = buildIcs([MULTILINE], TERM_END, FROM);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    // MoWe primary: Monday Aug 24 (fromDate itself) at 2:45PM.
    expect(ics).toContain('DTSTART:20260824T144500');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261212T235959');
    // TuTh embedded: Tuesday Aug 25 at 4:15PM.
    expect(ics).toContain('DTSTART:20260825T161500');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261212T235959');
  });

  test('TBA sections produce no VEVENTs', () => {
    const ics = buildIcs([TBA_SECTION], TERM_END, FROM);
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  test('noon-edge times serialize correctly (12:45PM -> T124500)', () => {
    const ics = buildIcs([HIST342C], TERM_END, FROM);
    expect(ics).toContain('DTSTART:20260825T113000');
    expect(ics).toContain('DTEND:20260825T124500');
  });

  test('escapes commas in text fields', () => {
    const commaRoom = { ...COMP170, room: 'Cuneo Hall, Room 202' };
    const ics = buildIcs([commaRoom], TERM_END, FROM);
    expect(ics).toContain('LOCATION:Cuneo Hall\\, Room 202');
  });
});

// ---------------------------------------------------------------------------
// Regression tests for the post-review minor fixes (2026-07-06)
// ---------------------------------------------------------------------------
const su = require('../schedule-utils');

describe('post-review fixes', () => {
  test('endMin <= startMin (bad LOCUS data) is treated as unscheduled, not a garbage block', () => {
    const bad = {
      subject: 'XXXX', catalog_number: '999', class_number: '11111',
      meeting_days: 'MoWe', meeting_time_start: '5:30PM', meeting_time_end: '4:15PM',
    };
    expect(su.parseMeetingPatterns(bad)).toEqual([]);
    expect(su.sectionsToBlocks([bad])).toEqual([]);
    expect(su.unscheduledSections([bad])).toHaveLength(1);
  });

  test('findTightGaps sees a tight transfer past an overlapping middle block (A→C)', () => {
    // A 9:00-10:45 Cuneo, B 9:30-9:55 Crown (overlaps A), C 10:50-11:30 LSB.
    const mk = (cn, start, end, building) => ({
      key: cn, day: 'Tu', startMin: start, endMin: end,
      section: { class_number: cn, building },
      color: '#000', label: cn,
    });
    const blocks = [
      mk('A', 9 * 60, 10 * 60 + 45, 'Cuneo Hall'),
      mk('B', 9 * 60 + 30, 9 * 60 + 55, 'Crown Center'),
      mk('C', 10 * 60 + 50, 11 * 60 + 30, 'Life Science Building'),
    ];
    const gaps = su.findTightGaps(blocks, () => 10); // every walk = 10 min
    // The real transfer is A(ends 10:45) -> C(starts 10:50): 5 min gap < 10 min walk.
    expect(gaps).toHaveLength(1);
    expect(gaps[0].from.key).toBe('A');
    expect(gaps[0].to.key).toBe('C');
    expect(gaps[0].gapMin).toBe(5);
  });
});
