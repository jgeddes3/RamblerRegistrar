import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { onAuthChange, ensureAnonymousSignIn } from './auth';
import { fetchUserProfile, fetchProgramById, fetchQuizResults, fetchUserCourses, fetchCourseDetail, fetchUserLocations, fetchFocusAreaById } from './firestore-data';
import { loadUserState, restoreRetryDelayMs, RESTORE_GRACE_MS, AUTH_RELOAD_TIMEOUT_MS } from './profile-restore';

// The data-layer reads loadUserState needs.
const RESTORE_API = {
  fetchUserProfile, fetchProgramById, fetchQuizResults, fetchUserCourses,
  fetchCourseDetail, fetchUserLocations, fetchFocusAreaById,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  // Privacy-policy consent state for the sign-in gate (App.js):
  //   string    -> the version this account accepted
  //   null      -> account has never recorded acceptance (gate it)
  //   undefined -> unknown (profile not restored yet / fetch failed — never
  //                gate on a read failure; offline users keep working)
  const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState(undefined);
  // Same tri-state, for the Terms of Service (termsVersion on users/{uid}).
  const [termsVersion, setTermsVersion] = useState(undefined);
  // "Do not sell or share my personal information" (dataSaleOptOut on
  // users/{uid}). Plain boolean — absent/false means data may be sold/shared
  // per the Privacy Policy; true excludes the account from every export
  // (enforced in backend/export-sale-data.js).
  const [dataSaleOptOut, setDataSaleOptOut] = useState(false);
  // Whether the saved profile is what's in memory:
  //   'ready'   -> restored (or nothing to restore: anonymous / new account)
  //   'loading' -> restore in flight
  //   'failed'  -> a read failed; retrying in the background. Profile edits
  //                are blocked until then (see profile-edits.js).
  const [profileStatus, setProfileStatus] = useState('ready');

  // ---- profile restore -------------------------------------------------------
  // Every auth event bumps the generation; a restore only applies its result
  // (or retries) while its generation is still the current one, so a slow
  // restore can never land on top of a sign-out or a different account.
  const authGenRef = useRef(0);
  const restoreRef = useRef({ uid: null, attempt: 0, timer: null, running: false, failed: false });

  const applyPatch = useCallback((patch) => {
    const setters = {
      privacyPolicyVersion: setPrivacyPolicyVersion,
      termsVersion: setTermsVersion,
      dataSaleOptOut: setDataSaleOptOut,
      selectedProgram: setSelectedProgram,
      selectedProgram2: setSelectedProgram2,
      selectedMinors: setSelectedMinors,
      graduationYear: setGraduationYear,
      classYear: setClassYear,
      isHonors: setIsHonors,
      isAthlete: setIsAthlete,
      selectedFocus: setSelectedFocus,
      quizResults: setQuizResults,
      selectedCourses: setSelectedCourses,
      userLocations: setUserLocations,
    };
    for (const key of Object.keys(patch)) {
      if (setters[key]) setters[key](patch[key]);
    }
  }, []);

  const runRestore = useCallback(async (uid, gen) => {
    const r = restoreRef.current;
    if (r.running) return;
    r.running = true;
    clearTimeout(r.timer);
    let result = { ok: false, patch: {} };
    try {
      result = await loadUserState(uid, RESTORE_API);
    } catch (e) {
      // treated as a failed restore below
    }
    r.running = false;
    if (authGenRef.current !== gen) return; // signed out / switched account meanwhile
    applyPatch(result.patch);
    r.failed = !result.ok;
    if (result.ok) {
      setProfileStatus('ready');
    } else {
      // Not critical for using the app, but the in-memory profile is not the
      // saved one yet: keep trying in the background.
      setProfileStatus('failed');
      r.timer = setTimeout(() => runRestore(uid, gen), restoreRetryDelayMs(r.attempt));
      r.attempt += 1;
    }
  }, [applyPatch]);

  // Retry a failed restore now (Profile calls this when an edit is blocked).
  const retryProfileRestore = useCallback(() => {
    const r = restoreRef.current;
    if (r.failed && r.uid) runRestore(r.uid, authGenRef.current);
  }, [runRestore]);

  // Coming back to the app is the likeliest moment the connection returned.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') retryProfileRestore();
    });
    return () => sub.remove();
  }, [retryProfileRestore]);

  // Listen to Firebase auth state
  useEffect(() => {
    const handleUser = async (firebaseUser, gen) => {
      const r = restoreRef.current;
      clearTimeout(r.timer);
      r.uid = null;
      r.attempt = 0;
      r.failed = false;

      if (firebaseUser) {
        // A restored session that LOOKS anonymous may be a stale snapshot from
        // before a linkWithCredential upgrade (B11: "signed up but it didn't
        // keep me signed in"). Reload once to get authoritative flags from the
        // server — reload() also re-persists the corrected user, so this
        // self-heals the stored session. Offline: keep the cached flags.
        // Bounded: on a stalled connection reload() can sit for 30 s with the
        // whole app waiting behind it. If it lands late and the session turns
        // out to be a real account, handle the user again.
        if (firebaseUser.isAnonymous) {
          const reload = Promise.resolve().then(() => firebaseUser.reload());
          const outcome = await Promise.race([
            reload.then(() => 'done', () => 'failed'),
            sleep(AUTH_RELOAD_TIMEOUT_MS).then(() => 'slow'),
          ]);
          if (authGenRef.current !== gen) return;
          if (outcome === 'slow') {
            reload.then(() => {
              if (authGenRef.current === gen && !firebaseUser.isAnonymous) {
                handleUser(firebaseUser, ++authGenRef.current);
              }
            }, () => {});
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

        // Anonymous users have no profile/quiz/courses/locations to restore —
        // skip the whole block. This also kills the post-sign-out error spam:
        // sign-out re-anons, and these fetches racing the auth transition used
        // to reject with "Missing or insufficient permissions".
        if (firebaseUser.isAnonymous) {
          setProfileStatus('ready');
          setAuthLoading(false);
          return;
        }

        // Restore the saved profile. The app waits for it only briefly: on a
        // good connection it lands inside the grace period and the first
        // screen renders complete; on a bad one the app opens anyway and the
        // profile fills in (or retries) behind it.
        setProfileStatus('loading');
        r.uid = firebaseUser.uid;
        const restore = runRestore(firebaseUser.uid, gen);
        await Promise.race([restore, sleep(RESTORE_GRACE_MS)]);
        if (authGenRef.current !== gen) return;
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
        setPrivacyPolicyVersion(undefined);
        setTermsVersion(undefined);
        setDataSaleOptOut(false);
        setProfileStatus('ready');
        // Session ended (sign-out, token revocation, account deletion) — re-establish
        // anonymous auth so Firestore catalog reads (rules require ANY auth) keep
        // working during re-onboarding. isLoggedIn already treats anonymous users as
        // logged out, so this cannot skip onboarding. Fire-and-forget: it never throws,
        // and success re-fires onAuthChange with the anonymous user (no loop — a failed
        // attempt produces no auth event).
        ensureAnonymousSignIn().catch(() => {});
      }
      setAuthLoading(false);
    };

    const unsubscribe = onAuthChange((firebaseUser) => {
      handleUser(firebaseUser, ++authGenRef.current);
    });

    return () => {
      authGenRef.current += 1; // drop any restore still in flight
      clearTimeout(restoreRef.current.timer);
      unsubscribe();
    };
  }, [runRestore]);

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
        privacyPolicyVersion,
        setPrivacyPolicyVersion,
        termsVersion,
        setTermsVersion,
        dataSaleOptOut,
        setDataSaleOptOut,
        profileStatus,
        retryProfileRestore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
