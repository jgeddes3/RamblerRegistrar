// firestore-guards.js — Firestore calls that always settle and never pass off
// "offline" as "empty".
//
// Measured against the real SDK with an unreachable backend:
//   - setDoc / addDoc / deleteDoc / updateDoc NEVER settle (they wait for the
//     server ack), so every `await save()` in the UI hung forever with its
//     "saving" flag stuck on.
//   - getDocs RESOLVES with an empty from-cache snapshot (native has no
//     persistent cache), which the app took for "there is nothing" — and
//     cached for the session.
//   - getDoc rejects on its own, after up to ~10 s on a stalled connection.
//
// Import getDoc/getDocs/setDoc/addDoc/deleteDoc/updateDoc from HERE, not from
// 'firebase/firestore'.

import {
  addDoc as fsAddDoc,
  deleteDoc as fsDeleteDoc,
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
} from 'firebase/firestore';

// Long enough for a slow connection, short enough that a dead one reads as a
// failed save rather than a frozen button.
export const WRITE_TIMEOUT_MS = 10000;
// Reads fail on their own once the SDK decides it is offline (~10 s); this is
// only a backstop in case one never does.
export const READ_TIMEOUT_MS = 20000;

const guardError = (code, message) => {
  const e = new Error(message);
  e.code = code;
  return e;
};

// Settle with the promise, or reject with code 'timeout' after `ms`.
export function withTimeout(promise, ms, what = 'request') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(guardError('timeout', `${what} timed out after ${ms} ms`)),
      ms
    );
    // Handlers stay attached, so a late rejection is never "unhandled".
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

// NOTE on a timed-out write: the SDK keeps it queued in memory and still sends
// it if the connection returns while the app is open. Every write in this app
// is a whole-document set/delete keyed by id (feedback aside), so a retry
// followed by the late original lands on the same result.
const write = (fn, what) => (...args) => withTimeout(fn(...args), WRITE_TIMEOUT_MS, what);

export const setDoc = write(fsSetDoc, 'setDoc');
export const addDoc = write(fsAddDoc, 'addDoc');
export const deleteDoc = write(fsDeleteDoc, 'deleteDoc');
export const updateDoc = write(fsUpdateDoc, 'updateDoc');

export const getDoc = (ref) => withTimeout(fsGetDoc(ref), READ_TIMEOUT_MS, 'getDoc');

// An empty snapshot served from cache means the server was not reached, not
// that the collection is empty. Reject so callers take their failure path
// (and never cache it). A non-empty cached snapshot is real data — keep it.
export const getDocs = async (queryOrRef) => {
  const snap = await withTimeout(fsGetDocs(queryOrRef), READ_TIMEOUT_MS, 'getDocs');
  if (snap.empty && snap.metadata && snap.metadata.fromCache) {
    throw guardError('unavailable', 'Empty result served from cache: the client is offline.');
  }
  return snap;
};
