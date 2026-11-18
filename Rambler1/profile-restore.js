// profile-restore.js — read a signed-in user's saved state back from the
// server. No react, no firebase: the data-layer functions are passed in.
//
// loadUserState(uid, api) -> { ok, patch }
//   patch: AppContext fields to set, containing ONLY what was actually read
//          (a missing key means "leave the context value alone").
//   ok:    false when the profile or quiz read FAILED (as opposed to "nothing
//          saved"). The caller retries; until then the in-memory profile is
//          not the saved one, and edits must not be written over it.
//
// The four top-level reads start together, then the lookups that depend on
// them start together: two round trips instead of the old five in a row.

// How long app startup waits for the restore before opening without it.
export const RESTORE_GRACE_MS = 4000;
// How long startup waits on the anonymous-session reload() check.
export const AUTH_RELOAD_TIMEOUT_MS = 5000;

const UNDECIDED ={ id: 'undecided', name: 'Undecided', type: 'major', degree: null };

const settled = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    return null;
  }
};

export async function loadUserState(uid, api) {
  const [profile, quiz, userCourses, locations] = await Promise.all([
    settled(() => api.fetchUserProfile(uid)),
    settled(() => api.fetchQuizResults(uid)),
    settled(() => api.fetchUserCourses(uid)),
    settled(() => api.fetchUserLocations(uid)),
  ]);

  const patch = {};
  const hasProfile = !!profile && !profile.error;

  // "No profile found" is a KNOWN state: no doc means no recorded acceptance,
  // so the consent gate must fire. A failed read leaves these untouched
  // (unknown, never gated).
  if (profile) {
    patch.privacyPolicyVersion = profile.error ? null : (profile.privacy_policy_version ?? null);
    patch.termsVersion = profile.error ? null : (profile.terms_version ?? null);
    patch.dataSaleOptOut = profile.error ? false : profile.data_sale_opt_out === true;
  }

  const lookup = (id) => settled(() => api.fetchProgramById(id)).then((p) => (p && !p.error ? p : null));
  const courseCodes = Array.isArray(userCourses) ? userCourses.map((uc) => uc.course_code).filter(Boolean) : [];

  const [program, program2, focus, courses] = await Promise.all([
    !hasProfile || profile.selected_program_id === 'undecided' || profile.program || !profile.selected_program_id
      ? null
      : lookup(profile.selected_program_id),
    !hasProfile || profile.program2 || !profile.selected_program2_id
      ? null
      : lookup(profile.selected_program2_id),
    hasProfile && profile.selected_focus_id
      ? settled(() => api.fetchFocusAreaById(profile.selected_focus_id))
      : null,
    Promise.all(courseCodes.map((code) => settled(() => api.fetchCourseDetail(code)))),
  ]);

  if (hasProfile) {
    if (profile.selected_program_id === 'undecided') patch.selectedProgram = UNDECIDED;
    else if (profile.program) patch.selectedProgram = profile.program;
    else if (program) patch.selectedProgram = program;

    if (profile.program2) patch.selectedProgram2 = profile.program2;
    else if (program2) patch.selectedProgram2 = program2;

    if (profile.minors && profile.minors.length > 0) patch.selectedMinors = profile.minors;
    if (profile.graduation_year) patch.graduationYear = profile.graduation_year;
    if (profile.class_year) patch.classYear = profile.class_year;
    patch.isHonors = profile.is_honors === true;
    patch.isAthlete = profile.is_athlete === true;
    if (focus) patch.selectedFocus = focus;
  }

  if (quiz && !quiz.error) {
    patch.quizResults = {
      scores: quiz.scores,
      code: quiz.code,
      profileName: quiz.profile_name,
      answers: quiz.answers,
      schedulingPrefs: quiz.scheduling_prefs,
    };
  }

  const fullCourses = courses.filter((c) => c && !c.error);
  if (fullCourses.length > 0) patch.selectedCourses = fullCourses;

  if (Array.isArray(locations) && locations.length > 0) patch.userLocations = locations;

  return { ok: !!profile && !!quiz, patch };
}

// Wait before retry number `attempt` (0-based) of a failed restore.
const RETRY_DELAYS_MS = [5000, 15000, 30000, 60000];
export function restoreRetryDelayMs(attempt) {
  return RETRY_DELAYS_MS[Math.min(Math.max(attempt, 0), RETRY_DELAYS_MS.length - 1)];
}
