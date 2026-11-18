// onboarding-resume.test.js — resuming rebuilds the stack, which mounts every
// screen under the top one. Those must not rewrite the draft's step.
import React from 'react';
import { View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
const mockStore = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => (mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn(async (k, v) => { mockStore.set(k, v); }),
  removeItem: jest.fn(async (k) => { mockStore.delete(k); }),
}));
const mockNav = { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() };
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNav }));
const mockCtx = { current: {} };
jest.mock('../AppContext', () => ({ useAppContext: () => mockCtx.current }));
jest.mock('../styleComponents/BackgroundImage', () => ({ children }) => children);
jest.mock('../firestore-data', () => ({ saveQuizResults: jest.fn(async () => ({ success: true })) }));
const PreferenceQuiz = require('../PreferenceQuiz').default;
const SchedulingPrefs = require('../screens/SchedulingPrefs').default;
const useOnboardingDraft = require('../components/ui/useOnboardingDraft').default;
const { DRAFT_KEY } = require('../onboarding');
const Top = () => { useOnboardingDraft('AccountSetup'); return null; };

test('resume at AccountSetup keeps step AccountSetup', async () => {
  mockCtx.current = { isLoggedIn: false, user: null, quizResults: { scores: { R: 1 }, code: 'R', profileName: 'x' }, setQuizResults: jest.fn() };
  mockStore.set(DRAFT_KEY, JSON.stringify({ step: 'AccountSetup', savedAt: Date.now(),
    quizProgress: { answers: { 0: 0 }, current: 24 }, prefsProgress: { answers: { a: 1 }, current: 2 } }));
  await render(<View><PreferenceQuiz /><SchedulingPrefs /><Top /></View>);
  await new Promise((r) => setTimeout(r, 100));
  expect(JSON.parse(mockStore.get(DRAFT_KEY)).step).toBe('AccountSetup');
});

test('a skipped quiz resumes without the results screen in the stack', () => {
  const { resumeRoutes } = require('../onboarding');
  expect(resumeRoutes('AccountSetup', { quizTaken: false }).map((r) => r.name))
    .toEqual(['Login', 'ProgramSelect', 'CourseSelect', 'PreferenceQuiz', 'SchedulingPrefs', 'AccountSetup']);
  expect(resumeRoutes('QuizResults', { quizTaken: false }).map((r) => r.name).pop()).toBe('PreferenceQuiz');
});
