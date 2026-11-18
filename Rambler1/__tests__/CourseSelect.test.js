// CourseSelect.test.js — the onboarding course picker with a full-size catalog.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const CATALOG = Array.from({ length: 2082 }, (_, i) => ({
  id: i + 1,
  code: `SUBJ ${1000 + i}`,
  name: `Course number ${i}`,
}));

const mockSetSelectedCourses = jest.fn();
let mockSelected = [];
jest.mock('../Database', () => ({
  fetchCourses: jest.fn(),
  fetchProgramCourses: jest.fn(async () => []),
  ensureCatalog: jest.fn(async () => {}),
}));
jest.mock('../AppContext', () => ({
  useAppContext: () => ({
    selectedCourses: mockSelected,
    setSelectedCourses: mockSetSelectedCourses,
    selectedProgram: null,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock('../CourseDetailModal', () => () => null);

import CourseSelect from '../CourseSelect';
import { fetchCourses, ensureCatalog } from '../Database';

beforeEach(() => {
  mockSelected = [];
  mockSetSelectedCourses.mockReset();
  fetchCourses.mockReset().mockResolvedValue(CATALOG);
  ensureCatalog.mockClear();
});

test('mounts only a window of the catalog, not all 2,082 rows', async () => {
  await render(<CourseSelect />);
  expect(await screen.findByText('SUBJ 1000 · Course number 0')).toBeTruthy();
  const mounted = screen.getAllByText(/^SUBJ \d+ · /).length;
  expect(mounted).toBeGreaterThan(0);
  expect(mounted).toBeLessThan(200);
});

test('tapping a course toggles it in the selection', async () => {
  await render(<CourseSelect />);
  await fireEvent.press(await screen.findByText('SUBJ 1000 · Course number 0'));
  expect(mockSetSelectedCourses).toHaveBeenCalledTimes(1);
  const update = mockSetSelectedCourses.mock.calls[0][0];
  expect(update([])).toEqual([CATALOG[0]]);
  expect(update([CATALOG[0]])).toEqual([]);
});

test('search narrows the list', async () => {
  await render(<CourseSelect />);
  await screen.findByText('SUBJ 1000 · Course number 0');
  await fireEvent.changeText(screen.getByPlaceholderText('Search courses...'), 'SUBJ 3081');
  expect(await screen.findByText('SUBJ 3081 · Course number 2081')).toBeTruthy();
  expect(screen.queryByText('SUBJ 1000 · Course number 0')).toBeNull();
});

test('an empty local catalog triggers a catalog retry and offers Retry instead of a blank list', async () => {
  fetchCourses.mockResolvedValue([]);
  await render(<CourseSelect />);
  expect(await screen.findByText('Retry')).toBeTruthy();
  expect(ensureCatalog).toHaveBeenCalled();
});
