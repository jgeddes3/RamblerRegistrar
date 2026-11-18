// signup-save.js — save what a new account chose during onboarding, and keep
// whatever didn't save so it can be retried instead of dropped.
// No react, no firebase: the data-layer functions and storage are passed in.
//
// data / remaining: { profile: object|null, quiz: object|null, courseCodes: [] }
//   A part is null (or [] for courses) once it has been saved.
//
// The data-layer saves resolve null on failure (they time out on their own,
// see firestore-guards.js); a throw counts as a failure too.

import { saveCoursesConcurrently } from './course-sync';

export const PENDING_SIGNUP_KEY = 'pendingSignupSave';
// Background retries before the banner shows (PendingSaveBanner).
export const RETRY_DELAYS_MS = [2000, 5000];

const succeeded = (r) => r.status === 'fulfilled' && !!r.value;

export const isNothingPending = (r) =>
  !r || (!r.profile && !r.quiz && !(r.courseCodes && r.courseCodes.length));

const normalize = (d = {}) => ({
  profile: d.profile || null,
  quiz: d.quiz || null,
  courseCodes: [...new Set((d.courseCodes || []).filter(Boolean))],
});

async function saveOnce(uid, r, api) {
  const [profile, quiz, courses] = await Promise.allSettled([
    r.profile ? api.saveUserProfile(uid, r.profile) : true,
    r.quiz ? api.saveQuizResults(uid, r.quiz) : true,
    saveCoursesConcurrently(r.courseCodes, (code) => api.addUserCourse(uid, code, null, null)),
  ]);
  return {
    profile: succeeded(profile) ? null : r.profile,
    quiz: succeeded(quiz) ? null : r.quiz,
    courseCodes: courses.status === 'fulfilled' ? courses.value.failed : r.courseCodes,
  };
}

// One attempt, then one more after each delay, retrying only what failed.
export async function saveSignupData(uid, data, api, { delays = [], sleep = defaultSleep } = {}) {
  let remaining = normalize(data);
  for (let attempt = 0; ; attempt++) {
    remaining = await saveOnce(uid, remaining, api);
    if (isNothingPending(remaining) || attempt >= delays.length) break;
    await sleep(delays[attempt]);
  }
  return { ok: isNothingPending(remaining), remaining };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- what is still unsaved, kept on the device across restarts -------------

export async function storePendingSignup(storage, uid, remaining) {
  await storage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({ uid, remaining: normalize(remaining) }));
}

// The unsaved parts for this account, or null (none, another account's, or
// unreadable).
export async function readPendingSignup(storage, uid) {
  try {
    const raw = await storage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.uid !== uid || isNothingPending(parsed.remaining)) return null;
    return normalize(parsed.remaining);
  } catch (e) {
    return null;
  }
}

export async function clearPendingSignup(storage) {
  await storage.removeItem(PENDING_SIGNUP_KEY);
}
