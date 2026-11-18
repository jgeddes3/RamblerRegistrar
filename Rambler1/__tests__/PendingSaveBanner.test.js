// PendingSaveBanner.test.js — signup details that didn't save are retried in
// the background, then shown with Try again; nothing shows when all is saved.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockStore = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => (mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn(async (k, v) => { mockStore.set(k, v); }),
  removeItem: jest.fn(async (k) => { mockStore.delete(k); }),
}));
const mockSave = jest.fn();
jest.mock('../firestore-data', () => ({
  saveUserProfile: (...a) => mockSave(...a),
  saveQuizResults: jest.fn(async () => ({ success: true })),
  addUserCourse: jest.fn(async () => ({ success: true })),
}));
const mockReload = jest.fn();
jest.mock('../AppContext', () => ({
  useAppContext: () => ({ user: { uid: 'u1', isAnonymous: false }, reloadProfile: mockReload }),
}));

import PendingSaveBanner from '../components/PendingSaveBanner';
import { PENDING_SIGNUP_KEY } from '../signup-save';

const PENDING = JSON.stringify({ uid: 'u1', remaining: { profile: { graduationYear: '2028' }, quiz: null, courseCodes: [] } });

beforeEach(() => {
  mockStore.clear();
  mockSave.mockReset();
  mockReload.mockReset();
});

test('nothing pending: renders nothing and saves nothing', async () => {
  await render(<PendingSaveBanner retryDelays={[]} />);
  await new Promise((r) => setTimeout(r, 20));
  expect(screen.queryByText(/aren't saved yet/)).toBeNull();
  expect(mockSave).not.toHaveBeenCalled();
});

test('a pending save that lands in the background clears quietly and reloads the profile', async () => {
  mockStore.set(PENDING_SIGNUP_KEY, PENDING);
  mockSave.mockResolvedValue({ success: true });
  await render(<PendingSaveBanner retryDelays={[]} />);
  await waitFor(() => expect(mockReload).toHaveBeenCalled());
  expect(mockStore.has(PENDING_SIGNUP_KEY)).toBe(false);
  expect(screen.queryByText(/aren't saved yet/)).toBeNull();
});

test('still failing after the retries: a banner with Try again', async () => {
  mockStore.set(PENDING_SIGNUP_KEY, PENDING);
  mockSave.mockResolvedValue(null);
  await render(<PendingSaveBanner retryDelays={[]} />);
  expect(await screen.findByText("Your signup details aren't saved yet.")).toBeTruthy();

  mockSave.mockResolvedValue({ success: true });
  await fireEvent.press(screen.getByRole('button', { name: 'Try saving your signup details again' }));
  await waitFor(() => expect(screen.queryByText("Your signup details aren't saved yet.")).toBeNull());
  expect(mockStore.has(PENDING_SIGNUP_KEY)).toBe(false);
});
