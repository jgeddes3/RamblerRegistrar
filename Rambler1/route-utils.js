// route-utils.js — route GEOMETRY for the Day Map polylines (F-Q7).
// Zero react imports. Feasibility math (the 60-minute LSC<->WTC budget) lives
// in commute-utils; this module only decides HOW each leg is drawn — walking
// vs driving — and pulls the actual street path from OSRM.
//
// Routing: the public OSRM demo at routing.openstreetmap.de. Volume is tiny —
// a handful of segments per map view, cached for the session — well inside
// the demo server's fair-use policy.

import { haversineMeters, WALKABLE_METERS } from './commute-utils';

const OSRM_BASE = 'https://routing.openstreetmap.de';
const TIMEOUT_MS = 6000;

/**
 * points: [{ latitude, longitude, campus }] in visit order (campus is null
 * for home). Returns [{ from, to, profile }] for consecutive distinct points;
 * zero-length legs (repeated coordinates) are skipped. profile is 'car' when
 * the leg crosses campuses (LSC<->WTC) or is beyond a plausible walk (a
 * far-away home); otherwise 'foot'.
 */
export function buildSegments(points) {
  const pts = (points || []).filter(
    (p) => p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
  );
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const from = out.length ? out[out.length - 1].to : pts[0];
    const to = pts[i];
    if (to.latitude === from.latitude && to.longitude === from.longitude) continue;
    const crossCampus = !!(from.campus && to.campus && from.campus !== to.campus);
    const meters = haversineMeters(from.latitude, from.longitude, to.latitude, to.longitude);
    out.push({ from, to, profile: crossCampus || meters > WALKABLE_METERS ? 'car' : 'foot' });
  }
  return out;
}

const geometryCache = new Map();

const cacheKey = (from, to, profile) =>
  `${Number(from.latitude).toFixed(5)},${Number(from.longitude).toFixed(5)};` +
  `${Number(to.latitude).toFixed(5)},${Number(to.longitude).toFixed(5)};${profile}`;

/**
 * Street path between two points. Resolves [{ latitude, longitude }], or null
 * on ANY failure (timeout, HTTP error, malformed body) — callers fall back to
 * a straight line. Successes are cached for the session; failures are not, so
 * a flaky request can retry on the next render.
 */
export async function fetchRouteGeometry(from, to, profile) {
  const key = cacheKey(from, to, profile);
  if (geometryCache.has(key)) return geometryCache.get(key);

  const service = profile === 'car' ? 'routed-car/route/v1/car' : 'routed-foot/route/v1/foot';
  const url =
    `${OSRM_BASE}/${service}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    '?overview=full&geometries=geojson';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || !coords.length) return null;
    const line = coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
    geometryCache.set(key, line);
    return line;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Geometry for every segment, fetched in parallel. Each item is
 * { profile, coords }; coords falls back to the straight from->to line when
 * routing failed.
 */
export function routeForSegments(segments) {
  return Promise.all(
    (segments || []).map(async ({ from, to, profile }) => {
      const line = await fetchRouteGeometry(from, to, profile);
      return {
        profile,
        coords: line || [
          { latitude: from.latitude, longitude: from.longitude },
          { latitude: to.latitude, longitude: to.longitude },
        ],
      };
    })
  );
}
