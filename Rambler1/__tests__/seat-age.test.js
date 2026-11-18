// seat-age.test.js — how old a seat count is, in words.
import { seatAge, newestReadAt, STALE_AFTER_HOURS } from '../seat-age';

// Local-time dates, so the test reads the same in any timezone.
const NOW = new Date(2026, 10, 18, 15, 30);
const iso = (...a) => new Date(...a).toISOString();

test('read today', () => {
  expect(seatAge(iso(2026, 10, 18, 10, 42), NOW)).toEqual({ label: 'Seats as of 10:42 AM today', stale: false });
});

test('read yesterday', () => {
  expect(seatAge(iso(2026, 10, 17, 16, 5), NOW)).toEqual({ label: 'Seats as of yesterday, 4:05 PM', stale: false });
});

test(`older than ${STALE_AFTER_HOURS} hours is stale and shows the date`, () => {
  expect(seatAge(iso(2026, 10, 15, 16, 0), NOW)).toEqual({ label: 'Seats as of Nov 15', stale: true });
});

test('yesterday morning is stale once it passes the cutoff', () => {
  expect(seatAge(iso(2026, 10, 17, 3, 0), NOW).stale).toBe(true);
});

test('missing or unreadable times give nothing to show', () => {
  expect(seatAge(null, NOW)).toBeNull();
  expect(seatAge('', NOW)).toBeNull();
  expect(seatAge('not a date', NOW)).toBeNull();
});

test('newestReadAt picks the latest read among sections', () => {
  expect(newestReadAt([
    { enrollment_read_at: iso(2026, 10, 15, 16, 0) },
    { enrollment_read_at: null },
    { enrollment_read_at: iso(2026, 10, 18, 10, 42) },
  ])).toBe(iso(2026, 10, 18, 10, 42));
  expect(newestReadAt([{}, { enrollment_read_at: null }])).toBeNull();
  expect(newestReadAt(null)).toBeNull();
});
