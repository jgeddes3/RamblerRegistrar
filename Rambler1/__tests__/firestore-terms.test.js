// firestore-data.getTerms + the registration-term loader it registers.
// firebase is mocked: these tests pin what the app does with what Firestore
// returns, not Firestore itself.

jest.mock('../firebaseConfig', () => ({ db: {}, auth: { currentUser: null } }));
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  doc: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((ref) => ref),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

import { getDocs } from 'firebase/firestore';
import { getTerms } from '../firestore-data';
import { getRegistrationTerm, resolveRegistrationTerm, registrationTermFor } from '../term';

const snapOf = (docs) => ({
  empty: docs.length === 0,
  size: docs.length,
  metadata: { fromCache: false },
  docs: docs.map(([id, data]) => ({ id, data: () => data })),
});

beforeEach(() => {
  getDocs.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => console.error.mockRestore());

describe('getTerms', () => {
  test('lists published terms newest first', async () => {
    getDocs.mockResolvedValue(snapOf([['1266', { name: 'Fall 2026' }], ['1272', {}]]));
    expect((await getTerms()).map((t) => t.code)).toEqual(['1272', '1266']);
  });

  test('returns an empty list, not a hardcoded term, when nothing is published', async () => {
    getDocs.mockResolvedValue(snapOf([]));
    expect(await getTerms()).toEqual([]);
  });

  test('returns an empty list when the read fails', async () => {
    getDocs.mockRejectedValue(new Error('unavailable'));
    expect(await getTerms()).toEqual([]);
  });
});

describe('registration term loader', () => {
  test('importing firestore-data lets the term resolve against published terms', async () => {
    const calendar = registrationTermFor().code;
    // Publish only a term older than the calendar one: the app must follow it.
    const older = String(Number(calendar) - 10).replace(/.$/, '6');
    getDocs.mockResolvedValue(snapOf([[older, {}]]));
    await resolveRegistrationTerm();
    expect(getRegistrationTerm().code).toBe(older);
  });
});
