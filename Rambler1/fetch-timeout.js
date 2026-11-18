// fetch-timeout.js — fetch() with a deadline.
//
// React Native's fetch has no timeout: on a stalled connection a request can
// sit forever, and so does the spinner waiting on it. This aborts the request
// (headers AND body) once the deadline passes; callers' existing catch paths
// then show their "unavailable" state.
//
// Resolves { ok, status, text(), json() } with the body already read, so a
// body that stalls after the headers arrive is covered by the same deadline.

export const FETCH_TIMEOUT_MS = 10000;

export async function fetchWithTimeout(url, options = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  } finally {
    clearTimeout(timer);
  }
}
