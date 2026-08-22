import {
  semestersUntilGraduation,
  computeGraduationOutlook,
  OUTLOOK_DISCLAIMER,
} from '../graduation-outlook';

// All dates are deterministic. Reminder: Date months are 0-indexed.

describe('semestersUntilGraduation', () => {
  test('June date: summer -> next semester is Fall of same year', () => {
    // June 15, 2026 -> Fall 2026 + Spring 2027 = 2
    expect(semestersUntilGraduation(2027, new Date(2026, 5, 15))).toBe(2);
  });

  test('October date: Fall semester in progress COUNTS as remaining', () => {
    // Oct 10, 2026 -> Fall 2026 (in progress) + Spring 2027 = 2
    expect(semestersUntilGraduation(2027, new Date(2026, 9, 10))).toBe(2);
  });

  test('January date: Spring semester in progress counts', () => {
    // Jan 15, 2027 -> Spring 2027 = 1
    expect(semestersUntilGraduation(2027, new Date(2027, 0, 15))).toBe(1);
  });

  test('several years out', () => {
    // Sep 1, 2025 -> Fall 25, Spring 26, Fall 26, Spring 27 = 4
    expect(semestersUntilGraduation(2027, new Date(2025, 8, 1))).toBe(4);
  });

  test('graduation already passed clamps at 0', () => {
    // June 2027, graduated Spring 2027 -> 0
    expect(semestersUntilGraduation(2027, new Date(2027, 5, 1))).toBe(0);
    // Grad year fully in the past
    expect(semestersUntilGraduation(2025, new Date(2026, 9, 10))).toBe(0);
  });

  test('accepts string graduation year', () => {
    expect(semestersUntilGraduation('2027', new Date(2026, 9, 10))).toBe(2);
    expect(semestersUntilGraduation(' 2027 ', new Date(2026, 9, 10))).toBe(2);
  });

  test('invalid graduation year returns null', () => {
    const now = new Date(2026, 9, 10);
    expect(semestersUntilGraduation(null, now)).toBeNull();
    expect(semestersUntilGraduation(undefined, now)).toBeNull();
    expect(semestersUntilGraduation('', now)).toBeNull();
    expect(semestersUntilGraduation('soon', now)).toBeNull();
    expect(semestersUntilGraduation(NaN, now)).toBeNull();
    expect(semestersUntilGraduation(2026.5, now)).toBeNull();
  });

  test('invalid now returns null', () => {
    expect(semestersUntilGraduation(2027, new Date('nonsense'))).toBeNull();
    expect(semestersUntilGraduation(2027, 'not a date')).toBeNull();
  });
});

describe('computeGraduationOutlook', () => {
  const degreeProgress = (remainingCount) => ({
    remainingCount,
    completedCount: 10,
    totalRequired: 10 + remainingCount,
  });

  const coreProgress = (incompleteCount, otherCount = 2) => ({
    areas: [
      ...Array.from({ length: incompleteCount }, () => ({ status: 'incomplete' })),
      ...Array.from({ length: otherCount }, () => ({ status: 'satisfied' })),
      { status: 'waived' },
    ],
  });

  test('on-track: comfortable pace', () => {
    // Sep 2025, grad 2027 -> 4 semesters; 6 remaining -> pace 1.5
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(6),
      coreProgress: null,
      graduationYear: 2027,
      now: new Date(2025, 8, 1),
    });
    expect(result.status).toBe('on-track');
    expect(result.semestersLeft).toBe(4);
    expect(result.remainingUnits).toBe(6);
    expect(result.pace).toBe(1.5);
    expect(result.gradLabel).toBe('Spring 2027');
    expect(result.message).toBe('On pace to graduate Spring 2027.');
  });

  test('at-risk: 4 < pace <= 5, and core incomplete areas add to remainingUnits', () => {
    // Oct 2026, grad 2027 -> 2 semesters; 7 degree + 2 incomplete core = 9 -> pace 4.5
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(7),
      coreProgress: coreProgress(2),
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(result.status).toBe('at-risk');
    expect(result.semestersLeft).toBe(2);
    expect(result.remainingUnits).toBe(9);
    expect(result.pace).toBe(4.5);
    expect(result.message).toContain('5-course load');
  });

  test('pace exactly 4 is on-track; pace exactly 5 is at-risk', () => {
    const four = computeGraduationOutlook({
      degreeProgress: degreeProgress(8),
      graduationYear: 2027,
      now: new Date(2026, 9, 10), // 2 semesters -> pace 4
    });
    expect(four.status).toBe('on-track');

    const five = computeGraduationOutlook({
      degreeProgress: degreeProgress(10),
      graduationYear: 2027,
      now: new Date(2026, 9, 10), // 2 semesters -> pace 5
    });
    expect(five.status).toBe('at-risk');
  });

  test('off-track: pace > 5', () => {
    // Jan 2027, grad 2027 -> 1 semester; 9 remaining -> pace 9
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(9),
      coreProgress: null,
      graduationYear: '2027',
      now: new Date(2027, 0, 15),
    });
    expect(result.status).toBe('off-track');
    expect(result.semestersLeft).toBe(1);
    expect(result.pace).toBe(9);
    expect(result.message).toBe(
      "9 requirements left with 1 semester to go. That's about 9 courses/semester. Talk to your advisor. " +
      "You're 5 course units beyond an on-track pace of 4 per semester — without more time, that means overload semesters or summer terms. " +
      "Planning a fifth year (graduating Spring 2028) would bring you to about 3 courses/semester — no longer at risk."
    );
  });

  test('off-track: semestersLeft 0 with remaining > 0', () => {
    // June 2027, grad 2027 -> 0 semesters, 3 remaining
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(3),
      graduationYear: 2027,
      now: new Date(2027, 5, 15),
    });
    expect(result.status).toBe('off-track');
    expect(result.semestersLeft).toBe(0);
    expect(result.remainingUnits).toBe(3);
    expect(result.message).toContain('Talk to your advisor');
  });

  test('semestersLeft 0 with nothing remaining is on-track (done)', () => {
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(0),
      graduationYear: 2027,
      now: new Date(2027, 5, 15),
    });
    expect(result.status).toBe('on-track');
    expect(result.pace).toBe(0);
  });

  test('unknown: null degreeProgress', () => {
    const result = computeGraduationOutlook({
      degreeProgress: null,
      coreProgress: coreProgress(2),
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(result.status).toBe('unknown');
    expect(result.pace).toBeNull();
    expect(result.remainingUnits).toBeNull();
    expect(result.gradLabel).toBe('Spring 2027');
  });

  test('unknown: missing or invalid graduationYear', () => {
    const noYear = computeGraduationOutlook({
      degreeProgress: degreeProgress(5),
      graduationYear: null,
      now: new Date(2026, 9, 10),
    });
    expect(noYear.status).toBe('unknown');
    expect(noYear.semestersLeft).toBeNull();
    expect(noYear.gradLabel).toBeNull();

    const badYear = computeGraduationOutlook({
      degreeProgress: degreeProgress(5),
      graduationYear: 'someday',
      now: new Date(2026, 9, 10),
    });
    expect(badYear.status).toBe('unknown');
  });

  test('unknown: called with no arguments at all', () => {
    expect(computeGraduationOutlook().status).toBe('unknown');
    expect(computeGraduationOutlook({}).status).toBe('unknown');
  });

  test('pace is rounded to 1 decimal', () => {
    // Sep 2025, grad 2027 -> 4 semesters; 7 remaining -> 1.75 -> 1.8
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(7),
      graduationYear: 2027,
      now: new Date(2025, 8, 1),
    });
    expect(result.pace).toBe(1.8);
  });

  test('string graduationYear works end to end', () => {
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(4),
      graduationYear: '2028',
      now: new Date(2026, 9, 10), // Fall26, Spr27, Fall27, Spr28 = 4
    });
    expect(result.semestersLeft).toBe(4);
    expect(result.gradLabel).toBe('Spring 2028');
    expect(result.status).toBe('on-track');
  });

  test('additionalDegreeProgress (2nd major / minors) adds to remainingUnits', () => {
    // Oct 2026, grad 2027 -> 2 semesters. Primary done (0 remaining) but 2nd
    // major has 9 remaining -> pace 4.5 -> at-risk, NOT on-track.
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(0),
      additionalDegreeProgress: [degreeProgress(9)],
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(result.remainingUnits).toBe(9);
    expect(result.status).toBe('at-risk');

    // Multiple extra programs sum; nulls (failed fetches) contribute 0.
    const multi = computeGraduationOutlook({
      degreeProgress: degreeProgress(2),
      additionalDegreeProgress: [degreeProgress(3), null, { remainingCount: 4 }, {}],
      coreProgress: coreProgress(1),
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(multi.remainingUnits).toBe(2 + 3 + 4 + 1);
    expect(multi.status).toBe('at-risk'); // 10 / 2 = 5
  });

  test('additionalDegreeProgress alone does not rescue a null primary (still unknown)', () => {
    const result = computeGraduationOutlook({
      degreeProgress: null,
      additionalDegreeProgress: [degreeProgress(5)],
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(result.status).toBe('unknown');
  });

  test('coreProgress with malformed areas is tolerated', () => {
    const result = computeGraduationOutlook({
      degreeProgress: degreeProgress(2),
      coreProgress: { areas: [null, { status: 'incomplete' }, {}] },
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(result.remainingUnits).toBe(3);
  });
});

describe('OUTLOOK_DISCLAIMER', () => {
  test('is a non-empty string mentioning LOCUS and heuristic limits', () => {
    expect(typeof OUTLOOK_DISCLAIMER).toBe('string');
    expect(OUTLOOK_DISCLAIMER).toContain('LOCUS');
    expect(OUTLOOK_DISCLAIMER.length).toBeGreaterThan(50);
  });
});

// --------------------------------------------------------------------------
// Regression: message-quality fixes (2026-07-06 post-review)
// --------------------------------------------------------------------------
const go = require('../graduation-outlook');

describe('message fixes', () => {
  test('at-risk with exactly 1 semester says "next semester", not "every semester"', () => {
    const out = go.computeGraduationOutlook({
      degreeProgress: { remainingCount: 5 },
      coreProgress: null,
      graduationYear: 2027,
      now: new Date(2027, 0, 15), // Jan 2027 -> Spring 2027 only
    });
    expect(out.semestersLeft).toBe(1);
    expect(out.status).toBe('at-risk');
    expect(out.message).toContain('next semester');
    expect(out.message).not.toContain('every semester');
  });

  test('past grad year with nothing remaining reads as complete, not "on pace"', () => {
    const out = go.computeGraduationOutlook({
      degreeProgress: { remainingCount: 0 },
      coreProgress: null,
      graduationYear: 2025,
      now: new Date(2026, 6, 6), // July 2026 — Spring 2025 long gone
    });
    expect(out.status).toBe('on-track');
    expect(out.semestersLeft).toBe(0);
    expect(out.message).toContain('complete');
    expect(out.message).not.toContain('On pace');
  });

  test('programs with unloaded requirements are named, not silently counted as 0 (B12)', () => {
    const out = go.computeGraduationOutlook({
      degreeProgress: { remainingCount: 6, program: { name: 'Computer Science' } },
      additionalDegreeProgress: [
        { remainingCount: 0, requirementsUnknown: true, program: { name: 'Philosophy' } },
      ],
      coreProgress: null,
      graduationYear: 2028,
      now: new Date(2026, 6, 7),
    });
    expect(out.unknownPrograms).toEqual(['Philosophy']);
    expect(out.message).toContain("Requirements for Philosophy aren't loaded yet");
    // remainingUnits still only counts what we know about.
    expect(out.remainingUnits).toBe(6);
  });

  test('no unknown programs -> unchanged message and empty unknownPrograms', () => {
    const out = go.computeGraduationOutlook({
      degreeProgress: { remainingCount: 4 },
      coreProgress: null,
      graduationYear: 2028,
      now: new Date(2026, 6, 7),
    });
    expect(out.unknownPrograms).toEqual([]);
    expect(out.message).not.toContain("aren't loaded");
  });
});

// --------------------------------------------------------------------------
// Credits at risk + fifth-year projection (2026-08-21)
// --------------------------------------------------------------------------

describe('unitsOverPace and fifthYear', () => {
  // Oct 2026, grad 2027 -> 2 semesters; 9 remaining -> pace 4.5, at-risk.
  const atRiskArgs = {
    degreeProgress: { remainingCount: 9 },
    coreProgress: null,
    graduationYear: 2027,
    now: new Date(2026, 9, 10),
  };

  test('at-risk: unitsOverPace counts units beyond a 4-per-semester load', () => {
    const out = computeGraduationOutlook(atRiskArgs);
    expect(out.status).toBe('at-risk');
    expect(out.unitsOverPace).toBe(1); // 9 - 4*2
  });

  test('on-track: unitsOverPace is 0 and fifthYear is null', () => {
    const out = computeGraduationOutlook({
      degreeProgress: { remainingCount: 6 },
      graduationYear: 2027,
      now: new Date(2025, 8, 1), // 4 semesters -> pace 1.5
    });
    expect(out.status).toBe('on-track');
    expect(out.unitsOverPace).toBe(0);
    expect(out.fifthYear).toBeNull();
  });

  test('unknown: unitsOverPace and fifthYear are null', () => {
    const out = computeGraduationOutlook({});
    expect(out.unitsOverPace).toBeNull();
    expect(out.fifthYear).toBeNull();
  });

  test('at-risk: fifthYear projects 2 extra semesters and flags recovery', () => {
    const out = computeGraduationOutlook(atRiskArgs);
    expect(out.fifthYear).toEqual({
      gradLabel: 'Spring 2028',
      semestersLeft: 4,
      pace: 2.3, // 9 / 4 = 2.25 -> 2.3
      wouldBeOnTrack: true,
    });
  });

  test('at-risk message: singular unit over pace, fifth-year relief sentence', () => {
    const out = computeGraduationOutlook(atRiskArgs);
    expect(out.message).toContain(
      "You're 1 course unit beyond an on-track pace of 4 per semester"
    );
    expect(out.message).toContain('overload semesters or summer terms');
    expect(out.message).toContain(
      'Planning a fifth year (graduating Spring 2028)'
    );
    expect(out.message).toContain('no longer at risk');
  });

  test('off-track with 0 semesters left: all remaining units are over pace', () => {
    // June 2027, grad 2027 -> 0 semesters, 3 remaining.
    const out = computeGraduationOutlook({
      degreeProgress: { remainingCount: 3 },
      graduationYear: 2027,
      now: new Date(2027, 5, 15),
    });
    expect(out.status).toBe('off-track');
    expect(out.unitsOverPace).toBe(3);
    // Fifth year: 2 semesters for 3 units -> pace 1.5 -> recoverable.
    expect(out.fifthYear.wouldBeOnTrack).toBe(true);
    expect(out.message).toContain('no longer at risk');
  });

  test('fifth year that still does not fix it gets no relief sentence', () => {
    // June 2027, grad 2027 -> 0 semesters, 30 remaining. Fifth year: 2
    // semesters -> 15/semester, still off-track.
    const out = computeGraduationOutlook({
      degreeProgress: { remainingCount: 30 },
      graduationYear: 2027,
      now: new Date(2027, 5, 15),
    });
    expect(out.status).toBe('off-track');
    expect(out.fifthYear.wouldBeOnTrack).toBe(false);
    expect(out.message).not.toContain('fifth year');
    expect(out.message).not.toContain('no longer at risk');
    // The over-pace count still appears so the student knows the size of the gap.
    expect(out.message).toContain('30 course units beyond an on-track pace');
  });

  test('unknown-programs note still lands after the new sentences', () => {
    const out = computeGraduationOutlook({
      degreeProgress: { remainingCount: 9, program: { name: 'Computer Science' } },
      additionalDegreeProgress: [
        { remainingCount: 0, requirementsUnknown: true, program: { name: 'Philosophy' } },
      ],
      coreProgress: null,
      graduationYear: 2027,
      now: new Date(2026, 9, 10),
    });
    expect(out.status).toBe('at-risk');
    expect(out.message).toContain("Requirements for Philosophy aren't loaded yet");
    // Note comes last, after the fifth-year sentence.
    expect(out.message.indexOf('fifth year')).toBeLessThan(
      out.message.indexOf("aren't loaded")
    );
  });
});
