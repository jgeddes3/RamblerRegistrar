// Enrollment history must only record numbers that were actually read, and an
// enrollment read must land on the section it belongs to.
// Run: npm test (from backend/)
//
// - When a section's enrollment read fails, its previous numbers are kept
//   (enrollment-preserve.test.js). Those kept numbers were then snapshotted
//   into enrollment_history with today's date, as if they were fresh.
// - The detail page for a section was opened by its POSITION in the scraped
//   list, while LOCUS numbers its rows by DOM index. If the two ever differ,
//   one section gets another section's seat counts.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Point db.js at a throwaway file BEFORE it is required; never touch locus.db.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-db-fresh-'));
process.env.LOCUS_DB_PATH = path.join(tmpDir, 'test.db');

const db = require('../db');
const { enrollmentRowIndex, sameClassNumber, freshEnrollmentClassNumbers } = require('../scraper-puppeteer');

const TERM = '9998';
const section = (overrides) => ({
  subject: 'PSYC', catalog_number: '101', section_number: '001',
  class_number: '5440', title: 'General Psychology', instructor: 'A. Smith',
  ...overrides,
});

before(async () => {
  await db.initDb();
});

after(() => {
  try { db.close(); } catch (e) { /* already closed */ }
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('snapshotEnrollment records only the sections whose numbers were read this run', () => {
  db.insertSection(TERM, section({ class_number: '1001', enrollment_cap: 30, enrollment_total: 12, waitlist_cap: 0, waitlist_total: 0 }));
  db.insertSection(TERM, section({ class_number: '1002', section_number: '002', enrollment_cap: 25, enrollment_total: 25, waitlist_cap: 5, waitlist_total: 2 }));

  const count = db.snapshotEnrollment(TERM, new Set(['1001']));

  assert.equal(count, 1);
  const history = db.getRecentHistoryByClass(TERM);
  assert.equal(history['1001'].length, 1);
  assert.equal(history['1002'], undefined);
});

test('snapshotEnrollment with no fresh reads records nothing', () => {
  assert.equal(db.snapshotEnrollment(TERM, new Set()), 0);
});

test('freshEnrollmentClassNumbers keeps sections that carry a real read, including a real 0', () => {
  const fresh = freshEnrollmentClassNumbers([
    section({ class_number: '1', enrollment_cap: 30, enrollment_total: 4 }),
    section({ class_number: '2', enrollment_cap: 0, enrollment_total: 0 }),
    section({ class_number: '3' }), // read failed: no enrollment fields
    section({ class_number: '4', enrollment_cap: null }),
  ]);
  assert.deepEqual([...fresh].sort(), ['1', '2']);
});

test('enrollmentRowIndex uses the row LOCUS gave the section, not its list position', () => {
  assert.equal(enrollmentRowIndex({ row_index: 7 }, 3), 7);
  assert.equal(enrollmentRowIndex({ row_index: 0 }, 3), 0);
});

test('enrollmentRowIndex falls back to the list position when no row was recorded', () => {
  assert.equal(enrollmentRowIndex({}, 3), 3);
  assert.equal(enrollmentRowIndex({ row_index: 'x' }, 3), 3);
});

test('sameClassNumber compares the link text with the section, ignoring whitespace', () => {
  assert.equal(sameClassNumber(' 5440\n', '5440'), true);
  assert.equal(sameClassNumber('5441', '5440'), false);
  assert.equal(sameClassNumber('', '5440'), false);
  assert.equal(sameClassNumber(null, '5440'), false);
});
