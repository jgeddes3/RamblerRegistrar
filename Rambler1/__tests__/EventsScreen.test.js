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

import EventsScreen from '../screens/EventsScreen';

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

beforeEach(() => {
  mockGetEvents.mockReset();
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
});
