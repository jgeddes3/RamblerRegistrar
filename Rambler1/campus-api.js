// =============================================================================
// campus-api.js — device-side port of backend/services/libcal.js + events.js
//
// LibCal API  — Loyola University library hours (institution 3076, no auth)
// Localist API — Loyola campus events (events.luc.edu, no auth)
//
// Structure:
//   - Pure PARSER functions (exported): take raw API JSON -> shaped result.
//   - Thin FETCHERS: call the live endpoint, delegate to the parser, cache.
//
// All fetchers are try/catch and resolve to null (object-shaped results) or
// [] (array-shaped results) on any failure. NOTE: these public APIs are
// blocked by CORS in web browsers — native (Expo Go / device) works fine —
// so callers must handle the empty/null case gracefully.
// =============================================================================

const LIBCAL_BASE = 'https://api3.libcal.com';
const INSTITUTION_ID = 3076;
const EVENTS_BASE = 'https://events.luc.edu/api/2';

const HOURS_CACHE_TTL = 60 * 60 * 1000; // 1 hour (same as backend libcal.js)
const EVENTS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (same as backend events.js)

let hoursCache = null;
let hoursCacheTime = 0;

let weeklyCache = null;
let weeklyCacheTime = 0;

let eventsCache = {};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Campus API error: ${response.status}`);
  return await response.json();
}

// -----------------------------------------------------------------------------
// Pure parsers
// -----------------------------------------------------------------------------

/**
 * Parse the raw api_hours_today.php payload.
 * Returns { date: 'YYYY-MM-DD', locations: [{ id, name, category, url, hours, status, currentlyOpen, note }] }
 *
 * NOTE: `status` is a DAY-level flag ('open' means hours are set today);
 * `currentlyOpen` (from times.currently_open) is the live open-right-now flag.
 */
export function parseLibraryHours(data) {
  const locations = ((data && data.locations) || []).map((loc) => ({
    id: loc.lid,
    name: loc.name,
    category: loc.category,
    url: loc.url,
    hours: loc.times?.hours || [],
    status: loc.times?.status || 'unknown',
    currentlyOpen: !!loc.times?.currently_open,
    note: loc.times?.note || null,
  }));

  return { date: new Date().toISOString().split('T')[0], locations };
}

/**
 * Parse the raw api_hours_grid.php payload.
 * The backend returned this payload untouched; keep the same shape:
 * { locations: [{ lid, name, category, url, weeks: [{ Sunday..Saturday }] }, ...] }
 */
export function parseLibraryHoursWeekly(data) {
  if (!data || typeof data !== 'object') return { locations: [] };
  return { ...data, locations: data.locations || [] };
}

/**
 * Parse the raw Localist /events payload.
 * Returns an array of
 * { id, title, description, location, address, url, start, end, allDay, image, tags, filters }
 */
export function parseEvents(data) {
  return ((data && data.events) || []).map((wrapper, i) => {
    const e = (wrapper && wrapper.event) || {};
    const start = e.event_instances?.[0]?.event_instance?.start || null;
    return {
      id: e.id,
      // Localist returns one entry PER INSTANCE: a recurring event repeats
      // with the same event id but a different start. React list keys need
      // the instance identity, not the event identity.
      instanceKey: `${e.id ?? `idx${i}`}|${start ?? ''}`,
      title: e.title,
      description: e.description_text ? e.description_text.substring(0, 300) : null,
      location: e.location_name || e.location || null,
      address: e.address || null,
      url: e.localist_url || e.url || null,
      start,
      end: e.event_instances?.[0]?.event_instance?.end || null,
      allDay: e.event_instances?.[0]?.event_instance?.all_day || false,
      image: e.photo_url || null,
      tags: e.tags || [],
      filters: e.filters || {},
    };
  });
}

// -----------------------------------------------------------------------------
// Fetchers (thin: live endpoint -> parser -> cache). Null/[] on any failure.
// -----------------------------------------------------------------------------

/**
 * Today's hours for all Loyola library locations.
 * Resolves to { date, locations: [...] } or null on failure.
 */
export async function getLibraryHours() {
  if (hoursCache && Date.now() - hoursCacheTime < HOURS_CACHE_TTL) {
    return hoursCache;
  }

  try {
    const data = await fetchJson(
      `${LIBCAL_BASE}/api_hours_today.php?iid=${INSTITUTION_ID}&lid=0&format=json&systemTime=0`
    );
    hoursCache = parseLibraryHours(data);
    hoursCacheTime = Date.now();
    return hoursCache;
  } catch (err) {
    return null;
  }
}

/**
 * This week's hours grid for all Loyola library locations.
 * Resolves to { locations: [...] } (raw grid shape) or null on failure.
 */
export async function getLibraryHoursWeekly() {
  if (weeklyCache && Date.now() - weeklyCacheTime < HOURS_CACHE_TTL) {
    return weeklyCache;
  }

  try {
    const data = await fetchJson(
      `${LIBCAL_BASE}/api_hours_grid.php?iid=${INSTITUTION_ID}&format=json&weeks=1&systemTime=0`
    );
    weeklyCache = parseLibraryHoursWeekly(data);
    weeklyCacheTime = Date.now();
    return weeklyCache;
  } catch (err) {
    return null;
  }
}

/**
 * Upcoming campus events for the next `days` days (default 7).
 * Resolves to an array of shaped events, or [] on failure.
 */
export async function getEvents(days = 7) {
  const cacheKey = `events_${days}`;

  if (eventsCache[cacheKey] && Date.now() - eventsCache[cacheKey].time < EVENTS_CACHE_TTL) {
    return eventsCache[cacheKey].data;
  }

  try {
    // pp=100: a 14-day window can exceed 50 events; Localist caps per-page and
    // we don't paginate — one bigger page covers realistic windows.
    const data = await fetchJson(`${EVENTS_BASE}/events?days=${days}&pp=100`);
    const events = parseEvents(data);
    eventsCache[cacheKey] = { data: events, time: Date.now() };
    return events;
  } catch (err) {
    return [];
  }
}

/** Today's campus events. Resolves to an array (possibly empty). */
export async function getEventsToday() {
  return await getEvents(1);
}

// =============================================================================
// GEOCODING (Nominatim / OpenStreetMap) — F-Q7 home-address input.
// Keyless + CORS-open; fine at our volume (one call per address save, never
// per-render). Bias results toward Chicago so bare street addresses resolve.
// =============================================================================

/**
 * Autocomplete suggestions while typing an address (F: home-address autofill).
 * Returns up to 5 { latitude, longitude, displayName } rows, Chicago-biased.
 * Callers MUST debounce (>=400ms) — Nominatim's usage policy is 1 req/sec.
 * Never throws; [] on any failure.
 */
export async function suggestAddresses(query) {
  try {
    const q = String(query || '').trim();
    if (q.length < 4) return [];
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us' +
      '&email=johngeddes%40pm.me&addressdetails=0' +
      `&viewbox=-87.95,42.10,-87.50,41.60&bounded=0&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r) => ({
        latitude: Number(r.lat),
        longitude: Number(r.lon),
        displayName: r.display_name || '',
      }))
      .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && r.displayName);
  } catch (err) {
    return [];
  }
}

/**
 * Address string -> { latitude, longitude, displayName } | null.
 * Never throws.
 */
export async function geocodeAddress(address) {
  try {
    const q = String(address || '').trim();
    if (!q) return null;
    // email= is Nominatim's documented identifier for browser-side callers
    // (scripts can't set User-Agent there). Keep volume tiny: one call per
    // address save.
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us' +
      '&email=johngeddes%40pm.me' +
      `&viewbox=-87.95,42.10,-87.50,41.60&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.log('[geocode] HTTP', res.status);
      return null;
    }
    const rows = await res.json();
    const hit = Array.isArray(rows) ? rows[0] : null;
    if (!hit) {
      console.log('[geocode] empty result for query');
      return null;
    }
    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude, displayName: hit.display_name || q };
  } catch (err) {
    console.log('[geocode] failed:', err.message || String(err));
    return null;
  }
}

/** Test helper: clear all in-memory caches. */
export function _resetCampusApiCaches() {
  hoursCache = null;
  hoursCacheTime = 0;
  weeklyCache = null;
  weeklyCacheTime = 0;
  eventsCache = {};
}
