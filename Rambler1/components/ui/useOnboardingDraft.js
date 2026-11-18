// useOnboardingDraft — in sign-up, remember this screen (and the choices
// made so far) in the onboarding draft, so Login's "Continue setting up your
// account" can bring the user back here after the app was closed.
// Does nothing once signed in (the same screens are reused for a retake).
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../AppContext';
import { saveDraft } from '../../onboarding';

export default function useOnboardingDraft(step, fields = {}) {
  const { isLoggedIn } = useAppContext();
  const snapshot = JSON.stringify(fields);
  useEffect(() => {
    if (isLoggedIn) return;
    saveDraft(AsyncStorage, { step, ...JSON.parse(snapshot) });
  }, [isLoggedIn, step, snapshot]);
}
