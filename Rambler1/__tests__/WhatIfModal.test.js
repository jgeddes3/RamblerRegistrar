// WhatIfModal.test.js — the What If search narrows the measured programs.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const MAJORS = [
  { id: 'cs', name: 'Computer Science', degree: 'BS' },
  { id: 'phil', name: 'Philosophy', degree: 'BA' },
  { id: 'math', name: 'Mathematics', degree: 'BS' },
];
const MINORS = [
  { id: 'philm', name: 'Philosophy Minor' },
  { id: 'art', name: 'Art History' },
];
const mockFetchPrograms = jest.fn();
jest.mock('../firestore-data', () => ({
  fetchPrograms: (...a) => mockFetchPrograms(...a),
  // No requirement rows: every program lands in "Requirements not loaded yet".
  fetchProgramRequirementRowsLean: jest.fn(async () => []),
  saveUserProfile: jest.fn(),
}));
jest.mock('../AppContext', () => ({
  useAppContext: () => ({ user: { uid: 'u1' }, selectedCourses: [], selectedMinors: [] }),
}));

import WhatIfModal from '../components/WhatIfModal';

beforeEach(() => {
  mockFetchPrograms.mockReset().mockImplementation(async (type) => (type === 'minor' ? MINORS : MAJORS));
});

const open = () => render(
  <WhatIfModal visible asScreen onClose={() => {}} baseRemainingCount={0} semestersLeft={4} plans={{}} />
);

test('typing narrows the list; clearing brings it back', async () => {
  await open();
  expect(await screen.findByText('Computer Science (BS)')).toBeTruthy();
  expect(screen.getByText('Philosophy (BA)')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Search majors'), 'phil');
  expect(screen.getByText('Philosophy (BA)')).toBeTruthy();
  expect(screen.queryByText('Computer Science (BS)')).toBeNull();
  expect(screen.queryByText('Mathematics (BS)')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByText('Computer Science (BS)')).toBeTruthy();
  expect(screen.getByText('Mathematics (BS)')).toBeTruthy();
  // Filtering never refetches.
  expect(mockFetchPrograms).toHaveBeenCalledTimes(1);
});

test('nothing matching says so, and hides the group headings', async () => {
  await open();
  await screen.findByText('Computer Science (BS)');

  await fireEvent.changeText(screen.getByLabelText('Search majors'), 'zzz');
  expect(screen.getByText('No majors match "zzz".')).toBeTruthy();
  expect(screen.queryByText('Requirements not loaded yet')).toBeNull();
});

test('the search carries over to another mode', async () => {
  await open();
  await screen.findByText('Computer Science (BS)');
  await fireEvent.changeText(screen.getByLabelText('Search majors'), 'phil');

  await fireEvent.press(screen.getByRole('tab', { name: 'Add minor' }));
  expect(await screen.findByText('Philosophy Minor')).toBeTruthy();
  expect(screen.queryByText('Art History')).toBeNull();
  expect(screen.getByLabelText('Search minors').props.value).toBe('phil');
});
