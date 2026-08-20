import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, ensureAnonymousSignIn } from './auth';
import { fetchUserProfile, fetchProgramById, fetchQuizResults, fetchUserCourses, fetchCourseDetail, fetchUserLocations, fetchFocusAreaById } from './firestore-data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedProgram2, setSelectedProgram2] = useState(null);
  const [selectedMinors, setSelectedMinors] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [quizTags, setQuizTags] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [graduationYear, setGraduationYear] = useState('');
  const [classYear, setClassYear] = useState('');
  const [isHonors, setIsHonors] = useState(false);
  const [isAthlete, setIsAthlete] = useState(false);
  const [userLocations, setUserLocations] = useState([]);
  const [selectedFocus, setSelectedFocus] = useState(null);
  // Legal consent (Terms + Privacy) as stored on users/{uid}.
  //   undefined = not loaded yet (profile fetch pending or failed) — the
  //               consent gate must NOT show on unknown state;
  //   {}        = profile exists/none but no acceptance recorded — gate shows;
  //   {termsAcceptedVersion, privacyAcceptedVersion} = compare via
  //               needsLegalConsent() in legal.js.
  const [legalConsent, setLegalConsent] = useState(undefined);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // A restored session that LOOKS anonymous may be a stale snapshot from
        // before a linkWithCredential upgrade (B11: "signed up but it didn't
        // keep me signed in"). Reload once to get authoritative flags from the
        // server — reload() also re-persists the corrected user, so this
        // self-heals the stored session. Offline: keep the cached flags.
        if (firebaseUser.isAnonymous) {
          try {
            await firebaseUser.reload();
          } catch (e) {
            // Offline or transient — proceed with the cached session.
          }
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
        // Anonymous sessions (catalog-read auth) do NOT count as logged in —
        // they must still go through onboarding.
        setIsLoggedIn(!firebaseUser.isAnonymous);

        // Restore saved profile from backend
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          // Legal consent state (real accounts only — anonymous sessions are
          // pre-onboarding and never gated). No profile doc = never consented.
          // A failed fetch (profile === null) leaves consent undefined so the
          // gate stays hidden rather than blocking on unknown state.
          if (!firebaseUser.isAnonymous) {
            if (profile && !profile.error) {
              setLegalConsent({
                termsAcceptedVersion: profile.terms_accepted_version ?? null,
                privacyAcceptedVersion: profile.privacy_accepted_version ?? null,
              });
            } else if (profile && profile.error) {
              setLegalConsent({});
            }
          }
          if (profile && !profile.error) {
            // Restore program objects
            if (profile.selected_program_id === 'undecided') {
              setSelectedProgram({ id: 'undecided', name: 'Undecided', type: 'major', degree: null });
            } else if (profile.program) {
              setSelectedProgram(profile.program);
            } else if (profile.selected_program_id) {
              const prog = await fetchProgramById(profile.selected_program_id);
              if (prog && !prog.error) setSelectedProgram(prog);
            }

            if (profile.program2) {
              setSelectedProgram2(profile.program2);
            } else if (profile.selected_program2_id) {
              const prog2 = await fetchProgramById(profile.selected_program2_id);
              if (prog2 && !prog2.error) setSelectedProgram2(prog2);
            }

            if (profile.minors && profile.minors.length > 0) {
              setSelectedMinors(profile.minors);
            }

            if (profile.graduation_year) {
              setGraduationYear(profile.graduation_year);
            }
            if (profile.class_year) {
              setClassYear(profile.class_year);
            }
            // Priority flags — booleans, default false when absent
            setIsHonors(profile.is_honors === true);
            setIsAthlete(profile.is_athlete === true);

            // Focus area (B10): stored as an id; hydrate the full object so
            // ProfileScreen can show name/description without re-selection.
            if (profile.selected_focus_id) {
              const focus = await fetchFocusAreaById(profile.selected_focus_id);
              if (focus) setSelectedFocus(focus);
            }
          }
        } catch (e) {
          // Profile restore failed — not critical, user can re-select
        }

        // Restore quiz results, courses, and locations in parallel
        try {
          const [quizSettled, coursesSettled, locationsSettled] = await Promise.allSettled([
            fetchQuizResults(firebaseUser.uid),
            fetchUserCourses(firebaseUser.uid),
            fetchUserLocations(firebaseUser.uid),
          ]);

          // Quiz results
          if (quizSettled.status === 'fulfilled' && quizSettled.value && !quizSettled.value.error) {
            const q = quizSettled.value;
            setQuizResults({
              scores: q.scores,
              code: q.code,
              profileName: q.profile_name,
              answers: q.answers,
              schedulingPrefs: q.scheduling_prefs,
            });
          }

          // Courses — hydrate course_code into full course objects
          if (coursesSettled.status === 'fulfilled' && coursesSettled.value && coursesSettled.value.length > 0) {
            const hydrated = await Promise.allSettled(
              coursesSettled.value.map(uc => fetchCourseDetail(uc.course_code))
            );
            const fullCourses = hydrated
              .filter(r => r.status === 'fulfilled' && r.value && !r.value.error)
              .map(r => r.value);
            if (fullCourses.length > 0) {
              setSelectedCourses(fullCourses);
            }
          }

          // Locations
          if (locationsSettled.status === 'fulfilled' && locationsSettled.value && locationsSettled.value.length > 0) {
            setUserLocations(locationsSettled.value);
          }
        } catch (e) {
          // Non-critical — user can re-do quiz, re-select courses
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setSelectedProgram(null);
        setSelectedProgram2(null);
        setSelectedMinors([]);
        setSelectedCourses([]);
        setQuizTags([]);
        setQuizResults(null);
        setGraduationYear('');
        setClassYear('');
        setIsHonors(false);
        setIsAthlete(false);
        setUserLocations([]);
        setSelectedFocus(null);
        setLegalConsent(undefined);
        // Session ended (sign-out, token revocation, account deletion) — re-establish
        // anonymous auth so Firestore catalog reads (rules require ANY auth) keep
        // working during re-onboarding. isLoggedIn already treats anonymous users as
        // logged out, so this cannot skip onboarding. Fire-and-forget: it never throws,
        // and success re-fires onAuthChange with the anonymous user (no loop — a failed
        // attempt produces no auth event).
        ensureAnonymousSignIn().catch(() => {});
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedProgram,
        setSelectedProgram,
        selectedProgram2,
        setSelectedProgram2,
        selectedMinors,
        setSelectedMinors,
        selectedCourses,
        setSelectedCourses,
        quizTags,
        setQuizTags,
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        authLoading,
        graduationYear,
        setGraduationYear,
        classYear,
        setClassYear,
        isHonors,
        setIsHonors,
        isAthlete,
        setIsAthlete,
        quizResults,
        setQuizResults,
        userLocations,
        setUserLocations,
        selectedFocus,
        setSelectedFocus,
        legalConsent,
        setLegalConsent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
