// walk-route.js — pure walk-time math shared by firestore-data.js (commute
// times) and the campus map's route builder. Zero React / Firebase imports.
// The distance model is the verbatim port of backend/walktime.js: haversine
// meters * 1.3 walking factor, 80 m/min, minutes rounded up.

// Haversine formula: distance in meters between two GPS coordinates
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate walk time between two places — returns { from, to, distance_m, walk_minutes }
export function calculateWalkTime(buildingA, buildingB) {
  if (!buildingA || !buildingB) return null;

  const straightLine = haversineDistance(
    buildingA.latitude, buildingA.longitude,
    buildingB.latitude, buildingB.longitude
  );

  // Walking factor: paths aren't straight lines, multiply by 1.3
  const walkingDistance = straightLine * 1.3;

  // Average walking speed: 80 meters per minute
  const walkMinutes = Math.ceil(walkingDistance / 80);

  return {
    from: buildingA.name,
    to: buildingB.name,
    distance_m: Math.round(walkingDistance),
    walk_minutes: walkMinutes,
  };
}

const hasCoords = (p) =>
  p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude));

/**
 * Chain an ordered list of stops (buildings) into route legs.
 * Stops without usable coordinates are skipped; the chain connects across
 * them. Returns { legs: [{ from, to, distance_m, walk_minutes }],
 * totalDistanceM, totalMinutes } — empty legs and zero totals below 2 stops.
 */
export function buildRouteLegs(stops) {
  const usable = (Array.isArray(stops) ? stops : []).filter(hasCoords);
  const legs = [];
  for (let i = 1; i < usable.length; i++) {
    const leg = calculateWalkTime(usable[i - 1], usable[i]);
    if (leg) legs.push(leg);
  }
  return {
    legs,
    totalDistanceM: legs.reduce((sum, l) => sum + l.distance_m, 0),
    totalMinutes: legs.reduce((sum, l) => sum + l.walk_minutes, 0),
  };
}
