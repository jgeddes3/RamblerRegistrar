// Watch poller: blank-status handling and Expo push sending. Fakes only: no
// Firestore, no LOCUS, no network.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { usableStatus, sendExpoPushes, capWatchesPerUser, MAX_WATCHES_PER_USER } = require('../watch-poller');

// --- per-user watch cap --------------------------------------------------------
// The rules cannot count documents, so one account can create any number of
// watches. Past the cap they must not cost section reads, state reads or
// LOCUS searches, or push other people's subjects out of the poll.

const watch = (uid, n) => ({ uid, classNumber: String(n), termCode: '1272' });

test('capWatchesPerUser: accounts at or under the cap keep every watch', () => {
  const watches = [watch('a', 1), watch('a', 2), watch('b', 3)];
  const { kept, overCap } = capWatchesPerUser(watches, 2);
  assert.deepEqual(kept, watches);
  assert.deepEqual(overCap, []);
});

test('capWatchesPerUser: an account over the cap keeps its first ones, in order', () => {
  const watches = [watch('a', 1), watch('b', 9), watch('a', 2), watch('a', 3), watch('a', 4)];
  const { kept, overCap } = capWatchesPerUser(watches, 2);
  assert.deepEqual(kept, [watch('a', 1), watch('b', 9), watch('a', 2)]);
  assert.deepEqual(overCap, [{ uid: 'a', total: 4 }]);
});

test('capWatchesPerUser: one account flooding watches does not cost anyone else theirs', () => {
  const flood = Array.from({ length: 5000 }, (_, i) => watch('attacker', i));
  const { kept, overCap } = capWatchesPerUser([...flood, watch('student', 77)]);
  assert.equal(kept.filter((w) => w.uid === 'attacker').length, MAX_WATCHES_PER_USER);
  assert.deepEqual(kept.filter((w) => w.uid === 'student'), [watch('student', 77)]);
  assert.deepEqual(overCap, [{ uid: 'attacker', total: 5000 }]);
});

// --- blank scraped status ------------------------------------------------------

test('usableStatus: real statuses pass through trimmed', () => {
  assert.equal(usableStatus('Open'), 'Open');
  assert.equal(usableStatus(' Closed '), 'Closed');
  assert.equal(usableStatus('Wait List'), 'Wait List');
});

test('usableStatus: blank / missing / non-string reads are unusable (null)', () => {
  for (const bad of ['', '   ', undefined, null, 5]) assert.equal(usableStatus(bad), null);
});

// --- push sending --------------------------------------------------------------

const msg = (to) => ({ to, title: 't', body: 'b' });
const okFetch = (tickets) => async () => ({ ok: true, status: 200, json: async () => ({ data: tickets }) });

test('sendExpoPushes: accepted tickets are reported accepted', async () => {
  const r = await sendExpoPushes([msg('ExponentPushToken[a]')], { fetchImpl: okFetch([{ status: 'ok' }]) });
  assert.deepEqual(r.accepted, [true]);
  assert.deepEqual(r.deadTokens, []);
});

test('sendExpoPushes: DeviceNotRegistered marks the token dead', async () => {
  const r = await sendExpoPushes(
    [msg('ExponentPushToken[a]'), msg('ExponentPushToken[b]')],
    { fetchImpl: okFetch([
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      { status: 'ok' },
    ]) },
  );
  assert.deepEqual(r.accepted, [false, true]);
  assert.deepEqual(r.deadTokens, ['ExponentPushToken[a]']);
});

test('sendExpoPushes: other errors are not treated as dead tokens', async () => {
  const r = await sendExpoPushes([msg('ExponentPushToken[a]')], {
    fetchImpl: okFetch([{ status: 'error', details: { error: 'MessageRateExceeded' } }]),
  });
  assert.deepEqual(r.accepted, [false]);
  assert.deepEqual(r.deadTokens, []);
});

test('sendExpoPushes: a hanging request is aborted and reported as not accepted', async () => {
  const hanging = (url, opts) => new Promise((resolve, reject) => {
    opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
  const t0 = Date.now();
  const r = await sendExpoPushes([msg('ExponentPushToken[a]')], { fetchImpl: hanging, timeoutMs: 50 });
  assert.ok(Date.now() - t0 < 2000);
  assert.deepEqual(r.accepted, [false]);
  assert.deepEqual(r.deadTokens, []);
});
