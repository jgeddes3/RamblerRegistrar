// Who may appear in the data-sale export. Pure rule, no Firebase.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { saleExclusion } = require('../sale-eligibility');

const auth = { email: 'student@example.edu', emailVerified: true, displayName: 'S' };
const profile = { privacyPolicyVersion: '2026-08-20', termsVersion: '2026-08-20' };

test('a verified, consenting account is eligible', () => {
  assert.equal(saleExclusion(auth, profile), null);
});

test('an address nobody proved they own is excluded', () => {
  // Anyone can sign up with someone else's email and tick the boxes.
  assert.equal(saleExclusion({ ...auth, emailVerified: false }, profile), 'unverifiedEmail');
  assert.equal(saleExclusion({ email: auth.email }, profile), 'unverifiedEmail');
});

test('no auth record or no email is excluded', () => {
  assert.equal(saleExclusion(undefined, profile), 'noEmail');
  assert.equal(saleExclusion({ email: null, emailVerified: true }, profile), 'noEmail');
});

test('an opted-out account is excluded', () => {
  assert.equal(saleExclusion(auth, { ...profile, dataSaleOptOut: true }), 'optedOut');
});

test('an account that only accepted a policy from before the sale was disclosed is excluded', () => {
  assert.equal(saleExclusion(auth, { ...profile, privacyPolicyVersion: '2026-08-19' }), 'preSalePolicy');
  assert.equal(saleExclusion(auth, { termsVersion: '2026-08-20' }), 'preSalePolicy');
});

test('an account that never accepted the Terms is excluded', () => {
  assert.equal(saleExclusion(auth, { privacyPolicyVersion: '2026-08-20' }), 'noTerms');
});
