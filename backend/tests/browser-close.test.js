// browser.close() hanging must not wedge the scrape/poll lock. Fakes only: no Chrome.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { closeBrowserBounded } = require('../scraper-puppeteer');

const never = () => new Promise(() => {});

function fakeBrowser(closeImpl) {
  const killed = [];
  return {
    killed,
    close: closeImpl,
    process: () => ({ pid: 4242, kill: (sig) => killed.push(sig) }),
  };
}

test('a browser that closes normally is not killed', async () => {
  const b = fakeBrowser(async () => {});
  await closeBrowserBounded(b, { close: async () => {} }, { timeoutMs: 200, settleMs: 0 });
  assert.deepEqual(b.killed, []);
});

test('a browser whose close() hangs is killed and close returns', async () => {
  const b = fakeBrowser(never);
  const t0 = Date.now();
  await closeBrowserBounded(b, null, { timeoutMs: 50, settleMs: 0 });
  assert.ok(Date.now() - t0 < 1000, 'must return shortly after the timeout');
  assert.deepEqual(b.killed, ['SIGKILL']);
});

test('a page whose close() hangs does not block browser shutdown', async () => {
  const b = fakeBrowser(async () => {});
  await closeBrowserBounded(b, { close: never }, { timeoutMs: 50, settleMs: 0 });
  assert.deepEqual(b.killed, []);
});

test('a browser whose close() throws is killed', async () => {
  const b = fakeBrowser(async () => { throw new Error('boom'); });
  await closeBrowserBounded(b, null, { timeoutMs: 50, settleMs: 0 });
  assert.deepEqual(b.killed, ['SIGKILL']);
});
