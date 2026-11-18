// onboarding-races.test.js — draft writes that overlap (finishing preferences
// while Create Account records itself) must not lose each other. The store
// takes a moment per call, like the native module.
import React, { useState } from 'react';
import { View } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
const mockStore = new Map();
const tick = () => new Promise((r) => setTimeout(r, 2)); // a native round trip
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => { await tick(); return mockStore.has(k) ? mockStore.get(k) : null; }),
  setItem: jest.fn(async (k, v) => { await tick(); mockStore.set(k, v); }),
  removeItem: jest.fn(async (k) => { await tick(); mockStore.delete(k); }),
}));
const mockNav = { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNav }));
const mockCtx = { current: {} };
jest.mock('../AppContext', () => ({ useAppContext: () => mockCtx.current }));
jest.mock('../styleComponents/BackgroundImage', () => ({ children }) => children);
jest.mock('../firestore-data', () => ({ saveQuizResults: jest.fn(async () => ({ success: true })) }));
const SchedulingPrefs = require('../screens/SchedulingPrefs').default;
const useOnboardingDraft = require('../components/ui/useOnboardingDraft').default;
const { DRAFT_KEY } = require('../onboarding');
const Top = () => { useOnboardingDraft('AccountSetup'); return null; };
const Stack = () => {
  const [top, setTop] = useState(false);
  mockNav.navigate.mockImplementation((n) => { if (n === 'AccountSetup') setTop(true); });
  return <View><SchedulingPrefs />{top ? <Top /> : null}</View>;
};

test('finishing prefs: the draft keeps the prefs', async () => {
  mockCtx.current = { isLoggedIn: false, user: null, quizResults: null, setQuizResults: jest.fn() };
  const answers = { timePreference: 'early', weekShape: 'mwf', classSize: 'small', modality: 'mix', campus: 'lsc' };
  mockStore.set(DRAFT_KEY, JSON.stringify({ step: 'SchedulingPrefs', savedAt: Date.now(), prefsProgress: { answers, current: 4 } }));
  await render(<Stack />);
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  const next = screen.getAllByText(/Finish|Next|Continue|Done/)[0];
  await fireEvent.press(next);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  const d = JSON.parse(mockStore.get(DRAFT_KEY));
  expect(d.quizResults && d.quizResults.schedulingPrefs).toEqual(answers);
});
