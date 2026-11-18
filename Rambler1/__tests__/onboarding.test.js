// onboarding.test.js — "Step n of 6", a draft that survives closing the app,
// and the route stack to resume from.
import {
  ONBOARDING_STEPS, stepNumber, resumeRoutes, saveDraft, loadDraft, clearDraft, DRAFT_MAX_AGE_MS,
} from '../onboarding';

const memory = () => {
  const m = new Map();
  return {
    getItem: async (k) => (m.has(k) ? m.get(k) : null),
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
    _m: m,
  };
};

test('six steps, in the order the sign-up flow runs', () => {
  expect(ONBOARDING_STEPS).toEqual(['ProgramSelect', 'CourseSelect', 'PreferenceQuiz', 'QuizResults', 'SchedulingPrefs', 'AccountSetup']);
  expect(stepNumber('PreferenceQuiz')).toEqual({ n: 3, total: 6 });
  expect(stepNumber('Login')).toBeNull();
});

test('resuming rebuilds the stack under the step, so Back still works', () => {
  expect(resumeRoutes('PreferenceQuiz').map((r) => r.name))
    .toEqual(['Login', 'ProgramSelect', 'CourseSelect', 'PreferenceQuiz']);
  expect(resumeRoutes('Nowhere')).toBeNull();
});

test('a draft merges as the user goes, and clears', async () => {
  const storage = memory();
  await saveDraft(storage, { step: 'CourseSelect', selectedProgram: { id: 'p1' } });
  await saveDraft(storage, { step: 'PreferenceQuiz', quizProgress: { answers: { 0: 2 }, current: 1 } });
  const draft = await loadDraft(storage);
  expect(draft.step).toBe('PreferenceQuiz');
  expect(draft.selectedProgram).toEqual({ id: 'p1' });
  expect(draft.quizProgress).toEqual({ answers: { 0: 2 }, current: 1 });
  await clearDraft(storage);
  expect(await loadDraft(storage)).toBeNull();
});

test('an old or unreadable draft is ignored', async () => {
  const storage = memory();
  await storage.setItem('@rambler_onboarding_draft', '{oops');
  expect(await loadDraft(storage)).toBeNull();
  await storage.setItem('@rambler_onboarding_draft', JSON.stringify({ step: 'CourseSelect', savedAt: Date.now() - DRAFT_MAX_AGE_MS - 1 }));
  expect(await loadDraft(storage)).toBeNull();
});
