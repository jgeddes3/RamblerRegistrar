// home-today.test.js — pure tests for Home's exported helpers:
// buildTodayRows (today's-classes rows) and eventsForToday (campus-events
// slice). Home's component imports pull in firebase/navigation, so those
// modules are mocked; the helpers themselves never touch them.

jest.mock('../firestore-data', () => ({
  fetchSchedule: jest.fn(),
  getSectionsByClassNumbers: jest.fn(),
  fetchDegreeProgress: jest.fn(),
  fetchUserCoreProgress: jest.fn(),
}));
jest.mock('../AppContext', () => ({
  useAppContext: () => ({}),
}));
jest.mock('../campus-api', () => ({
  getLibraryHours: jest.fn(),
  getEventsToday: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

import { buildTodayRows, eventsForToday } from '../Home';

// ------------------------------------------------------------ buildTodayRows

const SECTION = {
  subject: 'COMP',
  catalog_number: '271',
  class_number: 2841,
  title: 'Object-Oriented Programming',
  building: 'Cuneo Hall',
  instructor: 'Ada Lovelace',
  meeting_days: 'MoWeFr',
  meeting_time_start: '10:25AM',
  meeting_time_end: '11:15AM',
};

describe('buildTodayRows', () => {
  test('carries class_number and instructor through to the row', () => {
    const rows = buildTodayRows([SECTION], 'We');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      code: 'COMP 271',
      title: 'Object-Oriented Programming',
      building: 'Cuneo Hall',
      classNumber: 2841,
      instructor: 'Ada Lovelace',
      startMin: 10 * 60 + 25,
      endMin: 11 * 60 + 15,
    });
  });

  test('missing instructor becomes empty string; "To be Announced" survives', () => {
    const noProf = { ...SECTION, instructor: undefined };
    expect(buildTodayRows([noProf], 'Mo')[0].instructor).toBe('');

    const tba = { ...SECTION, instructor: 'To be Announced' };
    expect(buildTodayRows([tba], 'Mo')[0].instructor).toBe('To be Announced');
  });

  test('filters to the day code and sorts by start time', () => {
    const early = {
      ...SECTION,
      class_number: 1111,
      meeting_days: 'TuTh',
      meeting_time_start: '8:30AM',
      meeting_time_end: '9:45AM',
    };
    const offDay = { ...SECTION, class_number: 2222, meeting_days: 'MoWeFr' };
    const late = {
      ...SECTION,
      class_number: 3333,
      meeting_days: 'TuTh',
      meeting_time_start: '2:30PM',
      meeting_time_end: '3:45PM',
    };
    const rows = buildTodayRows([late, offDay, early], 'Tu');
    expect(rows.map((r) => r.classNumber)).toEqual([1111, 3333]);
  });
});

// ------------------------------------------------------------ eventsForToday

// FIXED clock — never call new Date() without an argument in these tests.
const NOW = new Date('2026-07-10T12:00:00');

const ev = (overrides) => ({
  id: 1,
  instanceKey: '1|',
  title: 'Event',
  location: null,
  url: null,
  start: null,
  end: null,
  allDay: false,
  ...overrides,
});

describe('eventsForToday', () => {
  test('keeps today + all-day events, drops other days and undated rows', () => {
    const morning = ev({ id: 1, title: 'Morning', start: '2026-07-10T09:00:00' });
    const evening = ev({ id: 2, title: 'Evening', start: '2026-07-10T19:00:00' });
    const allDay = ev({ id: 3, title: 'Exhibit', start: null, allDay: true });
    const tomorrow = ev({ id: 4, title: 'Tomorrow', start: '2026-07-11T10:00:00' });
    const undated = ev({ id: 5, title: 'Undated', start: null });

    const out = eventsForToday([evening, tomorrow, allDay, undated, morning], NOW);
    expect(out.map((e) => e.id)).toEqual([1, 2, 3]); // timed ascending, all-day last
  });

  test('caps the list at 3', () => {
    const events = [10, 11, 13, 15].map((h) =>
      ev({ id: h, start: `2026-07-10T${h}:00:00` })
    );
    const out = eventsForToday(events, NOW);
    expect(out).toHaveLength(3);
    expect(out.map((e) => e.id)).toEqual([10, 11, 13]);
  });

  test('empty and missing input return an empty array', () => {
    expect(eventsForToday([], NOW)).toEqual([]);
    expect(eventsForToday(null, NOW)).toEqual([]);
  });
});
