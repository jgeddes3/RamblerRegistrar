// schedule-generator.test.js — pure-logic tests, no react/firebase.
import {
  generateSchedules,
  scoreSchedule,
  sectionFilterReason,
  formatMinutes,
  WEIGHTS,
} from '../schedule-generator';

// --- fixtures ----------------------------------------------------------------
let nextClassNum = 1000;
function sec(subject, catalog, sectionNumber, days, start, end, extra = {}) {
  return {
    class_number: String(nextClassNum++),
    subject,
    catalog_number: catalog,
    section_number: sectionNumber,
    title: `${subject} ${catalog}`,
    status: 'Open',
    building: 'Cuneo Hall',
    meeting_days: days,
    meeting_time_start: start,
    meeting_time_end: end,
    ...extra,
  };
}

beforeEach(() => { nextClassNum = 1000; });

const noWalk = () => 0;

// --- sectionFilterReason -------------------------------------------------------
describe('sectionFilterReason', () => {
  test('removed sections always rejected', () => {
    const s = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM', { status: 'removed' });
    expect(sectionFilterReason(s, {})).toBe('no longer offered');
    expect(sectionFilterReason(s, { openOnly: false })).toBe('no longer offered');
  });

  test('openOnly (default) rejects Closed and Wait List', () => {
    const closed = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM', { status: 'Closed' });
    const wl = sec('COMP', '170', '002', 'MoWeFr', '9:20AM', '10:10AM', { status: 'Wait List' });
    expect(sectionFilterReason(closed, {})).toBe('not open');
    expect(sectionFilterReason(wl, {})).toBe('not open');
    expect(sectionFilterReason(closed, { openOnly: false })).toBeNull();
  });

  test('earliestStart / latestEnd / freeDays', () => {
    const early = sec('COMP', '170', '001', 'MoWeFr', '8:15AM', '9:05AM');
    const late = sec('COMP', '170', '002', 'MoWeFr', '6:00PM', '8:30PM');
    const friday = sec('COMP', '170', '003', 'MoWeFr', '10:25AM', '11:15AM');
    expect(sectionFilterReason(early, { earliestStart: 9 * 60 })).toBe('starts too early');
    expect(sectionFilterReason(late, { latestEnd: 17 * 60 })).toBe('ends too late');
    expect(sectionFilterReason(friday, { freeDays: ['Fr'] })).toBe('meets on Fr');
    expect(sectionFilterReason(friday, { freeDays: ['Sa'] })).toBeNull();
  });

  test('TBA (no patterns) passes time filters', () => {
    const tba = sec('COMP', '170', '700N', 'TBA', '', '');
    expect(sectionFilterReason(tba, { earliestStart: 9 * 60, freeDays: ['Fr'] })).toBeNull();
  });
});

// --- generateSchedules: correctness -------------------------------------------
describe('generateSchedules', () => {
  test('picks one section per course, never overlapping', () => {
    const comp1 = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const comp2 = sec('COMP', '170', '002', 'MoWeFr', '10:25AM', '11:15AM');
    const math1 = sec('MATH', '131', '001', 'MoWeFr', '9:20AM', '10:10AM'); // clashes comp1
    const { candidates, notes } = generateSchedules({
      courseGroups: [
        { code: 'COMP 170', sections: [comp1, comp2] },
        { code: 'MATH 131', sections: [math1] },
      ],
      walkMinutes: noWalk,
    });
    expect(notes).toEqual([]);
    expect(candidates).toHaveLength(1); // only comp2+math1 fits
    const nums = candidates[0].sections.map((s) => s.class_number).sort();
    expect(nums).toEqual([comp2.class_number, math1.class_number].sort());
  });

  test('impossible combination -> empty with explanatory note', () => {
    const a = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const b = sec('MATH', '131', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const { candidates, notes } = generateSchedules({
      courseGroups: [
        { code: 'COMP 170', sections: [a] },
        { code: 'MATH 131', sections: [b] },
      ],
    });
    expect(candidates).toEqual([]);
    expect(notes.join(' ')).toMatch(/No conflict-free combination/);
  });

  test('touching endpoints do not conflict', () => {
    const a = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const b = sec('MATH', '131', '001', 'MoWeFr', '10:10AM', '11:00AM');
    const { candidates } = generateSchedules({
      courseGroups: [
        { code: 'COMP 170', sections: [a] },
        { code: 'MATH 131', sections: [b] },
      ],
    });
    expect(candidates).toHaveLength(1);
  });

  test('filtered-out course produces a note and is left out', () => {
    const closedOnly = sec('FINC', '345', '001', 'TuTh', '10:00AM', '11:15AM', { status: 'Closed' });
    const open = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const { candidates, notes } = generateSchedules({
      courseGroups: [
        { code: 'FINC 345', sections: [closedOnly] },
        { code: 'COMP 170', sections: [open] },
      ],
    });
    expect(notes.join(' ')).toMatch(/FINC 345: no sections match.*not open/);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sections).toHaveLength(1);
  });

  test('locked sections are built around and always included', () => {
    const locked = sec('BIOL', '101', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const clash = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const fits = sec('COMP', '170', '002', 'MoWeFr', '10:25AM', '11:15AM');
    const { candidates } = generateSchedules({
      courseGroups: [{ code: 'COMP 170', sections: [clash, fits] }],
      lockedSections: [locked],
      walkMinutes: noWalk,
    });
    expect(candidates).toHaveLength(1);
    const nums = candidates[0].sections.map((s) => s.class_number);
    expect(nums).toContain(locked.class_number);
    expect(nums).toContain(fits.class_number);
    expect(nums).not.toContain(clash.class_number);
  });

  test('a picked course already locked is skipped with a note', () => {
    const locked = sec('COMP', '170', '001', 'MoWeFr', '9:20AM', '10:10AM');
    const other = sec('COMP', '170', '002', 'MoWeFr', '10:25AM', '11:15AM');
    const { candidates, notes } = generateSchedules({
      courseGroups: [{ code: 'COMP 170', sections: [locked, other] }],
      lockedSections: [locked],
    });
    expect(notes.join(' ')).toMatch(/already on your schedule/);
    expect(candidates).toEqual([]); // no groups left -> no candidates
  });

  test('compact 2-day candidate outranks spread 4-day candidate', () => {
    // COMP has a TuTh section and a MoWe section; MATH is TuTh only.
    const compTuTh = sec('COMP', '170', '001', 'TuTh', '10:00AM', '11:15AM');
    const compMoWe = sec('COMP', '170', '002', 'MoWe', '10:00AM', '11:15AM');
    const mathTuTh = sec('MATH', '131', '001', 'TuTh', '11:30AM', '12:45PM');
    const { candidates } = generateSchedules({
      courseGroups: [
        { code: 'COMP 170', sections: [compMoWe, compTuTh] },
        { code: 'MATH 131', sections: [mathTuTh] },
      ],
      walkMinutes: noWalk,
    });
    expect(candidates).toHaveLength(2);
    // Winner: everything on Tu/Th (2 days), loser spans Mo/We/Tu/Th (4 days).
    expect(candidates[0].stats.daysOnCampus).toBe(2);
    expect(candidates[1].stats.daysOnCampus).toBe(4);
    expect(candidates[0].score).toBeGreaterThan(candidates[1].score);
    expect(candidates[0].sections.map((s) => s.class_number)).toContain(compTuTh.class_number);
  });

  test('tight walk transfer is penalized', () => {
    // Two candidate pairs, identical times; one pair changes buildings with a
    // 20-minute walk against a 15-minute gap. Single meeting day so exactly
    // one tight transfer is expected.
    const a1 = sec('COMP', '170', '001', 'Mo', '9:00AM', '9:50AM', { building: 'Cuneo Hall' });
    const a2 = sec('COMP', '170', '002', 'Mo', '9:00AM', '9:50AM', { building: 'Far Hall' });
    const b1 = sec('MATH', '131', '001', 'Mo', '10:05AM', '10:55AM', { building: 'Cuneo Hall' });
    const walk = (from, to) => (from === to ? 0 : 20);
    const { candidates } = generateSchedules({
      courseGroups: [
        { code: 'COMP 170', sections: [a2, a1] },
        { code: 'MATH 131', sections: [b1] },
      ],
      walkMinutes: walk,
    });
    expect(candidates).toHaveLength(2);
    expect(candidates[0].stats.tightGaps).toHaveLength(0);
    expect(candidates[1].stats.tightGaps).toHaveLength(1);
    expect(candidates[0].score - candidates[1].score).toBe(-WEIGHTS.TIGHT_GAP);
    expect(candidates[0].sections.map((s) => s.class_number)).toContain(a1.class_number);
  });

  test('limit caps the returned candidates', () => {
    const groups = [{
      code: 'COMP 170',
      sections: [
        sec('COMP', '170', '001', 'Mo', '9:00AM', '9:50AM'),
        sec('COMP', '170', '002', 'Tu', '9:00AM', '9:50AM'),
        sec('COMP', '170', '003', 'We', '9:00AM', '9:50AM'),
      ],
    }];
    const { candidates } = generateSchedules({ courseGroups: groups, limit: 2 });
    expect(candidates).toHaveLength(2);
  });

  test('step budget truncates gracefully with a note', () => {
    const many = (subj) => ({
      code: `${subj} 100`,
      sections: Array.from({ length: 10 }, (_, i) =>
        sec(subj, '100', String(i), 'Mo', `${(i % 9) + 1}:00AM`, `${(i % 9) + 1}:50AM`)),
    });
    const { candidates, notes } = generateSchedules({
      courseGroups: [many('AAAA'), many('BBBB'), many('CCCC')],
      stepBudget: 20,
    });
    expect(notes.join(' ')).toMatch(/first few hundred/);
    expect(candidates.length).toBeGreaterThan(0);
  });

  test('deterministic output for identical input', () => {
    const build = () => {
      nextClassNum = 5000;
      return [
        { code: 'COMP 170', sections: [sec('COMP', '170', '001', 'MoWe', '9:00AM', '9:50AM'), sec('COMP', '170', '002', 'TuTh', '9:00AM', '9:50AM')] },
        { code: 'MATH 131', sections: [sec('MATH', '131', '001', 'MoWe', '10:00AM', '10:50AM')] },
      ];
    };
    const r1 = generateSchedules({ courseGroups: build(), walkMinutes: noWalk });
    const r2 = generateSchedules({ courseGroups: build(), walkMinutes: noWalk });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

// --- scoreSchedule -------------------------------------------------------------
describe('scoreSchedule', () => {
  test('empty schedule scores clean 100 minus nothing', () => {
    const { score, stats } = scoreSchedule([], noWalk);
    expect(score).toBe(100 - 0);
    expect(stats.daysOnCampus).toBe(0);
  });

  test('idle time and extra days reduce the score', () => {
    const tight = [
      sec('A', '1', '001', 'Mo', '9:00AM', '9:50AM'),
      sec('B', '1', '001', 'Mo', '10:00AM', '10:50AM'), // 10-min gap: not idle
    ];
    const spread = [
      sec('A', '1', '001', 'Mo', '9:00AM', '9:50AM'),
      sec('B', '1', '001', 'Tu', '2:00PM', '2:50PM'),
    ];
    const sTight = scoreSchedule(tight, noWalk);
    const sSpread = scoreSchedule(spread, noWalk);
    expect(sTight.stats.idleMinutes).toBe(0);
    expect(sTight.score).toBeGreaterThan(sSpread.score); // extra day penalty
  });

  test('non-open sections are counted and penalized', () => {
    const open = [sec('A', '1', '001', 'Mo', '9:00AM', '9:50AM')];
    const wl = [sec('A', '1', '001', 'Mo', '9:00AM', '9:50AM', { status: 'Wait List' })];
    expect(scoreSchedule(open, noWalk).score - scoreSchedule(wl, noWalk).score)
      .toBe(-WEIGHTS.NON_OPEN_SECTION);
  });

  test('no-lunch day detected; a 30-min window clears it', () => {
    const noLunch = [
      sec('A', '1', '001', 'Mo', '10:00AM', '11:30AM'),
      sec('B', '1', '001', 'Mo', '11:40AM', '1:10PM'),
    ];
    const withLunch = [
      sec('A', '1', '001', 'Mo', '10:00AM', '11:30AM'),
      sec('B', '1', '001', 'Mo', '12:10PM', '1:40PM'),
    ];
    expect(scoreSchedule(noLunch, noWalk).stats.noLunchDays).toBe(1);
    expect(scoreSchedule(withLunch, noWalk).stats.noLunchDays).toBe(0);
  });

  test('TBA sections count as unscheduled and add no day/idle stats', () => {
    const { stats } = scoreSchedule([sec('A', '1', '700N', 'TBA', '', '')], noWalk);
    expect(stats.unscheduledCount).toBe(1);
    expect(stats.daysOnCampus).toBe(0);
  });
});

// --- formatMinutes ---------------------------------------------------------------
describe('formatMinutes', () => {
  test.each([
    [0, '12:00 AM'],
    [9 * 60 + 25, '9:25 AM'],
    [12 * 60, '12:00 PM'],
    [15 * 60 + 35, '3:35 PM'],
    [null, ''],
  ])('%s -> %s', (input, expected) => {
    expect(formatMinutes(input)).toBe(expected);
  });
});
