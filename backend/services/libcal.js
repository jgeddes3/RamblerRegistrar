// =============================================================================
// LibCal API — Loyola University Library Hours
// Institution ID: 3076
// No auth required
// =============================================================================

const LIBCAL_BASE = 'https://api3.libcal.com';
const INSTITUTION_ID = 3076;

let hoursCache = null;
let hoursCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let weeklyCache = null;
let weeklyCacheTime = 0;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`LibCal API error: ${response.status}`);
  return await response.json();
}

async function getLibraryHours() {
  // Return cache if fresh
  if (hoursCache && Date.now() - hoursCacheTime < CACHE_TTL) {
    return hoursCache;
  }

  const data = await fetchJson(
    `${LIBCAL_BASE}/api_hours_today.php?iid=${INSTITUTION_ID}&lid=0&format=json&systemTime=0`
  );

  // Transform to cleaner format
  const locations = (data.locations || []).map(loc => ({
    id: loc.lid,
    name: loc.name,
    category: loc.category,
    url: loc.url,
    hours: loc.times?.hours || [],
    status: loc.times?.status || 'unknown',
    note: loc.times?.note || null,
  }));

  hoursCache = { date: new Date().toISOString().split('T')[0], locations };
  hoursCacheTime = Date.now();

  return hoursCache;
}

async function getLibraryHoursWeekly() {
  if (weeklyCache && Date.now() - weeklyCacheTime < CACHE_TTL) {
    return weeklyCache;
  }

  const data = await fetchJson(
    `${LIBCAL_BASE}/api_hours_grid.php?iid=${INSTITUTION_ID}&format=json&weeks=1&systemTime=0`
  );

  weeklyCache = data;
  weeklyCacheTime = Date.now();

  return weeklyCache;
}

module.exports = { getLibraryHours, getLibraryHoursWeekly };
