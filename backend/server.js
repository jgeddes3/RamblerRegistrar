// =============================================================================
// Rambler Backend — scraper host + thin proxy API.
//
// After the Phase 0.5 Firestore migration (2026-07-05), the mobile app reads
// catalog/sections/user data directly from Cloud Firestore. This server's jobs:
//   1. Run the daily LOCUS scrape (cron) and sync results to Firestore.
//   2. Proxy a few external campus APIs the app may use later (LibCal library
//      hours, Localist events, study rooms) plus a schedule-analysis helper.
//
// Removed in the Phase 1 cleanup: all /api/user/*, catalog, sections,
// instructors, enrollment, buildings/walktime, core, quiz, admin, and scrape
// endpoints (dead code after the client cutover — Firestore security rules are
// the access-control layer now). This server no longer needs firebase-admin or
// the service-account key; the scraper's firestore-sync initializes its own.
// =============================================================================

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const db = require('./db');
const { scrape } = require('./scraper-puppeteer');
const { analyzeSchedule } = require('./walktime');

const app = express();
const PORT = process.env.PORT || 3001;

// Behind a reverse proxy in production so express-rate-limit sees the real
// client IP. Trust the first hop.
app.set('trust proxy', 1);

// --- CORS: allow non-browser clients (mobile app / curl send no Origin) plus
// any explicitly allowlisted origin via ALLOWED_ORIGINS (comma-separated). ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());

// --- Rate limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Guards against overlapping heavyweight Puppeteer runs (cron re-entry).
let scrapeInProgress = false;
let pollInProgress = false;

// =============================================================================
// API ROUTES
// =============================================================================

// Health check (also used by ops/health-monitor.ps1 self-heal)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// LIBRARY HOURS API (LibCal)
// =============================================================================

const { getLibraryHours, getLibraryHoursWeekly } = require('./services/libcal');

app.get('/api/library/hours', async (req, res) => {
  try {
    const hours = await getLibraryHours();
    res.json(hours);
  } catch (err) {
    console.error('[library/hours]', err.message);
    res.status(502).json({ error: 'Library hours unavailable' });
  }
});

app.get('/api/library/hours/weekly', async (req, res) => {
  try {
    const hours = await getLibraryHoursWeekly();
    res.json(hours);
  } catch (err) {
    console.error('[library/hours/weekly]', err.message);
    res.status(502).json({ error: 'Library hours unavailable' });
  }
});

// =============================================================================
// CAMPUS EVENTS API (Localist)
// =============================================================================

const { getEvents } = require('./services/events');

app.get('/api/events', async (req, res) => {
  try {
    const events = await getEvents(req.query.days || 7);
    res.json(events);
  } catch (err) {
    console.error('[events]', err.message);
    res.status(502).json({ error: 'Events unavailable' });
  }
});

// =============================================================================
// STUDY ROOMS API (LibCal)
// =============================================================================

const { getAllRooms, filterRooms, getLocations, fetchLocationAvailability, LOCATIONS } = require('./services/studyrooms');

app.get('/api/studyrooms/locations', (req, res) => {
  res.json(getLocations());
});

app.get('/api/studyrooms', (req, res) => {
  const { campus, building, minCapacity } = req.query;
  const rooms = filterRooms({
    campus: campus || null,
    building: building || null,
    minCapacity: minCapacity ? parseInt(minCapacity) : null,
  });
  res.json(rooms);
});

app.get('/api/studyrooms/availability/:locationName', async (req, res) => {
  const locationName = decodeURIComponent(req.params.locationName);
  const date = req.query.date || new Date().toISOString().split('T')[0];

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
    console.error('[studyrooms/availability]', err.message);
    res.status(502).json({ error: 'Availability unavailable' });
  }
});

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
// SCHEDULE ANALYSIS API
// =============================================================================

// Analyze a schedule of sections for walk-time conflicts
app.post('/api/schedule/analyze', (req, res) => {
  const { sections: classNumbers, termCode } = req.body;
  if (!Array.isArray(classNumbers) || !termCode) {
    return res.status(400).json({ error: 'sections (array) and termCode required in request body' });
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
// 404 + ERROR HANDLING (must be registered after all routes)
// =============================================================================

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Terminal error handler — logs internally, returns a generic message so stack
// traces and internal error text never leak to clients. (4-arg = error handler.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message || err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// =============================================================================
// SCHEDULED SCRAPING
// =============================================================================

// Scrape once daily at 10 AM (America/Chicago — same clock as the watch poll
// cron below) with enrollment data; syncs to Firestore at the end of the run
// (backend/firestore-sync.js). Retries up to 3 times with 5-minute delays if
// LOCUS is unreachable. If a watch poll is mid-run at 10:00, waits for it to
// finish (up to 10 min) so two Puppeteer/LOCUS sessions never overlap.
cron.schedule('0 10 * * *', async () => {
  if (scrapeInProgress) {
    console.log('Scheduled scrape skipped — a scrape is already running.');
    return;
  }
  // Claim the lock first so the poll cron skips while we wait for an
  // in-flight poll to drain (poll cron checks scrapeInProgress).
  scrapeInProgress = true;

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes
  const POLL_WAIT_INTERVAL_MS = 30 * 1000; // check every 30s
  const POLL_WAIT_MAX_MS = 10 * 60 * 1000; // give up after 10 minutes

  try {
    // Wait for any in-flight watch poll to finish before starting the heavy
    // enrollment scrape (a 9:40 poll can still be scraping at 10:00).
    const waitStart = Date.now();
    while (pollInProgress) {
      if (Date.now() - waitStart >= POLL_WAIT_MAX_MS) {
        console.error('Scheduled scrape aborted — watch poll still running after 10 minutes.');
        return; // finally clears the lock
      }
      console.log('Scheduled scrape waiting — watch poll in progress...');
      await new Promise(r => setTimeout(r, POLL_WAIT_INTERVAL_MS));
    }
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[${new Date().toISOString()}] Running scheduled scrape (attempt ${attempt}/${MAX_RETRIES})...`);
      try {
        await scrape(null, null, true);
        console.log('Scheduled scrape complete.');
        return; // Success — exit retry loop (finally still clears the lock)
      } catch (err) {
        console.error(`Scheduled scrape attempt ${attempt} failed:`, err.message || err);
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY_MS / 60000} minutes...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        } else {
          console.error('All scrape attempts failed.');
        }
      }
    }
  } finally {
    scrapeInProgress = false;
  }
}, { timezone: 'America/Chicago' });

// =============================================================================
// SCHEDULED WATCH POLLING
// =============================================================================

// Poll watched sections for Closed/Wait List -> Open transitions every 20
// minutes, 09:00-21:40 America/Chicago only (LOCUS is unreliable overnight).
// Skips when the daily scrape or a previous poll is still running.
cron.schedule('*/20 9-21 * * *', async () => {
  if (scrapeInProgress) {
    console.log('Watch poll skipped — daily scrape in progress.');
    return;
  }
  if (pollInProgress) {
    console.log('Watch poll skipped — previous poll still running.');
    return;
  }
  pollInProgress = true;
  try {
    // Lazy require (mirrors the scrape pattern) so firebase-admin only
    // initializes when a poll actually runs.
    const { pollWatches } = require('./watch-poller');
    const result = await pollWatches();
    console.log(`[${new Date().toISOString()}] Watch poll:`, JSON.stringify(result));
  } catch (err) {
    console.error('Watch poll failed:', err.message || err);
  } finally {
    pollInProgress = false;
  }
}, { timezone: 'America/Chicago' });

// =============================================================================
// START SERVER
// =============================================================================

db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Rambler Backend running on port ${PORT}`);
    console.log(`Role: daily LOCUS scraper (10 AM cron -> SQLite + Firestore) + campus API proxy`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/library/hours`);
    console.log(`  GET  /api/library/hours/weekly`);
    console.log(`  GET  /api/events?days=7`);
    console.log(`  GET  /api/studyrooms/locations`);
    console.log(`  GET  /api/studyrooms?campus=...&building=...&minCapacity=...`);
    console.log(`  GET  /api/studyrooms/availability/:locationName?date=...`);
    console.log(`  GET  /api/studyrooms/book/:roomId`);
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
