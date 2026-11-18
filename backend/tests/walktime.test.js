// analyzeSchedule must read the columns sections actually store.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeSchedule } = require('../walktime');

const buildings = [
  { name: 'Cuneo Hall', latitude: 41.9990, longitude: -87.6580 },
  { name: 'Mundelein Center', latitude: 42.0010, longitude: -87.6600 },
];

const sec = (over) => ({
  subject: 'PSYC', catalog_number: '101', meeting_days: 'MoWe',
  meeting_time_start: '10:00AM', meeting_time_end: '10:50AM', room: 'Cuneo Hall - 101',
  ...over,
});

test('overlapping sections are found from meeting_days / meeting_time_start / meeting_time_end', () => {
  const r = analyzeSchedule([
    sec({}),
    sec({ subject: 'MATH', catalog_number: '117', meeting_time_start: '10:30AM', meeting_time_end: '11:20AM' }),
  ], buildings);
  assert.equal(r.conflicts.length, 2); // Mo and We
  assert.equal(r.conflicts[0].overlap_minutes, 20);
});

test('a tight walk between buildings is flagged using the real columns', () => {
  const r = analyzeSchedule([
    sec({}),
    sec({ subject: 'MATH', catalog_number: '117', room: 'Mundelein Center - 5',
      meeting_time_start: '10:55AM', meeting_time_end: '11:45AM' }),
  ], buildings);
  assert.ok(r.walkTimes.length > 0);
  assert.equal(r.walkTimes[0].gap, 5);
});

test('sections without meeting times are skipped, not crashed on', () => {
  const r = analyzeSchedule([sec({ meeting_time_start: '', meeting_time_end: '' })], buildings);
  assert.deepEqual(r.conflicts, []);
});
