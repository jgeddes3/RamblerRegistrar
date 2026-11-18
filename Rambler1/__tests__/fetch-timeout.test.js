import { fetchWithTimeout, FETCH_TIMEOUT_MS } from '../fetch-timeout';

// The campus, CTA and RateMyProfessors calls used a bare fetch(), which has no
// timeout in React Native: on a stalled connection the Library, Events and
// Phoenix screens spun forever.

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
  jest.useRealTimers();
});

// A fetch that never answers, but honours the abort signal like the real one.
const stalledFetch = () =>
  jest.fn((url, opts) => new Promise((resolve, reject) => {
    opts.signal.addEventListener('abort', () => {
      const e = new Error('Aborted');
      e.name = 'AbortError';
      reject(e);
    });
  }));

const response = (body, { ok = true, status = 200, textDelay = null } = {}) => ({
  ok,
  status,
  text: () => (textDelay ? textDelay : Promise.resolve(body)),
});

test('gives up on a request that never answers', async () => {
  jest.useFakeTimers();
  global.fetch = stalledFetch();
  const pending = fetchWithTimeout('https://example.test/x');
  const outcome = pending.then(() => 'resolved', (e) => e.name);
  await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS + 1);
  expect(await outcome).toBe('AbortError');
});

test('gives up when the headers arrive but the body never does', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn((url, opts) => Promise.resolve(response(null, {
    textDelay: new Promise((resolve, reject) => {
      opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
    }),
  })));
  const outcome = fetchWithTimeout('https://example.test/x').then(() => 'resolved', (e) => e.name);
  await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS + 1);
  expect(await outcome).toBe('AbortError');
});

test('a normal response passes through with its status and body', async () => {
  global.fetch = jest.fn(async () => response('{"a":1}', { status: 200 }));
  const res = await fetchWithTimeout('https://example.test/x', { headers: { Accept: 'application/json' } });
  expect(res.ok).toBe(true);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ a: 1 });
  expect(await res.text()).toBe('{"a":1}');
  expect(global.fetch.mock.calls[0][1].headers).toEqual({ Accept: 'application/json' });
});

test('an error status is reported, not thrown', async () => {
  global.fetch = jest.fn(async () => response('nope', { ok: false, status: 503 }));
  const res = await fetchWithTimeout('https://example.test/x');
  expect(res.ok).toBe(false);
  expect(res.status).toBe(503);
});

test('a custom timeout is honoured', async () => {
  jest.useFakeTimers();
  global.fetch = stalledFetch();
  const outcome = fetchWithTimeout('https://example.test/x', {}, 500).then(() => 'resolved', (e) => e.name);
  await jest.advanceTimersByTimeAsync(501);
  expect(await outcome).toBe('AbortError');
});
