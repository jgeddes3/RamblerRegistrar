import { canEditProfile, programEdit, minorToggleEdit, priorityEdit, MAX_MINORS } from '../profile-edits';

// Profile edits used to resend the WHOLE profile from in-memory state. When
// that state had never been restored (failed load at launch), flipping the
// Honors switch wrote a blank major, no minors and no graduation year over
// the saved ones. Each edit now sends only the field it changes.

describe('canEditProfile', () => {
  test('only once the saved profile has been restored', () => {
    expect(canEditProfile('ready')).toBe(true);
    expect(canEditProfile('loading')).toBe(false);
    expect(canEditProfile('failed')).toBe(false);
  });
});

describe('programEdit', () => {
  test('sends only the major', () => {
    expect(programEdit({ id: 12, name: 'Computer Science' })).toEqual({ selectedProgramId: 12 });
  });
});

describe('priorityEdit', () => {
  test('sends only the flag that was flipped', () => {
    expect(priorityEdit('isHonors', true)).toEqual({ isHonors: true });
    expect(priorityEdit('isAthlete', false)).toEqual({ isAthlete: false });
  });
});

describe('minorToggleEdit', () => {
  const MATH = { id: 40, name: 'Math' };
  const STAT = { id: 41, name: 'Statistics' };

  test('adding sends only the new minors list', () => {
    expect(minorToggleEdit([MATH], STAT)).toEqual({
      updated: [MATH, STAT],
      payload: { selectedMinors: [40, 41] },
    });
  });

  test('removing sends only the new minors list', () => {
    expect(minorToggleEdit([MATH, STAT], MATH)).toEqual({
      updated: [STAT],
      payload: { selectedMinors: [41] },
    });
  });

  test('refuses a minor past the cap', () => {
    const full = Array.from({ length: MAX_MINORS }, (_, i) => ({ id: i }));
    expect(minorToggleEdit(full, { id: 99 })).toBeNull();
  });

  test('treats a missing list as empty', () => {
    expect(minorToggleEdit(null, MATH).payload).toEqual({ selectedMinors: [40] });
  });
});
