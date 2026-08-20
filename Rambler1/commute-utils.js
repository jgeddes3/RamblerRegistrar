// commute-utils.js — PURE commute/feasibility math for the Schedule Map view
// (F-Q7). Zero react/firebase imports.
//
// Two campuses ~8 miles apart change the math completely: a 15-minute gap
// between classes is fine on one campus and PHYSICALLY IMPOSSIBLE across
// campuses. Intercampus budget (researched 2026-07-08): the Loyola shuttle
// runs a continuous LSC<->WTC loop at 20–30 min headways (weekdays 7am–12:10am),
// ride ~30 min + walks — call it 60 minutes door-to-door. CTA Red Line is
// comparable. A gap under that is flagged impossible, not merely tight.

export const INTERCAMPUS_MINUTES = 60;
export const HOME_BUFFER_MINUTES = 5; // pack up, find the room
export const PREP_MINUTES = 30; // wake-up -> out the door
export const WALKABLE_METERS = 2500; // beyond this, walking-time estimates are fiction

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const walkMinutesFromMeters = (m) => Math.round((m * 1.3) / 80);

// Longest-name partial match (same heuristic ScheduleScreen uses): section
// rows carry strings like 'Life Science Building-Room 412'.
export function matchBuilding(buildings, raw) {
  if (!raw || !Array.isArray(buildings) || !buildings.length) return null;
  const needle = String(raw).toLowerCase().trim();
  if (!needle) return null;
  let best = null;
  for (const b of buildings) {
    const name = String(b.name || '').toLowerCase();
    if (!name) continue;
    if (needle.includes(name) || name.includes(needle)) {
      if (!best || name.length > String(best.name).length) best = b;
    }
  }
  return best;
}

export function campusOf(rawBuilding, buildings) {
  const b = matchBuilding(buildings, rawBuilding);
  return (b && b.campus) || null;
}

/**
 * Feasibility of each transition in one day's blocks (sorted by startMin;
 * shape from schedule-utils.sectionsToBlocks). Returns
 * [{ from, to, gapMin, neededMin|null, mode: 'walk'|'shuttle'|'unknown',
 *    status: 'ok'|'tight'|'impossible'|'unknown' }].
 * - Same campus (or campus unknown on either end): walking model. Short gap
 *   is 'tight' — you can hustle a walk.
 * - Different campuses: shuttle model. gap < INTERCAMPUS_MINUTES is
 *   'impossible' — no amount of hustle beats 8 miles.
 */
export function dayTransitions(dayBlocks, buildings) {
  const sorted = [...(dayBlocks || [])].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const out = [];
  for (let i = 1; i < sorted.length; i++) {
    const from = sorted[i - 1];
    const to = sorted[i];
    const gapMin = to.startMin - from.endMin;
    const fromB = matchBuilding(buildings, from.section?.building);
    const toB = matchBuilding(buildings, to.section?.building);

    if (!fromB || !toB) {
      out.push({ from, to, gapMin, neededMin: null, mode: 'unknown', status: 'unknown' });
      continue;
    }
    const crossCampus = fromB.campus && toB.campus && fromB.campus !== toB.campus;
    if (crossCampus) {
      out.push({
        from, to, gapMin,
        neededMin: INTERCAMPUS_MINUTES,
        mode: 'shuttle',
        status: gapMin >= INTERCAMPUS_MINUTES ? 'ok' : 'impossible',
      });
      continue;
    }
    const sameSpot = fromB.id === toB.id;
    const neededMin = sameSpot
      ? 0
      : walkMinutesFromMeters(haversineMeters(fromB.latitude, fromB.longitude, toB.latitude, toB.longitude));
    out.push({
      from, to, gapMin, neededMin,
      mode: 'walk',
      status: gapMin >= neededMin ? 'ok' : 'tight',
    });
  }
  return out;
}

// 8-RIDE (Loyola's evening safety ride service at LSC): 6:30 PM – 2:30 AM,
// campus + Rogers Park. Surface the card when the day's last class ends at or
// after this line (researched 2026-07-08; booking = TripShot app or phone).
export const EVENING_RIDE_START_MIN = 18 * 60 + 30;
export const EVENING_RIDE_PHONE = '773-508-7433';

export function endsInEvening(dayBlocks) {
  const blocks = dayBlocks || [];
  if (!blocks.length) return false;
  const lastEnd = Math.max(...blocks.map((b) => b.endMin || 0));
  return lastEnd >= EVENING_RIDE_START_MIN;
}

/**
 * Home -> first class of the day. home = { latitude, longitude } (the user's
 * primary saved location). Returns null when there's no home or no classes;
 * else { mode: 'walk'|'far', meters, minutes|null, leaveByMin|null,
 *        wakeByMin|null, firstBlock }.
 * 'far' = beyond a plausible walk — we won't invent a transit estimate
 * (future: CTA bus/train times; see PROJECT_PLAN).
 */
export function homeCommute(home, dayBlocks, buildings) {
  if (!home || !Number.isFinite(Number(home.latitude)) || !Number.isFinite(Number(home.longitude))) return null;
  const sorted = [...(dayBlocks || [])].sort((a, b) => a.startMin - b.startMin);
  const firstBlock = sorted[0];
  if (!firstBlock) return null;
  const b = matchBuilding(buildings, firstBlock.section?.building);
  if (!b || !Number.isFinite(b.latitude)) return null;

  const meters = haversineMeters(Number(home.latitude), Number(home.longitude), b.latitude, b.longitude);
  if (meters > WALKABLE_METERS) {
    return { mode: 'far', meters, minutes: null, leaveByMin: null, wakeByMin: null, firstBlock };
  }
  const minutes = walkMinutesFromMeters(meters);
  const leaveByMin = firstBlock.startMin - minutes - HOME_BUFFER_MINUTES;
  return {
    mode: 'walk',
    meters,
    minutes,
    leaveByMin,
    wakeByMin: leaveByMin - PREP_MINUTES,
    firstBlock,
  };
}
