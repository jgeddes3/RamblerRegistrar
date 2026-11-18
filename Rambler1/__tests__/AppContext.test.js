// AppContext.test.js — startup gating and profile-restore retry.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';

let mockAuthCallback = null;
jest.mock('../auth', () => ({
  onAuthChange: (cb) => { mockAuthCallback = cb; return () => {}; },
  ensureAnonymousSignIn: jest.fn(async () => null),
}));

jest.mock('../firestore-data', () => ({
  fetchUserProfile: jest.fn(),
  fetchProgramById: jest.fn(async () => null),
  fetchQuizResults: jest.fn(),
  fetchUserCourses: jest.fn(async () => []),
  fetchCourseDetail: jest.fn(async () => null),
  fetchUserLocations: jest.fn(async () => []),
  fetchFocusAreaById: jest.fn(async () => null),
}));

// Real restore logic, but with test-sized waits.
jest.mock('../profile-restore', () => ({
  ...jest.requireActual('../profile-restore'),
  RESTORE_GRACE_MS: 40,
  restoreRetryDelayMs: () => 40,
}));

import { AppProvider, useAppContext } from '../AppContext';
import * as mockApi from '../firestore-data';

const PROFILE = {
  selected_program_id: 12,
  program: { id: 12, name: 'Computer Science', type: 'major' },
  minors: [],
  graduation_year: '2028',
  privacy_policy_version: '3',
  terms_version: '2',
};
const NO_QUIZ = { error: 'No quiz results found' };
const realUser = (uid = 'u1') => ({ uid, email: 'a@b.c', displayName: null, isAnonymous: false });
const anonUser = { uid: 'anon', email: null, displayName: null, isAnonymous: true, reload: jest.fn(async () => {}) };

const Probe = () => {
  const ctx = useAppContext();
  return (
    <Text testID="probe">
      {JSON.stringify({
        authLoading: ctx.authLoading,
        isLoggedIn: ctx.isLoggedIn,
        profileStatus: ctx.profileStatus,
        major: ctx.selectedProgram ? ctx.selectedProgram.name : null,
      })}
    </Text>
  );
};
const state = () => JSON.parse(screen.getByTestId('probe').props.children);
const signInAs = (user) => act(async () => { mockAuthCallback(user); });

beforeEach(() => {
  mockAuthCallback = null;
  mockApi.fetchUserProfile.mockReset().mockResolvedValue(PROFILE);
  mockApi.fetchQuizResults.mockReset().mockResolvedValue(NO_QUIZ);
});

test('a restored profile is in place before the app is shown', async () => {
  await render(<AppProvider><Probe /></AppProvider>);
  expect(state().authLoading).toBe(true);
  await signInAs(realUser());
  await waitFor(() => expect(state().authLoading).toBe(false));
  expect(state()).toEqual({ authLoading: false, isLoggedIn: true, profileStatus: 'ready', major: 'Computer Science' });
});

test('a slow restore stops holding the app back after the grace period, then fills in', async () => {
  let release;
  mockApi.fetchUserProfile.mockImplementation(() => new Promise((r) => { release = () => r(PROFILE); }));
  await render(<AppProvider><Probe /></AppProvider>);
  await signInAs(realUser());

  await waitFor(() => expect(state().authLoading).toBe(false));
  expect(state()).toEqual({ authLoading: false, isLoggedIn: true, profileStatus: 'loading', major: null });

  await act(async () => { release(); });
  await waitFor(() => expect(state().profileStatus).toBe('ready'));
  expect(state().major).toBe('Computer Science');
});

test('a failed restore is marked failed and retried until it succeeds', async () => {
  mockApi.fetchUserProfile.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValue(PROFILE);
  await render(<AppProvider><Probe /></AppProvider>);
  await signInAs(realUser());

  await waitFor(() => expect(state().profileStatus).toBe('failed'));
  expect(state().major).toBeNull();

  await waitFor(() => expect(state().profileStatus).toBe('ready'), { timeout: 3000 });
  expect(state().major).toBe('Computer Science');
  expect(mockApi.fetchUserProfile).toHaveBeenCalledTimes(3);
});

test('a restore that finishes after sign-out is discarded', async () => {
  let release;
  mockApi.fetchUserProfile.mockImplementation(() => new Promise((r) => { release = () => r(PROFILE); }));
  await render(<AppProvider><Probe /></AppProvider>);
  await signInAs(realUser());
  await signInAs(null); // signed out while the restore is in flight
  await signInAs(anonUser);

  await act(async () => { release(); });
  await new Promise((r) => setTimeout(r, 60));
  expect(state()).toEqual({ authLoading: false, isLoggedIn: false, profileStatus: 'ready', major: null });
});

test('anonymous sessions have nothing to restore and are ready at once', async () => {
  await render(<AppProvider><Probe /></AppProvider>);
  await signInAs(anonUser);
  await waitFor(() => expect(state().authLoading).toBe(false));
  expect(state()).toEqual({ authLoading: false, isLoggedIn: false, profileStatus: 'ready', major: null });
  expect(mockApi.fetchUserProfile).not.toHaveBeenCalled();
});
