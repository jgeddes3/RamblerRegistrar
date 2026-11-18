// useOnboardingDraft — in sign-up, remember this screen (and the choices
// made so far) in the onboarding draft, so Login's "Continue setting up your
// account" can bring the user back here after the app was closed.
// Does nothing once signed in (the same screens are reused for a retake), and
// only the focused screen writes: resuming rebuilds the whole stack, and the
// screens mounted underneath must not move the draft's step back.
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Navigation from '@react-navigation/native';
import { useAppContext } from '../../AppContext';
import { saveDraft } from '../../onboarding';

// Outside a navigator (some tests) there is nothing to be unfocused from.
const useFocused = typeof Navigation.useIsFocused === 'function' ? Navigation.useIsFocused : () => true;

export default function useOnboardingDraft(step, fields = {}) {
  const { isLoggedIn } = useAppContext();
  const focused = useFocused();
  const snapshot = JSON.stringify(fields);
  useEffect(() => {
    if (isLoggedIn || !focused) return;
    saveDraft(AsyncStorage, { step, ...JSON.parse(snapshot) });
  }, [isLoggedIn, focused, step, snapshot]);
}
