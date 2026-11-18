// ProfileCourses.test.js — the Profile "Courses Completed" picker.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

const CATALOG = Array.from({ length: 2082 }, (_, i) => ({
  id: `SUBJ ${1000 + i}`,
  code: `SUBJ ${1000 + i}`,
  name: `Course number ${i}`,
}));

jest.mock('../firestore-data', () => ({
  fetchPrograms: jest.fn(async () => []),
  fetchCourses: jest.fn(),
  addUserCourse: jest.fn(),
  removeUserCourse: jest.fn(),
  saveUserProfile: jest.fn(),
  fetchEnrichedRecommendations: jest.fn(async () => []),
  fetchQuizFocusAreas: jest.fn(async () => []),
  setUserLocation: jest.fn(),
}));
jest.mock('../auth', () => ({ signOut: jest.fn() }));
jest.mock('../campus-api', () => ({ geocodeAddress: jest.fn(), suggestAddresses: jest.fn(async () => []) }));
jest.mock('../alert', () => jest.fn());
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

// A minimal real provider-like store so the screen's context updates re-render it.
let mockCtx;
jest.mock('../AppContext', () => {
  const React = require('react');
  // Stable identities, like the real context: the screen keys effects on them.
  const fixed = {
    user: { uid: 'u1', email: 'a@b.c', isAnonymous: false },
    selectedProgram: { id: 12, name: 'Computer Science', degree: 'BS' },
    setSelectedProgram: jest.fn(),
    selectedProgram2: null,
    setSelectedProgram2: jest.fn(),
    selectedMinors: [],
    setSelectedMinors: jest.fn(),
    graduationYear: '2028',
    classYear: 'Junior',
    quizResults: null,
    selectedFocus: null,
    setSelectedFocus: jest.fn(),
    isHonors: false,
    setIsHonors: jest.fn(),
    isAthlete: false,
    setIsAthlete: jest.fn(),
    userLocations: [],
    setUserLocations: jest.fn(),
    dataSaleOptOut: false,
    setDataSaleOptOut: jest.fn(),
    profileStatus: 'ready',
    retryProfileRestore: jest.fn(),
  };
  return {
    useAppContext: () => {
      const [selectedCourses, setSelectedCourses] = React.useState(mockCtx.initialCourses);
      mockCtx.selectedCourses = selectedCourses;
      return { ...fixed, selectedCourses, setSelectedCourses };
    },
  };
});

import ProfileScreen from '../screens/ProfileScreen';
import { fetchCourses, addUserCourse, removeUserCourse } from '../firestore-data';
import showAlert from '../alert';

const openCourseList = async () => {
  await render(<ProfileScreen visible onClose={jest.fn()} />);
  await fireEvent.press(screen.getByText('Courses Completed'));
  await screen.findByText('SUBJ 1000');
};

beforeEach(() => {
  mockCtx = { initialCourses: [], selectedCourses: [] };
  fetchCourses.mockReset().mockResolvedValue(CATALOG);
  addUserCourse.mockReset().mockResolvedValue({ success: true });
  removeUserCourse.mockReset().mockResolvedValue({ success: true });
  showAlert.mockReset();
});

test('mounts only a window of the catalog, not all 2,082 rows', async () => {
  await openCourseList();
  const mounted = screen.getAllByText(/^SUBJ \d+$/).length;
  expect(mounted).toBeGreaterThan(0);
  expect(mounted).toBeLessThan(200);
});

test('a tap selects the course at once, without waiting for the save', async () => {
  let finishSave;
  addUserCourse.mockImplementation(() => new Promise((r) => { finishSave = () => r({ success: true }); }));
  await openCourseList();

  await fireEvent.press(screen.getByText('SUBJ 1000'));
  expect(mockCtx.selectedCourses.map((c) => c.code)).toEqual(['SUBJ 1000']); // save still pending
  expect(addUserCourse).toHaveBeenCalledWith('u1', 'SUBJ 1000', null, null);

  await act(async () => { finishSave(); });
  expect(mockCtx.selectedCourses.map((c) => c.code)).toEqual(['SUBJ 1000']);
});

test('quick taps on several courses all register', async () => {
  addUserCourse.mockImplementation(() => new Promise(() => {})); // saves still in flight
  await openCourseList();
  await fireEvent.press(screen.getByText('SUBJ 1000'));
  await fireEvent.press(screen.getByText('SUBJ 1001'));
  await fireEvent.press(screen.getByText('SUBJ 1002'));
  expect(mockCtx.selectedCourses.map((c) => c.code)).toEqual(['SUBJ 1000', 'SUBJ 1001', 'SUBJ 1002']);
});

test('a failed save puts the row back and says so', async () => {
  addUserCourse.mockResolvedValue(null);
  await openCourseList();
  await fireEvent.press(screen.getByText('SUBJ 1000'));
  await waitFor(() => expect(showAlert).toHaveBeenCalled());
  expect(mockCtx.selectedCourses).toEqual([]);
});

test('tapping a selected course removes it', async () => {
  mockCtx.initialCourses = [CATALOG[0]];
  await openCourseList();
  await fireEvent.press(screen.getByText('SUBJ 1000'));
  expect(mockCtx.selectedCourses).toEqual([]);
  expect(removeUserCourse).toHaveBeenCalledWith('u1', 'SUBJ 1000');
});
