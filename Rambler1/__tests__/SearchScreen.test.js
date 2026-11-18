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
  addSectionToSchedule: (...a) => mockAddSection(...a),
  removeSectionFromSchedule: (...a) => mockRemoveSection(...a),
}));
const mockAddSection = jest.fn();
const mockRemoveSection = jest.fn();
jest.mock('../Database', () => ({ fetchCourses: jest.fn(async () => []) }));
const mockCtx = { current: { selectedProgram: null } };
jest.mock('../AppContext', () => ({ useAppContext: () => mockCtx.current }));
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

import SearchScreen, { PRELOAD_COURSES, SECTIONS_SHOWN, FilterChips } from '../screens/SearchScreen';
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
    await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(PRELOAD_COURSES));
    expect(mockGetCourseSections).not.toHaveBeenCalledWith('1272', 'SUBJ 140');

    await act(async () => {
      mockListProps.onViewableItemsChanged({
        viewableItems: MANY.slice(38, 43).map((item) => ({ item, isViewable: true })),
        changed: [],
      });
    });
    await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledWith('1272', 'SUBJ 140'));
    expect(mockGetCourseSections).toHaveBeenCalledTimes(PRELOAD_COURSES + 5);
  });
});

describe('failed reads show an error with Try again', () => {
  test('a failed catalog search says so instead of "No courses found"', async () => {
    mockSearchCourses.mockResolvedValueOnce(null); // read failed
    await render(<SearchScreen />);
    await search('COMP 170');
    expect(await screen.findByText("Couldn't search the catalog")).toBeTruthy();
    expect(screen.queryByText('No courses found')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('COMP 170')).toBeTruthy();
    expect(mockSearchCourses).toHaveBeenCalledTimes(2);
  });

  test("a course whose sections failed to load offers Try again on its card", async () => {
    mockGetCourseSections.mockResolvedValueOnce(null); // read failed
    await render(<SearchScreen />);
    await search('COMP 170');
    expect(await screen.findByText("Couldn't load sections.")).toBeTruthy();

    mockGetCourseSections.mockResolvedValueOnce([]);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again loading sections for COMP 170' }));
    await waitFor(() => expect(mockGetCourseSections).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/No sections for/)).toBeTruthy();
  });
});

describe('lighter results', () => {
  const SECTIONS = Array.from({ length: 5 }, (_, i) => ({
    id: String(5000 + i), class_number: String(5000 + i), section_number: `00${i + 1}`,
    subject: 'COMP', catalog_number: '170', enrollment_cap: 30, enrollment_total: 10,
  }));

  test('a card shows the first few sections, and Show all reveals the rest', async () => {
    mockGetCourseSections.mockResolvedValue(SECTIONS);
    await render(<SearchScreen />);
    await search('COMP 170');
    expect(await screen.findByText('Sec 001')).toBeTruthy();
    expect(SECTIONS_SHOWN).toBe(3);
    expect(screen.queryByText('Sec 004')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Show all 5 sections of COMP 170' }));
    expect(screen.getByText('Sec 005')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Show fewer sections of COMP 170' }));
    expect(screen.queryByText('Sec 005')).toBeNull();
  });

  test('only the first results get their sections up front', () => {
    expect(PRELOAD_COURSES).toBeLessThanOrEqual(10);
  });

  test('clearing the box cancels a search that has not started yet', async () => {
    await render(<SearchScreen />);
    await fireEvent.changeText(screen.getByPlaceholderText(/Search courses/), 'COMP');
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    await new Promise((r) => setTimeout(r, 400)); // past the 250 ms debounce
    expect(mockSearchCourses).not.toHaveBeenCalled();
  });
});

describe('"+" adds a section straight to the schedule', () => {
  const { ToastProvider, ToastHost } = require('../components/ui/Toast');
  const SEC = { id: '5000', class_number: '5000', section_number: '001', subject: 'COMP', catalog_number: '170', enrollment_cap: 30, enrollment_total: 10 };
  const withToasts = () => (
    <ToastProvider>
      <SearchScreen />
      <ToastHost />
    </ToastProvider>
  );
  afterEach(() => { mockCtx.current = { selectedProgram: null }; });

  test('signed in: one tap adds it, with a toast that can undo it', async () => {
    mockCtx.current = { selectedProgram: null, user: { uid: 'u1', isAnonymous: false } };
    mockGetCourseSections.mockResolvedValue([SEC]);
    mockAddSection.mockReset().mockResolvedValue({ added: true });
    mockRemoveSection.mockReset().mockResolvedValue({ removed: true });
    await render(withToasts());
    await search('COMP 170');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add COMP 170 Sec 001 to your schedule' }));
    expect(mockAddSection).toHaveBeenCalledWith('u1', '1272', '5000');
    expect(await screen.findByText(/COMP 170 Sec 001 added to your .* schedule\./)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(mockRemoveSection).toHaveBeenCalledWith('u1', '1272', '5000');
  });

  test('signed out: no "+" (there is no schedule to add to)', async () => {
    mockGetCourseSections.mockResolvedValue([SEC]);
    await render(withToasts());
    await search('COMP 170');
    expect(await screen.findByText('Sec 001')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /to your schedule/ })).toBeNull();
  });
});

test('filter chips report whether each filter is on', async () => {
  await render(<FilterChips filters={{ timeOfDay: 'morning', days: null, openOnly: false }} onFilterChange={() => {}} />);
  expect(screen.getByRole('button', { name: /Morning/ }).props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByRole('button', { name: /Open Seats/ }).props.accessibilityState).toMatchObject({ selected: false });
});
