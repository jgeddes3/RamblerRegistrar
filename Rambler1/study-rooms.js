// study-rooms.js — where study rooms can be booked (F-Q8). Pure.
// LibCal's booking flow needs a Loyola login, so the app deep-links straight
// into the official picker for each location (lids from
// backend/services/studyrooms.js). One list for both places that offer
// booking: Library Hours and Home's library card.
export const STUDY_ROOM_LOCATIONS = [
  { name: 'Information Commons', campus: 'LSC', lid: 10019 },
  { name: 'Cudahy Library', campus: 'LSC', lid: 10022 },
  { name: 'Lewis Library', campus: 'WTC', lid: 10020 },
  { name: 'Schreiber Center', campus: 'WTC', lid: 10021 },
];

export const bookingUrl = (lid) => `https://libcal.luc.edu/spaces?lid=${lid}`;

// LibCal's hours feed and the booking lids name locations slightly differently
// ("Cudahy Library" vs "Cudahy"), so match when either name contains the other.
export function bookableFor(locName) {
  const n = String(locName || '').trim().toLowerCase();
  if (!n) return null;
  return STUDY_ROOM_LOCATIONS.find((b) => {
    const bn = b.name.toLowerCase();
    return n.includes(bn) || bn.includes(n);
  }) || null;
}
