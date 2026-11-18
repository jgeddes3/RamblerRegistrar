// PendingSaveBanner — signup details that didn't save (AccountSetup keeps them
// on the phone) are retried quietly in the background. If they still won't
// save, this says so and offers Try again. Mounted once, under the top bar.
// It retries again whenever the app comes back to the foreground.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserProfile, saveQuizResults, addUserCourse, fetchSignupSaveState } from '../firestore-data';
import { useAppContext } from '../AppContext';
import {
  saveSignupData, readPendingSignup, storePendingSignup, clearPendingSignup, RETRY_DELAYS_MS,
  pruneAgainstServer, isNothingPending, firstResult, keepStillPending, trackRetry,
} from '../signup-save';
import { isDeletingAccount } from '../account-deletion';
import ErrorState from './ErrorState';

const API = { saveUserProfile, saveQuizResults, addUserCourse };

export default function PendingSaveBanner({ retryDelays = RETRY_DELAYS_MS }) {
  const { user, reloadProfile } = useAppContext();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const [failed, setFailed] = useState(false);
  const runningRef = useRef(false);
  const delaysRef = useRef(retryDelays);

  const run = useCallback(async (delays) => {
    if (!uid || runningRef.current || isDeletingAccount()) return;
    runningRef.current = true;
    try {
      const pending = await readPendingSignup(AsyncStorage, uid);
      if (!pending) {
        setFailed(false);
        return;
      }
      // Only what the server still lacks: anything there now was saved by an
      // earlier try or changed by the user since, and must not be overwritten.
      const server = await firstResult(() => fetchSignupSaveState(uid), delays, undefined, isDeletingAccount);
      if (isDeletingAccount()) return;
      if (!server) {
        setFailed(true);
        return;
      }
      const toSave = pruneAgainstServer(pending, server);
      const res = isNothingPending(toSave)
        ? { ok: true, remaining: toSave }
        : await saveSignupData(uid, toSave, API, { delays, shouldStop: isDeletingAccount });
      if (isDeletingAccount()) return; // the account is going; don't store it again
      if (res.ok) {
        await clearPendingSignup(AsyncStorage);
        setFailed(false);
        // On a later launch the profile was restored before this landed.
        if (reloadProfile) reloadProfile();
      } else {
        // Re-read first: a course removed in Profile while this ran stays removed.
        const current = await readPendingSignup(AsyncStorage, uid);
        await storePendingSignup(AsyncStorage, uid, keepStillPending(res.remaining, current));
        setFailed(true);
      }
    } catch (e) {
      setFailed(true);
    } finally {
      runningRef.current = false;
    }
  }, [uid, reloadProfile]);

  // Registered so account deletion can wait for a retry already under way.
  const attempt = useCallback((delays) => trackRetry(run(delays)), [run]);

  useEffect(() => {
    attempt(delaysRef.current);
  }, [attempt]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') attempt([]);
    });
    return () => sub.remove();
  }, [attempt]);

  if (!failed) return null;
  return (
    <ErrorState
      variant="banner"
      title="Your signup details aren't saved yet."
      message="They're kept on this phone. Try again when you're online."
      onRetry={() => attempt([])}
      retryLabel="Try saving your signup details again"
    />
  );
}
