// AccountSetup.save.test.js — a signup whose profile save fails still signs
// the user in, and keeps the unsaved details for PendingSaveBanner to retry.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockStore = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => (mockStore.has(k) ? mockStore.get(k) : null)),
  setItem: jest.fn(async (k, v) => { mockStore.set(k, v); }),
  removeItem: jest.fn(async (k) => { mockStore.delete(k); }),
}));
const mockSaveProfile = jest.fn();
jest.mock('../firestore-data', () => ({
  saveUserProfile: (...a) => mockSaveProfile(...a),
  saveQuizResults: jest.fn(async () => ({ success: true })),
  addUserCourse: jest.fn(async () => ({ success: true })),
}));
jest.mock('../auth', () => ({
  upgradeAnonymousAccount: jest.fn(async (email) => ({ uid: 'u1', email, displayName: null })),
}));
const mockCtx = {
  selectedProgram: { id: 'p1' }, selectedProgram2: null, selectedMinors: [], selectedCourses: [{ code: 'COMP 170' }],
  quizResults: null,
};
for (const k of ['setGraduationYear', 'setClassYear', 'setIsHonors', 'setIsAthlete', 'setUser', 'setIsLoggedIn',
  'setPrivacyPolicyVersion', 'setTermsVersion']) mockCtx[k] = jest.fn();
jest.mock('../AppContext', () => ({ useAppContext: () => mockCtx }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
// Picker stand-in: a press picks its first real option.
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Picker = ({ children, onValueChange }) => {
    const first = React.Children.toArray(children).find((c) => c.props.value !== '');
    return <Text onPress={() => onValueChange(first.props.value)}>pick</Text>;
  };
  Picker.Item = () => null;
  return { Picker };
});
// Consent modals: accepting is a press, without the long scroll-to-agree.
jest.mock('../components/PrivacyPolicyModal', () => {
  const { Text } = require('react-native');
  return ({ visible, onAccept, agreeLabel }) =>
    visible ? <Text onPress={onAccept}>{agreeLabel || 'I agree to the Privacy Policy'}</Text> : null;
});
jest.mock('../styleComponents/BackgroundImage', () => ({ children }) => children);

import AccountSetup from '../AccountSetup';
import { PENDING_SIGNUP_KEY } from '../signup-save';

const signUp = async () => {
  await render(<AccountSetup />);
  for (const picker of screen.getAllByText('pick')) await fireEvent.press(picker);
  await fireEvent.changeText(screen.getByLabelText('Email'), 'sam@example.edu');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'hunter22');
  await fireEvent.press(screen.getByLabelText('Read and agree to the Terms of Service'));
  await fireEvent.press(screen.getByText('I agree to the Terms of Service'));
  await fireEvent.press(screen.getByLabelText('Read and agree to the Privacy Policy'));
  await fireEvent.press(screen.getByText('I agree to the Privacy Policy'));
  await fireEvent.press(screen.getByText('Next'));
  await waitFor(() => expect(mockCtx.setIsLoggedIn).toHaveBeenCalledWith(true));
};

beforeEach(() => {
  mockStore.clear();
  mockSaveProfile.mockReset();
  mockCtx.setIsLoggedIn.mockClear();
});

test('a failed profile save is kept on the phone, and the user still gets in', async () => {
  mockSaveProfile.mockResolvedValue(null); // the data layer's "failed"
  await signUp();
  const pending = JSON.parse(mockStore.get(PENDING_SIGNUP_KEY));
  expect(pending.uid).toBe('u1');
  expect(pending.remaining.profile).toMatchObject({ selectedProgramId: 'p1' });
  expect(pending.remaining.courseCodes).toEqual([]); // the course did save
});

test('a clean save leaves nothing pending', async () => {
  mockSaveProfile.mockResolvedValue({ success: true });
  await signUp();
  expect(mockStore.has(PENDING_SIGNUP_KEY)).toBe(false);
});

test('Next is there from the start; pressing it early says what is missing, field by field', async () => {
  await render(<AccountSetup />);
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Pick your expected graduation year.')).toBeTruthy();
  expect(screen.getByText('Enter your email.')).toBeTruthy();
  expect(screen.getByText('Agree to the Terms of Service and the Privacy Policy to continue.')).toBeTruthy();
  expect(mockCtx.setIsLoggedIn).not.toHaveBeenCalled();

  // Fixing a field clears its message while the others stay.
  await fireEvent.changeText(screen.getByLabelText('Email'), 'sam@example.edu');
  expect(screen.queryByText('Enter your email.')).toBeNull();
  expect(screen.getByText('Pick your expected graduation year.')).toBeTruthy();
});
