// saved-events.js — campus events the user added to their day.
// No react, no firebase: storage (AsyncStorage) is passed in.
//
// Kept on the phone only, under one key with the account's uid inside (the
// pendingSignupSave pattern): another account on the same phone starts empty,
// and deleting the account removes it (ProfileScreen's LOCAL_ACCOUNT_KEYS).
// Home merges today's saved events into "Today's classes".

export const SAVED_EVENTS_KEY = '@rambler_saved_events';

const owner = (uid) => uid || 'guest';

const startOf = (ev) => {
  if (!ev || !ev.start) return null;
  const d = new Date(ev.start);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sameLocalDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const minutesOf = (d) => d.getHours() * 60 + d.getMinutes();

// Localist returns one entry per instance of a recurring event, so the
// instance (id + start) is what gets saved, not the event.
export function savedEventKey(ev) {
  return ev.key ?? ev.instanceKey ?? `${ev.id ?? ''}|${ev.start ?? ''}`;
}

// An event with no start can't be placed on a day.
export function canSaveEvent(ev) {
  return startOf(ev) !== null;
}

// Only what Home needs to draw the row.
export function toSavedEvent(ev) {
  return {
    key: savedEventKey(ev),
    title: ev.title || 'Untitled event',
    start: ev.start,
    end: ev.end || null,
    allDay: !!ev.allDay,
    location: ev.location || null,
    url: ev.url || null,
  };
}

// Events from before today are done: drop them so the list can't grow forever.
export function pruneSavedEvents(events, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return (events || []).filter((ev) => {
    const start = startOf(ev);
    return start !== null && start.getTime() >= today;
  });
}

// This account's saved events, or [] (none, another account's, or unreadable).
export async function loadSavedEvents(storage, uid, now = new Date()) {
  try {
    const raw = await storage.getItem(SAVED_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.uid !== owner(uid) || !Array.isArray(parsed.events)) return [];
    return pruneSavedEvents(parsed.events, now);
  } catch (e) {
    return [];
  }
}

// Writes run one at a time: a toggle reads the list, changes it and writes it
// back, so two quick taps would otherwise each write their own copy.
let queue = Promise.resolve();
const inQueue = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.then(() => {}, () => {});
  return run;
};

// Add the event, or remove it if it's already saved.
// Resolves { saved, events }: whether it is saved now, and the new list.
export function toggleSavedEvent(storage, uid, ev, now = new Date()) {
  return inQueue(async () => {
    const current = await loadSavedEvents(storage, uid, now);
    const key = savedEventKey(ev);
    const had = current.some((e) => e.key === key);
    const events = had ? current.filter((e) => e.key !== key) : [...current, toSavedEvent(ev)];
    await storage.setItem(SAVED_EVENTS_KEY, JSON.stringify({ uid: owner(uid), events }));
    return { saved: !had, events };
  });
}

// Rows for the saved events that start on `now`'s local date, shaped like
// Home's class rows: { kind: 'event', key, allDay, startMin, endMin, title,
// location, url }. All-day events have no startMin. endMin is null when the
// event has no end, or ends on another day.
export function savedEventRowsForDay(events, now) {
  const rows = [];
  for (const ev of events || []) {
    const start = startOf(ev);
    if (!start || !sameLocalDay(start, now)) continue;
    const end = ev.end ? new Date(ev.end) : null;
    const endSameDay = end && !Number.isNaN(end.getTime()) && sameLocalDay(end, now) && end > start;
    rows.push({
      kind: 'event',
      key: `event:${ev.key}`,
      allDay: !!ev.allDay,
      startMin: ev.allDay ? null : minutesOf(start),
      endMin: !ev.allDay && endSameDay ? minutesOf(end) : null,
      title: ev.title || 'Untitled event',
      location: ev.location || '',
      url: ev.url || null,
    });
  }
  return rows;
}
