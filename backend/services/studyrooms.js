// =============================================================================
// LibCal Study Room Availability — Loyola University Chicago
// Institution ID: 3076
// No auth needed to VIEW availability (booking requires Loyola login)
// =============================================================================

const LIBCAL_BASE = 'https://libcal.luc.edu';

// All bookable locations and their rooms
const LOCATIONS = {
  'Information Commons': {
    lid: 10019,
    gid: 18356,
    campus: 'LSC',
    building: 'Information Commons',
    rooms: [
      { id: 70785, name: 'IC-211', capacity: 4, floor: 2 },
      { id: 70786, name: 'IC-212', capacity: 4, floor: 2 },
      { id: 70787, name: 'IC-213', capacity: 4, floor: 2 },
      { id: 70788, name: 'IC-214', capacity: 6, floor: 2 },
      { id: 70790, name: 'IC-218', capacity: 4, floor: 2 },
      { id: 70793, name: 'IC-226', capacity: 4, floor: 2 },
      { id: 70795, name: 'IC-228', capacity: 4, floor: 2 },
      { id: 70797, name: 'IC-310', capacity: 4, floor: 3 },
      { id: 70798, name: 'IC-311', capacity: 4, floor: 3 },
      { id: 70799, name: 'IC-312', capacity: 4, floor: 3 },
      { id: 70800, name: 'IC-313', capacity: 4, floor: 3 },
      { id: 70801, name: 'IC-314', capacity: 4, floor: 3 },
      { id: 70803, name: 'IC-318', capacity: 4, floor: 3 },
      { id: 70805, name: 'IC-320', capacity: 2, floor: 3 },
      { id: 70806, name: 'IC-322', capacity: 2, floor: 3 },
      { id: 70808, name: 'IC-326', capacity: 4, floor: 3 },
      { id: 70810, name: 'IC-328', capacity: 4, floor: 3 },
      { id: 70811, name: 'IC-330', capacity: 4, floor: 3 },
      { id: 70812, name: 'IC-331', capacity: 2, floor: 3 },
      { id: 70813, name: 'IC-332', capacity: 2, floor: 3 },
      { id: 70814, name: 'IC-333', capacity: 4, floor: 3 },
    ],
  },
  'Cudahy Library': {
    lid: 10022,
    gid: 29512,
    campus: 'LSC',
    building: 'Cudahy Library',
    rooms: [
      { id: 111978, name: 'Cud-203', capacity: 4, floor: 2 },
      { id: 111986, name: 'Cud-204', capacity: 4, floor: 2 },
      { id: 111987, name: 'Cud-207', capacity: 4, floor: 2 },
      { id: 111988, name: 'Cud-208', capacity: 6, floor: 2 },
      { id: 111989, name: 'Cud-303', capacity: 4, floor: 3 },
      { id: 111990, name: 'Cud-304', capacity: 4, floor: 3 },
    ],
  },
  'Lewis Library': {
    lid: 10020,
    gid: 18357,
    campus: 'WTC',
    building: 'Lewis Library',
    rooms: [
      { id: 70815, name: 'CLC-905', capacity: 4, floor: 9 },
      { id: 204646, name: 'CLC-906', capacity: 4, floor: 9 },
      { id: 70816, name: 'CLC-908', capacity: 4, floor: 9 },
      { id: 70817, name: 'CLC-909', capacity: 4, floor: 9 },
      { id: 70818, name: 'CLC-917', capacity: 2, floor: 9 },
      { id: 70819, name: 'CLC-918', capacity: 8, floor: 9 },
      { id: 70820, name: 'CLC-919', capacity: 2, floor: 9 },
      { id: 70821, name: 'CLC-920', capacity: 2, floor: 9 },
      { id: 70822, name: 'CLC-921', capacity: 8, floor: 9 },
      { id: 70824, name: 'CLC-922', capacity: 3, floor: 9 },
      { id: 70826, name: 'CLC-923', capacity: 3, floor: 9 },
      { id: 70827, name: 'CLC-924', capacity: 8, floor: 9 },
    ],
  },
  'Schreiber Center': {
    lid: 10021,
    gid: 18360,
    campus: 'WTC',
    building: 'Schreiber Center',
    rooms: [
      { id: 70832, name: 'SCHR-210', capacity: 8, floor: 2 },
      { id: 70833, name: 'SCHR-407', capacity: 4, floor: 4 },
      { id: 70835, name: 'SCHR-606', capacity: 4, floor: 6 },
      { id: 170044, name: 'SCHR-808', capacity: 4, floor: 8 },
    ],
  },
};

// Cache for availability data
let availabilityCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch availability for a location on a given date
async function fetchLocationAvailability(lid, gid, date) {
  const cacheKey = `${lid}_${date}`;
  if (availabilityCache[cacheKey] && Date.now() - availabilityCache[cacheKey].time < CACHE_TTL) {
    return availabilityCache[cacheKey].data;
  }

  try {
    const response = await fetch(`${LIBCAL_BASE}/spaces/availability/grid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: `lid=${lid}&gid=${gid}&start=${date}&end=${date}&pageSize=50`,
    });

    if (!response.ok) return null;

    const data = await response.json();
    availabilityCache[cacheKey] = { data, time: Date.now() };
    return data;
  } catch (e) {
    return null;
  }
}

// Get all rooms with their static info
function getAllRooms() {
  const rooms = [];
  for (const [locationName, loc] of Object.entries(LOCATIONS)) {
    for (const room of loc.rooms) {
      rooms.push({
        ...room,
        location: locationName,
        campus: loc.campus,
        building: loc.building,
        bookingUrl: `${LIBCAL_BASE}/space/${room.id}`,
      });
    }
  }
  return rooms;
}

// Get rooms filtered by criteria
function filterRooms({ campus, building, minCapacity }) {
  let rooms = getAllRooms();
  if (campus) rooms = rooms.filter(r => r.campus === campus);
  if (building) rooms = rooms.filter(r => r.building.toLowerCase().includes(building.toLowerCase()));
  if (minCapacity) rooms = rooms.filter(r => r.capacity >= minCapacity);
  return rooms;
}

// Get all locations summary
function getLocations() {
  return Object.entries(LOCATIONS).map(([name, loc]) => ({
    name,
    lid: loc.lid,
    campus: loc.campus,
    building: loc.building,
    roomCount: loc.rooms.length,
    totalCapacity: loc.rooms.reduce((sum, r) => sum + r.capacity, 0),
  }));
}

module.exports = {
  LOCATIONS,
  getAllRooms,
  filterRooms,
  getLocations,
  fetchLocationAvailability,
};
