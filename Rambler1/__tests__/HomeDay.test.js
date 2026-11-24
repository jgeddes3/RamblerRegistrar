// HomeDay.test.js — Home's day additions: saved campus events in "Today's
// classes", the Map button, and room booking from the library card.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockData = {
  fetchSchedule: jest.fn(),
  getSectionsByClassNumbers: jest.fn(),
  fetchBuildings: jest.fn(),
};
jest.mock('../firestore-data', () => ({
  // Lazy wrappers: this factory runs before mockData is initialised.
  fetchSchedule: (...a) => mockData.fetchSchedule(...a),
  getSectionsByClassNumbers: (...a) => mockData.getSectionsByClassNumbers(...a),
  fetchBuildings: (...a) => mockData.fetchBuildings(...a),
  fetchDegreeProgress: jest.fn(async () => null),
  fetchUserCoreProgress: jest.fn(async () => null),
  fetchUserPrimaryLocation: jest.fn(async () => null),
}));
const USER = { uid: 'u1', isAnonymous: false, displayName: 'Sam Lee' };
const NONE = []; // stable, as AppContext provides: Home's focus effect depends on them
jest.mock('../AppContext', () => ({
  useAppContext: () => ({ user: mockUser, selectedMinors: mockNone, selectedCourses: mockNone }),
}));
const mockUser = USER;
const mockNone = NONE;
const mockLibrary = jest.fn();
jest.mock('../campus-api', () => ({
  getLibraryHours: (...a) => mockLibrary(...a),
  getEventsToday: jest.fn(async () => []),
  getPhoenixHeadlines: jest.fn(async () => []),
}));
jest.mock('../cta', () => ({
  nearestStation: () => ({}), getTrainArrivals: jest.fn(async () => []), groupArrivalsBothWays: () => [],
}));
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb) => React.useEffect(cb, [cb]),
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});
jest.mock('../term', () => {
  const actual = jest.requireActual('../term');
  return { ...actual, inSessionTermFor: () => ({ code: '1266', label: 'Fall 2026' }) };
});
const mockMapModal = jest.fn();
jest.mock('../components/ScheduleMapModal', () => (props) => { mockMapModal(props); return null; });

import Home from '../Home';
import { toggleSavedEvent } from '../saved-events';

// Meets every day, so the test passes whatever day it runs.
const SECTION = {
  subject: 'COMP', catalog_number: '271', class_number: 2841,
  title: 'Object-Oriented Programming', building: 'Cuneo Hall', instructor: 'Ada Lovelace',
  meeting_days: 'MoTuWeThFrSaSu', meeting_time_start: '10:25AM', meeting_time_end: '11:15AM',
};
const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// An event today at 7 PM local, saved the way EventsScreen saves it.
const saveEventToday = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 0, 0).toISOString();
  return toggleSavedEvent(AsyncStorage, 'u1', {
    id: 7, instanceKey: `7|${start}`, title: 'Jazz Night', start, end: null, allDay: false,
    location: 'Damen Student Center', url: 'https://events.luc.edu/event/jazz',
  });
};

let openSpy;
beforeEach(async () => {
  await AsyncStorage.clear();
  mockNavigate.mockClear();
  mockMapModal.mockClear();
  mockData.fetchSchedule.mockReset().mockResolvedValue({ section_ids: [2841] });
  mockData.getSectionsByClassNumbers.mockReset().mockResolvedValue([SECTION]);
  mockData.fetchBuildings.mockReset().mockResolvedValue([]);
  mockLibrary.mockReset().mockResolvedValue({
    locations: [
      { id: 1, name: 'Information Commons', hours: [{ from: '8am', to: '10pm' }], status: 'open' },
      { id: 2, name: 'Research Help Desk', hours: [{ from: '9am', to: '5pm' }], status: 'open' },
    ],
  });
  openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});
afterEach(() => openSpy.mockRestore());

describe("today's classes", () => {
  test('a saved event for today sits in the timeline with the classes', async () => {
    await saveEventToday();
    await render(<Home />);

    expect(await screen.findByText('COMP 271')).toBeTruthy();
    expect(await screen.findByText('Jazz Night')).toBeTruthy();
    expect(screen.getByText('Campus event')).toBeTruthy();
    expect(screen.getByText('7:00PM')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Campus event: Jazz Night' }));
    expect(openSpy).toHaveBeenCalledWith('https://events.luc.edu/event/jazz');
  });

  test('with no schedule, a saved event shows instead of the empty message', async () => {
    mockData.fetchSchedule.mockResolvedValue({ section_ids: [] });
    await saveEventToday();
    await render(<Home />);

    expect(await screen.findByText('Jazz Night')).toBeTruthy();
    expect(screen.queryByText('Build your schedule')).toBeNull();
  });

  test('nothing saved: the card is as before, and there is no Map button', async () => {
    mockData.fetchSchedule.mockResolvedValue({ section_ids: [] });
    await render(<Home />);

    expect(await screen.findByText('Build your schedule')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Map of your day' })).toBeNull();
  });
});

describe('map of your day', () => {
  test("Map opens the day map on today, with today's classes and saved events", async () => {
    await saveEventToday();
    await render(<Home />);
    await screen.findByText('Jazz Night');
    await screen.findByText('COMP 271');
    expect(mockMapModal.mock.calls.at(-1)[0].visible).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Map of your day' }));
    const props = mockMapModal.mock.calls.at(-1)[0];
    expect(props.visible).toBe(true);
    expect(props.fixedDay).toBe(DAY_CODES[new Date().getDay()]);
    expect(props.sections).toEqual([SECTION]);
    expect(props.events.map((e) => e.title)).toEqual(['Jazz Night']);
  });
});

describe('library card', () => {
  test('a bookable location links straight to its LibCal room picker', async () => {
    await render(<Home />);

    const book = await screen.findByRole('link', { name: 'Book a study room at Information Commons' });
    expect(screen.queryByRole('link', { name: 'Book a study room at Research Help Desk' })).toBeNull();

    await fireEvent.press(book);
    expect(openSpy).toHaveBeenCalledWith('https://libcal.luc.edu/spaces?lid=10019');
  });

  test('the footer goes to the Library page', async () => {
    await render(<Home />);
    await screen.findByText('Information Commons');

    await fireEvent.press(screen.getByText('Hours & room booking'));
    expect(mockNavigate).toHaveBeenCalledWith('More', { screen: 'Library' });
  });
});
