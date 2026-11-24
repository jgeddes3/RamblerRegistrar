// PlanningScreen.clear.test.js — clearing one semester, or every semester,
// asks first and can be undone.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockSavePlan = jest.fn();
const mockFetchPlans = jest.fn();
jest.mock('../firestore-data', () => ({
  fetchPlans: (...a) => mockFetchPlans(...a),
  savePlan: (...a) => mockSavePlan(...a),
  addCourseToPlan: jest.fn(),
  removeCourseFromPlan: jest.fn(),
  searchCourses: jest.fn(async () => []),
  fetchDegreeProgress: jest.fn(async () => null),
  fetchUserCoreProgress: jest.fn(async () => null),
  fetchPrerequisites: jest.fn(async () => []),
  PLAN_TERM_CAP: 15,
}));
// Confirming is pressing the destructive button; other alerts just record.
jest.mock('../alert', () => jest.fn((t, m, buttons) => {
  const b = (buttons || []).find((x) => x.style === 'destructive'); if (b) b.onPress();
}));
jest.mock('../AppContext', () => {
  const ctx = {
    user: { uid: 'u1', isAnonymous: false }, isLoggedIn: true, graduationYear: '2028',
    selectedProgram: null, selectedProgram2: null, selectedMinors: [], selectedCourses: [], selectedFocus: null,
  };
  return { useAppContext: () => ctx };
});
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return { useFocusEffect: (effect) => React.useEffect(effect, [effect]) };
});
jest.mock('../components/WhatIfModal', () => () => null);

import PlanningScreen from '../screens/PlanningScreen';
import { ToastProvider, ToastHost } from '../components/ui/Toast';
import showAlert from '../alert';

const NOV_2026 = new Date(2026, 10, 18); // semesters run Spring 2027 (1272) -> Spring 2028
let db;

beforeEach(() => {
  jest.useFakeTimers({
    now: NOV_2026,
    doNotFake: [
      'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
      'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame',
      'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime',
    ],
  });
  db = { 1272: ['COMP 271', 'MATH 162'], 1276: ['PHIL 181'] };
  mockFetchPlans.mockReset().mockImplementation(async () => JSON.parse(JSON.stringify(db)));
  mockSavePlan.mockReset().mockImplementation(async (uid, term, codes) => { db[term] = [...codes]; return { success: true }; });
  showAlert.mockClear();
});
afterEach(() => jest.useRealTimers());

const open = async () => {
  await render(<ToastProvider><PlanningScreen /><ToastHost /></ToastProvider>);
  await screen.findByText('COMP 271  ✕');
};

test('Clear on a semester empties that one and leaves the others', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear Spring 2027' }));

  expect(showAlert).toHaveBeenCalledWith(
    'Clear Spring 2027?',
    'This removes all 2 planned courses from this semester.',
    expect.any(Array),
  );
  await waitFor(() => expect(mockSavePlan).toHaveBeenCalledWith('u1', '1272', []));
  expect(mockSavePlan).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByText('COMP 271  ✕')).toBeNull());
  expect(screen.getByText('PHIL 181  ✕')).toBeTruthy();
  expect(screen.getByText('Spring 2027 cleared.')).toBeTruthy();
  // An empty semester has nothing to clear.
  expect(screen.queryByRole('button', { name: 'Clear Spring 2027' })).toBeNull();
});

test('Undo puts the semester back', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear Spring 2027' }));
  await fireEvent.press(await screen.findByText('Undo'));

  await waitFor(() => expect(mockSavePlan).toHaveBeenLastCalledWith('u1', '1272', ['COMP 271', 'MATH 162']));
  expect(await screen.findByText('COMP 271  ✕')).toBeTruthy();
  expect(screen.getByText('MATH 162  ✕')).toBeTruthy();
});

test('Clear all plans empties every semester', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear all plans' }));

  expect(showAlert).toHaveBeenCalledWith(
    'Clear all plans?',
    'This removes all 3 planned courses from every semester. Your schedule and completed courses stay.',
    expect.any(Array),
  );
  await waitFor(() => expect(db).toEqual({ 1272: [], 1276: [] }));
  await waitFor(() => expect(screen.queryByText('PHIL 181  ✕')).toBeNull());
  expect(screen.getByText('Plans cleared.')).toBeTruthy();
  // Nothing planned anywhere: the button goes away.
  expect(screen.queryByRole('button', { name: 'Clear all plans' })).toBeNull();
});

test('a semester that fails to clear stays, and says so', async () => {
  mockSavePlan.mockImplementation(async (uid, term, codes) => {
    if (term === '1276') return null; // the data layer's "failed"
    db[term] = [...codes];
    return { success: true };
  });
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear all plans' }));

  await waitFor(() => expect(showAlert).toHaveBeenCalledWith(
    'Clear failed', 'Some of your plan could not be cleared. Please try again.',
  ));
  expect(screen.queryByText('COMP 271  ✕')).toBeNull();
  expect(screen.getByText('PHIL 181  ✕')).toBeTruthy();
});
