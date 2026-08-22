import { calculateWalkTime, buildRouteLegs } from '../walk-route';

// Real campus anchors (approx): Cudahy Library and Damen Student Center are a
// few hundred meters apart on LSC; Corboy Law Center is on WTC ~11km south.
const CUDAHY = { id: 1, name: 'Cudahy Library', latitude: 42.0011, longitude: -87.6579 };
const DAMEN = { id: 2, name: 'Damen Student Center', latitude: 41.9995, longitude: -87.6608 };
const CORBOY = { id: 3, name: 'Corboy Law Center', latitude: 41.8970, longitude: -87.6263 };

describe('calculateWalkTime', () => {
  test('nearby buildings: short distance, small ceil-rounded minutes', () => {
    const res = calculateWalkTime(CUDAHY, DAMEN);
    expect(res.from).toBe('Cudahy Library');
    expect(res.to).toBe('Damen Student Center');
    // ~300m straight line * 1.3 walking factor -> roughly 350-500m
    expect(res.distance_m).toBeGreaterThan(250);
    expect(res.distance_m).toBeLessThan(600);
    expect(res.walk_minutes).toBe(Math.ceil(res.distance_m / 80));
  });

  test('cross-campus pair is an order of magnitude farther', () => {
    const res = calculateWalkTime(CUDAHY, CORBOY);
    expect(res.distance_m).toBeGreaterThan(10000);
  });

  test('missing endpoint returns null', () => {
    expect(calculateWalkTime(null, DAMEN)).toBeNull();
    expect(calculateWalkTime(CUDAHY, undefined)).toBeNull();
  });
});

describe('buildRouteLegs', () => {
  test('two stops produce one leg with matching totals', () => {
    const route = buildRouteLegs([CUDAHY, DAMEN]);
    expect(route.legs).toHaveLength(1);
    expect(route.legs[0].from).toBe('Cudahy Library');
    expect(route.legs[0].to).toBe('Damen Student Center');
    expect(route.totalDistanceM).toBe(route.legs[0].distance_m);
    expect(route.totalMinutes).toBe(route.legs[0].walk_minutes);
  });

  test('three stops chain into two legs and totals sum the legs', () => {
    const route = buildRouteLegs([CUDAHY, DAMEN, CORBOY]);
    expect(route.legs).toHaveLength(2);
    expect(route.legs[0].to).toBe('Damen Student Center');
    expect(route.legs[1].from).toBe('Damen Student Center');
    expect(route.totalDistanceM).toBe(
      route.legs[0].distance_m + route.legs[1].distance_m
    );
    expect(route.totalMinutes).toBe(
      route.legs[0].walk_minutes + route.legs[1].walk_minutes
    );
  });

  test('fewer than two stops means no legs and zero totals', () => {
    expect(buildRouteLegs([])).toEqual({ legs: [], totalDistanceM: 0, totalMinutes: 0 });
    expect(buildRouteLegs([CUDAHY])).toEqual({ legs: [], totalDistanceM: 0, totalMinutes: 0 });
    expect(buildRouteLegs(null)).toEqual({ legs: [], totalDistanceM: 0, totalMinutes: 0 });
  });

  test('stops without usable coordinates are skipped, chain stays connected', () => {
    const ghost = { id: 9, name: 'Ghost Hall', latitude: null, longitude: undefined };
    const route = buildRouteLegs([CUDAHY, ghost, DAMEN]);
    expect(route.legs).toHaveLength(1);
    expect(route.legs[0].from).toBe('Cudahy Library');
    expect(route.legs[0].to).toBe('Damen Student Center');
  });
});
