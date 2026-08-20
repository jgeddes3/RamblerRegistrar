// legal.test.js — the consent predicate every gate decision rides on.
import { needsLegalConsent, TERMS_VERSION, PRIVACY_VERSION, TERMS_URL, PRIVACY_URL } from '../legal';

describe('needsLegalConsent', () => {
  const current = {
    termsAcceptedVersion: TERMS_VERSION,
    privacyAcceptedVersion: PRIVACY_VERSION,
  };

  it('both versions current -> no consent needed', () => {
    expect(needsLegalConsent(current)).toBe(false);
  });

  it('null/missing profile -> must consent (legacy accounts do not skip the gate)', () => {
    expect(needsLegalConsent(null)).toBe(true);
    expect(needsLegalConsent(undefined)).toBe(true);
  });

  it('empty consent object (profile exists, never accepted) -> must consent', () => {
    expect(needsLegalConsent({})).toBe(true);
  });

  it('null-stamped fields (Firestore doc without the keys) -> must consent', () => {
    expect(
      needsLegalConsent({ termsAcceptedVersion: null, privacyAcceptedVersion: null })
    ).toBe(true);
  });

  it('stale terms version alone forces re-consent', () => {
    expect(
      needsLegalConsent({ ...current, termsAcceptedVersion: '2020-01-01' })
    ).toBe(true);
  });

  it('stale privacy version alone forces re-consent', () => {
    expect(
      needsLegalConsent({ ...current, privacyAcceptedVersion: '2020-01-01' })
    ).toBe(true);
  });
});

describe('version + URL constants', () => {
  it('versions fit the firestore.rules optStr(20) limit', () => {
    expect(TERMS_VERSION.length).toBeLessThanOrEqual(20);
    expect(PRIVACY_VERSION.length).toBeLessThanOrEqual(20);
  });

  it('document URLs point at the site routes', () => {
    expect(TERMS_URL).toMatch(/^https:\/\/.+\/terms\/$/);
    expect(PRIVACY_URL).toMatch(/^https:\/\/.+\/privacy\/$/);
  });
});
