const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const admin = require('firebase-admin');
const path = require('path');
const db = require('./db');
const { scrape } = require('./scraper-puppeteer');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware to verify Firebase auth token (for protected routes)
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// =============================================================================
// API ROUTES
// =============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available terms
app.get('/api/terms', (req, res) => {
  const terms = db.getTerms();
  res.json(terms);
});

// =============================================================================
// CATALOG API ROUTES
// =============================================================================

// Get programs (optionally filtered by type)
// GET /api/programs?type=major
app.get('/api/programs', (req, res) => {
  const { type } = req.query;
  const programs = db.getPrograms(type || null);
  res.json(programs);
});

// Get single program with its required courses
// GET /api/programs/42
app.get('/api/programs/:id', (req, res) => {
  const program = db.getProgramById(parseInt(req.params.id));
  if (!program) return res.status(404).json({ error: 'Program not found' });
  const courses = db.getProgramCourses(program.id);
  res.json({ ...program, courses });
});

// Get all courses
// GET /api/courses
app.get('/api/courses', (req, res) => {
  const courses = db.getCourses();
  res.json(courses);
});

// Search courses
// GET /api/courses/search?q=calculus
app.get('/api/courses/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q query parameter required' });
  const courses = db.searchCourses(q);
  res.json(courses);
});

// Get single course by code
// GET /api/courses/COMP%20170
app.get('/api/courses/:code', (req, res) => {
  const course = db.getCourseByCode(decodeURIComponent(req.params.code));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// Get prerequisites for a course
// GET /api/prerequisites/COMP%20271
app.get('/api/prerequisites/:code', (req, res) => {
  const prereqs = db.getPrerequisites(decodeURIComponent(req.params.code));
  res.json(prereqs);
});

// Full catalog sync (for mobile app offline cache)
// GET /api/sync/catalog
app.get('/api/sync/catalog', (req, res) => {
  const catalog = db.getFullCatalog();
  res.json(catalog);
});

// Check catalog version
// GET /api/sync/version
app.get('/api/sync/version', (req, res) => {
  const version = db.getCatalogVersion();
  res.json({ version });
});

// =============================================================================
// SECTION / ENROLLMENT / INSTRUCTOR API ROUTES
// =============================================================================

// Get all sections for a term
app.get('/api/sections/:termCode', (req, res) => {
  const sections = db.getAllSections(req.params.termCode);
  res.json(sections);
});

// Get sections for a specific course
// GET /api/sections/2269/COMP/170
app.get('/api/sections/:termCode/:subject/:catalogNumber', (req, res) => {
  const { termCode, subject, catalogNumber } = req.params;
  const sections = db.getSectionsForCourse(termCode, subject.toUpperCase(), catalogNumber);
  res.json(sections);
});

// Get all sections for a subject/department
// GET /api/subject/2269/COMP
app.get('/api/subject/:termCode/:subject', (req, res) => {
  const { termCode, subject } = req.params;
  const sections = db.getSectionsForSubject(termCode, subject.toUpperCase());
  res.json(sections);
});

// Get instructors for a course
// GET /api/instructors/2269/COMP/170
app.get('/api/instructors/:termCode/:subject/:catalogNumber', (req, res) => {
  const { termCode, subject, catalogNumber } = req.params;
  const instructors = db.getInstructorsForCourse(termCode, subject.toUpperCase(), catalogNumber);
  res.json(instructors);
});

// Search by instructor name
// GET /api/instructor-search/2269?name=Smith
app.get('/api/instructor-search/:termCode', (req, res) => {
  const { termCode } = req.params;
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'name query parameter required' });
  }
  const sections = db.searchByInstructor(termCode, name);
  res.json(sections);
});

// Get enrollment stats for a course
// GET /api/enrollment/2269/COMP/170
app.get('/api/enrollment/:termCode/:subject/:catalogNumber', (req, res) => {
  const { termCode, subject, catalogNumber } = req.params;
  const stats = db.getEnrollmentStats(termCode, subject.toUpperCase(), catalogNumber);
  res.json(stats);
});

// Trigger a manual scrape (protected — add auth in production)
app.post('/api/scrape', requireAuth, async (req, res) => {
  const { termCode } = req.body;
  if (!termCode) {
    return res.status(400).json({ error: 'termCode required in request body' });
  }

  try {
    res.json({ status: 'started', termCode });
    // Run scrape in background
    scrape(termCode)
      .then(() => console.log(`Scrape complete for ${termCode}`))
      .catch((err) => console.error(`Scrape failed for ${termCode}:`, err));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// ADMIN ENDPOINTS (protected by Firebase auth)
// =============================================================================

// Add a new course
app.post('/api/admin/add-course', requireAuth, (req, res) => {
  try {
    const course = db.addCourse(req.body);
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing course
app.post('/api/admin/update-course', requireAuth, (req, res) => {
  const { code, ...updates } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    const course = db.updateCourse(code, updates);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a program
app.post('/api/admin/update-program', requireAuth, (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  try {
    const program = db.updateProgram(id, updates);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json({ success: true, program });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually bump catalog version
app.post('/api/admin/bump-version', requireAuth, (req, res) => {
  try {
    const version = db.bumpVersion();
    res.json({ success: true, version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// BUILDINGS & WALK TIME API
// =============================================================================

const { calculateWalkTime, analyzeSchedule, parseBuildingName } = require('./walktime');

// Get all buildings
app.get('/api/buildings', (req, res) => {
  const buildings = db.getBuildings();
  res.json(buildings);
});

// Get a single building by name
app.get('/api/buildings/:name', (req, res) => {
  const results = db.getBuildingByName(decodeURIComponent(req.params.name));
  if (!results || results.length === 0) return res.status(404).json({ error: 'Building not found' });
  res.json(results[0]);
});

// Get walk time between two buildings
app.get('/api/walktime', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query parameters required' });
  }
  const resultsA = db.getBuildingByName(from);
  const resultsB = db.getBuildingByName(to);
  if (!resultsA || resultsA.length === 0 || !resultsB || resultsB.length === 0) {
    return res.status(404).json({ error: 'One or both buildings not found' });
  }
  const result = calculateWalkTime(resultsA[0], resultsB[0]);
  res.json(result);
});

// =============================================================================
// LIBRARY HOURS API (LibCal)
// =============================================================================

const { getLibraryHours, getLibraryHoursWeekly } = require('./services/libcal');

// Get today's library hours
app.get('/api/library/hours', async (req, res) => {
  try {
    const hours = await getLibraryHours();
    res.json(hours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly library hours
app.get('/api/library/hours/weekly', async (req, res) => {
  try {
    const hours = await getLibraryHoursWeekly();
    res.json(hours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// CAMPUS EVENTS API (Localist)
// =============================================================================

const { getEvents } = require('./services/events');

// Get upcoming campus events
app.get('/api/events', async (req, res) => {
  try {
    const events = await getEvents(req.query.days || 7);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// USER PROFILE API (saved onboarding selections)
// =============================================================================

// Get user profile (saved onboarding selections)
app.get('/api/user/:uid/profile', (req, res) => {
  const profile = db.getUserProfile(req.params.uid);
  res.json(profile || { error: 'No profile found' });
});

// Save user profile
app.post('/api/user/:uid/profile', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.saveUserProfile(req.params.uid, req.body);
  res.json({ success: true });
});

// =============================================================================
// USER COURSES & DEGREE PROGRESS API
// =============================================================================

// Get courses a user has taken
app.get('/api/user/:uid/courses', (req, res) => {
  const courses = db.getUserCourses(req.params.uid);
  res.json(courses);
});

// Add a course to a user's record
app.post('/api/user/:uid/courses', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { courseCode, grade, semester } = req.body;
  db.addUserCourse(req.params.uid, courseCode, grade, semester);
  res.json({ success: true });
});

// Remove a course from a user's record
app.delete('/api/user/:uid/courses/:code', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.removeUserCourse(req.params.uid, decodeURIComponent(req.params.code));
  res.json({ success: true });
});

// Get degree progress for a user in a specific program
app.get('/api/user/:uid/progress/:programId', (req, res) => {
  const progress = db.getDegreeProgress(req.params.uid, parseInt(req.params.programId));
  res.json(progress);
});

// =============================================================================
// USER LOCATIONS API (home, dorm, custom)
// =============================================================================

// Get a user's saved locations
app.get('/api/user/:uid/locations', (req, res) => {
  const locations = db.getUserLocations(req.params.uid);
  res.json(locations);
});

// Get user's primary location (home/dorm)
app.get('/api/user/:uid/location/primary', (req, res) => {
  const location = db.getUserPrimaryLocation(req.params.uid);
  res.json(location || { error: 'No primary location set' });
});

// Set a custom home location
app.post('/api/user/:uid/locations', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { label, address, latitude, longitude, isPrimary } = req.body;
  if (!label || !latitude || !longitude) {
    return res.status(400).json({ error: 'label, latitude, and longitude required' });
  }
  db.setUserLocation(req.params.uid, label, address, latitude, longitude, isPrimary);
  res.json({ success: true });
});

// Set a dorm as home (picks from buildings table)
app.post('/api/user/:uid/locations/dorm', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { dormName } = req.body;
  if (!dormName) return res.status(400).json({ error: 'dormName required' });
  const dorm = db.setUserDorm(req.params.uid, dormName);
  if (!dorm) return res.status(404).json({ error: 'Dorm not found' });
  res.json({ success: true, dorm });
});

// Remove a saved location
app.delete('/api/user/:uid/locations/:label', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.removeUserLocation(req.params.uid, decodeURIComponent(req.params.label));
  res.json({ success: true });
});

// Get walk time from user's home to a building
app.get('/api/user/:uid/walktime/:building', (req, res) => {
  const home = db.getUserPrimaryLocation(req.params.uid);
  if (!home) return res.status(404).json({ error: 'No primary location set' });
  const resultsB = db.getBuildingByName(decodeURIComponent(req.params.building));
  if (!resultsB || resultsB.length === 0) return res.status(404).json({ error: 'Building not found' });
  const result = calculateWalkTime(
    { name: home.label, latitude: home.latitude, longitude: home.longitude },
    resultsB[0]
  );
  res.json(result);
});

// =============================================================================
// CORE CURRICULUM API
// =============================================================================

// Get all core areas with course options
app.get('/api/core/areas', (req, res) => {
  const areas = db.getCoreAreas();
  res.json(areas);
});

// Get core areas with school-specific overrides
app.get('/api/core/areas/:school', (req, res) => {
  const areas = db.getCoreAreasForSchool(decodeURIComponent(req.params.school));
  res.json(areas);
});

// Get user's core progress
app.get('/api/user/:uid/core-progress', (req, res) => {
  const { school } = req.query;
  const progress = db.getUserCoreProgress(req.params.uid, school || null);
  res.json(progress);
});

// =============================================================================
// RIASEC QUIZ API
// =============================================================================

// Save quiz results
app.post('/api/user/:uid/quiz', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.saveQuizResults(req.params.uid, req.body);
  res.json({ success: true });
});

// Get quiz results
app.get('/api/user/:uid/quiz', (req, res) => {
  const results = db.getQuizResults(req.params.uid);
  res.json(results || { error: 'No quiz results found' });
});

// Get enriched recommendations with feasibility data
app.get('/api/quiz/recommendations/:code/enriched', (req, res) => {
  const { uid, gradYear } = req.query;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  const enriched = db.getEnrichedRecommendations(req.params.code.toUpperCase(), uid, gradYear || '');
  // Sort: feasible first, then by original rank
  enriched.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return (a.rank || 99) - (b.rank || 99);
  });
  res.json(enriched);
});

// Get major recommendations for a RIASEC code (for undecided students)
app.get('/api/quiz/recommendations/:code', (req, res) => {
  const recommendations = db.getRecommendationsForCode(req.params.code.toUpperCase());
  res.json(recommendations);
});

// Get ranked focus areas for a decided student's program
app.get('/api/quiz/focus/:programId', (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    // No user context — just return focus areas unranked
    const areas = db.getFocusAreasForProgram(parseInt(req.params.programId));
    return res.json(areas);
  }
  const quiz = db.getQuizResults(uid);
  if (!quiz) {
    const areas = db.getFocusAreasForProgram(parseInt(req.params.programId));
    return res.json(areas);
  }
  const ranked = db.getRankedFocusAreas(parseInt(req.params.programId), quiz.scores);
  res.json(ranked);
});

// =============================================================================
// STUDY ROOMS API (LibCal)
// =============================================================================

const { getAllRooms, filterRooms, getLocations, fetchLocationAvailability, LOCATIONS } = require('./services/studyrooms');

// Get all study room locations (summary)
app.get('/api/studyrooms/locations', (req, res) => {
  res.json(getLocations());
});

// Get all rooms (with optional filters)
app.get('/api/studyrooms', (req, res) => {
  const { campus, building, minCapacity } = req.query;
  const rooms = filterRooms({
    campus: campus || null,
    building: building || null,
    minCapacity: minCapacity ? parseInt(minCapacity) : null,
  });
  res.json(rooms);
});

// Get availability for a location on a date
app.get('/api/studyrooms/availability/:locationName', async (req, res) => {
  const locationName = decodeURIComponent(req.params.locationName);
  const date = req.query.date || new Date().toISOString().split('T')[0];

  // Find the location
  const loc = LOCATIONS[locationName];
  if (!loc) {
    return res.status(404).json({ error: 'Location not found', available: Object.keys(LOCATIONS) });
  }

  try {
    const availability = await fetchLocationAvailability(loc.lid, loc.gid, date);
    res.json({
      location: locationName,
      date,
      rooms: loc.rooms,
      availability: availability,
      bookingBaseUrl: `https://libcal.luc.edu/spaces?lid=${loc.lid}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single room's booking URL (deep link for the student to book)
app.get('/api/studyrooms/book/:roomId', (req, res) => {
  const roomId = parseInt(req.params.roomId);
  const allRooms = getAllRooms();
  const room = allRooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    room,
    bookingUrl: `https://libcal.luc.edu/space/${roomId}`,
  });
});

// =============================================================================
// ENROLLMENT TRENDS API
// =============================================================================

// Get courses that fill up fastest
app.get('/api/enrollment/fastest/:termCode', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const courses = db.getFastestFillingCourses(req.params.termCode, limit);
  res.json(courses);
});

// Get courses that are currently full or nearly full
app.get('/api/enrollment/full/:termCode', (req, res) => {
  const courses = db.getFullCourses(req.params.termCode);
  res.json(courses);
});

// Get enrollment history for a specific course
app.get('/api/enrollment/history/:termCode/:subject/:catalogNumber', (req, res) => {
  const { termCode, subject, catalogNumber } = req.params;
  const history = db.getCourseEnrollmentHistory(termCode, subject.toUpperCase(), catalogNumber);
  res.json(history);
});

// Take an enrollment snapshot (triggered after scrape or manually)
app.post('/api/enrollment/snapshot/:termCode', requireAuth, (req, res) => {
  const count = db.snapshotEnrollment(req.params.termCode);
  res.json({ success: true, sectionsSnapshotted: count });
});

// =============================================================================
// SCHEDULE ANALYSIS API
// =============================================================================

// Analyze a schedule of sections for walk-time conflicts
app.post('/api/schedule/analyze', (req, res) => {
  const { sections: classNumbers, termCode } = req.body;
  if (!classNumbers || !termCode) {
    return res.status(400).json({ error: 'sections and termCode required in request body' });
  }

  const allSections = db.getAllSections(termCode);
  const matchedSections = allSections.filter(s =>
    classNumbers.includes(s.class_number)
  );

  const buildings = db.getBuildings();
  const analysisResults = analyzeSchedule(matchedSections, buildings);

  res.json({ sections: matchedSections, ...analysisResults });
});

// =============================================================================
// SCHEDULED SCRAPING
// =============================================================================

// Scrape every day at 4 AM with enrollment data (when LOCUS is least busy)
cron.schedule('0 4 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled scrape with enrollment data...`);
  try {
    await scrape(null, null, true);
    console.log('Scheduled scrape complete.');
  } catch (err) {
    console.error('Scheduled scrape failed:', err);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

// Initialize database then start server
db.initDb().then(() => {
app.listen(PORT, () => {
  console.log(`Rambler Backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/terms`);
  console.log(`  --- Catalog ---`);
  console.log(`  GET  /api/programs?type=major`);
  console.log(`  GET  /api/programs/:id`);
  console.log(`  GET  /api/courses`);
  console.log(`  GET  /api/courses/search?q=...`);
  console.log(`  GET  /api/courses/:code`);
  console.log(`  GET  /api/prerequisites/:code`);
  console.log(`  GET  /api/sync/catalog`);
  console.log(`  GET  /api/sync/version`);
  console.log(`  --- Sections / Enrollment ---`);
  console.log(`  GET  /api/sections/:termCode`);
  console.log(`  GET  /api/sections/:termCode/:subject/:catalogNumber`);
  console.log(`  GET  /api/subject/:termCode/:subject`);
  console.log(`  GET  /api/instructors/:termCode/:subject/:catalogNumber`);
  console.log(`  GET  /api/instructor-search/:termCode?name=...`);
  console.log(`  GET  /api/enrollment/:termCode/:subject/:catalogNumber`);
  console.log(`  POST /api/scrape { termCode: "2269" }`);
  console.log(`  --- Buildings & Walk Time ---`);
  console.log(`  GET  /api/buildings`);
  console.log(`  GET  /api/buildings/:name`);
  console.log(`  GET  /api/walktime?from=...&to=...`);
  console.log(`  --- Library Hours ---`);
  console.log(`  GET  /api/library/hours`);
  console.log(`  GET  /api/library/hours/weekly`);
  console.log(`  --- Campus Events ---`);
  console.log(`  GET  /api/events?days=7`);
  console.log(`  --- User Courses & Degree Progress ---`);
  console.log(`  GET  /api/user/:uid/courses`);
  console.log(`  POST /api/user/:uid/courses`);
  console.log(`  DEL  /api/user/:uid/courses/:code`);
  console.log(`  GET  /api/user/:uid/progress/:programId`);
  console.log(`  --- Core Curriculum ---`);
  console.log(`  GET  /api/core/areas`);
  console.log(`  GET  /api/core/areas/:school`);
  console.log(`  GET  /api/user/:uid/core-progress?school=...`);
  console.log(`  --- RIASEC Quiz ---`);
  console.log(`  POST /api/user/:uid/quiz`);
  console.log(`  GET  /api/user/:uid/quiz`);
  console.log(`  GET  /api/quiz/recommendations/:code`);
  console.log(`  GET  /api/quiz/focus/:programId?uid=...`);
  console.log(`  --- Schedule Analysis ---`);
  console.log(`  POST /api/schedule/analyze`);
});
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  db.close();
  process.exit(0);
});
