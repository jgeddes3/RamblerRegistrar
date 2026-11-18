import {
  registrationTermFor,
  inSessionTermFor,
  pickAvailableTerm,
  getRegistrationTerm,
  resolveRegistrationTerm,
  subscribeTerm,
  __resetTermForTests,
} from '../term';

describe('registrationTermFor', () => {
  test('Oct-Dec registers for Spring of next year', () => {
    expect(registrationTermFor(new Date(2026, 10, 18))).toEqual({ code: '1272', label: 'Spring 2027' });
    expect(registrationTermFor(new Date(2026, 9, 1)).code).toBe('1272');
  });
  test('Mar-Sep registers for Fall of this year', () => {
    expect(registrationTermFor(new Date(2026, 2, 1))).toEqual({ code: '1266', label: 'Fall 2026' });
    expect(registrationTermFor(new Date(2026, 8, 30)).code).toBe('1266');
  });
  test('Jan-Feb registers for Spring of this year', () => {
    expect(registrationTermFor(new Date(2027, 0, 15))).toEqual({ code: '1272', label: 'Spring 2027' });
  });
  test('zero-pads the year (2009 -> Spring 2010 is 1102, Fall 2005 is 1056)', () => {
    expect(registrationTermFor(new Date(2009, 10, 1)).code).toBe('1102');
    expect(registrationTermFor(new Date(2005, 4, 1)).code).toBe('1056');
  });
});

describe('inSessionTermFor', () => {
  test('Aug-Dec is Fall, Jan-May is Spring, Jun-Jul is null', () => {
    expect(inSessionTermFor(new Date(2026, 10, 18))).toEqual({ code: '1266', label: 'Fall 2026' });
    expect(inSessionTermFor(new Date(2027, 1, 1))).toEqual({ code: '1272', label: 'Spring 2027' });
    expect(inSessionTermFor(new Date(2026, 5, 15))).toBeNull();
  });
});

describe('pickAvailableTerm', () => {
  test('keeps the preferred term when it has data', () => {
    expect(pickAvailableTerm('1272', ['1266', '1272'])).toBe('1272');
  });
  test('falls back to the newest earlier term when the preferred one was never scraped', () => {
    expect(pickAvailableTerm('1272', ['1262', '1266'])).toBe('1266');
  });
  test('ignores terms later than the preferred one unless nothing earlier exists', () => {
    expect(pickAvailableTerm('1272', ['1266', '1276'])).toBe('1266');
    expect(pickAvailableTerm('1266', ['1272', '1276'])).toBe('1272');
  });
  test('ignores non Fall/Spring and malformed codes', () => {
    expect(pickAvailableTerm('1272', ['1264', 'garbage', '1266'])).toBe('1266');
  });
  test('keeps the preferred term when nothing usable is available', () => {
    expect(pickAvailableTerm('1272', [])).toBe('1272');
    expect(pickAvailableTerm('1272', null)).toBe('1272');
  });
});

describe('resolveRegistrationTerm', () => {
  const NOV_2026 = new Date(2026, 10, 18);
  beforeEach(() => __resetTermForTests(NOV_2026));

  test('starts on the calendar registration term', () => {
    expect(getRegistrationTerm()).toEqual({ code: '1272', label: 'Spring 2027' });
  });

  test('switches to the newest scraped term when the calendar term has no data, and notifies subscribers', async () => {
    const seen = [];
    const unsub = subscribeTerm(() => seen.push(getRegistrationTerm().code));
    const term = await resolveRegistrationTerm(async () => ['1266'], NOV_2026);
    unsub();
    expect(term).toEqual({ code: '1266', label: 'Fall 2026' });
    expect(getRegistrationTerm()).toEqual({ code: '1266', label: 'Fall 2026' });
    expect(seen).toEqual(['1266']);
  });

  test('does not ask the server again once resolved', async () => {
    const loader = jest.fn(async () => ['1266', '1272']);
    await resolveRegistrationTerm(loader, NOV_2026);
    await resolveRegistrationTerm(loader, NOV_2026);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(getRegistrationTerm().code).toBe('1272');
  });

  test('an unknown answer (offline: empty list or a throw) keeps the calendar term and retries next time', async () => {
    const loader = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(['1266']);
    expect((await resolveRegistrationTerm(loader, NOV_2026)).code).toBe('1272');
    expect((await resolveRegistrationTerm(loader, NOV_2026)).code).toBe('1272');
    expect((await resolveRegistrationTerm(loader, NOV_2026)).code).toBe('1266');
    expect(loader).toHaveBeenCalledTimes(3);
  });

  test('concurrent callers share one request', async () => {
    const loader = jest.fn(async () => ['1266']);
    await Promise.all([
      resolveRegistrationTerm(loader, NOV_2026),
      resolveRegistrationTerm(loader, NOV_2026),
    ]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleTermOptions', () => {
  const { scheduleTermOptions } = require('../term');
  const SPRING_27 = { code: '1272', label: 'Spring 2027' };
  const FALL_26 = { code: '1266', label: 'Fall 2026' };

  test('while registering for next term, offers the term in session and the registration term, oldest first', () => {
    expect(scheduleTermOptions(SPRING_27, new Date(2026, 10, 18))).toEqual([FALL_26, SPRING_27]);
  });

  test('offers one term when the term in session IS the registration term', () => {
    // Nov 2026, but only Fall 2026 is published so the app fell back to it.
    expect(scheduleTermOptions(FALL_26, new Date(2026, 10, 18))).toEqual([FALL_26]);
    // Feb 2027: Spring 2027 is both in session and being registered for.
    expect(scheduleTermOptions(SPRING_27, new Date(2027, 1, 10))).toEqual([SPRING_27]);
  });

  test('offers only the registration term over the summer break', () => {
    const FALL_27 = { code: '1276', label: 'Fall 2027' };
    expect(scheduleTermOptions(FALL_27, new Date(2027, 5, 20))).toEqual([FALL_27]);
  });
});
