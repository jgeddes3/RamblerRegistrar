// SearchScreen.test.js — which term Search asks for, and how often.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

const mockGetCourseSections = jest.fn();
const mockSearchCourses = jest.fn();
jest.mock('../firestore-data', () => ({
  searchCourses: (...a) => mockSearchCourses(...a),
  getCourseSections: (...a) => mockGetCourseSections(...a),
  searchByInstructor: jest.fn(async () => []),
}));
jest.mock('../Database', () => ({ fetchCourses: jest.fn(async () => []) }));
jest.mock('../AppContext', () => ({ useAppContext: () => ({ selectedProgram: null }) }));
jest.mock('../CourseDetailModal', () => () => null);
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

import SearchScreen from '../screens/SearchScreen';
import { resolveRegistrationTerm, __resetTermForTests } from '../term';

const NOV_2026 = new Date(2026, 10, 18); // calendar registration term: 1272
const COMP170 = { code: 'COMP 170', name: 'Intro to Object-Oriented Programming', credits: 3 };

// Types a query and waits for that search (250 ms debounce) to reach the API.
const search = async (text) => {
  const before = mockSearchCourses.mock.calls.length;
  await fireEvent.changeText(screen.getByPlaceholderText(/Search courses/), text);
  await waitFor(() => expect(mockSearchCourses.mock.calls.length).toBe(before + 1), { timeout: 3000 });
};

beforeEach(() => {
  __resetTermForTests(NOV_2026);
  mockGetCourseSections.mockReset().mockResolvedValue([]);
  mockSearchCourses.mockReset().mockResolvedValue([COMP170]);
});
test('asks for sections in the shared registration term, not its own calendar guess', async () => {
  await resolveRegistrationTerm(async () => ['1266'], NOV_2026); // only Fall 2026 is published
  await render(<SearchScreen />);
  await search('COMP 170');
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledWith('1266', 'COMP 170'));
});

test('reloads sections when the term is corrected after results are showing', async () => {
  await render(<SearchScreen />);
  await search('COMP 170');
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledWith('1272', 'COMP 170'));

  await act(async () => { await resolveRegistrationTerm(async () => ['1266'], NOV_2026); });
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledWith('1266', 'COMP 170'));
});

test('does not refetch sections it already has when the same course comes up again', async () => {
  await render(<SearchScreen />);
  await search('COMP 170');
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(1));
  await search('COMP 17');
  await search('COMP 170');
  await new Promise((r) => setTimeout(r, 50)); // let any section reload start
  expect(mockGetCourseSections).toHaveBeenCalledTimes(1);
});

test('retries sections for a course whose first load failed', async () => {
  mockGetCourseSections.mockResolvedValueOnce(null); // read failed
  await render(<SearchScreen />);
  await search('COMP 170');
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(1));
  await search('COMP 17');
  await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(2));
});
