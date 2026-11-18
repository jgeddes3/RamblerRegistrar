// Write-capable CLI scripts must not silently clobber the running server's
// in-memory DB image. Uses a throwaway local http server as the "backend".

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { isServerUp, shouldRefuse } = require('../cli-guard');

function listen(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

test('isServerUp is true when something answers /api/health', async () => {
  const srv = await listen((req, res) => res.end('{"status":"ok"}'));
  try {
    assert.equal(await isServerUp(srv.address().port, 1000), true);
  } finally { srv.close(); }
});

test('isServerUp is false when nothing is listening', async () => {
  const srv = await listen((req, res) => res.end('x'));
  const port = srv.address().port;
  await new Promise((r) => srv.close(r));
  assert.equal(await isServerUp(port, 1000), false);
});

test('shouldRefuse: refuses when the server is up and no --force', () => {
  assert.equal(shouldRefuse(true, ['node', 'seed.js']), true);
  assert.equal(shouldRefuse(true, ['node', 'seed.js', '--force']), false);
  assert.equal(shouldRefuse(false, ['node', 'seed.js']), false);
});
