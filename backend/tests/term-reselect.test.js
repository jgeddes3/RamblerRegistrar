// A reloaded LOCUS search form comes back on LOCUS's default term. Searching it
// without picking the scrape's term again returns "no results" (or another
// term's sections) for every remaining subject in that browser batch.
// Fakes only: no Chrome, no LOCUS, throwaway db path.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.LOCUS_DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rambler-term-')), 'test.db');
const { LocusPuppeteerScraper } = require('../scraper-puppeteer');

const TERM_SELECT = '[id="CLASS_SRCH_WRK2_STRM$35$"]';

// A search form whose term dropdown holds `formTerm`. Records the term that
// was on the form at the moment Search was clicked.
function scraperOnForm(formTerm) {
  const form = { term: formTerm, searchedWith: [], selects: 0 };
  const s = new LocusPuppeteerScraper();
  s.page = {
    $eval: async (selector, fn) => {
      assert.equal(selector, TERM_SELECT);
      return fn({ value: form.term });
    },
    select: async (selector, value) => {
      assert.equal(selector, TERM_SELECT);
      form.term = value;
      form.selects += 1;
    },
    evaluate: async () => false, // neither "no results" nor "exceeded"
  };
  s.waitForPeopleSoft = async () => {};
  s.selectSubject = async () => {};
  s.selectCareer = async () => {};
  s.uncheckOpenOnly = async () => {};
  s.clickSearch = async () => { form.searchedWith.push(form.term); };
  s.extractSections = async () => [{ class_number: '1001' }];
  return { s, form };
}

test('a form sitting on another term is put on the scrape term before searching', async () => {
  const { s, form } = scraperOnForm('1262'); // what a reloaded form shows
  const sections = await s.scrapeSubject('1272', 'CHEM', false);
  assert.deepEqual(form.searchedWith, ['1272']);
  assert.equal(sections.length, 1);
});

test('a form already on the scrape term is left alone', async () => {
  const { s, form } = scraperOnForm('1272');
  await s.scrapeSubject('1272', 'CHEM', false);
  assert.deepEqual(form.searchedWith, ['1272']);
  assert.equal(form.selects, 0);
});
