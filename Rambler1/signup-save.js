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
// shouldStop(): checked between attempts (account deletion started).
export async function saveSignupData(uid, data, api, { delays = [], sleep = defaultSleep, shouldStop = () => false } = {}) {
  let remaining = normalize(data);
  for (let attempt = 0; ; attempt++) {
    remaining = await saveOnce(uid, remaining, api);
    if (isNothingPending(remaining) || attempt >= delays.length || shouldStop()) break;
    await sleep(delays[attempt]);
    if (shouldStop()) break;
  }
  return { ok: isNothingPending(remaining), remaining };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---- a later retry: the server's current state wins ------------------------
// By the time a pending save is retried (minutes or launches later), the user
// may have changed things in Profile. Those edits write single fields, so a
// field present on the server was either saved by an earlier attempt or
// changed since; either way the signup value must not be written over it.
// server: { profileKeys: [field names on users/{uid}], hasQuiz }.
export function pruneAgainstServer(remaining, server) {
  const r = normalize(remaining);
  let profile = null;
  if (r.profile) {
    const have = new Set((server && server.profileKeys) || []);
    const left = Object.fromEntries(Object.entries(r.profile).filter(([k]) => !have.has(k)));
    profile = Object.keys(left).length ? left : null;
  }
  return { profile, quiz: server && server.hasQuiz ? null : r.quiz, courseCodes: r.courseCodes };
}

// The user removed a course after signup: a later retry must not re-add it.
export async function forgetPendingCourse(storage, uid, code) {
  const pending = await readPendingSignup(storage, uid);
  if (!pending || !pending.courseCodes.includes(code)) return;
  const remaining = { ...pending, courseCodes: pending.courseCodes.filter((c) => c !== code) };
  if (isNothingPending(remaining)) await clearPendingSignup(storage);
  else await storePendingSignup(storage, uid, remaining);
}

// A failed retry stores what it still couldn't save. Courses removed from the
// pending entry while it ran (forgetPendingCourse) stay removed.
export function keepStillPending(remaining, current) {
  if (!current) return remaining;
  return { ...remaining, courseCodes: remaining.courseCodes.filter((c) => current.courseCodes.includes(c)) };
}

// The banner's retry in flight. Account deletion waits it out rather than
// racing it: a retry that lands after the delete would recreate the profile.
let inFlight = null;
export function trackRetry(promise) {
  inFlight = promise;
  promise.then(() => {}, () => {}).then(() => { if (inFlight === promise) inFlight = null; });
  return promise;
}
export const settleRetry = () => (inFlight ? inFlight.then(() => {}, () => {}) : Promise.resolve());

// read() once, then again after each delay while it resolves null.
export async function firstResult(read, delays = [], sleep = defaultSleep, shouldStop = () => false) {
  for (let attempt = 0; ; attempt++) {
    const value = await read();
    if (value != null || attempt >= delays.length || shouldStop()) return value ?? null;
    await sleep(delays[attempt]);
  }
}

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
