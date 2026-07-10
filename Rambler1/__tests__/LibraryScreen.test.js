// LibraryScreen.test.js — render tests with campus-api mocked.
// RNTL v14: render() is ASYNC — always `await render(...)`.
// `virtual: true` lets these tests run even before campus-api.js lands.
import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockGetLibraryHours = jest.fn();
const mockGetLibraryHoursWeekly = jest.fn();
jest.mock(
  '../campus-api',
  () => ({
    getLibraryHours: (...args) => mockGetLibraryHours(...args),
    getLibraryHoursWeekly: (...args) => mockGetLibraryHoursWeekly(...args),
  }),
  { virtual: true }
);

import LibraryScreen from '../screens/LibraryScreen';

const TODAY_FIXTURE = {
  date: '2026-07-06',
  locations: [
    {
      id: 4247,
      name: 'Cudahy Library',
      category: 'library',
      url: 'https://libcal.luc.edu',
      hours: [{ from: '8am', to: '10pm' }],
      status: 'open',
      currentlyOpen: true,
      note: null,
    },
    {
      id: 4248,
      name: 'Lewis Library',
      category: 'library',
      url: null,
      hours: [],
      status: 'closed',
      currentlyOpen: false,
      note: null,
    },
  ],
};

const WEEKLY_FIXTURE = {
  locations: [
    {
      lid: 4247,
      name: 'Cudahy Library',
      weeks: [
        {
          Monday: { date: '2026-07-06', rendered: '8am – 10pm' },
          Tuesday: { date: '2026-07-07', rendered: '8am – 10pm' },
          Wednesday: { date: '2026-07-08', rendered: '8am – 10pm' },
          Thursday: { date: '2026-07-09', rendered: '8am – 10pm' },
          Friday: { date: '2026-07-10', rendered: '8am – 5pm' },
          Saturday: { date: '2026-07-11', rendered: 'Closed' },
          Sunday: { date: '2026-07-12', rendered: 'Noon – 8pm' },
        },
      ],
    },
  ],
};

beforeEach(() => {
  mockGetLibraryHours.mockReset();
  mockGetLibraryHoursWeekly.mockReset();
});

describe('LibraryScreen', () => {
  test('renders today cards with open/closed status and the weekly grid', async () => {
    mockGetLibraryHours.mockResolvedValue(TODAY_FIXTURE);
    mockGetLibraryHoursWeekly.mockResolvedValue(WEEKLY_FIXTURE);

    await render(<LibraryScreen />);

    // Today section
    expect(await screen.findByText('Today')).toBeTruthy();
    expect(screen.getAllByText('Cudahy Library').length).toBeGreaterThan(0);
    // Also appears in the F-Q8 booking section, so expect >= 1 not exactly 1.
    expect(screen.getAllByText('Lewis Library').length).toBeGreaterThan(0);
    // Appears on the today card and again in the weekly grid rows
    expect(screen.getAllByText('8am – 10pm').length).toBeGreaterThan(0);
    expect(screen.getByText('Open')).toBeTruthy();
    // Lewis is closed: pill + hours line both say Closed, plus Saturday in the grid
    expect(screen.getAllByText('Closed').length).toBeGreaterThanOrEqual(2);

    // Study-room booking section (F-Q8): static deep-link rows
    expect(screen.getByText('Book a study room')).toBeTruthy();
    expect(screen.getByText('Information Commons')).toBeTruthy();
    expect(screen.getByText('Schreiber Center')).toBeTruthy();

    // Weekly section
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
    expect(screen.getByText('Noon – 8pm')).toBeTruthy();
  });

  test('shows the unavailable state when the api returns null', async () => {
    mockGetLibraryHours.mockResolvedValue(null);
    mockGetLibraryHoursWeekly.mockResolvedValue(null);

    await render(<LibraryScreen />);

    expect(await screen.findByText('Hours unavailable right now')).toBeTruthy();
    expect(screen.getByText('Pull down to try again.')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
  });
});
