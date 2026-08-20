// ratings.js — the single seam between the UI and whichever professor-ratings
// source is live. 'rmp' does on-demand, per-view Rate My Professors lookups
// (rmp.js) — the same request volume the modal has always generated; no bulk
// or scheduled fetching. 'own' reads Firestore instructorRatings/{slug} docs
// written by the future F-A4 aggregator, expected doc shape:
//   { avgRating, avgDifficulty, wouldTakeAgainPercent, numRatings }

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { searchProfessors } from './rmp';

export const RATINGS_SOURCE = 'rmp'; // FLIP TO 'own' WHEN F-A4 SHIPS — the only line that changes

// Must match the backend / firestore-data.js instructorSlug exactly.
const instructorSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'unknown';

// Keyed by full instructor name. Stores promises so concurrent lookups share
// one request. Misses stay cached (a professor with no rating should not
// refetch every modal open); transport failures are evicted so the next open
// retries.
const cache = new Map();

async function lookupRmp(name) {
  const lastName = name.split(',')[0]?.trim() || name.split(' ').pop();
  const results = await searchProfessors(lastName);
  if (!results || results.length === 0) return null;
  const match =
    results.find((r) => name.toLowerCase().includes(r.lastName.toLowerCase())) ||
    results[0];
  return {
    rating: match.avgRating,
    difficulty: match.avgDifficulty,
    wouldTakeAgainPercent: match.wouldTakeAgainPercent,
    numRatings: match.numRatings,
    source: 'rmp',
  };
}

async function lookupOwn(name) {
  const snap = await getDoc(doc(db, 'instructorRatings', instructorSlug(name)));
  if (!snap.exists()) return null; // collection does not exist until F-A4
  const d = snap.data() || {};
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  return {
    rating: num(d.avgRating),
    difficulty: num(d.avgDifficulty),
    wouldTakeAgainPercent: num(d.wouldTakeAgainPercent),
    numRatings: num(d.numRatings),
    source: 'own',
  };
}

// -> { rating, difficulty, wouldTakeAgainPercent, numRatings, source } | null.
// Never rejects; any failure resolves to null.
export async function getInstructorRating(instructorName) {
  const name = typeof instructorName === 'string' ? instructorName : '';
  if (!name.trim()) return null;
  if (!cache.has(name)) {
    const lookup = RATINGS_SOURCE === 'own' ? lookupOwn : lookupRmp;
    const p = lookup(name).catch(() => {
      cache.delete(name);
      return null;
    });
    cache.set(name, p);
  }
  return cache.get(name);
}

export function ratingsAttribution(source = RATINGS_SOURCE) {
  return source === 'own'
    ? 'Ratings from Rambler students'
    : 'Ratings via Rate My Professors';
}

export function noRatingCopy(source = RATINGS_SOURCE) {
  return source === 'own' ? 'No student ratings yet' : 'No RMP rating found';
}
