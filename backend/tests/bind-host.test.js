// The HTTP API is only called from this machine (health monitor, cli-guard);
// the mobile app talks to Firestore. It must not listen on the network unless
// someone asks for that explicitly.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bindHost } = require('../bind-host');

test('listens on loopback only by default', () => {
  assert.equal(bindHost({}), '127.0.0.1');
});

test('a blank BIND_HOST still means loopback', () => {
  assert.equal(bindHost({ BIND_HOST: '' }), '127.0.0.1');
  assert.equal(bindHost({ BIND_HOST: '   ' }), '127.0.0.1');
});

test('BIND_HOST opens another interface on purpose', () => {
  assert.equal(bindHost({ BIND_HOST: '0.0.0.0' }), '0.0.0.0');
});
