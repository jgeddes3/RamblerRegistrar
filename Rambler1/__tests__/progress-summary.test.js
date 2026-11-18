import { programProgressSummary } from '../progress-summary';

// The Progress tab loaded degree progress for the second major and each minor
// but drew their bars and tab badges from hardcoded zeros.

const CS2 = { id: 14, name: 'Mathematics', min_credits: 45 };
const MINOR = { id: 40, name: 'Statistics', min_credits: 18 };
const LOADED = [
  { program: { id: 14 }, percentComplete: 40, creditsCompleted: 18, totalCreditsRequired: 45 },
  { program: { id: '40' }, percentComplete: 67, creditsCompleted: 12, totalCreditsRequired: 18 },
];

test('uses the loaded progress for the program', () => {
  expect(programProgressSummary(LOADED, CS2, 60)).toEqual({ percent: 40, completed: 18, total: 45 });
});

test('matches ids whether they arrive as numbers or strings', () => {
  expect(programProgressSummary(LOADED, MINOR, 18)).toEqual({ percent: 67, completed: 12, total: 18 });
});

test('falls back to zero of the program minimum when nothing was loaded for it', () => {
  expect(programProgressSummary(LOADED, { id: 99, min_credits: 21 }, 18)).toEqual({ percent: 0, completed: 0, total: 21 });
  expect(programProgressSummary([], { id: 99 }, 18)).toEqual({ percent: 0, completed: 0, total: 18 });
  expect(programProgressSummary(null, MINOR, 18)).toEqual({ percent: 0, completed: 0, total: 18 });
});

test('a program whose requirements are not in the catalog yet keeps its minimum as the total', () => {
  const empty = [{ program: { id: 14 }, percentComplete: 0, creditsCompleted: 0, totalCreditsRequired: 0 }];
  expect(programProgressSummary(empty, CS2, 60)).toEqual({ percent: 0, completed: 0, total: 45 });
});

test('skips failed loads (null entries)', () => {
  expect(programProgressSummary([null, LOADED[0]], CS2, 60).percent).toBe(40);
});
