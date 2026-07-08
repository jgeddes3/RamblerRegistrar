import { computeRequirementProgress } from '../requirement-progress';

const req = (code, credits = 3) => ({ code, name: code, credits, requirement_type: 'required' });
const opt = (code, group, choose, credits = 3) => ({
  code, name: code, credits, requirement_type: 'choice', choice_group: group, choose_count: choose,
});

describe('computeRequirementProgress', () => {
  test('plain required rows behave like the legacy math', () => {
    const out = computeRequirementProgress(
      [req('COMP 170'), req('COMP 271'), req('MATH 131', 4)],
      new Set(['COMP 170'])
    );
    expect(out.totalRequired).toBe(3);
    expect(out.completedCount).toBe(1);
    expect(out.remainingCount).toBe(2);
    expect(out.creditsCompleted).toBe(3);
    expect(out.creditsRemaining).toBe(7);
    expect(out.percentComplete).toBe(33);
    expect(out.remaining.map((c) => c.code)).toEqual(['COMP 271', 'MATH 131']);
  });

  test('a pick-1-of-8 group is ONE unit, not eight (the Philosophy minor shape)', () => {
    const options = ['PHIL 181', 'PHIL 182', 'PHIL 283', 'PHIL 284', 'PHIL 285', 'PHIL 286', 'PHIL 287', 'PHIL 288']
      .map((c) => opt(c, 1, 1));
    const out = computeRequirementProgress(options, new Set());
    expect(out.totalRequired).toBe(1);
    expect(out.remainingCount).toBe(1);
    expect(out.creditsRemaining).toBe(3);
    // All 8 options listed under one "Choose 1" note.
    expect(out.remaining).toHaveLength(8);
    expect(new Set(out.remaining.map((c) => c.choice_note))).toEqual(new Set(['Choose 1 of the following:']));
  });

  test('completing one option satisfies the group and hides its siblings', () => {
    const options = ['PHIL 181', 'PHIL 182', 'PHIL 283'].map((c) => opt(c, 1, 1));
    const out = computeRequirementProgress(options, new Set(['PHIL 182']));
    expect(out.completedCount).toBe(1);
    expect(out.remainingCount).toBe(0);
    expect(out.remaining).toEqual([]);
    expect(out.completed.map((c) => c.code)).toEqual(['PHIL 182']);
    expect(out.percentComplete).toBe(100);
  });

  test('choose-2 group: one done leaves one unit and a "Choose 1" note', () => {
    const options = ['A 1', 'A 2', 'A 3', 'A 4'].map((c) => opt(c, 7, 2));
    const out = computeRequirementProgress(options, new Set(['A 3']));
    expect(out.totalRequired).toBe(2);
    expect(out.completedCount).toBe(1);
    expect(out.remainingCount).toBe(1);
    expect(out.remaining.map((c) => c.code)).toEqual(['A 1', 'A 2', 'A 4']);
    expect(out.remaining[0].choice_note).toBe('Choose 1 of the following:');
    expect(out.creditsRemaining).toBe(3); // one unmet unit, not three options
  });

  test('overachieving a group never exceeds its unit count', () => {
    const options = ['B 1', 'B 2', 'B 3'].map((c) => opt(c, 2, 1));
    const out = computeRequirementProgress(options, new Set(['B 1', 'B 2', 'B 3']));
    expect(out.totalRequired).toBe(1);
    expect(out.completedCount).toBe(1);
    expect(out.percentComplete).toBe(100);
    expect(out.completed).toHaveLength(1); // capped at choose_count
  });

  test('mixed required + multiple groups', () => {
    const rows = [
      req('CORE 100'),
      ...['C 1', 'C 2'].map((c) => opt(c, 1, 1)),
      ...['D 1', 'D 2', 'D 3'].map((c) => opt(c, 2, 2)),
    ];
    const out = computeRequirementProgress(rows, new Set(['CORE 100', 'D 1']));
    // units: 1 required + 1 (group C) + 2 (group D) = 4; done: CORE + D1 = 2
    expect(out.totalRequired).toBe(4);
    expect(out.completedCount).toBe(2);
    expect(out.percentComplete).toBe(50);
  });

  test('choose_count larger than the option list clamps to the list size', () => {
    const options = ['E 1', 'E 2'].map((c) => opt(c, 9, 5));
    const out = computeRequirementProgress(options, new Set());
    expect(out.totalRequired).toBe(2);
  });

  test('empty input -> zeroes, no NaN percent', () => {
    const out = computeRequirementProgress([], new Set());
    expect(out.totalRequired).toBe(0);
    expect(out.percentComplete).toBe(0);
  });

  describe('subject electives (the Philosophy-minor prose requirements)', () => {
    const se = (subject, count, minLevel = null) => ({
      requirement_type: 'subject_elective', subject, count, min_level: minLevel,
    });

    test('the full Philosophy minor shape: 2 picks + 2 any-level + 2 at 300 = 6 units', () => {
      const rows = [
        opt('PHIL 181', 1, 1), opt('PHIL 182', 1, 1),
        opt('PHIL 130', 2, 1), opt('PHIL 271', 2, 1),
        se('PHIL', 2, null),
        se('PHIL', 2, 300),
      ];
      const out = computeRequirementProgress(rows, new Set());
      expect(out.totalRequired).toBe(6);
      expect(out.remainingCount).toBe(6);
      const placeholders = out.remaining.filter((r) => r.is_placeholder);
      expect(placeholders).toHaveLength(4);
    });

    test('any matching completed course satisfies, respecting min_level', () => {
      const out = computeRequirementProgress(
        [se('PHIL', 2, 300)],
        new Set(['PHIL 130', 'PHIL 340', 'HIST 300'])
      );
      // Only PHIL 340 qualifies (PHIL 130 below level, HIST wrong subject).
      expect(out.completedCount).toBe(1);
      expect(out.remainingCount).toBe(1);
      expect(out.completed[0].code).toBe('PHIL 340');
    });

    test('courses consumed by explicit requirements do not double-count into electives', () => {
      const rows = [
        req('PHIL 181'),
        se('PHIL', 1, null),
      ];
      const out = computeRequirementProgress(rows, new Set(['PHIL 181']));
      // PHIL 181 satisfies the required row ONLY — the elective stays unmet.
      expect(out.totalRequired).toBe(2);
      expect(out.completedCount).toBe(1);
      expect(out.remaining.filter((r) => r.is_placeholder)).toHaveLength(1);
    });

    test('a second matching course fills the elective after consumption', () => {
      const rows = [req('PHIL 181'), se('PHIL', 1, null)];
      const out = computeRequirementProgress(rows, new Set(['PHIL 181', 'PHIL 285']));
      expect(out.completedCount).toBe(2);
      expect(out.percentComplete).toBe(100);
    });

    test('choice-group picks are consumed before electives too', () => {
      const rows = [opt('PHIL 181', 1, 1), opt('PHIL 182', 1, 1), se('PHIL', 1, null)];
      const out = computeRequirementProgress(rows, new Set(['PHIL 181', 'PHIL 182']));
      // 181 satisfies the group; 182 spills into the elective.
      expect(out.completedCount).toBe(2);
      expect(out.remainingCount).toBe(0);
    });
  });
});
