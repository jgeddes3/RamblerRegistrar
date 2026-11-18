// How the data layer behaves when Firestore is unreachable. Reproduced against
// the real SDK with a dead endpoint, an unreachable Firestore does three
// things, and each one used to freeze or mislead the app:
//   - a write (setDoc/addDoc/deleteDoc) NEVER settles
//   - a collection read (getDocs) RESOLVES with an empty from-cache snapshot
//   - a document read (getDoc) rejects
// firebase is mocked here to play those behaviors back.

jest.mock('../firebaseConfig', () => ({ db: {}, auth: { currentUser: { uid: 'u1' } } }));
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  doc: jest.fn((_db, ...segs) => ({ path: segs.filter((s) => typeof s === 'string').join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((ref) => ref),
  serverTimestamp: jest.fn(() => 'ts'),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

import * as fs from 'firebase/firestore';
import { WRITE_TIMEOUT_MS } from '../firestore-guards';
import {
  saveSchedule, addUserCourse, submitFeedback, removeWatch,
  fetchCourses, fetchBuildings, fetchProgramRequirementRowsLean,
  getCourseSections, addCourseToPlan, removeCourseFromPlan, fetchPlans,
} from '../firestore-data';

const never = () => new Promise(() => {});
const snapOf = (docs, fromCache = false) => ({
  empty: docs.length === 0,
  size: docs.length,
  metadata: { fromCache },
  docs: docs.map(([id, data]) => ({ id, data: () => data })),
});
const OFFLINE_EMPTY = snapOf([], true);
const missingDoc = { exists: () => false };

// Resolves to the promise's value, or 'PENDING' if it is still unsettled once
// the write timeout has elapsed.
const settleWithin = async (promise) => {
  let out = 'PENDING';
  promise.then((v) => { out = v; });
  await jest.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS + 1000);
  return out;
};

beforeEach(() => {
  jest.useFakeTimers();
  ['addDoc', 'deleteDoc', 'getDoc', 'getDocs', 'setDoc', 'updateDoc'].forEach((n) => fs[n].mockReset());
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
  jest.useRealTimers();
});

describe('a write that never reaches the server', () => {
  test('saveSchedule gives up and reports failure instead of hanging', async () => {
    fs.getDoc.mockResolvedValue(missingDoc);
    fs.setDoc.mockImplementation(never);
    expect(await settleWithin(saveSchedule('u1', '1272', ['1001']))).toBeNull();
  });

  test('addUserCourse gives up and reports failure', async () => {
    fs.setDoc.mockImplementation(never);
    expect(await settleWithin(addUserCourse('u1', 'COMP 170'))).toBeNull();
  });

  test('submitFeedback gives up and reports failure', async () => {
    fs.addDoc.mockImplementation(never);
    expect(await settleWithin(submitFeedback({ type: 'bug', message: 'it froze' }))).toBeNull();
  });

  test('removeWatch gives up and reports failure', async () => {
    fs.deleteDoc.mockImplementation(never);
    expect(await settleWithin(removeWatch('u1', '1001'))).toBeNull();
  });

  test('a write that does reach the server still succeeds', async () => {
    fs.setDoc.mockResolvedValue(undefined);
    expect(await settleWithin(addUserCourse('u1', 'COMP 170'))).toEqual({ success: true });
  });
});

describe('a collection read that comes back empty from cache (offline)', () => {
  test('fetchCourses reports failure and does not keep the empty list for the session', async () => {
    fs.getDocs.mockResolvedValueOnce(OFFLINE_EMPTY);
    expect(await fetchCourses()).toBeNull();

    fs.getDocs.mockResolvedValueOnce(snapOf([['COMP 170', { code: 'COMP 170', name: 'Intro' }]]));
    expect((await fetchCourses()).map((c) => c.code)).toEqual(['COMP 170']);
  });

  test('fetchBuildings retries after an offline-empty read', async () => {
    fs.getDocs.mockResolvedValueOnce(OFFLINE_EMPTY);
    expect(await fetchBuildings()).toEqual([]);

    fs.getDocs.mockResolvedValueOnce(snapOf([['Cuneo Hall', { name: 'Cuneo Hall' }]]));
    expect((await fetchBuildings()).map((b) => b.name)).toEqual(['Cuneo Hall']);
  });

  test('program requirements are not cached as "none" after an offline-empty read', async () => {
    fs.getDocs.mockResolvedValueOnce(OFFLINE_EMPTY);
    expect(await fetchProgramRequirementRowsLean('p-offline')).toEqual([]);

    fs.getDocs.mockResolvedValueOnce(snapOf([['COMP 170', { courseCode: 'COMP 170' }]]));
    expect((await fetchProgramRequirementRowsLean('p-offline')).map((r) => r.code)).toEqual(['COMP 170']);
  });

  test('getCourseSections returns null (failed), not [] (no sections)', async () => {
    fs.getDocs.mockResolvedValueOnce(OFFLINE_EMPTY);
    expect(await getCourseSections('1272', 'COMP 170')).toBeNull();
  });

  test('getCourseSections returns [] when the server really has none', async () => {
    fs.getDocs.mockResolvedValueOnce(snapOf([]));
    expect(await getCourseSections('1272', 'COMP 170')).toEqual([]);
  });

  test('addCourseToPlan refuses to write over a plan it could not read', async () => {
    fs.getDocs.mockResolvedValue(OFFLINE_EMPTY);
    fs.getDoc.mockResolvedValue(missingDoc);
    fs.setDoc.mockResolvedValue(undefined);
    expect(await addCourseToPlan('u1', '1272', 'COMP 170')).toBeNull();
    expect(fs.setDoc).not.toHaveBeenCalled();
  });

  test('removeCourseFromPlan reports failure when the plan could not be read', async () => {
    fs.getDocs.mockResolvedValue(OFFLINE_EMPTY);
    expect(await removeCourseFromPlan('u1', '1272', 'COMP 170')).toBeNull();
    expect(fs.setDoc).not.toHaveBeenCalled();
  });

  test('fetchPlans still returns {} for a user who really has no plans', async () => {
    fs.getDocs.mockResolvedValue(snapOf([]));
    expect(await fetchPlans('u1')).toEqual({});
  });
});
