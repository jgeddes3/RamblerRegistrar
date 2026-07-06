// =============================================================================
// Phase 0.5 — scraper cutover: dual-write the freshly-scraped term to Firestore.
//
// Called at the end of a scrape (scraper-puppeteer.js). Reads the finalized
// state from SQLite (still source of truth during the transition) and writes:
//   - terms/{term}/sections/{classNumber}  (current state + enrollment + sparkline)
//   - instructors/{slug}                    (normalized; RMP cache filled later)
//   - marks sections missing from this run as status:'removed'  (fixes B3)
// Uses the Admin SDK (bypasses security rules). Failures are non-fatal to the scrape.
// =============================================================================

const admin = require('firebase-admin');
const path = require('path');
const db = require('./db');

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

// Sync one term's sections + instructors to Firestore. Reads from SQLite (db.js
// must already be initialized). Returns counts. Throws on hard failure — callers
// wrap this in try/catch so a Firestore problem never fails the scrape.
async function syncTermToFirestore(termCode) {
  const fdb = initFirestore();
  const FieldValue = admin.firestore.FieldValue;
  const sections = db.getAllSections(termCode);
  const historyByClass = db.getRecentHistoryByClass(termCode, 30);

  const termSections = fdb.collection('terms').doc(String(termCode)).collection('sections');
  const instructors = new Map();
  const seen = new Set();
  const b = makeBatcher(fdb);

  for (const s of sections) {
    const classNumber = String(s.class_number);
    seen.add(classNumber);
    const cap = s.enrollment_cap || 0;
    const total = s.enrollment_total || 0;
    const instructorId = s.instructor ? slug(s.instructor) : null;
    if (instructorId) instructors.set(instructorId, s.instructor);

    await b.set(termSections.doc(sanitizeId(classNumber)), clean({
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
      recentHistory: historyByClass[classNumber] || [],
      instructionMode: s.instruction_mode, component: s.component, status: s.status || 'active',
      updatedAt: FieldValue.serverTimestamp(),
    }), { merge: true });
  }

  // Upsert instructors (merge so any cached RMP data added elsewhere is preserved).
  for (const [id, name] of instructors) {
    await b.set(fdb.collection('instructors').doc(id),
      { name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  await b.commit();

  // Prune: mark sections present in Firestore for this term but missing from this
  // run as removed (a section cancelled in LOCUS should not linger as active). B3.
  let pruned = 0;
  const existing = await termSections.select().get(); // ids only — no field reads
  const pruneBatch = [];
  let pb = fdb.batch();
  let pn = 0;
  for (const doc of existing.docs) {
    if (!seen.has(doc.id)) {
      pb.set(doc.ref, { status: 'removed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      pruned++;
      if (++pn >= 450) { pruneBatch.push(pb.commit()); pb = fdb.batch(); pn = 0; }
    }
  }
  if (pn > 0) pruneBatch.push(pb.commit());
  await Promise.all(pruneBatch);

  return { sections: sections.length, instructors: instructors.size, pruned };
}

module.exports = { syncTermToFirestore, initFirestore };
