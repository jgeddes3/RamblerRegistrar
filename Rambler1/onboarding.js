// onboarding.js — the sign-up flow's steps and its saved draft.
// No react, no firebase: storage (AsyncStorage) is passed in.
//
// Sign-up is six screens before the app opens. Answers used to live only in
// memory, so closing the app meant starting over; the draft keeps them on
// the phone until the account is created, and Login offers to continue.

export const ONBOARDING_STEPS = [
  'ProgramSelect', 'CourseSelect', 'PreferenceQuiz', 'QuizResults', 'SchedulingPrefs', 'AccountSetup',
];

// { n, total } for "Step n of total", or null for screens outside the flow.
export function stepNumber(route) {
  const i = ONBOARDING_STEPS.indexOf(route);
  return i < 0 ? null : { n: i + 1, total: ONBOARDING_STEPS.length };
}

// The stack to rebuild when resuming at `step`: Login, then every step up to
// it, so Back walks the flow as if it had never been closed. A skipped quiz
// has no results to show, so QuizResults is left out (and resuming "at" it
// means going back to the quiz).
export function resumeRoutes(step, { quizTaken = true } = {}) {
  let target = step;
  if (!quizTaken && target === 'QuizResults') target = 'PreferenceQuiz';
  const i = ONBOARDING_STEPS.indexOf(target);
  if (i < 0) return null;
  const names = ONBOARDING_STEPS.slice(0, i + 1).filter((name) => quizTaken || name !== 'QuizResults');
  return [{ name: 'Login' }, ...names.map((name) => ({ name }))];
}

// ---- the draft --------------------------------------------------------------
// { step, selectedProgram, selectedProgram2, selectedMinors, selectedCourses,
//   quizResults, quizProgress: { answers, current }, prefsProgress: { answers, current },
//   savedAt }
export const DRAFT_KEY = '@rambler_onboarding_draft';
export const DRAFT_MAX_AGE_MS = 30 * 24 * 3600 * 1000; // a month: past it, start fresh

export async function loadDraft(storage) {
  try {
    const raw = await storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== 'object') return null;
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) return null;
    return draft;
  } catch (e) {
    return null;
  }
}

// Writes run one at a time: saveDraft reads the draft, merges, and writes it
// back, so two at once (finishing preferences while Create Account records
// itself) would each write their own copy and one patch would be lost.
let queue = Promise.resolve();
const inQueue = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.then(() => {}, () => {});
  return run;
};

export function saveDraft(storage, patch) {
  return inQueue(async () => {
    try {
      const current = (await loadDraft(storage)) || {};
      await storage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch, savedAt: Date.now() }));
    } catch (e) {
      // A draft is a convenience: failing to keep one must not stop sign-up.
    }
  });
}

export function clearDraft(storage) {
  return inQueue(async () => {
    try { await storage.removeItem(DRAFT_KEY); } catch (e) { /* nothing to keep */ }
  });
}
