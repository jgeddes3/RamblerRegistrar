// cta.js — CTA Red Line transit math + live arrivals for the Day Map commute
// card. Pure data/fetch, zero react imports; walking math reuses commute-utils.
//
// Station list hardcoded from the City of Chicago "CTA L stops" open dataset
// (resource 8pix-ypme, red=true, fetched 2026-07-10; stop rows deduped to
// parent stations by map_id). No runtime dependency on that endpoint.
// Array order IS track order, Howard (north) -> 95th/Dan Ryan (south) —
// direction and stops-between math depend on it.

import { haversineMeters, walkMinutesFromMeters } from './commute-utils';

export const RED_LINE_STATIONS = [
  { name: 'Howard', mapId: 40900, latitude: 42.019063, longitude: -87.672892 },
  { name: 'Jarvis', mapId: 41190, latitude: 42.015876, longitude: -87.669092 },
  { name: 'Morse', mapId: 40100, latitude: 42.008362, longitude: -87.665909 },
  { name: 'Loyola', mapId: 41300, latitude: 42.001073, longitude: -87.661061 },
  { name: 'Granville', mapId: 40760, latitude: 41.993664, longitude: -87.659202 },
  { name: 'Thorndale', mapId: 40880, latitude: 41.990259, longitude: -87.659076 },
  { name: 'Bryn Mawr', mapId: 41380, latitude: 41.983504, longitude: -87.65884 },
  { name: 'Berwyn', mapId: 40340, latitude: 41.977984, longitude: -87.658668 },
  { name: 'Argyle', mapId: 41200, latitude: 41.973453, longitude: -87.65853 },
  { name: 'Lawrence', mapId: 40770, latitude: 41.969139, longitude: -87.658493 },
  { name: 'Wilson', mapId: 40540, latitude: 41.964273, longitude: -87.657588 },
  { name: 'Sheridan', mapId: 40080, latitude: 41.953775, longitude: -87.654929 },
  { name: 'Addison', mapId: 41420, latitude: 41.947428, longitude: -87.653626 },
  { name: 'Belmont', mapId: 41320, latitude: 41.939751, longitude: -87.65338 },
  { name: 'Fullerton', mapId: 41220, latitude: 41.925051, longitude: -87.652866 },
  { name: 'North/Clybourn', mapId: 40650, latitude: 41.910655, longitude: -87.649177 },
  { name: 'Clark/Division', mapId: 40630, latitude: 41.90392, longitude: -87.631412 },
  { name: 'Chicago', mapId: 41450, latitude: 41.896671, longitude: -87.628176 },
  { name: 'Grand', mapId: 40330, latitude: 41.891665, longitude: -87.628021 },
  { name: 'Lake', mapId: 41660, latitude: 41.884809, longitude: -87.627813 },
  { name: 'Monroe', mapId: 41090, latitude: 41.880745, longitude: -87.627696 },
  { name: 'Jackson', mapId: 40560, latitude: 41.878153, longitude: -87.627596 },
  { name: 'Harrison', mapId: 41490, latitude: 41.874039, longitude: -87.627479 },
  { name: 'Roosevelt', mapId: 41400, latitude: 41.867368, longitude: -87.627402 },
  { name: 'Cermak-Chinatown', mapId: 41000, latitude: 41.853206, longitude: -87.630968 },
  { name: 'Sox-35th', mapId: 40190, latitude: 41.831191, longitude: -87.630636 },
  { name: '47th', mapId: 41230, latitude: 41.810318, longitude: -87.63094 },
  { name: 'Garfield', mapId: 41170, latitude: 41.79542, longitude: -87.631157 },
  { name: '63rd', mapId: 40910, latitude: 41.780536, longitude: -87.630952 },
  { name: '69th', mapId: 40990, latitude: 41.768367, longitude: -87.625724 },
  { name: '79th', mapId: 40240, latitude: 41.750419, longitude: -87.625112 },
  { name: '87th', mapId: 41430, latitude: 41.735372, longitude: -87.624717 },
  { name: '95th/Dan Ryan', mapId: 40450, latitude: 41.722377, longitude: -87.624342 },
];

const stationByMapId = (mapId) => RED_LINE_STATIONS.find((s) => s.mapId === mapId);

// LSC is served by Loyola (41300), WTC by Chicago (41450).
export const CAMPUS_STATIONS = {
  LSC: stationByMapId(41300),
  WTC: stationByMapId(41450),
};

export function nearestStation(lat, lon) {
  let best = null;
  let bestMeters = Infinity;
  for (const station of RED_LINE_STATIONS) {
    const m = haversineMeters(lat, lon, station.latitude, station.longitude);
    if (m < bestMeters) {
      best = station;
      bestMeters = m;
    }
  }
  return { station: best, meters: bestMeters };
}

// Scheduled-ride approximation: about 2.2 min per stop-to-stop hop plus 2 min
// of board/dwell slack (calibrated so Loyola->Chicago lands near the CTA's
// published ~30 min). Real headways/delays belong to the live arrivals path.
export const rideMinutes = (stopsBetween) => Math.round(stopsBetween * 2.2 + 2);

/**
 * Red Line door-to-door estimate. home = { latitude, longitude }, building =
 * a buildings row { latitude, longitude, campus }. Returns null when either
 * side is missing/unusable; else { walkToStationMin, rideMin,
 * walkFromStationMin, totalMin, fromStation, toStation,
 * direction: '95th-bound'|'Howard-bound'|null }.
 * When home's nearest station IS the campus station there is no ride:
 * rideMin 0, direction null, total = the two walk legs.
 */
export function transitEstimate({ home, building } = {}) {
  if (!home || !building) return null;
  const hLat = Number(home.latitude);
  const hLon = Number(home.longitude);
  const bLat = Number(building.latitude);
  const bLon = Number(building.longitude);
  if (![hLat, hLon, bLat, bLon].every(Number.isFinite)) return null;

  const from = nearestStation(hLat, hLon);
  const toStation = CAMPUS_STATIONS[building.campus] || nearestStation(bLat, bLon).station;
  const fromStation = from.station;

  const walkToStationMin = walkMinutesFromMeters(from.meters);
  const walkFromStationMin = walkMinutesFromMeters(
    haversineMeters(toStation.latitude, toStation.longitude, bLat, bLon)
  );

  const fromIdx = RED_LINE_STATIONS.indexOf(fromStation);
  const toIdx = RED_LINE_STATIONS.indexOf(toStation);
  const stopsBetween = Math.abs(toIdx - fromIdx);
  const rideMin = stopsBetween === 0 ? 0 : rideMinutes(stopsBetween);
  const direction = stopsBetween === 0 ? null : toIdx > fromIdx ? '95th-bound' : 'Howard-bound';

  return {
    walkToStationMin,
    rideMin,
    walkFromStationMin,
    totalMin: walkToStationMin + rideMin + walkFromStationMin,
    fromStation,
    toStation,
    direction,
  };
}

// ---- Live arrivals (CTA Train Tracker) --------------------------------------
// Optional: only used when the user has provisioned a Train Tracker key as
// EXPO_PUBLIC_CTA_TRAIN_KEY (Expo inlines EXPO_PUBLIC_* at build time). With
// no key we resolve [] immediately — the card simply omits the arrivals line.

const ARRIVALS_TTL_MS = 60 * 1000;
const arrivalsCache = new Map(); // `${mapId}:${max}` -> { at, rows }

// Train Tracker timestamps come as ISO ("2026-07-10T08:05:00") or legacy
// "yyyyMMdd HH:mm:ss".
function parseCtaTime(s) {
  if (!s) return NaN;
  const iso = /^\d{8} /.test(s)
    ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9)}`
    : s;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

// Arrival rows -> BOTH Red Line directions in fixed order (Howard first, then
// 95th/Dan Ryan) for the Home "Your train" tile — a direction with no trains
// in the window still gets its row (empty minutes), so the tile always shows
// both ways. Direction comes from the API's trDr code (1 = Howard-bound,
// 5 = 95th-bound); rows missing trDr fall back to the destination text
// (Red Line short-turns like "Roosevelt"/"63rd" are all southbound).
// Returns [] when there are no usable rows at all (keyless / API down), so
// callers can keep their unavailable state.
export function groupArrivalsBothWays(rows, perDirection = 3) {
  const north = [];
  const south = [];
  for (const r of rows || []) {
    if (!r || !Number.isFinite(r.arrivalMin)) continue;
    const dr = String(r.trDr || '');
    const isNorth = dr === '1' || (!dr && /howard/i.test(r.destination || ''));
    (isNorth ? north : south).push(r.arrivalMin);
  }
  if (!north.length && !south.length) return [];
  const trim = (mins) => [...mins].sort((a, b) => a - b).slice(0, perDirection);
  return [
    { destination: 'Howard', minutes: trim(north) },
    { destination: '95th/Dan Ryan', minutes: trim(south) },
  ];
}

export async function getTrainArrivals(mapId, max = 3) {
  const key = process.env.EXPO_PUBLIC_CTA_TRAIN_KEY || null;
  if (!key || !mapId) return [];

  const cacheKey = `${mapId}:${max}`;
  const hit = arrivalsCache.get(cacheKey);
  if (hit && Date.now() - hit.at < ARRIVALS_TTL_MS) return hit.rows;

  try {
    // https required: iOS ATS and Android cleartext policies block plain http
    // in production builds (verified the endpoint serves https, 2026-07-10).
    const url =
      'https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx' +
      `?key=${encodeURIComponent(key)}&mapid=${mapId}&max=${max}&outputType=JSON`;
    const res = await fetch(url);
    const json = await res.json();
    const etas = Array.isArray(json?.ctatt?.eta) ? json.ctatt.eta : [];
    const rows = [];
    for (const e of etas) {
      if (e?.rt !== 'Red') continue;
      // Countdown = predicted arrival minus prediction-generated time (we just
      // fetched, so prdt is "now" without trusting the device clock).
      const arrivalMs = parseCtaTime(e.arrT) - parseCtaTime(e.prdt);
      if (!Number.isFinite(arrivalMs)) continue;
      rows.push({
        line: 'Red',
        destination: e.destNm || '',
        trDr: e.trDr || '', // 1 = Howard-bound, 5 = 95th-bound
        arrivalMin: Math.max(0, Math.round(arrivalMs / 60000)),
      });
    }
    arrivalsCache.set(cacheKey, { at: Date.now(), rows });
    return rows;
  } catch (err) {
    return [];
  }
}
