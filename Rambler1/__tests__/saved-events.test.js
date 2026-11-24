// saved-events.test.js — the events a user added to their day: kept per
// account on the phone, pruned once past, and turned into Home rows.
import {
  SAVED_EVENTS_KEY, savedEventKey, canSaveEvent, toSavedEvent, pruneSavedEvents,
  loadSavedEvents, toggleSavedEvent, savedEventRowsForDay,
} from '../saved-events';

// FIXED clock (local time): Wed Nov 25, 2026, noon.
const NOW = new Date(2026, 10, 25, 12, 0, 0);
const at = (day, h, m = 0) => new Date(2026, 10, day, h, m, 0).toISOString();

const memoryStorage = () => {
  const data = {};
  return {
    data,
    getItem: async (k) => (k in data ? data[k] : null),
    setItem: async (k, v) => { data[k] = v; },
  };
};

const ev = (overrides) => ({
  id: 7,
  instanceKey: `7|${overrides.start ?? ''}`,
  title: 'Jazz Night',
  location: 'Damen Student Center',
  url: 'https://events.luc.edu/event/jazz',
  end: null,
  allDay: false,
  description: 'long text the row never needs',
  ...overrides,
});

describe('keys and shape', () => {
  test('the instance key identifies an event; id + start stands in without one', () => {
    expect(savedEventKey({ instanceKey: '7|x' })).toBe('7|x');
    expect(savedEventKey({ id: 7, start: 'x' })).toBe('7|x');
    expect(savedEventKey({ key: 'saved-already', instanceKey: 'ignored' })).toBe('saved-already');
  });
  test('only events with a real start can be saved', () => {
    expect(canSaveEvent(ev({ start: at(25, 19) }))).toBe(true);
    expect(canSaveEvent(ev({ start: null }))).toBe(false);
    expect(canSaveEvent(ev({ start: 'not a date' }))).toBe(false);
  });
  test('a saved event keeps only what the row needs', () => {
    const start = at(25, 19);
    expect(toSavedEvent(ev({ start }))).toEqual({
      key: `7|${start}`, title: 'Jazz Night', start, end: null, allDay: false,
      location: 'Damen Student Center', url: 'https://events.luc.edu/event/jazz',
    });
  });
});

describe('pruneSavedEvents', () => {
  test('drops events from before today, keeps today (even earlier today) and later', () => {
    const list = [
      { key: 'yesterday', start: at(24, 23, 59) },
      { key: 'this-morning', start: at(25, 8) },
      { key: 'tomorrow', start: at(26, 10) },
      { key: 'undated', start: null },
    ];
    expect(pruneSavedEvents(list, NOW).map((e) => e.key)).toEqual(['this-morning', 'tomorrow']);
  });
});

describe('storage', () => {
  test('toggle adds, then removes, and load reads it back', async () => {
    const storage = memoryStorage();
    const jazz = ev({ start: at(25, 19) });

    const added = await toggleSavedEvent(storage, 'u1', jazz, NOW);
    expect(added.saved).toBe(true);
    expect((await loadSavedEvents(storage, 'u1', NOW)).map((e) => e.title)).toEqual(['Jazz Night']);

    const removed = await toggleSavedEvent(storage, 'u1', jazz, NOW);
    expect(removed.saved).toBe(false);
    expect(await loadSavedEvents(storage, 'u1', NOW)).toEqual([]);
  });

  test('two quick toggles of different events both land', async () => {
    const storage = memoryStorage();
    await Promise.all([
      toggleSavedEvent(storage, 'u1', ev({ id: 1, instanceKey: 'a', start: at(25, 9) }), NOW),
      toggleSavedEvent(storage, 'u1', ev({ id: 2, instanceKey: 'b', start: at(25, 10) }), NOW),
    ]);
    expect((await loadSavedEvents(storage, 'u1', NOW)).map((e) => e.key)).toEqual(['a', 'b']);
  });

  test("another account on the phone doesn't see them", async () => {
    const storage = memoryStorage();
    await toggleSavedEvent(storage, 'u1', ev({ start: at(25, 19) }), NOW);
    expect(await loadSavedEvents(storage, 'u2', NOW)).toEqual([]);
    expect(await loadSavedEvents(storage, undefined, NOW)).toEqual([]);
  });

  test('past events are gone on the next load', async () => {
    const storage = memoryStorage();
    await toggleSavedEvent(storage, 'u1', ev({ start: at(25, 19) }), NOW);
    const nextDay = new Date(2026, 10, 26, 9, 0, 0);
    expect(await loadSavedEvents(storage, 'u1', nextDay)).toEqual([]);
  });

  test('unreadable or missing data reads as nothing saved', async () => {
    const storage = memoryStorage();
    expect(await loadSavedEvents(storage, 'u1', NOW)).toEqual([]);
    storage.data[SAVED_EVENTS_KEY] = '{not json';
    expect(await loadSavedEvents(storage, 'u1', NOW)).toEqual([]);
    const broken = { getItem: async () => { throw new Error('no storage'); } };
    expect(await loadSavedEvents(broken, 'u1', NOW)).toEqual([]);
  });
});

describe('savedEventRowsForDay', () => {
  test("only today's events, as rows with minutes since midnight", () => {
    const saved = [
      toSavedEvent(ev({ id: 1, instanceKey: 'today', start: at(25, 19), end: at(25, 20, 30) })),
      toSavedEvent(ev({ id: 2, instanceKey: 'tomorrow', start: at(26, 19) })),
    ];
    expect(savedEventRowsForDay(saved, NOW)).toEqual([{
      kind: 'event', key: 'event:today', allDay: false,
      startMin: 19 * 60, endMin: 20 * 60 + 30,
      title: 'Jazz Night', location: 'Damen Student Center', url: 'https://events.luc.edu/event/jazz',
    }]);
  });
  test('all-day events have no times; an end on another day is left off', () => {
    const saved = [
      toSavedEvent(ev({ instanceKey: 'fair', title: 'Org Fair', start: at(25, 0), allDay: true })),
      toSavedEvent(ev({ instanceKey: 'late', title: 'Late Show', start: at(25, 23), end: at(26, 1) })),
    ];
    const rows = savedEventRowsForDay(saved, NOW);
    expect(rows[0]).toMatchObject({ key: 'event:fair', allDay: true, startMin: null, endMin: null });
    expect(rows[1]).toMatchObject({ key: 'event:late', allDay: false, startMin: 23 * 60, endMin: null });
  });
  test('empty and missing lists give no rows', () => {
    expect(savedEventRowsForDay([], NOW)).toEqual([]);
    expect(savedEventRowsForDay(null, NOW)).toEqual([]);
  });
});
