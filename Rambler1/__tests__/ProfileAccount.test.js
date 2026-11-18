// ProfileAccount.test.js — Sign Out asks first; Delete account checks the
// password, deletes the data, and only then deletes the sign-in.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../firestore-data', () => ({
  fetchPrograms: jest.fn(async () => []),
  fetchCourses: jest.fn(async () => []),
  addUserCourse: jest.fn(),
  removeUserCourse: jest.fn(),
  saveUserProfile: jest.fn(),
  fetchEnrichedRecommendations: jest.fn(async () => []),
  fetchQuizFocusAreas: jest.fn(async () => []),
  setUserLocation: jest.fn(),
  deleteAllUserData: jest.fn(),
}));
jest.mock('../auth', () => ({
  signOut: jest.fn(async () => {}),
  reauthenticate: jest.fn(),
  deleteCurrentAccount: jest.fn(async () => {}),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ multiRemove: jest.fn(async () => {}) }));
jest.mock('../campus-api', () => ({ geocodeAddress: jest.fn(), suggestAddresses: jest.fn(async () => []) }));
jest.mock('../alert', () => jest.fn());
jest.mock('../modal-sequencing', () => ({ afterModalDismiss: (fn) => fn() }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('../AppContext', () => {
  const fixed = {
    user: { uid: 'u1', email: 'a@b.c', isAnonymous: false },
    selectedProgram: { id: 12, name: 'Computer Science', degree: 'BS' },
    selectedProgram2: null, selectedMinors: [], selectedCourses: [], graduationYear: '2028',
    classYear: 'Junior', quizResults: null, selectedFocus: null, isHonors: false, isAthlete: false,
    userLocations: [], dataSaleOptOut: false, profileStatus: 'ready',
  };
  for (const k of ['setSelectedProgram', 'setSelectedProgram2', 'setSelectedMinors', 'setSelectedCourses',
    'setSelectedFocus', 'setIsHonors', 'setIsAthlete', 'setUserLocations', 'setDataSaleOptOut',
    'retryProfileRestore']) fixed[k] = jest.fn();
  return { useAppContext: () => fixed };
});

import ProfileScreen from '../screens/ProfileScreen';
import { signOut, reauthenticate, deleteCurrentAccount } from '../auth';
import { deleteAllUserData } from '../firestore-data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import showAlert from '../alert';

const onClose = jest.fn();
const openDeletePanel = async () => {
  await render(<ProfileScreen visible onClose={onClose} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
  await fireEvent.changeText(screen.getByLabelText('Password'), 'hunter22');
};

beforeEach(() => {
  jest.clearAllMocks();
  reauthenticate.mockResolvedValue(undefined);
  deleteAllUserData.mockResolvedValue(undefined);
});

test('Sign Out asks before signing out', async () => {
  await render(<ProfileScreen visible onClose={onClose} />);
  await fireEvent.press(screen.getByText('Sign Out'));
  expect(signOut).not.toHaveBeenCalled();
  const [title, , buttons] = showAlert.mock.calls[0];
  expect(title).toBe('Sign out?');
  buttons.find((b) => b.text === 'Sign Out').onPress();
  await waitFor(() => expect(signOut).toHaveBeenCalled());
});

test('a wrong password shows an error and deletes nothing', async () => {
  reauthenticate.mockRejectedValue(Object.assign(new Error('bad'), { code: 'auth/invalid-credential' }));
  await openDeletePanel();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
  expect(await screen.findByText("That password isn't right.")).toBeTruthy();
  expect(deleteAllUserData).not.toHaveBeenCalled();
  expect(deleteCurrentAccount).not.toHaveBeenCalled();
});

test('deletes the data, clears the phone, closes, then deletes the sign-in', async () => {
  await openDeletePanel();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
  await waitFor(() => expect(deleteCurrentAccount).toHaveBeenCalled());
  expect(reauthenticate).toHaveBeenCalledWith('hunter22');
  expect(deleteAllUserData).toHaveBeenCalledWith('u1');
  expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

test('a failed data delete keeps the sign-in and says so', async () => {
  deleteAllUserData.mockRejectedValue(new Error('offline'));
  await openDeletePanel();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
  expect(await screen.findByText(/Your account stays open/)).toBeTruthy();
  expect(deleteCurrentAccount).not.toHaveBeenCalled();
});
