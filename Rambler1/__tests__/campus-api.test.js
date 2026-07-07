// Tests for the pure parsers in campus-api.js.
// Fixtures below are trimmed REAL responses captured from the live APIs
// (api3.libcal.com iid=3076 and events.luc.edu/api/2/events) on 2026-07-06.
// No network access in these tests.

import {
  parseLibraryHours,
  parseLibraryHoursWeekly,
  parseEvents,
} from '../campus-api';

// ---------------------------------------------------------------------------
// REAL fixture: api_hours_today.php?iid=3076&lid=0&format=json&systemTime=0
// ---------------------------------------------------------------------------
const LIBCAL_TODAY_FIXTURE = {
  locations: [
    {
      lid: 735,
      name: 'Information Commons',
      category: 'library',
      desc: '',
      url: 'http://luc.edu/ic/',
      contact: '',
      lat: '',
      long: '',
      color: '#000000',
      fn: '',
      day: 'Monday',
      times: {
        status: 'open',
        hours: [{ from: '8am', to: '10pm' }],
        currently_open: true,
      },
      rendered: '8am - 10pm',
    },
    {
      lid: 737,
      name: 'Research Help Desk Hours',
      category: 'department',
      desc: '',
      url: 'http://libraries.luc.edu/ask',
      contact: '',
      lat: '',
      long: '',
      color: '#000000',
      parent_lid: 735,
      day: 'Monday',
      times: {
        status: 'open',
        hours: [{ from: '9am', to: '6pm' }],
        currently_open: true,
      },
      rendered: '9am - 6pm',
    },
    {
      lid: 734,
      name: 'Cudahy Library',
      category: 'library',
      desc: '',
      url: 'http://libraries.luc.edu/cudahy',
      contact: '',
      lat: '',
      long: '',
      color: '#000000',
      fn: '',
      day: 'Monday',
      times: {
        status: 'open',
        hours: [{ from: '8am', to: '10pm' }],
        currently_open: true,
      },
      rendered: '8am - 10pm',
    },
  ],
};

// ---------------------------------------------------------------------------
// REAL fixture: api_hours_grid.php?iid=3076&format=json&weeks=1&systemTime=0
// (one location, full week — closed Sunday is real data)
// ---------------------------------------------------------------------------
const LIBCAL_WEEKLY_FIXTURE = {
  locations: [
    {
      lid: 735,
      name: 'Information Commons',
      category: 'library',
      desc: '',
      url: 'http://luc.edu/ic/',
      contact: '',
      lat: '',
      long: '',
      color: '#000000',
      fn: '',
      weeks: [
        {
          Sunday: {
            date: '2026-07-05',
            times: { status: 'closed', currently_open: false },
            rendered: 'Closed',
          },
          Monday: {
            date: '2026-07-06',
            times: {
              status: 'open',
              hours: [{ from: '8am', to: '10pm' }],
              currently_open: true,
            },
            rendered: '8am - 10pm',
          },
          Tuesday: {
            date: '2026-07-07',
            times: {
              status: 'open',
              hours: [{ from: '8am', to: '10pm' }],
              currently_open: false,
            },
            rendered: '8am - 10pm',
          },
          Saturday: {
            date: '2026-07-11',
            times: {
              status: 'open',
              hours: [{ from: '12pm', to: '5pm' }],
              currently_open: false,
            },
            rendered: '12pm - 5pm',
          },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// REAL fixture: events.luc.edu/api/2/events?days=7&pp=50 (trimmed to 2 events)
// ---------------------------------------------------------------------------
const EVENTS_FIXTURE = {
  events: [
    {
      event: {
        id: 52930267255917,
        title: 'Transfer Orientation Session',
        url: 'https://www.luc.edu/orientation/',
        location: '',
        location_name: 'Lake Shore Campus',
        address: '1032 W. Sheridan Road Chicago, IL 60660',
        description_text:
          'The entire Loyola community is excited to welcome you to campus for Loyola University Chicago Orientation!',
        localist_url:
          'https://events.luc.edu/event/copy-of-first-year-orientation-session-for-commuter-students-2045',
        photo_url:
          'https://localist-images.azureedge.net/photos/52930267210860/huge/895ecf8461a54c8c3e8e29b89f63a82e8e8380ca.jpg',
        tags: [],
        filters: {
          event_audiences: [
            { name: 'Current Students', id: 51826050355332 },
            { name: 'Family & Friends', id: 51826050364553 },
            { name: 'Prospective Students', id: 51826050365578 },
          ],
          event_types: [{ name: 'Orientation', id: 51825946953356 }],
        },
        event_instances: [
          {
            event_instance: {
              id: 52930271058056,
              event_id: 52930267255917,
              start: '2026-07-06T00:00:00-05:00',
              end: null,
              ranking: 0.28,
              all_day: true,
              num_attending: 0,
            },
          },
        ],
      },
    },
    {
      event: {
        id: 52930267255918,
        title: 'Farmers Market',
        url: null,
        location: 'East Quad',
        location_name: '',
        address: null,
        description_text: 'A'.repeat(500), // long description -> should be truncated to 300
        localist_url: null,
        photo_url: null,
        tags: ['market', 'food'],
        filters: {},
        event_instances: [
          {
            event_instance: {
              id: 52930271058057,
              event_id: 52930267255918,
              start: '2026-07-07T10:00:00-05:00',
              end: '2026-07-07T14:00:00-05:00',
              ranking: 0,
              all_day: false,
              num_attending: 3,
            },
          },
        ],
      },
    },
  ],
  page: { current: 1, size: 50, total: 1 },
  date: { first: '2026-07-06', last: '2026-07-12' },
};

// ---------------------------------------------------------------------------
// parseLibraryHours
// ---------------------------------------------------------------------------
describe('parseLibraryHours', () => {
  test('shapes real payload into { date, locations }', () => {
    const result = parseLibraryHours(LIBCAL_TODAY_FIXTURE);

    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.locations).toHaveLength(3);
    expect(result.locations[0]).toEqual({
      id: 735,
      name: 'Information Commons',
      category: 'library',
      url: 'http://luc.edu/ic/',
      hours: [{ from: '8am', to: '10pm' }],
      status: 'open',
      currentlyOpen: true,
      note: null,
    });
    expect(result.locations[1].category).toBe('department');
  });

  test('handles missing times / fields gracefully', () => {
    const result = parseLibraryHours({
      locations: [{ lid: 1, name: 'Mystery Room' }],
    });
    expect(result.locations[0]).toEqual({
      id: 1,
      name: 'Mystery Room',
      category: undefined,
      url: undefined,
      hours: [],
      status: 'unknown',
      currentlyOpen: false,
      note: null,
    });
  });

  test('empty / malformed payloads give empty locations', () => {
    expect(parseLibraryHours({}).locations).toEqual([]);
    expect(parseLibraryHours(null).locations).toEqual([]);
    expect(parseLibraryHours({ locations: [] }).locations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseLibraryHoursWeekly
// ---------------------------------------------------------------------------
describe('parseLibraryHoursWeekly', () => {
  test('preserves raw grid shape from real payload', () => {
    const result = parseLibraryHoursWeekly(LIBCAL_WEEKLY_FIXTURE);

    expect(result.locations).toHaveLength(1);
    const loc = result.locations[0];
    expect(loc.lid).toBe(735);
    expect(loc.name).toBe('Information Commons');
    expect(loc.weeks[0].Sunday.times.status).toBe('closed');
    expect(loc.weeks[0].Monday.times.hours).toEqual([{ from: '8am', to: '10pm' }]);
    expect(loc.weeks[0].Saturday.rendered).toBe('12pm - 5pm');
  });

  test('empty / malformed payloads give empty locations', () => {
    expect(parseLibraryHoursWeekly({})).toEqual({ locations: [] });
    expect(parseLibraryHoursWeekly(null)).toEqual({ locations: [] });
    expect(parseLibraryHoursWeekly(undefined)).toEqual({ locations: [] });
  });
});

// ---------------------------------------------------------------------------
// parseEvents
// ---------------------------------------------------------------------------
describe('parseEvents', () => {
  test('shapes real payload into event array', () => {
    const events = parseEvents(EVENTS_FIXTURE);

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      id: 52930267255917,
      title: 'Transfer Orientation Session',
      description:
        'The entire Loyola community is excited to welcome you to campus for Loyola University Chicago Orientation!',
      location: 'Lake Shore Campus',
      address: '1032 W. Sheridan Road Chicago, IL 60660',
      url: 'https://events.luc.edu/event/copy-of-first-year-orientation-session-for-commuter-students-2045',
      start: '2026-07-06T00:00:00-05:00',
      end: null,
      allDay: true,
      image:
        'https://localist-images.azureedge.net/photos/52930267210860/huge/895ecf8461a54c8c3e8e29b89f63a82e8e8380ca.jpg',
      tags: [],
      filters: EVENTS_FIXTURE.events[0].event.filters,
    });
  });

  test('falls back location_name -> location and localist_url -> url; truncates description to 300', () => {
    const e = parseEvents(EVENTS_FIXTURE)[1];
    expect(e.location).toBe('East Quad'); // location_name empty -> falls back to location
    expect(e.url).toBeNull(); // both localist_url and url are null
    expect(e.description).toHaveLength(300);
    expect(e.image).toBeNull();
    expect(e.allDay).toBe(false);
    expect(e.end).toBe('2026-07-07T14:00:00-05:00');
    expect(e.tags).toEqual(['market', 'food']);
  });

  test('handles event with missing instances and fields', () => {
    const events = parseEvents({
      events: [{ event: { id: 1, title: 'Bare Event' } }],
    });
    expect(events[0]).toEqual({
      id: 1,
      title: 'Bare Event',
      description: null,
      location: null,
      address: null,
      url: null,
      start: null,
      end: null,
      allDay: false,
      image: null,
      tags: [],
      filters: {},
    });
  });

  test('empty / malformed payloads give empty array', () => {
    expect(parseEvents({})).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
    expect(parseEvents({ events: [] })).toEqual([]);
    expect(parseEvents({ events: [{}] })[0].id).toBeUndefined();
  });
});
