// Zero-seat bug regression tests. Run: npm test (from backend/)
//
// When LOCUS drops the scraper's session partway through a big subject, every
// remaining section's enrollment read fails. Those sections used to be saved
// as 0 enrolled / 0 seats, overwriting the last good numbers (and flowing into
// enrollment_history and Firestore). A failed read must now leave the
// section's previous numbers alone.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Point db.js at a throwaway file BEFORE it is required; never touch locus.db.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-db-test-'));
process.env.LOCUS_DB_PATH = path.join(tmpDir, 'test.db');

const db = require('../db');
const { parseEnrollmentFields } = require('../scraper-puppeteer');

const TERM = '9999';

function section(overrides) {
  return {
    subject: 'PSYC', catalog_number: '101', section_number: '001',
    class_number: '5440', title: 'General Psychology', instructor: 'A. Smith',
    ...overrides,
  };
}

function row(classNumber) {
  return db.getAllSections(TERM).find((s) => String(s.class_number) === classNumber);
}

before(async () => {
  await db.initDb();
});

after(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a section scraped without enrollment numbers keeps its previous numbers', () => {
  db.insertSection(TERM, section({ enrollment_cap: 30, enrollment_total: 29, waitlist_cap: 5, waitlist_total: 2 }));
  db.insertSection(TERM, section({ instructor: 'B. Jones' })); // failed read: no enrollment fields

  const r = row('5440');
  assert.equal(r.enrollment_cap, 30);
  assert.equal(r.enrollment_total, 29);
  assert.equal(r.waitlist_cap, 5);
  assert.equal(r.waitlist_total, 2);
  assert.equal(r.instructor, 'B. Jones', 'non-enrollment fields still update');
});

test('a successful read of 0 seats is saved as 0', () => {
  db.insertSection(TERM, section({ class_number: '7001', enrollment_cap: 40, enrollment_total: 12 }));
  db.insertSection(TERM, section({ class_number: '7001', enrollment_cap: 0, enrollment_total: 0, waitlist_cap: 0, waitlist_total: 0 }));

  const r = row('7001');
  assert.equal(r.enrollment_cap, 0);
  assert.equal(r.enrollment_total, 0);
});

test('a brand-new section with no enrollment read defaults to 0', () => {
  db.insertSection(TERM, section({ class_number: '7002' }));

  const r = row('7002');
  assert.equal(r.enrollment_cap, 0);
  assert.equal(r.enrollment_total, 0);
});

test('parseEnrollmentFields: fields missing from the page means the read failed', () => {
  assert.equal(parseEnrollmentFields({ cap: null, total: null, waitCap: null, waitTotal: null }), null);
  assert.equal(parseEnrollmentFields({ cap: '30', total: null, waitCap: '0', waitTotal: '0' }), null);
  assert.equal(parseEnrollmentFields({ cap: '', total: '29', waitCap: '0', waitTotal: '0' }), null);
});

test('parseEnrollmentFields: real numbers, including 0, are returned', () => {
  assert.deepEqual(
    parseEnrollmentFields({ cap: ' 30 ', total: '29', waitCap: '5', waitTotal: '2' }),
    { enrollment_cap: 30, enrollment_total: 29, waitlist_cap: 5, waitlist_total: 2 },
  );
  assert.deepEqual(
    parseEnrollmentFields({ cap: '0', total: '0', waitCap: null, waitTotal: null }),
    { enrollment_cap: 0, enrollment_total: 0, waitlist_cap: 0, waitlist_total: 0 },
  );
});
