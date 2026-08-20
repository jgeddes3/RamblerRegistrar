// legal-consent.test.js — sanity checks on the consent version stamps and
// document content both gates (App.js LegalConsentGate, AccountSetup) rely on.
import { POLICY_VERSION, POLICY_SECTIONS, POLICY_TITLE } from '../privacy-policy-content';
import { TERMS_VERSION, TERMS_SECTIONS, TERMS_TITLE } from '../terms-content';

const allParagraphs = (sections) => sections.flatMap((s) => s.paragraphs);

describe('consent version stamps', () => {
  it('fit the firestore.rules optStr(20) limit', () => {
    expect(POLICY_VERSION.length).toBeLessThanOrEqual(20);
    expect(TERMS_VERSION.length).toBeLessThanOrEqual(20);
  });

  it('are non-empty date-like strings', () => {
    expect(POLICY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('document content', () => {
  it('both documents have titles and sections of string paragraphs', () => {
    expect(POLICY_TITLE).toBeTruthy();
    expect(TERMS_TITLE).toBeTruthy();
    for (const sections of [POLICY_SECTIONS, TERMS_SECTIONS]) {
      expect(sections.length).toBeGreaterThan(3);
      for (const s of sections) {
        expect(Array.isArray(s.paragraphs)).toBe(true);
        expect(s.paragraphs.length).toBeGreaterThan(0);
        for (const p of s.paragraphs) expect(typeof p).toBe('string');
      }
    }
  });

  it('privacy policy discloses the data sharing/sale and both opt-out routes', () => {
    const text = allParagraphs(POLICY_SECTIONS).join(' ');
    expect(text).toMatch(/share and, in some cases, sell/);
    expect(text).toMatch(/johngeddes@pm\.me/);
    // The in-app switch (ProfileScreen dataSaleOptOut) must stay described so
    // the policy never drifts back to email-only while the switch ships.
    expect(text).toMatch(/Do not sell or share my personal information/);
    // The pre-2026-08-20 false claim must never come back.
    expect(text).not.toMatch(/never sell your data/);
    expect(text).not.toMatch(/do not sell or rent/);
  });

  it('terms include the data sharing/sale section and LOCUS password promise', () => {
    const text = allParagraphs(TERMS_SECTIONS).join(' ');
    expect(text).toMatch(/share and, in some cases, sell/);
    expect(text).toMatch(/never ask for, collect, store, transmit, or use your LOCUS/);
  });

  it('no em dashes in user-facing legal copy (house copy style)', () => {
    for (const p of [...allParagraphs(POLICY_SECTIONS), ...allParagraphs(TERMS_SECTIONS)]) {
      expect(p).not.toContain('—');
    }
  });
});
