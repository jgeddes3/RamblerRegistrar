// signup-save.test.js — signup details are retried until saved, never dropped.
import {
  saveSignupData, storePendingSignup, readPendingSignup, clearPendingSignup, isNothingPending,
} from '../signup-save';

const DATA = {
  profile: { selectedProgramId: 'p1', graduationYear: '2028' },
  quiz: { scores: { R: 1 }, code: 'RIA' },
  courseCodes: ['COMP 170', 'MATH 131'],
};
const noSleep = async () => {};

const api = ({ profile = [], quiz = [], course = {} } = {}) => {
  // Each list is the sequence of results per call; past its end, calls succeed.
  const next = (list) => (list.length ? list.shift() : { success: true });
  return {
    saveUserProfile: jest.fn(async () => next(profile)),
    saveQuizResults: jest.fn(async () => next(quiz)),
    addUserCourse: jest.fn(async (_uid, code) => next(course[code] || [])),
  };
};

test('everything saved first time: nothing remains', async () => {
  const a = api();
  const res = await saveSignupData('u1', DATA, a, { delays: [], sleep: noSleep });
  expect(res.ok).toBe(true);
  expect(isNothingPending(res.remaining)).toBe(true);
  expect(a.saveUserProfile).toHaveBeenCalledWith('u1', DATA.profile);
  expect(a.addUserCourse).toHaveBeenCalledTimes(2);
});

test('retries only the parts that failed', async () => {
  const a = api({ profile: [null], course: { 'MATH 131': [null] } });
  const res = await saveSignupData('u1', DATA, a, { delays: [0], sleep: noSleep });
  expect(res.ok).toBe(true);
  expect(a.saveUserProfile).toHaveBeenCalledTimes(2);
  expect(a.saveQuizResults).toHaveBeenCalledTimes(1);
  expect(a.addUserCourse.mock.calls.map((c) => c[1])).toEqual(['COMP 170', 'MATH 131', 'MATH 131']);
});

test('gives up after the last delay and reports what is still unsaved', async () => {
  const a = api({ profile: [null, null, null], quiz: [{ success: true }] });
  const sleep = jest.fn(async () => {});
  const res = await saveSignupData('u1', DATA, a, { delays: [10, 20], sleep });
  expect(res.ok).toBe(false);
  expect(res.remaining).toEqual({ profile: DATA.profile, quiz: null, courseCodes: [] });
  expect(sleep.mock.calls.map((c) => c[0])).toEqual([10, 20]);
});

test('a save that throws counts as failed, not as saved', async () => {
  const a = api();
  a.saveQuizResults.mockRejectedValueOnce(new Error('offline'));
  const res = await saveSignupData('u1', DATA, a, { delays: [], sleep: noSleep });
  expect(res.remaining.quiz).toEqual(DATA.quiz);
});

describe('pending signup store', () => {
  const memory = () => {
    const m = new Map();
    return {
      getItem: jest.fn(async (k) => (m.has(k) ? m.get(k) : null)),
      setItem: jest.fn(async (k, v) => { m.set(k, v); }),
      removeItem: jest.fn(async (k) => { m.delete(k); }),
    };
  };

  test('round-trips the unsaved parts for the same account', async () => {
    const storage = memory();
    await storePendingSignup(storage, 'u1', { profile: DATA.profile, quiz: null, courseCodes: ['X 1'] });
    expect(await readPendingSignup(storage, 'u1')).toEqual({ profile: DATA.profile, quiz: null, courseCodes: ['X 1'] });
    await clearPendingSignup(storage);
    expect(await readPendingSignup(storage, 'u1')).toBeNull();
  });

  test("never hands one account's details to another", async () => {
    const storage = memory();
    await storePendingSignup(storage, 'u1', { profile: DATA.profile, quiz: null, courseCodes: [] });
    expect(await readPendingSignup(storage, 'u2')).toBeNull();
  });

  test('unreadable storage reads as nothing pending', async () => {
    const storage = memory();
    storage.getItem.mockResolvedValueOnce('{not json');
    expect(await readPendingSignup(storage, 'u1')).toBeNull();
  });
});

describe('retrying later never overwrites what the user changed since', () => {
  const { pruneAgainstServer, forgetPendingCourse, firstResult } = require('../signup-save');

  test('fields the server already has are dropped; the rest still go', () => {
    const left = pruneAgainstServer(DATA, { profileKeys: ['selectedProgramId', 'createdAt'], hasQuiz: false });
    expect(left.profile).toEqual({ graduationYear: '2028' });
    expect(left.quiz).toEqual(DATA.quiz);
    expect(left.courseCodes).toEqual(DATA.courseCodes);
  });

  test('a saved quiz and a fully saved profile leave nothing of either', () => {
    const left = pruneAgainstServer(DATA, { profileKeys: ['selectedProgramId', 'graduationYear'], hasQuiz: true });
    expect(left.profile).toBeNull();
    expect(left.quiz).toBeNull();
  });

  test('a course the user removed is dropped from the pending entry', async () => {
    const m = new Map();
    const storage = {
      getItem: async (k) => (m.has(k) ? m.get(k) : null),
      setItem: async (k, v) => { m.set(k, v); },
      removeItem: async (k) => { m.delete(k); },
    };
    await storePendingSignup(storage, 'u1', { profile: null, quiz: null, courseCodes: ['COMP 170', 'MATH 131'] });
    await forgetPendingCourse(storage, 'u1', 'COMP 170');
    expect((await readPendingSignup(storage, 'u1')).courseCodes).toEqual(['MATH 131']);
    await forgetPendingCourse(storage, 'u1', 'MATH 131');
    expect(await readPendingSignup(storage, 'u1')).toBeNull(); // nothing left: cleared
  });

  test('firstResult retries a read that returned null, up to the delays', async () => {
    const read = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ ok: 1 });
    expect(await firstResult(read, [0, 0], noSleep)).toEqual({ ok: 1 });
    const never = jest.fn(async () => null);
    expect(await firstResult(never, [0], noSleep)).toBeNull();
    expect(never).toHaveBeenCalledTimes(2);
  });
});

describe('races with a retry in flight', () => {
  const { trackRetry, settleRetry, keepStillPending } = require('../signup-save');

  test('settleRetry waits for the retry in flight, and resolves at once when none is', async () => {
    let finish;
    const order = [];
    trackRetry(new Promise((r) => { finish = r; }).then(() => order.push('retry done')));
    const waited = settleRetry().then(() => order.push('settled'));
    await Promise.resolve();
    expect(order).toEqual([]);
    finish();
    await waited;
    expect(order).toEqual(['retry done', 'settled']);
    await settleRetry(); // nothing in flight
  });

  test('a failed retry does not store back a course removed while it ran', () => {
    const remaining = { profile: null, quiz: null, courseCodes: ['COMP 170', 'MATH 131'] };
    const current = { profile: null, quiz: null, courseCodes: ['MATH 131'] };
    expect(keepStillPending(remaining, current).courseCodes).toEqual(['MATH 131']);
    expect(keepStillPending(remaining, null)).toEqual(remaining);
  });
});
