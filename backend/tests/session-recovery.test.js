// LOCUS drops the scraper's session partway through a big subject (Nov 18:
// BIOL read 4 of 184 sections, PSYC 93 of 173, THTR 9 of 38). Every section
// after the drop used to fail its enrollment read. Now a failed read with
// the results page gone runs the subject's search again and retries that
// section, a bounded number of times per subject.
// Fakes only: no Chrome, no LOCUS, throwaway db path.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.LOCUS_DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-recovery-')), 'test.db');
const { LocusPuppeteerScraper, MAX_RESEARCHES_PER_SUBJECT } = require('../scraper-puppeteer');

const sectionsOf = (n) => Array.from({ length: n }, (_, i) => ({ class_number: String(1000 + i) }));

// A fake LOCUS whose session dies after `dropAfter` reads. While it is dead
// there is no results page and every read fails with no class link.
// `reSearchWorks` decides whether searching again brings the page back.
function scraper({ dropAfter = Infinity, reSearchWorks = true, outcomeOnPage } = {}) {
  const s = new LocusPuppeteerScraper();
  const state = { lost: false, reads: 0, reSearches: 0 };
  s.readOneEnrollment = async (section) => {
    if (state.lost) return 'nolink';
    if (outcomeOnPage) return outcomeOnPage(section);
    if (state.reads >= dropAfter) { state.lost = true; return 'nolink'; }
    state.reads += 1;
    Object.assign(section, { enrollment_cap: 30, enrollment_total: 10 });
    return 'read';
  };
  s.onResultsPage = async () => !state.lost;
  const reSearch = async () => {
    state.reSearches += 1;
    if (reSearchWorks) { state.lost = false; state.reads = 0; dropAfter = Infinity; }
    return reSearchWorks;
  };
  return { s, state, reSearch };
}

test('a session that drops mid-subject is recovered and every section is read', async () => {
  const { s, state, reSearch } = scraper({ dropAfter: 4 });
  const sections = sectionsOf(20);
  await s.fetchEnrollmentForSections(sections, { reSearch });
  assert.equal(state.reSearches, 1);
  assert.equal(sections.filter((x) => x.enrollment_cap === 30).length, 20);
});

test('a search that will not come back is tried a bounded number of times, then the rest are skipped', async () => {
  const { s, state, reSearch } = scraper({ dropAfter: 2, reSearchWorks: false });
  const sections = sectionsOf(50);
  await s.fetchEnrollmentForSections(sections, { reSearch });
  assert.equal(state.reSearches, MAX_RESEARCHES_PER_SUBJECT);
  assert.equal(sections.filter((x) => x.enrollment_cap === 30).length, 2);
});

test('without a way to search again, a dropped session is not retried (old behavior)', async () => {
  const { s, state } = scraper({ dropAfter: 3 });
  const sections = sectionsOf(10);
  await s.fetchEnrollmentForSections(sections);
  assert.equal(state.reSearches, 0);
  assert.equal(sections.filter((x) => x.enrollment_cap === 30).length, 3);
});

test('a skipped row while still on the results page does not trigger a new search', async () => {
  const { s, state, reSearch } = scraper({
    outcomeOnPage: (section) => (section.class_number === '1003' ? 'mismatch' : (Object.assign(section, { enrollment_cap: 30 }), 'read')),
  });
  const sections = sectionsOf(6);
  await s.fetchEnrollmentForSections(sections, { reSearch });
  assert.equal(state.reSearches, 0);
  assert.equal(sections.filter((x) => x.enrollment_cap === 30).length, 5);
});

test('scrapeSubject hands the enrollment pass a re-search that repeats the same search', async () => {
  const s = new LocusPuppeteerScraper();
  const calls = [];
  s.page = { evaluate: async () => false };
  s.loadSearchForm = async () => calls.push('load');
  s.ensureTerm = async (t) => calls.push(`term ${t}`);
  s.selectSubject = async (sub) => calls.push(`subject ${sub}`);
  s.selectCareer = async () => calls.push('career');
  s.uncheckOpenOnly = async () => calls.push('open-only');
  s.clickSearch = async () => calls.push('search');
  s.extractSections = async () => sectionsOf(2);
  s.onResultsPage = async () => true;
  let received;
  s.fetchEnrollmentForSections = async (sections, opts) => { received = opts; return sections; };

  await s.scrapeSubject('1266', 'BIOL', true);
  calls.length = 0;
  assert.equal(await received.reSearch(), true);
  assert.deepEqual(calls, ['load', 'term 1266', 'subject BIOL', 'career', 'open-only', 'search']);
});
