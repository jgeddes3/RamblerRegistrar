// =============================================================================
// Firestore sync — dual-writes the freshly-scraped term to Firestore.
//
// Phase 3.5 (2026-07-06): DELTA sync. A local shadow manifest
// (firestore-sync-state.json, gitignored) remembers the hash of every doc as
// last written, so unchanged docs are skipped entirely and removals are
// detected by diffing the manifest against this run's rows — the default path
// performs ZERO Firestore reads (the old implementation re-wrote ~2.5k section
// docs and read ~2.5k doc ids for pruning EVERY day; on the Spark tier that
// plus client boots exhausted the daily quota — see archive/HANDOFF.md Known issue 5).
//
// Writes per run (steady state): only sections whose data actually changed
// (status/enrollment/meeting fields — during quiet weeks that's near zero),
// new/renamed instructors, 1 term-parent doc, 1 meta/catalog doc.
//
// meta/catalog now carries TWO versions:
//   - version:            legacy scrape timestamp (bumped every scrape) — kept
//                         for old client bundles.
//   - catalogDataVersion: db.getCatalogDataFingerprint() — hash of the tables
//                         the client actually bulk-caches (courses/programs/
//                         program_courses/prerequisites). Changes only on a
//                         real ETL/data change, so clients stop re-downloading
//                         ~3.6k docs every day for nothing.
//
// recentHistory (sparkline array) is EXCLUDED from the change hash: a daily
// snapshot appends a point even when enrollment is flat, which would defeat
// the delta. It is refreshed whenever the doc is written for a real change —
// so it is exactly as fresh as the numbers it visualizes. (When the sparkline
// UI ships, fetch full history on demand instead of widening this.)
//
// Failure semantics: the manifest is saved only after a fully successful run.
// A run that dies mid-way leaves the old manifest, so the next run simply
// re-writes whatever it can't prove clean (idempotent, merge writes).
//
// Escape hatch: `--reconcile` (or opts.reconcile) restores the old behavior —
// reads all doc ids for the term, marks anything missing from SQLite as
// removed, and drops manifest entries with no matching Firestore doc. Use it
// if Firestore is suspected to have drifted (e.g. docs edited by hand).
//
// CLI: node firestore-sync.js [termCode] [--reconcile]
// Uses the Admin SDK (bypasses security rules). Failures are non-fatal to the
// scrape (scraper-puppeteer wraps this in try/catch).
// =============================================================================

const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const STATE_PATH = path.join(__dirname, 'firestore-sync-state.json');

function initFirestore() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))),
    });
  }
  return admin.firestore();
}

function sanitizeId(s) {
  return String(s).replace(/\//g, '_').replace(/^\.+$/, '_').trim().slice(0, 400) || '_';
}
function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 120) || 'unknown';
}
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

// Key-sorted stringify so hashes don't depend on object key insertion order.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function hashOf(obj) {
  return crypto.createHash('sha1').update(stableStringify(obj)).digest('hex').slice(0, 16);
}

// Shadow manifest: { terms: {termCode: {docId: hash}}, instructors: {id: hash},
// catalogFingerprint: string }. Missing/corrupt file = empty state (first run
// re-writes everything once, then goes quiet).
function loadSyncState() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    return state && typeof state === 'object' ? state : {};
  } catch {
    return {};
  }
}
function saveSyncState(state) {
  const tmp = STATE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, STATE_PATH);
}

// Small batched writer (Firestore limit is 500 ops/commit).
function makeBatcher(fdb) {
  let batch = fdb.batch();
  let n = 0;
  let total = 0;
  return {
    async set(ref, data, opts) { batch.set(ref, data, opts || {}); if (++n >= 450) await this.commit(); total++; },
    async commit() { if (n > 0) { await batch.commit(); batch = fdb.batch(); n = 0; } },
    get total() { return total; },
  };
}

// Sync one term's sections + instructors to Firestore. Reads from SQLite
// (db.js must already be initialized). Returns counts. Throws on hard failure
// — callers wrap this in try/catch so a Firestore problem never fails the scrape.
async function syncTermToFirestore(termCode, opts = {}) {
  const fdb = initFirestore();
  const FieldValue = admin.firestore.FieldValue;
  const sections = db.getAllSections(termCode);
  const historyByClass = db.getRecentHistoryByClass(termCode, 30);

  const state = loadSyncState();
  if (!state.terms) state.terms = {};
  if (!state.instructors) state.instructors = {};
  const shadow = state.terms[String(termCode)] || {};
  const newShadow = {};

  const termSections = fdb.collection('terms').doc(String(termCode)).collection('sections');
  const instructors = new Map();
  const seen = new Set();
  const b = makeBatcher(fdb);
  let written = 0;
  let skipped = 0;

  for (const s of sections) {
    const classNumber = String(s.class_number);
    const docId = sanitizeId(classNumber);
    seen.add(docId);
    const cap = s.enrollment_cap || 0;
    const total = s.enrollment_total || 0;
    const instructorId = s.instructor ? slug(s.instructor) : null;
    if (instructorId) instructors.set(instructorId, s.instructor);

    const payload = clean({
      termCode: s.term_code, subject: s.subject, catalogNumber: s.catalog_number,
      courseCode: s.subject && s.catalog_number ? `${s.subject} ${s.catalog_number}` : null,
      sectionNumber: s.section_number, classNumber: s.class_number, title: s.title,
      instructorName: s.instructor, instructorId,
      meetingDays: s.meeting_days, meetingTimeStart: s.meeting_time_start,
      meetingTimeEnd: s.meeting_time_end, room: s.room, building: s.building,
      enrollment: {
        cap, total, waitlistCap: s.waitlist_cap || 0, waitlistTotal: s.waitlist_total || 0,
        percentFull: cap > 0 ? Math.round((100 * total) / cap) : 0,
      },
      instructionMode: s.instruction_mode, component: s.component, status: s.status || 'active',
    });

    const hv = hashOf(payload); // recentHistory/updatedAt not part of the hash
    newShadow[docId] = hv;
    if (shadow[docId] === hv) { skipped++; continue; }

    await b.set(termSections.doc(docId), {
      ...payload,
      recentHistory: historyByClass[classNumber] || [],
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    written++;
  }

  // Removals — zero reads: anything the manifest tracked that this run's
  // SQLite rows no longer contain was pruned by deleteStaleSections (or the
  // ghost backfill), so mark it removed. Docs already marked removed left the
  // manifest on a previous run and are never touched again.
  let pruned = 0;
  for (const docId of Object.keys(shadow)) {
    if (seen.has(docId)) continue;
    await b.set(termSections.doc(docId),
      { status: 'removed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    pruned++;
  }

  // Upsert instructors (merge preserves cached RMP data added elsewhere);
  // skip the ones whose name hash is unchanged (steady state: all of them).
  let instructorsWritten = 0;
  for (const [id, name] of instructors) {
    const hv = hashOf({ name });
    if (state.instructors[id] === hv) continue;
    await b.set(fdb.collection('instructors').doc(id),
      { name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    state.instructors[id] = hv;
    instructorsWritten++;
  }

  // Term PARENT doc — a subcollection alone does not materialize its parent, so
  // without this, listing the `terms` collection returns nothing.
  const termRow = (db.getTerms() || []).find((t) => String(t.code) === String(termCode));
  await b.set(fdb.collection('terms').doc(String(termCode)), {
    code: String(termCode),
    name: (termRow && termRow.name) || `Term ${termCode}`,
    lastScraped: FieldValue.serverTimestamp(),
  }, { merge: true });

  // meta/catalog — `version` (legacy, scrape timestamp) keeps old client
  // bundles working; `catalogDataVersion` (data fingerprint) is what current
  // clients gate their ~3.6k-doc bulk re-download on. clean() drops a null
  // version so we never clobber an existing one with null.
  const fingerprint = db.getCatalogDataFingerprint();
  await b.set(fdb.collection('meta').doc('catalog'), clean({
    version: db.getCatalogVersion(),
    catalogDataVersion: fingerprint,
    updatedAt: FieldValue.serverTimestamp(),
  }), { merge: true });

  await b.commit();

  // --reconcile: heal drift the manifest can't see (hand-edited/deleted docs).
  // Reads every doc id for the term (~1 read per section) — run rarely.
  if (opts.reconcile) {
    const existing = await termSections.select().get();
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const rb = makeBatcher(fdb);
    for (const doc of existing.docs) {
      if (!seen.has(doc.id) && !(doc.id in shadow)) {
        await rb.set(doc.ref, { status: 'removed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        pruned++;
      }
    }
    await rb.commit();
    // Docs the manifest believes exist but Firestore lost: forget them so the
    // next run re-writes from SQLite.
    for (const docId of Object.keys(newShadow)) {
      if (!existingIds.has(docId)) delete newShadow[docId];
    }
  }

  // Persist the manifest only after everything committed. A failure above
  // leaves the old manifest → next run re-writes the difference. Manifest I/O
  // problems must not fail the scrape's sync.
  state.terms[String(termCode)] = newShadow;
  state.catalogFingerprint = fingerprint;
  try {
    saveSyncState(state);
  } catch (err) {
    console.error(`Firestore sync: manifest save failed (${err.message}) — next run re-writes deltas.`);
  }

  return {
    sections: sections.length,
    written,
    skipped,
    instructors: instructorsWritten,
    pruned,
  };
}

module.exports = { syncTermToFirestore, initFirestore };

// --- CLI: node firestore-sync.js [termCode] [--reconcile] --------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const reconcile = args.includes('--reconcile');
  const termCode = args.find((a) => !a.startsWith('-')) || '1266';

  db.initDb()
    .then(() => syncTermToFirestore(termCode, { reconcile }))
    .then((res) => {
      console.log(`Firestore sync ${termCode}:`, JSON.stringify(res));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Firestore sync failed:', err.message || err);
      process.exit(1);
    });
}
