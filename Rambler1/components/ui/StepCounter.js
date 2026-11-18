// StepCounter — "Step 3 of 6" in a sign-up screen's header. Hidden when the
// same screen is reached from inside the app (retaking the quiz from More).
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppContext } from '../../AppContext';
import { stepNumber } from '../../onboarding';
import { STONE } from '../../theme';

// tone: 'onDark' (white, for the maroon header) or 'onLight'.
export default function StepCounter({ route, tone = 'onDark' }) {
  const { isLoggedIn } = useAppContext();
  const step = stepNumber(route);
  if (isLoggedIn || !step) return null;
  return <Text style={[s.text, tone === 'onLight' && s.onLight]}>Step {step.n} of {step.total}</Text>;
}

const s = StyleSheet.create({
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', alignSelf: 'flex-end', marginBottom: 8 },
  onLight: { color: STONE },
});
