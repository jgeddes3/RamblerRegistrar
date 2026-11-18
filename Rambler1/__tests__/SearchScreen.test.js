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
// FlatList stand-in: renders every row and exposes its props, so a test can
// report rows as scrolled into view (the real list needs native layout for that).
let mockListProps = null;
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockFlatList = (props) => {
    mockListProps = props;
    return React.createElement(
      View,
      null,
      props.data.map((item, index) =>
        React.createElement(View, { key: props.keyExtractor(item, index) }, props.renderItem({ item, index }))
      )
    );
  };
  return { __esModule: true, default: MockFlatList };
});
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

describe('recent searches', () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  const savedRecents = () =>
    AsyncStorage.setItem.mock.calls.map(([, json]) => JSON.parse(json));

  beforeEach(() => AsyncStorage.setItem.mockClear());

  test('half-typed queries are not saved', async () => {
    await render(<SearchScreen />);
    await search('COMP 17');
    await search('COMP 170');
    await new Promise((r) => setTimeout(r, 50));
    expect(savedRecents()).toEqual([]);
  });

  test('opening a result saves the query that found it', async () => {
    await render(<SearchScreen />);
    await search('COMP 170');
    await fireEvent.press(await screen.findByText('COMP 170'));
    expect(savedRecents()).toEqual([['COMP 170']]);
  });

  test('submitting the search box saves the query', async () => {
    await render(<SearchScreen />);
    await search('calculus');
    await fireEvent(screen.getByPlaceholderText(/Search courses/), 'submitEditing');
    expect(savedRecents()).toEqual([['calculus']]);
  });
});

describe('sections beyond the first batch', () => {
  const MANY = Array.from({ length: 45 }, (_, i) => ({
    code: `SUBJ ${100 + i}`, name: `Course ${i}`, credits: 3,
  }));

  test('a result past the 30th gets its sections once it scrolls into view', async () => {
    mockSearchCourses.mockResolvedValue(MANY);
    await render(<SearchScreen />);
    await search('SUBJ');
    await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(30));
    expect(mockGetCourseSections).not.toHaveBeenCalledWith('1272', 'SUBJ 140');

    await act(async () => {
      mockListProps.onViewableItemsChanged({
        viewableItems: MANY.slice(38, 43).map((item) => ({ item, isViewable: true })),
        changed: [],
      });
    });
    await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledWith('1272', 'SUBJ 140'));
    expect(mockGetCourseSections).toHaveBeenCalledTimes(35);
  });
});
