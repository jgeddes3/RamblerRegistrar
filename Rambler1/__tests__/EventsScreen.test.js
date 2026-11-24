// EventsScreen.test.js — render tests with campus-api mocked.
// RNTL v14: render() is ASYNC — always `await render(...)`.
// `virtual: true` lets these tests run even before campus-api.js lands.
import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockGetEvents = jest.fn();
jest.mock(
  '../campus-api',
  () => ({
    getEvents: (...args) => mockGetEvents(...args),
  }),
  { virtual: true }
);
jest.mock('../AppContext', () => ({ useAppContext: () => ({ user: { uid: 'u1' } }) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import EventsScreen from '../screens/EventsScreen';
import { ToastProvider, ToastHost } from '../components/ui/Toast';
import { loadSavedEvents } from '../saved-events';

const EVENTS_FIXTURE = [
  {
    id: 101,
    title: 'Welcome Week Kickoff',
    description: 'Kick off the semester on the quad.',
    location: 'Damen Student Center',
    address: '6511 N Sheridan Rd',
    url: 'https://events.luc.edu/event/welcome-week',
    start: '2026-07-10T15:00:00-05:00',
    end: '2026-07-10T17:00:00-05:00',
    allDay: false,
    image: null,
    tags: [],
    filters: {},
  },
  {
    id: 102,
    title: 'All-Day Art Exhibit',
    description: null,
    location: 'Loyola University Museum of Art',
    address: null,
    url: null, // no link — card must not try to open anything
    start: '2026-07-08T00:00:00-05:00',
    end: null,
    allDay: true,
    image: null,
    tags: [],
    filters: {},
  },
];

beforeEach(async () => {
  mockGetEvents.mockReset();
  await AsyncStorage.clear();
});

describe('EventsScreen', () => {
  test('renders event cards and opens the url on tap', async () => {
    mockGetEvents.mockResolvedValue(EVENTS_FIXTURE);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await render(<EventsScreen />);

    expect(await screen.findByText('Welcome Week Kickoff')).toBeTruthy();
    expect(mockGetEvents).toHaveBeenCalledWith(14);
    expect(screen.getByText('All-Day Art Exhibit')).toBeTruthy();
    expect(screen.getByText('Damen Student Center')).toBeTruthy();
    expect(screen.getByText('All day')).toBeTruthy();

    await fireEvent.press(screen.getByText('Welcome Week Kickoff'));
    expect(openSpy).toHaveBeenCalledWith('https://events.luc.edu/event/welcome-week');

    // Card without a url is disabled — pressing it must not call openURL again.
    await fireEvent.press(screen.getByText('All-Day Art Exhibit'));
    expect(openSpy).toHaveBeenCalledTimes(1);

    openSpy.mockRestore();
  });

  test('shows the empty state for [] and the error state for null', async () => {
    mockGetEvents.mockResolvedValue([]);
    await render(<EventsScreen />);
    expect(await screen.findByText('No upcoming events')).toBeTruthy();

    mockGetEvents.mockResolvedValue(null);
    await render(<EventsScreen />);
    expect(await screen.findByText('Events unavailable right now')).toBeTruthy();
    expect(screen.getByText('Pull down to try again.')).toBeTruthy();
  });

  test('the add button saves an event to my day and takes it back off', async () => {
    // Tomorrow, so the saved event isn't pruned as past.
    const start = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    mockGetEvents.mockResolvedValue([
      { ...EVENTS_FIXTURE[0], instanceKey: `101|${start}`, start, end: null },
      { ...EVENTS_FIXTURE[1], id: 103, title: 'Undated Mixer', start: null, allDay: false },
    ]);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await render(<ToastProvider><EventsScreen /><ToastHost /></ToastProvider>);

    const add = await screen.findByRole('button', { name: 'Add Welcome Week Kickoff to my day' });
    // An event with no start can't be placed on a day: no button.
    expect(screen.queryByRole('button', { name: 'Add Undated Mixer to my day' })).toBeNull();

    await fireEvent.press(add);
    const remove = await screen.findByRole('button', { name: 'Remove Welcome Week Kickoff from my day' });
    expect(screen.getByText('Added to your day. It shows on Home that day.')).toBeTruthy();
    expect((await loadSavedEvents(AsyncStorage, 'u1')).map((e) => e.title)).toEqual(['Welcome Week Kickoff']);
    // Adding is its own button: it must not open the event page.
    expect(openSpy).not.toHaveBeenCalled();

    await fireEvent.press(remove);
    expect(await screen.findByRole('button', { name: 'Add Welcome Week Kickoff to my day' })).toBeTruthy();
    expect(await loadSavedEvents(AsyncStorage, 'u1')).toEqual([]);

    openSpy.mockRestore();
  });

  test('events already saved show as added when the screen opens', async () => {
    const start = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const event = { ...EVENTS_FIXTURE[0], instanceKey: `101|${start}`, start, end: null };
    await AsyncStorage.setItem('@rambler_saved_events', JSON.stringify({
      uid: 'u1', events: [{ key: event.instanceKey, title: event.title, start, end: null, allDay: false, location: null, url: null }],
    }));
    mockGetEvents.mockResolvedValue([event]);

    await render(<EventsScreen />);
    expect(await screen.findByRole('button', { name: 'Remove Welcome Week Kickoff from my day' })).toBeTruthy();
  });
});
