// Tests for route-utils.js — leg profiles (foot vs car) and the OSRM geometry
// fetcher. global.fetch is mocked throughout; no network access. Coordinate
// pairs are unique per network test because the module cache is module-level.

import { buildSegments, fetchRouteGeometry, routeForSegments } from '../route-utils';

const LSC_CUDAHY = { latitude: 41.9995, longitude: -87.658, campus: 'LSC' };
const LSC_MUNDELEIN = { latitude: 42.001, longitude: -87.6607, campus: 'LSC' }; // ~280 m away
const WTC_CORBOY = { latitude: 41.8969, longitude: -87.6262, campus: 'WTC' }; // ~11.6 km away
const HOME_NEAR = { latitude: 42.0005, longitude: -87.6565, campus: null }; // ~170 m from Cudahy
const HOME_FAR = { latitude: 41.95, longitude: -87.65, campus: null }; // ~5.5 km from Cudahy

const osrmBody = (coordinates) => ({ routes: [{ geometry: { coordinates } }] });
const okJson = (body) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

describe('buildSegments', () => {
  it('labels cross-campus legs as car', () => {
    const segs = buildSegments([LSC_CUDAHY, WTC_CORBOY]);
    expect(segs).toHaveLength(1);
    expect(segs[0].profile).toBe('car');
    expect(segs[0].from).toBe(LSC_CUDAHY);
    expect(segs[0].to).toBe(WTC_CORBOY);
  });

  it('labels differing campuses as car even when the points are close', () => {
    const segs = buildSegments([LSC_CUDAHY, { ...LSC_MUNDELEIN, campus: 'WTC' }]);
    expect(segs).toHaveLength(1);
    expect(segs[0].profile).toBe('car');
  });

  it('labels a far-away home leg as car', () => {
    const segs = buildSegments([HOME_FAR, LSC_CUDAHY]);
    expect(segs).toHaveLength(1);
    expect(segs[0].profile).toBe('car');
  });

  it('labels near-home and same-campus legs as foot', () => {
    const segs = buildSegments([HOME_NEAR, LSC_CUDAHY, LSC_MUNDELEIN]);
    expect(segs.map((s) => s.profile)).toEqual(['foot', 'foot']);
  });

  it('skips zero-length legs from repeated coordinates', () => {
    const segs = buildSegments([LSC_CUDAHY, { ...LSC_CUDAHY }, LSC_MUNDELEIN]);
    expect(segs).toHaveLength(1);
    expect(segs[0].to).toBe(LSC_MUNDELEIN);
  });

  it('returns [] for empty, single-point, or all-identical input', () => {
    expect(buildSegments([])).toEqual([]);
    expect(buildSegments([LSC_CUDAHY])).toEqual([]);
    expect(buildSegments([LSC_CUDAHY, { ...LSC_CUDAHY }])).toEqual([]);
    expect(buildSegments(null)).toEqual([]);
  });
});

describe('fetchRouteGeometry', () => {
  it('hits the foot service and converts [lon, lat] pairs', async () => {
    global.fetch = jest.fn(() =>
      okJson(osrmBody([[-87.658, 41.9995], [-87.6595, 42.0002], [-87.6607, 42.001]]))
    );
    const line = await fetchRouteGeometry(
      { latitude: 41.9995, longitude: -87.658 },
      { latitude: 42.001, longitude: -87.6607 },
      'foot'
    );
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('routing.openstreetmap.de/routed-foot/route/v1/foot/');
    expect(url).toContain('-87.658,41.9995;-87.6607,42.001');
    expect(url).toContain('overview=full&geometries=geojson');
    expect(line).toEqual([
      { latitude: 41.9995, longitude: -87.658 },
      { latitude: 42.0002, longitude: -87.6595 },
      { latitude: 42.001, longitude: -87.6607 },
    ]);
  });

  it('hits the car service for the car profile', async () => {
    global.fetch = jest.fn(() => okJson(osrmBody([[-87.658, 41.9995], [-87.6262, 41.8969]])));
    await fetchRouteGeometry(
      { latitude: 41.9995, longitude: -87.658 },
      { latitude: 41.8969, longitude: -87.6262 },
      'car'
    );
    expect(global.fetch.mock.calls[0][0]).toContain('routing.openstreetmap.de/routed-car/route/v1/car/');
  });

  it('resolves null on a non-ok response', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 429 }));
    const line = await fetchRouteGeometry(
      { latitude: 41.9, longitude: -87.61 },
      { latitude: 41.91, longitude: -87.62 },
      'foot'
    );
    expect(line).toBeNull();
  });

  it('resolves null on a network error', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network down')));
    const line = await fetchRouteGeometry(
      { latitude: 41.92, longitude: -87.63 },
      { latitude: 41.93, longitude: -87.64 },
      'car'
    );
    expect(line).toBeNull();
  });

  it('resolves null on a malformed body', async () => {
    global.fetch = jest.fn(() => okJson({ routes: [] }));
    const line = await fetchRouteGeometry(
      { latitude: 41.94, longitude: -87.63 },
      { latitude: 41.945, longitude: -87.64 },
      'foot'
    );
    expect(line).toBeNull();
  });

  it('caches successful results by coordinates and profile', async () => {
    global.fetch = jest.fn(() => okJson(osrmBody([[-87.66, 41.96], [-87.67, 41.97]])));
    const from = { latitude: 41.96, longitude: -87.66 };
    const to = { latitude: 41.97, longitude: -87.67 };
    const first = await fetchRouteGeometry(from, to, 'foot');
    const second = await fetchRouteGeometry(from, to, 'foot');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});

describe('routeForSegments', () => {
  it('falls back to the straight line when routing fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network down')));
    const out = await routeForSegments([
      {
        from: { latitude: 41.5, longitude: -87.5, campus: null },
        to: { latitude: 41.6, longitude: -87.6, campus: 'LSC' },
        profile: 'foot',
      },
    ]);
    expect(out).toEqual([
      {
        profile: 'foot',
        coords: [
          { latitude: 41.5, longitude: -87.5 },
          { latitude: 41.6, longitude: -87.6 },
        ],
      },
    ]);
  });

  it('returns fetched geometry with the segment profile', async () => {
    global.fetch = jest.fn(() => okJson(osrmBody([[-87.7, 41.7], [-87.71, 41.71], [-87.72, 41.72]])));
    const out = await routeForSegments([
      {
        from: { latitude: 41.7, longitude: -87.7 },
        to: { latitude: 41.72, longitude: -87.72 },
        profile: 'car',
      },
    ]);
    expect(out[0].profile).toBe('car');
    expect(out[0].coords).toEqual([
      { latitude: 41.7, longitude: -87.7 },
      { latitude: 41.71, longitude: -87.71 },
      { latitude: 41.72, longitude: -87.72 },
    ]);
  });
});
