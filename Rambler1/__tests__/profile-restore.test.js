import { loadUserState, restoreRetryDelayMs } from '../profile-restore';

const PROFILE = {
  user_id: 'u1',
  selected_program_id: 12,
  selected_program2_id: null,
  selected_minors: [40],
  graduation_year: '2028',
  class_year: 'Junior',
  is_honors: true,
  is_athlete: false,
  selected_focus_id: 'f1',
  privacy_policy_version: '3',
  terms_version: '2',
  data_sale_opt_out: true,
  program: { id: 12, name: 'Computer Science', type: 'major' },
  minors: [{ id: 40, name: 'Math', type: 'minor' }],
};
const QUIZ = { scores: { R: 1 }, code: 'RIA', profile_name: 'Builder', answers: { a: 1 }, scheduling_prefs: { mornings: true } };

const makeApi = (over = {}) => ({
  fetchUserProfile: jest.fn(async () => PROFILE),
  fetchProgramById: jest.fn(async (id) => ({ id, name: `Program ${id}` })),
  fetchFocusAreaById: jest.fn(async (id) => ({ id, name: 'Systems' })),
  fetchQuizResults: jest.fn(async () => QUIZ),
  fetchUserCourses: jest.fn(async () => [{ course_code: 'COMP 170' }, { course_code: 'MATH 161' }]),
  fetchCourseDetail: jest.fn(async (code) => ({ code, name: code })),
  fetchUserLocations: jest.fn(async () => [{ label: 'Home' }]),
  ...over,
});

describe('loadUserState', () => {
  test('restores the whole saved profile', async () => {
    const { ok, patch } = await loadUserState('u1', makeApi());
    expect(ok).toBe(true);
    expect(patch).toEqual({
      privacyPolicyVersion: '3',
      termsVersion: '2',
      dataSaleOptOut: true,
      selectedProgram: PROFILE.program,
      selectedMinors: PROFILE.minors,
      graduationYear: '2028',
      classYear: 'Junior',
      isHonors: true,
      isAthlete: false,
      selectedFocus: { id: 'f1', name: 'Systems' },
      quizResults: {
        scores: QUIZ.scores, code: 'RIA', profileName: 'Builder',
        answers: QUIZ.answers, schedulingPrefs: QUIZ.scheduling_prefs,
      },
      selectedCourses: [{ code: 'COMP 170', name: 'COMP 170' }, { code: 'MATH 161', name: 'MATH 161' }],
      userLocations: [{ label: 'Home' }],
    });
  });

  test('starts the profile, quiz, courses and locations reads together, not one after another', async () => {
    let releaseProfile;
    const api = makeApi({
      fetchUserProfile: jest.fn(() => new Promise((r) => { releaseProfile = () => r(PROFILE); })),
    });
    const pending = loadUserState('u1', api);
    await Promise.resolve();
    // The profile read is still in flight, yet the others have already started.
    expect(api.fetchQuizResults).toHaveBeenCalledWith('u1');
    expect(api.fetchUserCourses).toHaveBeenCalledWith('u1');
    expect(api.fetchUserLocations).toHaveBeenCalledWith('u1');
    releaseProfile();
    expect((await pending).ok).toBe(true);
  });

  test('a failed profile read is reported as not ok, and touches no profile fields', async () => {
    const { ok, patch } = await loadUserState('u1', makeApi({ fetchUserProfile: jest.fn(async () => null) }));
    expect(ok).toBe(false);
    expect(patch).not.toHaveProperty('selectedProgram');
    expect(patch).not.toHaveProperty('selectedMinors');
    expect(patch).not.toHaveProperty('privacyPolicyVersion'); // unknown, so the consent gate stays quiet
    expect(patch.quizResults).toBeDefined(); // what did load is still applied
  });

  test('a profile read that throws is also not ok', async () => {
    const api = makeApi({ fetchUserProfile: jest.fn(async () => { throw new Error('offline'); }) });
    expect((await loadUserState('u1', api)).ok).toBe(false);
  });

  test('a failed quiz read is not ok either', async () => {
    const { ok, patch } = await loadUserState('u1', makeApi({ fetchQuizResults: jest.fn(async () => null) }));
    expect(ok).toBe(false);
    expect(patch.selectedProgram).toEqual(PROFILE.program);
  });

  test('an account with no profile doc yet is ok, and gates consent', async () => {
    const api = makeApi({
      fetchUserProfile: jest.fn(async () => ({ error: 'No profile found' })),
      fetchQuizResults: jest.fn(async () => ({ error: 'No quiz results found' })),
      fetchUserCourses: jest.fn(async () => []),
      fetchUserLocations: jest.fn(async () => []),
    });
    const { ok, patch } = await loadUserState('u1', api);
    expect(ok).toBe(true);
    expect(patch).toEqual({ privacyPolicyVersion: null, termsVersion: null, dataSaleOptOut: false });
  });

  test('"undecided" restores the sentinel program without a lookup', async () => {
    const api = makeApi({
      fetchUserProfile: jest.fn(async () => ({ ...PROFILE, selected_program_id: 'undecided', program: undefined })),
    });
    const { patch } = await loadUserState('u1', api);
    expect(patch.selectedProgram).toEqual({ id: 'undecided', name: 'Undecided', type: 'major', degree: null });
    expect(api.fetchProgramById).not.toHaveBeenCalled();
  });

  test('looks programs up by id when the profile did not come with them hydrated', async () => {
    const api = makeApi({
      fetchUserProfile: jest.fn(async () => ({ ...PROFILE, program: undefined, selected_program2_id: 13 })),
    });
    const { patch } = await loadUserState('u1', api);
    expect(patch.selectedProgram).toEqual({ id: 12, name: 'Program 12' });
    expect(patch.selectedProgram2).toEqual({ id: 13, name: 'Program 13' });
  });
});

describe('restoreRetryDelayMs', () => {
  test('backs off and then holds at a minute', () => {
    expect([0, 1, 2, 3, 4, 9].map(restoreRetryDelayMs)).toEqual([5000, 15000, 30000, 60000, 60000, 60000]);
  });
});
