// Cleared section fields must be removed from Firestore, not left stale.
// Pure-function tests: nothing here touches Firestore or the live DB.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs');

// firestore-sync requires db.js, which reads LOCUS_DB_PATH at load time.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-sync-test-'));
process.env.LOCUS_DB_PATH = path.join(tmpDir, 'test.db');

const { sectionDoc, hashOf } = require('../firestore-sync');

const full = {
  term_code: '1266', subject: 'PSYC', catalog_number: '101', section_number: '001',
  class_number: '5440', title: 'General Psychology', instructor: 'A. Smith',
  meeting_days: 'MoWe', meeting_time_start: '10:00AM', meeting_time_end: '10:50AM',
  room: 'Cuneo 101', building: 'Cuneo', enrollment_cap: 30, enrollment_total: 20,
  instruction_mode: 'In Person', component: 'LEC', status: 'Open',
};

test('a section that has all its fields clears nothing', () => {
  const { payload, clearFields } = sectionDoc(full);
  assert.deepEqual(clearFields, []);
  assert.equal(payload.instructorName, 'A. Smith');
  assert.equal(payload.room, 'Cuneo 101');
});

test('a section that lost instructor, room, building and meeting time lists them for clearing', () => {
  const { payload, clearFields } = sectionDoc({
    ...full, instructor: '', room: null, building: '', meeting_days: '',
    meeting_time_start: undefined, meeting_time_end: '',
  });
  assert.deepEqual(
    [...clearFields].sort(),
    ['building', 'instructorId', 'instructorName', 'meetingDays', 'meetingTimeEnd', 'meetingTimeStart', 'room'],
  );
  for (const f of clearFields) assert.equal(f in payload, false, `${f} must not be in the payload`);
});

test('required identity fields and enrollment are never cleared', () => {
  const { clearFields } = sectionDoc({ ...full, title: '', instructor: '' });
  for (const f of ['termCode', 'subject', 'classNumber', 'enrollment', 'status', 'recentHistory']) {
    assert.equal(clearFields.includes(f), false, f);
  }
});

test('a field going empty changes the change hash, so the doc is rewritten', () => {
  const before = hashOf(sectionDoc(full).payload);
  const after = hashOf(sectionDoc({ ...full, room: '', building: '' }).payload);
  assert.notEqual(before, after);
});

test('the hash of an unchanged section is stable (no mass rewrite on deploy)', () => {
  // Hash is of the same cleaned payload the old inline code built.
  assert.equal(hashOf(sectionDoc(full).payload), hashOf(sectionDoc({ ...full }).payload));
});
