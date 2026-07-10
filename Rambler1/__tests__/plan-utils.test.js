import { termCodeFor, termLabelFor, planSemesters, allPlannedCodes, planOrderingIssues, programImpact } from '../plan-utils';

describe('termCodeFor / termLabelFor', () => {
  test('round-trips Loyola term codes', () => {
    expect(termCodeFor('Fall', 2026)).toBe('1266');
    expect(termCodeFor('Spring', 2027)).toBe('1272');
    expect(termLabelFor('1266')).toBe('Fall 2026');
    expect(termLabelFor('1272')).toBe('Spring 2027');
  });
  test('unknown shapes pass through', () => {
    expect(termLabelFor('garbage')).toBe('garbage');
  });
});

describe('planSemesters', () => {
  test('July 2026 through Spring 2028: Fall26, Spring27, Fall27, Spring28', () => {
    const sems = planSemesters(2028, new Date(2026, 6, 8));
    expect(sems.map((s) => s.label)).toEqual([
      'Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028',
    ]);
    expect(sems.map((s) => s.code)).toEqual(['1266', '1272', '1276', '1282']);
  });

  test('February start includes the in-progress Spring', () => {
    const sems = planSemesters(2027, new Date(2026, 1, 10));
    expect(sems.map((s) => s.label)).toEqual([
      'Spring 2026', 'Fall 2026', 'Spring 2027',
    ]);
  });

  test('missing graduation year falls back to a fixed horizon', () => {
    const sems = planSemesters(null, new Date(2026, 6, 8), 4);
    expect(sems).toHaveLength(4);
    expect(sems[0].label).toBe('Fall 2026');
  });

  test('graduation year in the past falls back too', () => {
    const sems = planSemesters(2020, new Date(2026, 6, 8), 3);
    expect(sems).toHaveLength(3);
  });
});

describe('planOrderingIssues', () => {
  const base = {
    termOrder: ['1266', '1272', '1276'],
    prereqsByCode: { 'COMP 271': ['COMP 170'], 'COMP 371': ['COMP 271'] },
  };

  test('prereq planned in an earlier semester is fine', () => {
    const issues = planOrderingIssues({
      ...base,
      planByTerm: { 1266: ['COMP 170'], 1272: ['COMP 271'] },
      completedCodes: [],
    });
    expect(issues).toEqual([]);
  });

  test('prereq planned LATER is flagged', () => {
    const issues = planOrderingIssues({
      ...base,
      planByTerm: { 1266: ['COMP 271'], 1272: ['COMP 170'] },
      completedCodes: [],
    });
    expect(issues).toEqual([
      { code: 'COMP 271', term: '1266', prereq: 'COMP 170', reason: 'later' },
    ]);
  });

  test('same-semester prereq is flagged as concurrent', () => {
    const issues = planOrderingIssues({
      ...base,
      planByTerm: { 1266: ['COMP 170', 'COMP 271'] },
      completedCodes: [],
    });
    expect(issues[0].reason).toBe('same');
  });

  test('completed prereqs satisfy regardless of the plan', () => {
    const issues = planOrderingIssues({
      ...base,
      planByTerm: { 1266: ['COMP 271'] },
      completedCodes: ['comp 170'], // normalization applies
    });
    expect(issues).toEqual([]);
  });

  test('missing prereq (neither completed nor planned) is flagged', () => {
    const issues = planOrderingIssues({
      ...base,
      planByTerm: { 1272: ['COMP 371'] },
      completedCodes: [],
    });
    expect(issues).toEqual([
      { code: 'COMP 371', term: '1272', prereq: 'COMP 271', reason: 'missing' },
    ]);
  });

  test('empty inputs produce no issues', () => {
    expect(planOrderingIssues({})).toEqual([]);
    expect(planOrderingIssues({ planByTerm: { 1266: ['COMP 170'] }, termOrder: ['1266'] })).toEqual([]);
  });
});

describe('programImpact', () => {
  test('small addition fits inside spare capacity', () => {
    // 4 semesters left, 12 base units -> plenty of room for 6 more (18/5 -> 4 sems)
    const r = programImpact({ programRemainingCount: 6, baseRemainingCount: 12, semestersLeft: 4 });
    expect(r.fitsTimeline).toBe(true);
    expect(r.addedSemesters).toBe(0);
  });

  test('a big minor late in the game extends the timeline', () => {
    // 2 semesters left, 8 base units (needs 2 sems), +8 more -> 16/5 = 4 sems
    const r = programImpact({ programRemainingCount: 8, baseRemainingCount: 8, semestersLeft: 2 });
    expect(r.fitsTimeline).toBe(false);
    expect(r.addedSemesters).toBe(2);
    expect(r.totalSemestersNeeded).toBe(4);
  });

  test('already off-track: added semesters are marginal, not total', () => {
    // 2 sems left but 15 base units already need 3 sems; +10 -> 25/5 = 5 sems
    const r = programImpact({ programRemainingCount: 10, baseRemainingCount: 15, semestersLeft: 2 });
    expect(r.fitsTimeline).toBe(false);
    expect(r.addedSemesters).toBe(2); // 5 - 3, not 5 - 2
  });

  test('zero remaining program (already satisfied) adds nothing', () => {
    const r = programImpact({ programRemainingCount: 0, baseRemainingCount: 10, semestersLeft: 4 });
    expect(r.addedSemesters).toBe(0);
    expect(r.fitsTimeline).toBe(true);
  });

  test('degenerate inputs never NaN or go negative', () => {
    const r = programImpact({});
    expect(r.addedSemesters).toBe(0);
    expect(r.totalSemestersNeeded).toBeGreaterThanOrEqual(1);
  });
});

describe('allPlannedCodes', () => {
  test('flattens, normalizes, and dedupes across semesters', () => {
    expect(allPlannedCodes({
      1266: ['comp 170', 'MATH  131'],
      1272: ['COMP 170', 'PHIL 181'],
    })).toEqual(['COMP 170', 'MATH 131', 'PHIL 181']);
  });
  test('handles empty/missing input', () => {
    expect(allPlannedCodes(null)).toEqual([]);
    expect(allPlannedCodes({})).toEqual([]);
  });
});
