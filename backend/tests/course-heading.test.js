// LOCUS moved the course heading out of each section's group (2026-11). The
// scraper kept finding sections but none had a course number, so the app could
// not look any of them up. These cover reading a heading and refusing to save
// a subject that came back without course numbers.
// Fakes only: no Chrome, no LOCUS, throwaway db path.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.LOCUS_DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-heading-')), 'test.db');
const { LocusPuppeteerScraper, parseCourseHeading, lacksCourseNumbers } = require('../scraper-puppeteer');

test('a heading gives the course number and title', () => {
  assert.deepEqual(parseCourseHeading('COMP  122 - Introduction to Digital Music'), {
    catalog_number: '122',
    title: 'Introduction to Digital Music',
  });
  assert.deepEqual(parseCourseHeading('MATH 162A - Calculus II Workshop'), {
    catalog_number: '162A',
    title: 'Calculus II Workshop',
  });
});

test('text with no heading gives empty strings, not a guess', () => {
  const sectionOnly = 'Class\nSection\nCampus\nMeeting Dates\n3119\n001-LEC\nRegular\nLSC\n01/19/2027 - 05/08/2027\nTuTh 1:00PM - 2:15PM\nDumbach Hall - Room 234';
  assert.deepEqual(parseCourseHeading(sectionOnly), { catalog_number: '', title: '' });
  assert.deepEqual(parseCourseHeading(''), { catalog_number: '', title: '' });
  assert.deepEqual(parseCourseHeading(null), { catalog_number: '', title: '' });
});

test('extractSections takes each section\'s course from the heading the page found for it', async () => {
  const s = new LocusPuppeteerScraper();
  s.page = {
    // What the in-page pass returns: one row per section with its heading text.
    evaluate: async () => [
      { row_index: 0, subject: 'COMP', heading: 'COMP 122 - Introduction to Digital Music', class_number: '3119', section_number: '001', days_times: 'TuTh 1:00PM - 2:15PM', room: 'Dumbach Hall - Room 234', dates: '01/19/2027 - 05/08/2027' },
      { row_index: 1, subject: 'COMP', heading: '', class_number: '3382', section_number: '002', days_times: '', room: '', dates: '' },
    ],
  };
  const rows = await s.extractSections('COMP');
  assert.equal(rows[0].catalog_number, '122');
  assert.equal(rows[0].title, 'Introduction to Digital Music');
  assert.equal(rows[0].building, 'Dumbach Hall');
  assert.equal(rows[1].catalog_number, '');
  assert.ok(!('heading' in rows[0]));
});

test('a subject with sections but no course numbers is flagged; anything else is not', () => {
  assert.equal(lacksCourseNumbers([{ catalog_number: '' }, { catalog_number: '' }]), true);
  assert.equal(lacksCourseNumbers([{ catalog_number: '122' }, { catalog_number: '' }]), false);
  assert.equal(lacksCourseNumbers([]), false);
});
