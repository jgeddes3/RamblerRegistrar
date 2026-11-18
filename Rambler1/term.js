// term.js — the ONE place the app decides which Loyola term it is working in.
//
// Loyola term codes: '1' + two-digit year + semester digit (2 = Spring,
// 6 = Fall). Fall 2026 -> '1266', Spring 2027 -> '1272'.
//
// Two different questions, two different answers:
//   registration term — the term students are registering FOR (Schedule,
//     Search, course sections, seat watches). Starts as the calendar guess and
//     is then corrected against the terms the scraper has actually published,
//     so the app never asks for a term that has no sections yet.
//   in-session term — the term happening NOW (Home's "today" card).
//
// backend/terms.js carries the same calendar rule for the scraper. Keep the
// two in step.

import { useEffect, useSyncExternalStore } from 'react';
import { termCodeFor, termLabelFor } from './plan-utils';

const termOf = (season, year) => {
  const code = termCodeFor(season, year);
  return { code, label: termLabelFor(code) };
};

export function registrationTermFor(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 10) return termOf('Spring', year + 1); // Oct-Dec: next Spring
  if (month >= 3) return termOf('Fall', year); // Mar-Sep: this Fall
  return termOf('Spring', year); // Jan-Feb: this Spring
}

export function inSessionTermFor(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 8) return termOf('Fall', year);
  if (month <= 5) return termOf('Spring', year);
  return null; // June/July: summer break
}

// Which term to use given the terms that actually have sections. Prefers the
// calendar term; otherwise the newest earlier Fall/Spring term; otherwise the
// earliest later one. With nothing usable, stays on the preferred term.
export function pickAvailableTerm(preferredCode, availableCodes) {
  const preferred = String(preferredCode);
  const usable = (Array.isArray(availableCodes) ? availableCodes : [])
    .map(String)
    .filter((c) => /^1\d\d[26]$/.test(c))
    .sort();
  if (usable.length === 0 || usable.includes(preferred)) return preferred;
  const earlier = usable.filter((c) => c < preferred);
  return earlier.length ? earlier[earlier.length - 1] : usable[0];
}

// ---- shared registration-term state ----------------------------------------
let _term = registrationTermFor();
let _resolved = false;
let _inflight = null;
let _loader = null;
const _listeners = new Set();

export function getRegistrationTerm() {
  return _term;
}

export function subscribeTerm(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// firestore-data.js registers how to list the published term codes. Kept as an
// injection so this module stays free of firebase.
export function setTermLoader(loader) {
  _loader = loader;
}

// Correct the calendar guess against the published terms. Safe to call often:
// one request at a time, none once an answer is in. An empty list or a failed
// read means "unknown" (offline), so the guess stays and the next call retries.
export function resolveRegistrationTerm(loader = _loader, now = new Date()) {
  if (_resolved || !loader) return Promise.resolve(_term);
  if (_inflight) return _inflight;
  _inflight = (async () => {
    try {
      const codes = await loader();
      if (Array.isArray(codes) && codes.length > 0) {
        const code = pickAvailableTerm(registrationTermFor(now).code, codes);
        _resolved = true;
        if (code !== _term.code) {
          _term = { code, label: termLabelFor(code) };
          _listeners.forEach((l) => l());
        }
      }
    } catch (e) {
      // unknown — keep the calendar term, retry on the next call
    } finally {
      _inflight = null;
    }
    return _term;
  })();
  return _inflight;
}

// Hook: the registration term, re-rendering if it gets corrected.
export function useRegistrationTerm() {
  useEffect(() => {
    resolveRegistrationTerm();
  }, []);
  return useSyncExternalStore(subscribeTerm, getRegistrationTerm, getRegistrationTerm);
}

export function __resetTermForTests(now = new Date()) {
  _term = registrationTermFor(now);
  _resolved = false;
  _inflight = null;
  _loader = null;
  _listeners.clear();
}
