import {
  fillWarning,
  requirementCoverage,
  coverageSummaryLine,
} from '../planning-insights';

const DAY12_HIGH =
  'Filled before sophomore registration opened last term. Have a backup plan.';
const DAY12_INFO =
  'Fills on day one of registration. Register the moment your window opens.';
const FIRST_WEEK_WARN =
  'Filled during registration week last term. Register the moment your window opens.';
const FIRST_WEEK_INFO = 'Fills within the first week of registration.';
const SUFFIX = ' (seat counts changed last term, so treat as an estimate)';
const ATHLETE_INFO =
  'Your athlete priority window opens before general registration. Register early and you should be fine.';
const HONORS_INFO =
  'You have Honors priority. Register right when your window opens.';

describe('fillWarning', () => {
  describe("class 'day1-2'", () => {
    it('Freshman -> high', () => {
      expect(fillWarning({ class: 'day1-2' }, 'Freshman')).toEqual({
        level: 'high',
        text: DAY12_HIGH,
      });
    });

    it('Sophomore (case-insensitive, padded) -> high', () => {
      expect(fillWarning({ class: 'day1-2' }, '  sOpHoMoRe ')).toEqual({
        level: 'high',
        text: DAY12_HIGH,
      });
    });

    it('Junior -> info', () => {
      expect(fillWarning({ class: 'day1-2' }, 'Junior')).toEqual({
        level: 'info',
        text: DAY12_INFO,
      });
    });

    it('Senior -> info', () => {
      expect(fillWarning({ class: 'day1-2' }, 'Senior')).toEqual({
        level: 'info',
        text: DAY12_INFO,
      });
    });

    it.each([null, undefined, '', 'Graduate', 42])(
      'unknown classYear %p -> info variant',
      (year) => {
        expect(fillWarning({ class: 'day1-2' }, year)).toEqual({
          level: 'info',
          text: DAY12_INFO,
        });
      }
    );
  });

  describe("class 'first-week'", () => {
    it('Freshman -> warn', () => {
      expect(fillWarning({ class: 'first-week' }, 'Freshman')).toEqual({
        level: 'warn',
        text: FIRST_WEEK_WARN,
      });
    });

    it('sophomore lowercase -> warn', () => {
      expect(fillWarning({ class: 'first-week' }, 'sophomore')).toEqual({
        level: 'warn',
        text: FIRST_WEEK_WARN,
      });
    });

    it('Senior -> info', () => {
      expect(fillWarning({ class: 'first-week' }, 'Senior')).toEqual({
        level: 'info',
        text: FIRST_WEEK_INFO,
      });
    });

    it('unknown classYear -> info', () => {
      expect(fillWarning({ class: 'first-week' }, null)).toEqual({
        level: 'info',
        text: FIRST_WEEK_INFO,
      });
    });
  });

  describe('capChanged suffix', () => {
    it('appends to day1-2 high text', () => {
      expect(
        fillWarning({ class: 'day1-2', capChanged: true }, 'Freshman')
      ).toEqual({ level: 'high', text: DAY12_HIGH + SUFFIX });
    });

    it('appends to first-week info text', () => {
      expect(
        fillWarning({ class: 'first-week', capChanged: true }, 'Senior')
      ).toEqual({ level: 'info', text: FIRST_WEEK_INFO + SUFFIX });
    });

    it('capChanged false -> no suffix', () => {
      expect(
        fillWarning({ class: 'day1-2', capChanged: false }, 'Senior').text
      ).toBe(DAY12_INFO);
    });
  });

  describe('null cases (no warning)', () => {
    it.each([null, undefined, {}, { capChanged: true }])(
      'missing fillStats/class %p -> null',
      (stats) => {
        expect(fillWarning(stats, 'Freshman')).toBeNull();
      }
    );

    it("'steady' -> null even for Freshman", () => {
      expect(fillWarning({ class: 'steady' }, 'Freshman')).toBeNull();
    });

    it("'open' -> null (freshman-reserved cores must NOT get scarcity warnings)", () => {
      expect(fillWarning({ class: 'open', capChanged: true }, 'Freshman')).toBeNull();
    });

    it('unrecognized class string -> null', () => {
      expect(fillWarning({ class: 'day1' }, 'Freshman')).toBeNull();
    });
  });

  describe('priority flags (3rd param)', () => {
    it('athlete downgrades day1-2 Freshman high -> info athlete text', () => {
      expect(
        fillWarning({ class: 'day1-2' }, 'Freshman', { isAthlete: true })
      ).toEqual({ level: 'info', text: ATHLETE_INFO });
    });

    it('honors downgrades first-week Sophomore warn -> info honors text', () => {
      expect(
        fillWarning({ class: 'first-week' }, 'Sophomore', { isHonors: true })
      ).toEqual({ level: 'info', text: HONORS_INFO });
    });

    it('athlete takes precedence over honors when both true', () => {
      expect(
        fillWarning({ class: 'day1-2' }, 'Freshman', {
          isAthlete: true,
          isHonors: true,
        })
      ).toEqual({ level: 'info', text: ATHLETE_INFO });
    });

    it('does NOT change an already-info result (senior day1-2)', () => {
      expect(
        fillWarning({ class: 'day1-2' }, 'Senior', {
          isAthlete: true,
          isHonors: true,
        })
      ).toEqual({ level: 'info', text: DAY12_INFO });
    });

    it('does NOT change null results (steady/open)', () => {
      expect(
        fillWarning({ class: 'steady' }, 'Freshman', { isAthlete: true })
      ).toBeNull();
      expect(
        fillWarning({ class: 'open' }, 'Freshman', { isHonors: true })
      ).toBeNull();
    });

    it('capChanged suffix still appended to priority texts', () => {
      expect(
        fillWarning({ class: 'day1-2', capChanged: true }, 'Freshman', {
          isAthlete: true,
        })
      ).toEqual({ level: 'info', text: ATHLETE_INFO + SUFFIX });
      expect(
        fillWarning({ class: 'first-week', capChanged: true }, 'Sophomore', {
          isHonors: true,
        })
      ).toEqual({ level: 'info', text: HONORS_INFO + SUFFIX });
    });

    it('falsy/non-true flags leave the underclass warning intact', () => {
      expect(
        fillWarning({ class: 'day1-2' }, 'Freshman', {
          isAthlete: false,
          isHonors: 'yes',
        })
      ).toEqual({ level: 'high', text: DAY12_HIGH });
      expect(fillWarning({ class: 'first-week' }, 'Sophomore', null)).toEqual({
        level: 'warn',
        text: FIRST_WEEK_WARN,
      });
    });

    it('2-arg calls remain backward compatible', () => {
      expect(fillWarning({ class: 'day1-2' }, 'Freshman')).toEqual({
        level: 'high',
        text: DAY12_HIGH,
      });
      expect(fillWarning({ class: 'first-week' }, 'Sophomore')).toEqual({
        level: 'warn',
        text: FIRST_WEEK_WARN,
      });
      expect(fillWarning({ class: 'day1-2' }, 'Senior')).toEqual({
        level: 'info',
        text: DAY12_INFO,
      });
    });
  });
});

describe('requirementCoverage', () => {
  const degreeProgress = {
    program: { name: 'Computer Science BS' },
    remaining: [{ code: 'COMP 271' }, { code: 'COMP 313' }],
    remainingCount: 2,
  };
  const additionalDegreeProgress = [
    {
      program: { name: 'Math Minor' },
      remaining: [{ code: 'MATH 212' }],
      remainingCount: 1,
    },
    null, // failed fetch tolerated
  ];
  const coreProgress = {
    areas: [
      {
        name: 'Philosophical Knowledge',
        status: 'incomplete',
        courseOptions: [{ course_code: 'PHIL 130' }, { course_code: 'COMP 271' }],
      },
      {
        name: 'Artistic Knowledge',
        status: 'complete',
        courseOptions: [{ course_code: 'FNAR 200' }],
      },
    ],
  };

  it('covers major + minor + core, with one course satisfying both major and core', () => {
    const result = requirementCoverage({
      degreeProgress,
      additionalDegreeProgress,
      coreProgress,
      plannedCourseCodes: ['  comp 271 ', 'PHIL 130', 'HIST 101', 'math  212'],
    });

    expect(result.planned).toEqual([
      {
        code: 'COMP 271',
        satisfies: ['Computer Science BS', 'Core: Philosophical Knowledge'],
      },
      { code: 'PHIL 130', satisfies: ['Core: Philosophical Knowledge'] },
      { code: 'HIST 101', satisfies: [] },
      { code: 'MATH 212', satisfies: ['Math Minor'] },
    ]);
    // 3 distinct requirement units: major COMP 271 + Core Philosophical
    // Knowledge (covered once, via COMP 271 and PHIL 130) + Math Minor MATH 212
    expect(result.coveredCount).toBe(3);
    // 2 major + 1 minor + 1 incomplete core area (matches graduation outlook)
    expect(result.remainingTotal).toBe(4);
  });

  it('two planned options of the same incomplete core area count as 1 covered requirement', () => {
    const result = requirementCoverage({
      coreProgress: {
        areas: [
          {
            name: 'Philosophical Knowledge',
            status: 'incomplete',
            courseOptions: [{ course_code: 'PHIL 130' }, { course_code: 'PHIL 181' }],
          },
        ],
      },
      plannedCourseCodes: ['PHIL 130', 'PHIL 181'],
    });
    expect(result.planned).toEqual([
      { code: 'PHIL 130', satisfies: ['Core: Philosophical Knowledge'] },
      { code: 'PHIL 181', satisfies: ['Core: Philosophical Knowledge'] },
    ]);
    expect(result.coveredCount).toBe(1);
    expect(result.remainingTotal).toBe(1);
  });

  it('one course satisfying a major requirement AND a core area covers 2 units', () => {
    const result = requirementCoverage({
      degreeProgress,
      coreProgress,
      plannedCourseCodes: ['COMP 271'],
    });
    expect(result.coveredCount).toBe(2);
    // 2 major remaining + 1 incomplete core area
    expect(result.remainingTotal).toBe(3);
  });

  it('complete core areas are excluded from the universe', () => {
    const result = requirementCoverage({
      degreeProgress,
      coreProgress,
      plannedCourseCodes: ['FNAR 200'],
    });
    expect(result.planned).toEqual([{ code: 'FNAR 200', satisfies: [] }]);
    expect(result.coveredCount).toBe(0);
  });

  it('falls back to generic labels when program names are missing', () => {
    const result = requirementCoverage({
      degreeProgress: { remaining: [{ code: 'BIOL 101' }], remainingCount: 1 },
      additionalDegreeProgress: [
        { remaining: [{ code: 'CHEM 101' }], remainingCount: 1 },
      ],
      plannedCourseCodes: ['BIOL 101', 'CHEM 101'],
    });
    expect(result.planned).toEqual([
      { code: 'BIOL 101', satisfies: ['Major requirement'] },
      { code: 'CHEM 101', satisfies: ['2nd program'] },
    ]);
    expect(result.coveredCount).toBe(2);
    expect(result.remainingTotal).toBe(2);
  });

  it('dedups repeated planned codes after normalization', () => {
    const result = requirementCoverage({
      degreeProgress,
      plannedCourseCodes: ['COMP 271', 'comp 271', ' COMP  271 '],
    });
    expect(result.planned).toHaveLength(1);
    expect(result.coveredCount).toBe(1);
  });

  it('tolerates empty/null everything', () => {
    expect(requirementCoverage({})).toEqual({
      coveredCount: 0,
      planned: [],
      remainingTotal: 0,
    });
    expect(requirementCoverage()).toEqual({
      coveredCount: 0,
      planned: [],
      remainingTotal: 0,
    });
    expect(
      requirementCoverage({
        degreeProgress: null,
        additionalDegreeProgress: null,
        coreProgress: null,
        plannedCourseCodes: null,
      })
    ).toEqual({ coveredCount: 0, planned: [], remainingTotal: 0 });
  });

  it('skips malformed planned entries and remaining entries', () => {
    const result = requirementCoverage({
      degreeProgress: {
        remaining: [{ code: 'COMP 271' }, null, {}, { code: '' }],
        remainingCount: 4,
      },
      coreProgress: { areas: [null, { status: 'incomplete', courseOptions: null }] },
      plannedCourseCodes: [null, undefined, '', '  ', 42, 'COMP 271'],
    });
    expect(result.planned).toEqual([
      { code: 'COMP 271', satisfies: ['Major requirement'] },
    ]);
    expect(result.coveredCount).toBe(1);
    // remainingCount taken at face value + 1 incomplete core area
    expect(result.remainingTotal).toBe(5);
  });
});

describe('coverageSummaryLine', () => {
  it('with pace clause', () => {
    expect(
      coverageSummaryLine({ coveredCount: 2, plannedCount: 4, neededPerSemester: 5 })
    ).toBe(
      'Covers 2 of your remaining requirements. You need about 5/semester to stay on pace.'
    );
  });

  it('without pace clause (neededPerSemester null)', () => {
    expect(
      coverageSummaryLine({ coveredCount: 2, plannedCount: 4, neededPerSemester: null })
    ).toBe('Covers 2 of your remaining requirements.');
  });

  it('zero covered', () => {
    expect(
      coverageSummaryLine({ coveredCount: 0, plannedCount: 3, neededPerSemester: 5 })
    ).toBe(
      'None of your 3 planned courses cover a remaining requirement. You need about 5/semester to stay on pace.'
    );
  });

  it('zero covered, single planned course', () => {
    expect(coverageSummaryLine({ coveredCount: 0, plannedCount: 1 })).toBe(
      'None of your 1 planned course covers a remaining requirement.'
    );
  });

  it('nothing planned -> empty string', () => {
    expect(coverageSummaryLine({ coveredCount: 0, plannedCount: 0 })).toBe('');
    expect(coverageSummaryLine()).toBe('');
  });
});
