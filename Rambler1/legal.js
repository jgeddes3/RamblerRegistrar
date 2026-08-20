// legal.js — legal document links + versioned consent.
//
// The CANONICAL Terms of Service and Privacy Policy are the marketing site's
// /terms/ and /privacy/ pages (RamblerRegistrarWeb repo). The app deliberately
// does NOT carry its own copy of the document text: a second copy is exactly
// how the two artifacts drift out of agreement (see
// RamblerRegistrarWeb/docs/legal/app-compliance-todo.md for the history).
// Consent UI shows a short summary and links out to the full documents.
//
// LEGAL_BASE_URL: the marketing site is NOT deployed yet (no GitHub Pages, no
// custom domain as of 2026-08-18). This default is the Firebase Hosting domain
// of the app's own project — deploying the site's dist/ there makes these
// links live with one command (`firebase deploy --only hosting`). When the
// production domain is chosen, change this ONE constant. Must be live before
// launch: consent that links to a 404 is not informed consent.
import { Linking } from 'react-native';

export const LEGAL_BASE_URL = 'https://ramblerregistrar-9b066.web.app';
export const TERMS_URL = `${LEGAL_BASE_URL}/terms/`;
export const PRIVACY_URL = `${LEGAL_BASE_URL}/privacy/`;

// Version stamps for consent. The site's documents are drafts whose effective
// date is "to be set at launch", so these are dated by when the app's consent
// gate began requiring them. Bump the matching constant whenever the
// corresponding document changes MATERIALLY — every account whose stored
// acceptance no longer matches is then forced through re-consent on next
// launch (LegalConsentGate in App.js). Bumping is the mechanism the
// compliance handoff doc relies on; never edit a document materially without
// bumping its version here.
export const TERMS_VERSION = '2026-08-18';
export const PRIVACY_VERSION = '2026-08-18';

// Does this account need to (re-)accept the current documents?
// `consent` is { termsAcceptedVersion?, privacyAcceptedVersion? } read from
// the users/{uid} profile doc; undefined means "not loaded yet" and is the
// CALLER's job to handle (don't gate on unknown). A missing profile or
// missing fields = MUST consent — a legacy account that never saw the gate
// does not get to slip past it.
export function needsLegalConsent(consent) {
  if (!consent) return true;
  return (
    consent.termsAcceptedVersion !== TERMS_VERSION ||
    consent.privacyAcceptedVersion !== PRIVACY_VERSION
  );
}

// openURL rejections (no browser, malformed intent) must never crash a
// consent flow — the checkbox, not the link visit, is what gates acceptance.
export const openTerms = () => Linking.openURL(TERMS_URL).catch(() => {});
export const openPrivacy = () => Linking.openURL(PRIVACY_URL).catch(() => {});
