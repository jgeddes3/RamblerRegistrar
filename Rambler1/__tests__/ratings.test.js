// Tests for the ratings-source adapter (ratings.js). RMP is mocked — no
// network. The module caches by instructor name at module scope, so each test
// re-requires a fresh copy via jest.resetModules().

const mockSearchProfessors = jest.fn();
jest.mock('../rmp', () => ({
  searchProfessors: (...args) => mockSearchProfessors(...args),
}));
// ratings.js imports these statically for the 'own' branch; keep them inert.
jest.mock('../firebaseConfig', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

let ratings;
beforeEach(() => {
  jest.resetModules();
  mockSearchProfessors.mockReset();
  ratings = require('../ratings');
});

const RMP_PROF = {
  rmpId: 'VGVhY2hlci0x',
  legacyId: 1,
  firstName: 'Dana',
  lastName: 'Whitfield',
  department: 'Computer Science',
  avgRating: 4.2,
  avgDifficulty: 2.9,
  numRatings: 34,
  wouldTakeAgainPercent: 87,
};

describe('getInstructorRating (rmp source)', () => {
  test('normalizes a found professor and searches by last name', async () => {
    mockSearchProfessors.mockResolvedValue([RMP_PROF]);
    const r = await ratings.getInstructorRating('Whitfield, Dana');
    expect(mockSearchProfessors).toHaveBeenCalledWith('Whitfield');
    expect(r).toEqual({
      rating: 4.2,
      difficulty: 2.9,
      wouldTakeAgainPercent: 87,
      numRatings: 34,
      source: 'rmp',
    });
  });

  test('picks the result whose last name matches the instructor', async () => {
    mockSearchProfessors.mockResolvedValue([
      { ...RMP_PROF, lastName: 'Rodrigues', avgRating: 2.1 },
      { ...RMP_PROF, lastName: 'Rodriguez', avgRating: 4.5 },
    ]);
    const r = await ratings.getInstructorRating('Rodriguez, Maria');
    expect(r.rating).toBe(4.5);
  });

  test('falls back to the first result when no last name matches', async () => {
    mockSearchProfessors.mockResolvedValue([
      { ...RMP_PROF, lastName: 'Somebody', avgRating: 3.3 },
      { ...RMP_PROF, lastName: 'Other', avgRating: 1.1 },
    ]);
    const r = await ratings.getInstructorRating('Whitfield, Dana');
    expect(r.rating).toBe(3.3);
  });

  test('caches by full instructor name — one search across repeat calls', async () => {
    mockSearchProfessors.mockResolvedValue([RMP_PROF]);
    const first = await ratings.getInstructorRating('Whitfield, Dana');
    const second = await ratings.getInstructorRating('Whitfield, Dana');
    expect(mockSearchProfessors).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  test('caches null results — a miss does not refetch', async () => {
    mockSearchProfessors.mockResolvedValue([]);
    expect(await ratings.getInstructorRating('Nobody, Ann')).toBeNull();
    expect(await ratings.getInstructorRating('Nobody, Ann')).toBeNull();
    expect(mockSearchProfessors).toHaveBeenCalledTimes(1);
  });

  test('resolves null on failure and retries on the next call', async () => {
    mockSearchProfessors.mockRejectedValueOnce(new Error('network down'));
    expect(await ratings.getInstructorRating('Whitfield, Dana')).toBeNull();
    mockSearchProfessors.mockResolvedValue([RMP_PROF]);
    const r = await ratings.getInstructorRating('Whitfield, Dana');
    expect(r.rating).toBe(4.2);
    expect(mockSearchProfessors).toHaveBeenCalledTimes(2);
  });

  test('resolves null for empty or missing names without searching', async () => {
    expect(await ratings.getInstructorRating('')).toBeNull();
    expect(await ratings.getInstructorRating(null)).toBeNull();
    expect(mockSearchProfessors).not.toHaveBeenCalled();
  });
});

describe('source switch copy', () => {
  test('RATINGS_SOURCE ships as rmp', () => {
    expect(ratings.RATINGS_SOURCE).toBe('rmp');
  });

  test('attribution for both sources', () => {
    expect(ratings.ratingsAttribution()).toBe('Ratings via Rate My Professors');
    expect(ratings.ratingsAttribution('rmp')).toBe('Ratings via Rate My Professors');
    expect(ratings.ratingsAttribution('own')).toBe('Ratings from Rambler students');
  });

  test('empty-state copy for both sources', () => {
    expect(ratings.noRatingCopy()).toBe('No RMP rating found');
    expect(ratings.noRatingCopy('rmp')).toBe('No RMP rating found');
    expect(ratings.noRatingCopy('own')).toBe('No student ratings yet');
  });
});
