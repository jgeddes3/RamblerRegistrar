// PendingSaveBanner — signup details that didn't save (AccountSetup keeps them
// on the phone) are retried quietly in the background. If they still won't
// save, this says so and offers Try again. Mounted once, under the top bar.
// It retries again whenever the app comes back to the foreground.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserProfile, saveQuizResults, addUserCourse } from '../firestore-data';
import { useAppContext } from '../AppContext';
import {
  saveSignupData, readPendingSignup, storePendingSignup, clearPendingSignup, RETRY_DELAYS_MS,
} from '../signup-save';
import ErrorState from './ErrorState';

const API = { saveUserProfile, saveQuizResults, addUserCourse };

export default function PendingSaveBanner({ retryDelays = RETRY_DELAYS_MS }) {
  const { user, reloadProfile } = useAppContext();
  const uid = user && !user.isAnonymous ? user.uid : null;
  const [failed, setFailed] = useState(false);
  const runningRef = useRef(false);
  const delaysRef = useRef(retryDelays);

  const attempt = useCallback(async (delays) => {
    if (!uid || runningRef.current) return;
    runningRef.current = true;
    try {
      const pending = await readPendingSignup(AsyncStorage, uid);
      if (!pending) {
        setFailed(false);
        return;
      }
      const res = await saveSignupData(uid, pending, API, { delays });
      if (res.ok) {
        await clearPendingSignup(AsyncStorage);
        setFailed(false);
        // On a later launch the profile was restored before this landed.
        if (reloadProfile) reloadProfile();
      } else {
        await storePendingSignup(AsyncStorage, uid, res.remaining);
        setFailed(true);
      }
    } catch (e) {
      setFailed(true);
    } finally {
      runningRef.current = false;
    }
  }, [uid, reloadProfile]);

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
