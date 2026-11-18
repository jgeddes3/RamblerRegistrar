// ScheduleScreen.test.js — the term switcher.
// RNTL v14: render() is ASYNC — always `await render(...)`.
//
// Since Oct 1 the Schedule tab only showed the term being registered for, so a
// schedule built for the term now in session could no longer be opened there.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../firestore-data', () => ({
  fetchSchedule: jest.fn(),
  saveSchedule: jest.fn(async () => ({ success: true })),
  getSectionsByClassNumbers: jest.fn(async () => []),
  searchCourses: jest.fn(async () => []),
  getCourseSections: jest.fn(async () => []),
  fetchBuildings: jest.fn(async () => []),
  fetchDegreeProgress: jest.fn(async () => null),
  fetchUserCoreProgress: jest.fn(async () => null),
  fetchWatches: jest.fn(async () => []),
  addWatch: jest.fn(),
  removeWatch: jest.fn(),
}));
jest.mock('../AppContext', () => {
  const ctx = {
    user: { uid: 'u1', isAnonymous: false },
    selectedProgram: null, selectedProgram2: null, selectedMinors: [], selectedFocus: null,
    graduationYear: '2028', classYear: 'Junior', isHonors: false, isAthlete: false,
    userLocations: [], quizResults: null,
  };
  return { useAppContext: () => ctx };
});
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  // Run the focus effect like a mounted, focused screen would.
  return { useFocusEffect: (effect) => React.useEffect(effect, [effect]) };
});
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('../ics-export', () => ({ writeCacheFile: jest.fn() }));
jest.mock('../components/ScheduleGrid', () => () => null);
jest.mock('../components/GenerateScheduleModal', () => () => null);
jest.mock('../components/ScheduleMapModal', () => () => null);
jest.mock('../CourseDetailModal', () => () => null);

import ScheduleScreen from '../screens/ScheduleScreen';
import { fetchSchedule, fetchWatches } from '../firestore-data';
import { __resetTermForTests } from '../term';

const NOV_2026 = new Date(2026, 10, 18); // in session: Fall 2026; registering for: Spring 2027
const FEB_2027 = new Date(2027, 1, 10); // Spring 2027 is both

// Fake ONLY the clock's date (the screen asks what term is in session);
// timers stay real so rendering and waitFor behave normally.
const setToday = (date) => jest.useFakeTimers({
  now: date,
  doNotFake: [
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
    'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
    'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime',
  ],
});

beforeEach(() => {
  fetchSchedule.mockReset().mockResolvedValue(null);
  fetchWatches.mockClear();
});
afterEach(() => jest.useRealTimers());

test('opens on the term being registered for', async () => {
  setToday(NOV_2026);
  __resetTermForTests(NOV_2026);
  await render(<ScheduleScreen />);
  await waitFor(() => expect(fetchSchedule).toHaveBeenCalledWith('u1', '1272'));
  expect(fetchSchedule).not.toHaveBeenCalledWith('u1', '1266');
});

test('the term in session can be opened from the header', async () => {
  setToday(NOV_2026);
  __resetTermForTests(NOV_2026);
  await render(<ScheduleScreen />);
  await waitFor(() => expect(fetchSchedule).toHaveBeenCalledWith('u1', '1272'));

  await fireEvent.press(screen.getByText('Fall 2026'));
  await waitFor(() => expect(fetchSchedule).toHaveBeenCalledWith('u1', '1266'));
  await waitFor(() => expect(fetchWatches).toHaveBeenCalledWith('u1', '1266'));

  await fireEvent.press(screen.getByText('Spring 2027'));
  await waitFor(() => expect(fetchSchedule).toHaveBeenCalledTimes(3));
  expect(fetchSchedule).toHaveBeenLastCalledWith('u1', '1272');
});

test('no switcher when there is only one term to show', async () => {
  setToday(FEB_2027);
  __resetTermForTests(FEB_2027);
  await render(<ScheduleScreen />);
  await waitFor(() => expect(fetchSchedule).toHaveBeenCalledWith('u1', '1272'));
  expect(screen.getByText('Spring 2027')).toBeTruthy();
  expect(screen.queryByText('Fall 2026')).toBeNull();
  expect(screen.queryByLabelText(/Show .* schedule/)).toBeNull();
});
