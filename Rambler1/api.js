// API client for the Rambler Backend server
// Fetches catalog data, live sections, and enrollment from the backend

const API_BASE = __DEV__
  ? 'http://100.65.1.81:3001/api'
  // ? 'http://192.168.1.70:3001/api'   // other network
  // ? 'http://10.246.110.54:3001/api'  // other network
  : 'https://your-production-url.com/api'; // Update for production

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
// CATALOG
// =============================================================================

// Get programs, optionally filtered by type ('major' or 'minor')
export const fetchPrograms = async (type) => {
  const query = type ? `?type=${type}` : '';
  return await apiFetch(`/programs${query}`);
};

// Get a single program with its courses
export const fetchProgramDetail = async (programId) => {
  return await apiFetch(`/programs/${programId}`);
};

// Get all courses
export const fetchCourses = async () => {
  return await apiFetch('/courses');
};

// Search courses by name or code
export const searchCourses = async (query) => {
  return await apiFetch(`/courses/search?q=${encodeURIComponent(query)}`);
};

// Get a single course by code
export const fetchCourseDetail = async (code) => {
  return await apiFetch(`/courses/${encodeURIComponent(code)}`);
};

// Get prerequisites for a course
export const fetchPrerequisites = async (code) => {
  return await apiFetch(`/prerequisites/${encodeURIComponent(code)}`);
};

// Full catalog sync — returns everything for offline cache
export const syncCatalog = async () => {
  return await apiFetch('/sync/catalog');
};

// Check catalog version (lightweight check before full sync)
export const checkCatalogVersion = async () => {
  const result = await apiFetch('/sync/version');
  return result ? result.version : null;
};

// =============================================================================
// LIVE SECTIONS (from LOCUS scraper)
// =============================================================================

// Get available terms
export const getTerms = async () => {
  return await apiFetch('/terms') || [];
};

// Get all sections for a specific course in a term
export const getCourseSections = async (termCode, courseCode) => {
  const [subject, catalogNumber] = courseCode.split(' ');
  if (!subject || !catalogNumber) return [];
  return await apiFetch(`/sections/${termCode}/${subject}/${catalogNumber}`) || [];
};

// Get all sections for a department in a term
export const getDepartmentSections = async (termCode, subject) => {
  return await apiFetch(`/subject/${termCode}/${subject}`) || [];
};

// Get instructors who teach a specific course
export const getCourseInstructors = async (termCode, courseCode) => {
  const [subject, catalogNumber] = courseCode.split(' ');
  if (!subject || !catalogNumber) return [];
  return await apiFetch(`/instructors/${termCode}/${subject}/${catalogNumber}`) || [];
};

// Search for sections by instructor name
export const searchByInstructor = async (termCode, name) => {
  return await apiFetch(`/instructor-search/${termCode}?name=${encodeURIComponent(name)}`) || [];
};

// Get enrollment stats for a course
export const getCourseEnrollment = async (termCode, courseCode) => {
  const [subject, catalogNumber] = courseCode.split(' ');
  if (!subject || !catalogNumber) return [];
  return await apiFetch(`/enrollment/${termCode}/${subject}/${catalogNumber}`) || [];
};

// =============================================================================
// BUILDINGS & WALK TIME
// =============================================================================

export const fetchBuildings = async () => {
  return await apiFetch('/buildings') || [];
};

export const fetchWalkTime = async (fromBuilding, toBuilding) => {
  return await apiFetch(`/walktime?from=${encodeURIComponent(fromBuilding)}&to=${encodeURIComponent(toBuilding)}`);
};

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
// USER LOCATIONS (home, dorm, custom)
// =============================================================================

export const fetchUserLocations = async (uid) => {
  return await apiFetch(`/user/${uid}/locations`) || [];
};

export const fetchUserPrimaryLocation = async (uid) => {
  return await apiFetch(`/user/${uid}/location/primary`);
};

export const setUserLocation = async (uid, label, address, latitude, longitude, isPrimary, authToken) => {
  try {
    const response = await fetch(`${API_BASE}/user/${uid}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ label, address, latitude, longitude, isPrimary }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const setUserDorm = async (uid, dormName, authToken) => {
  try {
    const response = await fetch(`${API_BASE}/user/${uid}/locations/dorm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ dormName }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const fetchWalkTimeFromHome = async (uid, buildingName) => {
  return await apiFetch(`/user/${uid}/walktime/${encodeURIComponent(buildingName)}`);
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
// USER PROFILE (persisted onboarding selections)
// =============================================================================

export const fetchUserProfile = async (uid) => {
  return await apiFetch(`/user/${uid}/profile`);
};

export const saveUserProfile = async (uid, profileData, authToken) => {
  try {
    const response = await fetch(`${API_BASE}/user/${uid}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const fetchProgramById = async (id) => {
  return await apiFetch(`/programs/${id}`);
};

// =============================================================================
// USER COURSES & DEGREE PROGRESS
// =============================================================================

export const fetchUserCourses = async (uid) => {
  return await apiFetch(`/user/${uid}/courses`) || [];
};

export const addUserCourse = async (uid, courseCode, grade, semester, authToken) => {
  try {
    const response = await fetch(`${API_BASE}/user/${uid}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ courseCode, grade, semester }),
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const removeUserCourse = async (uid, courseCode, authToken) => {
  try {
    const response = await fetch(`${API_BASE}/user/${uid}/courses/${encodeURIComponent(courseCode)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const fetchDegreeProgress = async (uid, programId) => {
  return await apiFetch(`/user/${uid}/progress/${programId}`);
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
// ENROLLMENT TRENDS
// =============================================================================

export const fetchFastestFillingCourses = async (termCode, limit = 50) => {
  return await apiFetch(`/enrollment/fastest/${termCode}?limit=${limit}`) || [];
};

export const fetchFullCourses = async (termCode) => {
  return await apiFetch(`/enrollment/full/${termCode}`) || [];
};

export const fetchCourseEnrollmentHistory = async (termCode, courseCode) => {
  const [subject, catalogNumber] = courseCode.split(' ');
  if (!subject || !catalogNumber) return [];
  return await apiFetch(`/enrollment/history/${termCode}/${subject}/${catalogNumber}`) || [];
};

// =============================================================================
// CORE CURRICULUM
// =============================================================================

export const fetchCoreAreas = async (school) => {
  if (school) {
    return await apiFetch(`/core/areas/${encodeURIComponent(school)}`);
  }
  return await apiFetch('/core/areas');
};

export const fetchUserCoreProgress = async (uid, school) => {
  const query = school ? `?school=${encodeURIComponent(school)}` : '';
  return await apiFetch(`/user/${uid}/core-progress${query}`);
};

// =============================================================================
// HEALTH
// =============================================================================

export const checkBackendHealth = async () => {
  const result = await apiFetch('/health');
  return result !== null;
};
