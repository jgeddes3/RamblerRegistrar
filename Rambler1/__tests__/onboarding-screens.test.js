// onboarding-screens.test.js — the sign-up screens show where you are,
// let you skip the optional parts, keep a draft, and offer to continue it.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';

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
jest.mock('../auth', () => ({ signIn: jest.fn() }));
jest.mock('../components/PrivacyPolicyModal', () => () => null);
jest.mock('../firestore-data', () => ({ saveQuizResults: jest.fn(async () => ({ success: true })) }));

import PreferenceQuiz from '../PreferenceQuiz';
import SchedulingPrefs from '../screens/SchedulingPrefs';
import Login from '../Login';
import { DRAFT_KEY } from '../onboarding';

const ctx = (over = {}) => {
  const c = { isLoggedIn: false, user: null, quizResults: null };
  for (const k of ['setQuizResults', 'setSelectedProgram', 'setSelectedProgram2', 'setSelectedMinors', 'setSelectedCourses']) c[k] = jest.fn();
  return Object.assign(c, over);
};
const draft = () => JSON.parse(mockStore.get(DRAFT_KEY) || 'null');

beforeEach(() => {
  mockStore.clear();
  Object.values(mockNav).forEach((f) => f.mockClear());
  mockCtx.current = ctx();
});

describe('quiz', () => {
  test('shows the step, and Skip for now goes on to scheduling preferences', async () => {
    await render(<PreferenceQuiz />);
    expect(screen.getByText('Step 3 of 6')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Skip the quiz for now' }));
    expect(mockNav.navigate).toHaveBeenCalledWith('SchedulingPrefs');
    expect(draft().step).toBe('SchedulingPrefs');
  });

  test('answers are kept in the draft as you go, and come back', async () => {
    await render(<PreferenceQuiz />);
    const firstOption = screen.getAllByRole('radio')[0];
    await fireEvent.press(firstOption);
    await waitFor(() => expect(draft()?.quizProgress?.answers?.[0]).toBe(0));
    await cleanup(); // closed the app

    await render(<PreferenceQuiz />);
    await waitFor(() => expect(screen.getAllByRole('radio')[0].props.accessibilityState.checked).toBe(true));
  });

  test('a retake from More shows no step counter and no skip', async () => {
    mockCtx.current = ctx({ isLoggedIn: true, user: { uid: 'u1', isAnonymous: false } });
    await render(<PreferenceQuiz />);
    expect(screen.queryByText(/Step \d of 6/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip the quiz for now' })).toBeNull();
  });
});

describe('scheduling preferences', () => {
  test('Skip for now goes on to create the account', async () => {
    await render(<SchedulingPrefs />);
    expect(screen.getByText('Step 5 of 6')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Skip scheduling preferences for now' }));
    expect(mockNav.navigate).toHaveBeenCalledWith('AccountSetup');
  });
});

describe('login', () => {
  test('a saved draft offers to continue where you left off', async () => {
    mockStore.set(DRAFT_KEY, JSON.stringify({
      step: 'PreferenceQuiz', savedAt: Date.now(),
      selectedProgram: { id: 'p1', name: 'Computer Science' }, selectedMinors: [], selectedCourses: [{ code: 'COMP 170' }],
    }));
    await render(<Login navigation={mockNav} />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Continue setting up your account' }));
    expect(mockCtx.current.setSelectedProgram).toHaveBeenCalledWith({ id: 'p1', name: 'Computer Science' });
    expect(mockCtx.current.setSelectedCourses).toHaveBeenCalledWith([{ code: 'COMP 170' }]);
    const arg = mockNav.reset.mock.calls[0][0];
    expect(arg.routes.map((r) => r.name)).toEqual(['Login', 'ProgramSelect', 'CourseSelect', 'PreferenceQuiz']);
    expect(arg.index).toBe(3);
  });

  test('no draft, no continue button', async () => {
    await render(<Login navigation={mockNav} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole('button', { name: 'Continue setting up your account' })).toBeNull();
  });
});
