// The app and the scraper must agree on which term is being registered for.
// Run: npm test (from backend/)
//
// The scraper used to default to a hardcoded '1266' (Fall 2026) while the app
// switched to Spring 2027 ('1272') on Oct 1, so every section lookup in the
// app came back empty.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { registrationTermFor, termLabelFor } = require('../terms');

test('Oct-Dec registers for Spring of next year', () => {
  assert.deepEqual(registrationTermFor(new Date(2026, 10, 18)), { code: '1272', label: 'Spring 2027' });
  assert.equal(registrationTermFor(new Date(2026, 9, 1)).code, '1272');
});

test('Mar-Sep registers for Fall of this year', () => {
  assert.deepEqual(registrationTermFor(new Date(2026, 2, 1)), { code: '1266', label: 'Fall 2026' });
  assert.equal(registrationTermFor(new Date(2026, 8, 30)).code, '1266');
});

test('Jan-Feb registers for Spring of this year', () => {
  assert.deepEqual(registrationTermFor(new Date(2027, 0, 15)), { code: '1272', label: 'Spring 2027' });
});

test('termLabelFor names Fall/Spring terms and passes other shapes through', () => {
  assert.equal(termLabelFor('1266'), 'Fall 2026');
  assert.equal(termLabelFor('1272'), 'Spring 2027');
  assert.equal(termLabelFor('garbage'), 'garbage');
});

test('the scraper defaults to the registration term, not a hardcoded one', () => {
  const { defaultScrapeTerm } = require('../scraper-puppeteer');
  assert.equal(defaultScrapeTerm(new Date(2026, 10, 18)), '1272');
  assert.equal(defaultScrapeTerm(new Date(2027, 3, 2)), '1276');
});
