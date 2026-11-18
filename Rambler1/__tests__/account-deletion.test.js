// account-deletion.test.js — deleting an account removes everything it owns,
// and never reports success with data left behind.

jest.mock('../firebaseConfig', () => ({ db: {}, auth: { currentUser: { uid: 'u1' } } }));
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  doc: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((ref, ...constraints) => ({ ...ref, constraints })),
  serverTimestamp: jest.fn(() => 'ts'),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn((...w) => w),
}));

import * as fs from 'firebase/firestore';
import { deleteAllUserData, USER_SUBCOLLECTIONS } from '../firestore-data';
import { eraseAccountData, deletionErrorMessage } from '../account-deletion';

const snapOf = (ids) => ({
  empty: ids.length === 0, size: ids.length, metadata: { fromCache: false },
  docs: ids.map((id) => ({ id, data: () => ({}) })),
});
const OWNED = {
  'users/u1/courses': ['COMP 170', 'MATH 131'],
  'users/u1/private': ['quiz'],
  'users/u1/watches': ['5440'],
  feedback: ['f1'],
};
const deleted = () => fs.deleteDoc.mock.calls.map(([ref]) => ref.path);

beforeEach(() => {
  fs.getDocs.mockReset().mockImplementation(async (ref) => snapOf(OWNED[ref.path] || []));
  fs.deleteDoc.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => console.error.mockRestore());

describe('deleteAllUserData', () => {
  test('deletes every owned doc and feedback report, then the profile doc last', async () => {
    await deleteAllUserData('u1');
    expect(deleted().sort()).toEqual([
      'feedback/f1', 'users/u1', 'users/u1/courses/COMP 170', 'users/u1/courses/MATH 131',
      'users/u1/private/quiz', 'users/u1/watches/5440',
    ]);
    expect(deleted()[deleted().length - 1]).toBe('users/u1');
    // only the caller's own feedback is queried
    const fbQuery = fs.getDocs.mock.calls.map(([r]) => r).find((r) => r.path === 'feedback');
    expect(fbQuery.constraints).toEqual([['uid', '==', 'u1']]);
  });

  test('reads every collection the rules give a user', async () => {
    await deleteAllUserData('u1');
    const read = fs.getDocs.mock.calls.map(([r]) => r.path);
    for (const sub of USER_SUBCOLLECTIONS) expect(read).toContain(`users/u1/${sub}`);
    expect(USER_SUBCOLLECTIONS).toEqual(['courses', 'locations', 'private', 'watches', 'schedules', 'plans']);
  });

  test('a failed read throws and deletes nothing', async () => {
    fs.getDocs.mockImplementation(async (ref) => {
      if (ref.path === 'users/u1/plans') throw new Error('offline');
      return snapOf(OWNED[ref.path] || []);
    });
    await expect(deleteAllUserData('u1')).rejects.toThrow();
    expect(deleted()).toEqual([]);
  });

  test('a list served from the offline cache is refused: it may be partial', async () => {
    fs.getDocs.mockImplementation(async (ref) => ({ ...snapOf(OWNED[ref.path] || ['x']), metadata: { fromCache: true } }));
    await expect(deleteAllUserData('u1')).rejects.toThrow(/offline/);
    expect(deleted()).toEqual([]);
  });

  test('a failed delete throws and keeps the profile doc', async () => {
    fs.deleteDoc.mockImplementation(async (ref) => {
      if (ref.path === 'users/u1/watches/5440') throw new Error('denied');
    });
    await expect(deleteAllUserData('u1')).rejects.toThrow();
    expect(deleted()).not.toContain('users/u1');
  });
});

describe('eraseAccountData', () => {
  const deps = (over = {}) => ({
    reauthenticate: jest.fn(async () => {}),
    deleteAllUserData: jest.fn(async () => {}),
    clearLocalData: jest.fn(async () => {}),
    ...over,
  });

  test('checks the password, deletes the data, clears the phone', async () => {
    const d = deps();
    expect(await eraseAccountData('pw', 'u1', d)).toEqual({ ok: true });
    expect(d.reauthenticate).toHaveBeenCalledWith('pw');
    expect(d.deleteAllUserData).toHaveBeenCalledWith('u1');
    expect(d.clearLocalData).toHaveBeenCalled();
  });

  test('a wrong password stops before anything is deleted', async () => {
    const err = Object.assign(new Error('bad'), { code: 'auth/invalid-credential' });
    const d = deps({ reauthenticate: jest.fn(async () => { throw err; }) });
    const res = await eraseAccountData('pw', 'u1', d);
    expect(res).toMatchObject({ ok: false, step: 'password', code: 'auth/invalid-credential' });
    expect(d.deleteAllUserData).not.toHaveBeenCalled();
    expect(deletionErrorMessage(res)).toBe("That password isn't right.");
  });

  test('a failed data delete reports it and leaves the phone alone', async () => {
    const d = deps({ deleteAllUserData: jest.fn(async () => { throw new Error('offline'); }) });
    const res = await eraseAccountData('pw', 'u1', d);
    expect(res).toMatchObject({ ok: false, step: 'data' });
    expect(d.clearLocalData).not.toHaveBeenCalled();
    expect(deletionErrorMessage(res)).toMatch(/Your account stays open/);
  });

  test('a failure to clear the phone does not undo a finished deletion', async () => {
    const d = deps({ clearLocalData: jest.fn(async () => { throw new Error('disk'); }) });
    expect(await eraseAccountData('pw', 'u1', d)).toEqual({ ok: true });
  });
});
