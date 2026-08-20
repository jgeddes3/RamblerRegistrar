import {
  RED_LINE_STATIONS, CAMPUS_STATIONS, nearestStation, transitEstimate, rideMinutes,
  groupArrivalsBothWays,
} from '../cta';
import { haversineMeters, walkMinutesFromMeters } from '../commute-utils';

// Real-ish coordinates: homes off-station, buildings from each campus.
const ROGERS_PARK_HOME = { latitude: 42.008, longitude: -87.666 }; // steps from Morse
const ANDERSONVILLE_HOME = { latitude: 41.978, longitude: -87.6685 }; // nearest: Berwyn
const CUNEO_LSC = { name: 'Cuneo Hall', latitude: 41.999, longitude: -87.657, campus: 'LSC' };
const CORBOY_WTC = { name: 'Corboy Law Center', latitude: 41.897, longitude: -87.626, campus: 'WTC' };

const byMapId = (id) => RED_LINE_STATIONS.find((s) => s.mapId === id);

describe('RED_LINE_STATIONS / CAMPUS_STATIONS', () => {
  test('full line, Howard through 95th, in track order', () => {
    expect(RED_LINE_STATIONS).toHaveLength(33);
    expect(RED_LINE_STATIONS[0].name).toBe('Howard');
    expect(RED_LINE_STATIONS[32].name).toBe('95th/Dan Ryan');
  });

  test('campus stations are Loyola (41300) and Chicago (41450)', () => {
    expect(CAMPUS_STATIONS.LSC.mapId).toBe(41300);
    expect(CAMPUS_STATIONS.LSC.name).toBe('Loyola');
    expect(CAMPUS_STATIONS.WTC.mapId).toBe(41450);
    expect(CAMPUS_STATIONS.WTC.name).toBe('Chicago');
  });
});

describe('nearestStation', () => {
  test('a point on a station picks that station at ~0 meters', () => {
    const loyola = byMapId(41300);
    const { station, meters } = nearestStation(loyola.latitude, loyola.longitude);
    expect(station.mapId).toBe(41300);
    expect(meters).toBeLessThan(1);
  });

  test('Rogers Park home -> Morse', () => {
    const { station } = nearestStation(ROGERS_PARK_HOME.latitude, ROGERS_PARK_HOME.longitude);
    expect(station.name).toBe('Morse');
  });

  test('Andersonville home -> Berwyn', () => {
    const { station } = nearestStation(ANDERSONVILLE_HOME.latitude, ANDERSONVILLE_HOME.longitude);
    expect(station.name).toBe('Berwyn');
  });
});

describe('transitEstimate', () => {
  test('null on missing inputs', () => {
    expect(transitEstimate()).toBeNull();
    expect(transitEstimate({ home: null, building: CUNEO_LSC })).toBeNull();
    expect(transitEstimate({ home: ROGERS_PARK_HOME, building: null })).toBeNull();
    expect(transitEstimate({ home: { latitude: 'x' }, building: CUNEO_LSC })).toBeNull();
    expect(transitEstimate({ home: ROGERS_PARK_HOME, building: { name: 'No coords' } })).toBeNull();
  });

  test('Rogers Park -> WTC: Morse to Chicago, southbound, total = walk + ride + walk', () => {
    const t = transitEstimate({ home: ROGERS_PARK_HOME, building: CORBOY_WTC });
    expect(t.fromStation.mapId).toBe(40100); // Morse
    expect(t.toStation.mapId).toBe(41450); // Chicago
    expect(t.direction).toBe('95th-bound');
    // Morse (index 2) -> Chicago (index 17): 15 stops
    expect(t.rideMin).toBe(rideMinutes(15));
    expect(t.rideMin).toBe(35);
    const walkTo = walkMinutesFromMeters(haversineMeters(
      ROGERS_PARK_HOME.latitude, ROGERS_PARK_HOME.longitude,
      t.fromStation.latitude, t.fromStation.longitude
    ));
    const walkFrom = walkMinutesFromMeters(haversineMeters(
      t.toStation.latitude, t.toStation.longitude,
      CORBOY_WTC.latitude, CORBOY_WTC.longitude
    ));
    expect(t.walkToStationMin).toBe(walkTo);
    expect(t.walkFromStationMin).toBe(walkFrom);
    expect(t.totalMin).toBe(walkTo + t.rideMin + walkFrom);
  });

  test('Andersonville -> LSC: Berwyn to Loyola, northbound', () => {
    const t = transitEstimate({ home: ANDERSONVILLE_HOME, building: CUNEO_LSC });
    expect(t.fromStation.mapId).toBe(40340); // Berwyn
    expect(t.toStation.mapId).toBe(41300); // Loyola
    expect(t.direction).toBe('Howard-bound');
    // Berwyn (index 7) -> Loyola (index 3): 4 stops
    expect(t.rideMin).toBe(rideMinutes(4));
    expect(t.rideMin).toBe(11);
    expect(t.totalMin).toBe(t.walkToStationMin + t.rideMin + t.walkFromStationMin);
  });

  test('ride heuristic is strictly monotonic in stop count', () => {
    for (let n = 1; n < RED_LINE_STATIONS.length; n++) {
      expect(rideMinutes(n)).toBeGreaterThan(rideMinutes(n - 1));
    }
  });

  test('home beside the campus station -> walking-dominant shape (no ride)', () => {
    const loyola = byMapId(41300);
    const home = { latitude: loyola.latitude + 0.0004, longitude: loyola.longitude };
    const t = transitEstimate({ home, building: CUNEO_LSC });
    expect(t.fromStation.mapId).toBe(41300);
    expect(t.toStation.mapId).toBe(41300);
    expect(t.rideMin).toBe(0);
    expect(t.direction).toBeNull();
    expect(t.totalMin).toBe(t.walkToStationMin + t.walkFromStationMin);
  });
});

describe('getTrainArrivals', () => {
  const realFetch = global.fetch;
  const realKey = process.env.EXPO_PUBLIC_CTA_TRAIN_KEY;

  // Fresh module per test: getTrainArrivals reads the key at call time but
  // keeps a 60s in-module cache we don't want leaking across tests.
  const freshCta = () => {
    jest.resetModules();
    return require('../cta'); // eslint-disable-line global-require
  };

  afterEach(() => {
    global.fetch = realFetch;
    if (realKey === undefined) delete process.env.EXPO_PUBLIC_CTA_TRAIN_KEY;
    else process.env.EXPO_PUBLIC_CTA_TRAIN_KEY = realKey;
    jest.resetModules();
  });

  const PAYLOAD = {
    ctatt: {
      eta: [
        { rt: 'Red', destNm: '95th/Dan Ryan', trDr: '5', arrT: '2026-07-10T08:05:00', prdt: '2026-07-10T08:00:00' },
        { rt: 'P', destNm: 'Linden', trDr: '1', arrT: '2026-07-10T08:07:00', prdt: '2026-07-10T08:00:00' },
        { rt: 'Red', destNm: 'Howard', trDr: '1', arrT: '2026-07-10T08:12:00', prdt: '2026-07-10T08:00:00' },
      ],
    },
  };

  test('resolves [] without a key and never fetches', async () => {
    delete process.env.EXPO_PUBLIC_CTA_TRAIN_KEY;
    global.fetch = jest.fn();
    const cta = freshCta();
    await expect(cta.getTrainArrivals(41300)).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('parses a mocked payload with a key, Red Line rows only', async () => {
    process.env.EXPO_PUBLIC_CTA_TRAIN_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ json: async () => PAYLOAD });
    const cta = freshCta();
    const rows = await cta.getTrainArrivals(41300);
    expect(rows).toEqual([
      { line: 'Red', destination: '95th/Dan Ryan', trDr: '5', arrivalMin: 5 },
      { line: 'Red', destination: 'Howard', trDr: '1', arrivalMin: 12 },
    ]);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('key=test-key');
    expect(url).toContain('mapid=41300');
    expect(url).toContain('max=3');
    expect(url).toContain('outputType=JSON');
  });

  test('60s cache: second call reuses the first fetch', async () => {
    process.env.EXPO_PUBLIC_CTA_TRAIN_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ json: async () => PAYLOAD });
    const cta = freshCta();
    const first = await cta.getTrainArrivals(41300);
    const second = await cta.getTrainArrivals(41300);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  test('resolves [] when fetch rejects', async () => {
    process.env.EXPO_PUBLIC_CTA_TRAIN_KEY = 'test-key';
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const cta = freshCta();
    await expect(cta.getTrainArrivals(41300)).resolves.toEqual([]);
  });

  test('resolves [] on a malformed payload', async () => {
    process.env.EXPO_PUBLIC_CTA_TRAIN_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ nope: true }) });
    const cta = freshCta();
    await expect(cta.getTrainArrivals(41300)).resolves.toEqual([]);
  });
});

describe('groupArrivalsBothWays', () => {
  const row = (destination, trDr, arrivalMin) => ({ line: 'Red', destination, trDr, arrivalMin });

  test('always returns BOTH directions in fixed order, Howard first, minutes ascending', () => {
    const out = groupArrivalsBothWays([
      row('95th/Dan Ryan', '5', 9),
      row('Howard', '1', 4),
      row('95th/Dan Ryan', '5', 2),
      row('Howard', '1', 12),
    ]);
    expect(out).toEqual([
      { destination: 'Howard', minutes: [4, 12] },
      { destination: '95th/Dan Ryan', minutes: [2, 9] },
    ]);
  });

  test('a direction with no trains still gets its (empty) row', () => {
    const out = groupArrivalsBothWays([row('95th/Dan Ryan', '5', 7)]);
    expect(out).toEqual([
      { destination: 'Howard', minutes: [] },
      { destination: '95th/Dan Ryan', minutes: [7] },
    ]);
  });

  test('short-turn southbound destinations group south; missing trDr falls back to text', () => {
    const out = groupArrivalsBothWays([
      row('Roosevelt', '5', 6), // southbound short-turn
      { line: 'Red', destination: 'Howard', arrivalMin: 3 }, // no trDr -> text match
      { line: 'Red', destination: '63rd', arrivalMin: 11 }, // no trDr, not Howard -> south
    ]);
    expect(out).toEqual([
      { destination: 'Howard', minutes: [3] },
      { destination: '95th/Dan Ryan', minutes: [6, 11] },
    ]);
  });

  test('caps each direction at perDirection and drops non-finite rows', () => {
    const north = [9, 2, 15, 21].map((m) => row('Howard', '1', m));
    const out = groupArrivalsBothWays([...north, row('Howard', '1', NaN)], 3);
    expect(out[0]).toEqual({ destination: 'Howard', minutes: [2, 9, 15] });
  });

  test('no usable rows at all -> [] (keyless/unavailable state preserved)', () => {
    expect(groupArrivalsBothWays([])).toEqual([]);
    expect(groupArrivalsBothWays(null)).toEqual([]);
    expect(groupArrivalsBothWays([{ line: 'Red', destination: 'Howard' }])).toEqual([]);
  });
});
