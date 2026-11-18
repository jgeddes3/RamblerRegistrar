// Who may appear in the data-sale export (export-sale-data.js). Kept apart from
// the script so the rule can be tested without Firebase.

// First Privacy Policy version that discloses the sale. ISO dates compare
// correctly as strings.
const SALE_DISCLOSED_SINCE = '2026-08-20';

// Why this account must be left out of the export, or null when it is eligible.
//   auth    - { email, emailVerified } from Firebase Auth (undefined if none)
//   profile - the users/{uid} document
function saleExclusion(auth, profile) {
  if (!auth || !auth.email) return 'noEmail';
  // Sign-up accepts any address without proof. Until the owner of the address
  // has confirmed it, the consent on this account is not known to be theirs.
  if (auth.emailVerified !== true) return 'unverifiedEmail';
  if (profile.dataSaleOptOut === true) return 'optedOut';
  const policy = typeof profile.privacyPolicyVersion === 'string' ? profile.privacyPolicyVersion : '';
  if (!policy || policy < SALE_DISCLOSED_SINCE) return 'preSalePolicy';
  if (typeof profile.termsVersion !== 'string' || !profile.termsVersion) return 'noTerms';
  return null;
}

module.exports = { saleExclusion, SALE_DISCLOSED_SINCE };
