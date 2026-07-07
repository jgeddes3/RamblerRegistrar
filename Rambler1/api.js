// API client for the Rambler Backend server
// Only backend-served features remain here: library hours, campus events,
// study rooms, schedule analysis, and health checks.
// All user data, catalog, sections, instructors, enrollment, buildings,
// walk-time, and quiz/recommendation reads now live in ./firestore-data.js.

// Configure via EXPO_PUBLIC_API_BASE in Rambler1/.env (e.g. a LAN IP during
// development). No hardcoded machine-specific IPs — falls back to localhost.
// Note: nothing in the app currently calls these endpoints; they exist for the
// Phase 2 library-hours / events / study-rooms features (which may end up
// calling LibCal/Localist directly from the device instead).
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3001/api';

const apiFetch = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API fetch failed for ${endpoint}:`, error.message);
    return null;
  }
};

// =============================================================================
// SCHEDULE ANALYSIS
// =============================================================================

export const analyzeSchedule = async (sectionIds, termCode) => {
  try {
    const response = await fetch(`${API_BASE}/schedule/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: sectionIds, termCode }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
};

// =============================================================================
// LIBRARY HOURS
// =============================================================================

export const fetchLibraryHours = async () => {
  return await apiFetch('/library/hours');
};

export const fetchLibraryHoursWeekly = async () => {
  return await apiFetch('/library/hours/weekly');
};

// =============================================================================
// CAMPUS EVENTS
// =============================================================================

export const fetchEvents = async (days = 7) => {
  return await apiFetch(`/events?days=${days}`) || [];
};

// =============================================================================
// STUDY ROOMS
// =============================================================================

export const fetchStudyRoomLocations = async () => {
  return await apiFetch('/studyrooms/locations') || [];
};

export const fetchStudyRooms = async (filters = {}) => {
  const params = [];
  if (filters.campus) params.push(`campus=${filters.campus}`);
  if (filters.building) params.push(`building=${encodeURIComponent(filters.building)}`);
  if (filters.minCapacity) params.push(`minCapacity=${filters.minCapacity}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiFetch(`/studyrooms${query}`) || [];
};

export const fetchStudyRoomAvailability = async (locationName, date) => {
  const dateParam = date ? `?date=${date}` : '';
  return await apiFetch(`/studyrooms/availability/${encodeURIComponent(locationName)}${dateParam}`);
};

export const getStudyRoomBookingUrl = async (roomId) => {
  return await apiFetch(`/studyrooms/book/${roomId}`);
};

// =============================================================================
// HEALTH
// =============================================================================

export const checkBackendHealth = async () => {
  const result = await apiFetch('/health');
  return result !== null;
};
