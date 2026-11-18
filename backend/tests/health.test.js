// /api/health must expose lock age so a wedged scrape/poll can be detected.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildHealth, MAX_SCRAPE_MS, MAX_POLL_MS } = require('../health');

const NOW = Date.parse('2026-11-18T15:00:00Z');
const idle = { scrapeStartedAt: null, pollStartedAt: null, lastScrapeOkAt: null, lastPollDoneAt: null };

test('idle server is ok and not wedged', () => {
  const h = buildHealth(idle, NOW);
  assert.equal(h.status, 'ok');
  assert.equal(h.wedged, false);
  assert.equal(h.scrape.inProgress, false);
  assert.equal(h.poll.inProgress, false);
  assert.equal(h.lastScrapeOkAt, null);
});

test('a scrape running for a plausible time is ok and reports its age', () => {
  const h = buildHealth({ ...idle, scrapeStartedAt: NOW - 3.5 * 3600e3 }, NOW);
  assert.equal(h.status, 'ok');
  assert.equal(h.scrape.inProgress, true);
  assert.equal(h.scrape.runningMinutes, 210);
});

test('a scrape running past the limit is wedged', () => {
  const h = buildHealth({ ...idle, scrapeStartedAt: NOW - MAX_SCRAPE_MS - 60e3 }, NOW);
  assert.equal(h.wedged, true);
  assert.equal(h.status, 'wedged');
  assert.match(h.wedgedReasons.join(' '), /scrape/);
});

test('a poll running past the limit is wedged', () => {
  const h = buildHealth({ ...idle, pollStartedAt: NOW - MAX_POLL_MS - 60e3 }, NOW);
  assert.equal(h.wedged, true);
  assert.match(h.wedgedReasons.join(' '), /poll/);
});

test('last successful scrape time is reported as ISO', () => {
  const h = buildHealth({ ...idle, lastScrapeOkAt: NOW - 1000 }, NOW);
  assert.equal(h.lastScrapeOkAt, new Date(NOW - 1000).toISOString());
});
