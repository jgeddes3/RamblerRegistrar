// =============================================================================
// Watch Poller — checks watched sections for Closed/Wait List -> Open
// transitions and sends Expo push notifications.
//
// Data contracts (see firestore.rules — DEPLOYED):
//   users/{uid}/watches/{classNumber}   client-owned. hasOnly ['termCode',
//     'classNumber','createdAt'] — the poller must NEVER write to these docs
//     (an admin-added field would make later client merge-writes fail the
//     validator). All poller state lives in a separate admin-only collection:
//   watchPoller/{termCode_classNumber}  { lastStatus, checkedAt, notifiedAt,
//     notifyPending } (no client rule = default deny; Admin SDK bypasses
//     rules). notifiedAt is set only after exp.host ACCEPTS a push;
//     notifyPending marks an owed alert whose send failed so it is retried
//     next poll instead of being silently lost.
//   terms/{termCode}/sections/{classNumber}  catalog doc — resolves a watch to
//     subject / courseCode / sectionNumber / meeting summary.
//
// Flow: collectionGroup('watches') -> resolve section docs -> dedupe subjects
// -> ONE LocusPuppeteerScraper pass (fetchEnrollment=false, no enrollment
// clicks) -> diff statuses against watchPoller state -> batch Expo pushes.
//
// First sighting of a class (no watchPoller doc) only records state — never
// notifies (prevents a false alert on a course that was always Open).
// Cooldown: a class notified within the last 6h is not re-notified.
//
// CLI: node watch-poller.js [--once] [--term=1266]
// =============================================================================

const path = require('path');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const NOTIFY_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const STATE_REFRESH_MS = 6 * 60 * 60 * 1000; // rewrite unchanged state docs at most every 6h
const DEFAULT_TERM = '1266'; // Fall 2026 — last-resort fallback
// Cap on subjects scraped per term per run. Watches spread across many
// subjects must not turn every 20-minute poll into a near-full LOCUS scrape;
// excess subjects rotate round-robin across runs (cursor persisted in the
// admin-only watchPoller/_meta doc) so every subject is covered within a few
// cycles.
const MAX_SUBJECTS_PER_POLL = 12;

function initFirestore() {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))),
    });
  }
  return { admin, fdb: admin.firestore() };
}

// 'Closed' or anything waitlist-ish ('Wait List', 'Waitlist', ...) counts as
// a not-open prior state worth alerting on when it flips to 'Open'.
function isClosedish(status) {
  if (!status) return false;
  return status === 'Closed' || /wait\s*list|waitlist/i.test(status);
}

function meetingSummary(sec) {
  const days = sec.meetingDays || '';
  const start = sec.meetingTimeStart || '';
  const end = sec.meetingTimeEnd || '';
  const time = start && end ? `${start}-${end}` : start;
  const summary = [days, time].filter(Boolean).join(' ');
  return summary || 'TBA';
}

// Latest term doc id (terms/{code} docs carry a `code` field), else DEFAULT_TERM.
async function resolveFallbackTerm(fdb) {
  try {
    const snap = await fdb.collection('terms').orderBy('code', 'desc').limit(1).get();
    if (!snap.empty) return snap.docs[0].id;
  } catch (err) {
    console.warn('[watch-poller] could not resolve latest term:', err.message || err);
  }
  return DEFAULT_TERM;
}

// Push tokens are credentials-adjacent (anyone holding one can spam that
// device via the public exp.host endpoint) and PM2 logs persist to disk —
// never log a full token.
function redactToken(token) {
  return `${String(token).slice(0, 24)}…`;
}

// Send all Expo push messages in one exp.host request; log tickets/errors.
// (Expo caps 100 messages/request — far above realistic watch volume here.)
// Error tickets can echo the full token in their message — log only the
// redacted token plus the ticket's error code / sanitized message.
// Returns a boolean array aligned with `messages`: true where Expo accepted
// the message (ticket status 'ok'). A request-level failure (network error /
// non-2xx) returns all-false so the caller can retry on a later poll.
async function sendExpoPushes(messages) {
  const accepted = new Array(messages.length).fill(false);
  if (messages.length === 0) return accepted;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      // Request-level error bodies can list full tokens in details — redact.
      const raw = String(JSON.stringify(body)).replace(/ExponentPushToken\[[^\]]*\]/g, (m) => redactToken(m));
      console.error(`[watch-poller] Expo push HTTP ${res.status}:`, raw);
      return accepted;
    }
    const tickets = (body && body.data) || [];
    tickets.forEach((t, i) => {
      if (i >= messages.length) return;
      const to = redactToken(messages[i].to);
      if (t.status === 'ok') {
        accepted[i] = true;
        console.log(`[watch-poller] push ok -> ${to} (${messages[i].title})`);
      } else {
        const errCode = (t.details && t.details.error) || t.status || 'unknown';
        const msg = String(t.message || '').split(messages[i].to).join(to);
        console.error(`[watch-poller] push error -> ${to}: ${errCode}${msg ? ` — ${msg}` : ''}`);
      }
    });
  } catch (err) {
    console.error('[watch-poller] Expo push request failed:', err.message || err);
  }
  return accepted;
}

async function pollWatches({ termCode } = {}) {
  const startedAt = new Date().toISOString();
  let admin, fdb;
  try {
    ({ admin, fdb } = initFirestore());
  } catch (err) {
    console.error('[watch-poller] Firestore init failed:', err.message || err);
    return { error: `Firestore init failed: ${err.message || err}` };
  }

  // --- a. Gather all watches across users ---------------------------------
  let snap;
  try {
    snap = await fdb.collectionGroup('watches').get();
  } catch (err) {
    console.error('[watch-poller] watches query failed:', err.message || err);
    return { error: `watches query failed: ${err.message || err}` };
  }
  if (snap.empty) {
    console.log(`[watch-poller] ${startedAt} no watches — nothing to do.`);
    return { watches: 0 };
  }

  const fallbackTerm = termCode ? String(termCode) : await resolveFallbackTerm(fdb);
  const watches = snap.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      uid: doc.ref.parent.parent.id,
      classNumber: String(data.classNumber != null ? data.classNumber : doc.id),
      termCode: String(data.termCode || fallbackTerm),
    };
  });
  console.log(`[watch-poller] ${startedAt} ${watches.length} watch(es), fallback term ${fallbackTerm}`);

  // --- b. Resolve each watch's section doc (subject/courseCode/meeting) ----
  // Cache section lookups: many users can watch the same class.
  const sectionCache = new Map(); // `${term}_${classNumber}` -> section data | null
  const resolved = [];
  for (const w of watches) {
    const key = `${w.termCode}_${w.classNumber}`;
    if (!sectionCache.has(key)) {
      try {
        const doc = await fdb.collection('terms').doc(w.termCode)
          .collection('sections').doc(w.classNumber).get();
        sectionCache.set(key, doc.exists ? doc.data() : null);
      } catch (err) {
        console.error(`[watch-poller] section read failed for ${key}:`, err.message || err);
        sectionCache.set(key, null);
      }
    }
    const section = sectionCache.get(key);
    if (!section || !section.subject) {
      console.log(`[watch-poller] skip watch ${key} (uid ${w.uid}) — section doc missing or has no subject.`);
      continue;
    }
    // firestore-sync marks sections that vanished from LOCUS as status:'removed'
    // (cancelled/renumbered). Don't scrape a subject just for a dead class —
    // the section can never flip to Open again under this class number.
    if (section.status === 'removed') {
      console.log(`[watch-poller] skip watch ${key} (uid ${w.uid}) — section was removed from LOCUS (cancelled/renumbered).`);
      continue;
    }
    resolved.push({ ...w, key, section });
  }
  if (resolved.length === 0) {
    return { watches: watches.length, resolved: 0, notified: 0 };
  }

  // --- c. ONE scraper pass over the deduped subjects (no enrollment clicks) -
  // Group by term (normally a single term); one browser instance for the run.
  const subjectsByTerm = new Map();
  for (const r of resolved) {
    if (!subjectsByTerm.has(r.termCode)) subjectsByTerm.set(r.termCode, new Set());
    subjectsByTerm.get(r.termCode).add(r.section.subject);
  }

  // Cap the per-term fan-out at MAX_SUBJECTS_PER_POLL. Over the cap, scrape a
  // rotating window over the sorted subject list; classes whose subject falls
  // outside this run's window are simply absent from statusByKey, so the diff
  // loop leaves their state untouched until their subject's turn comes around.
  const metaRef = fdb.collection('watchPoller').doc('_meta');
  let subjectCursors = null; // lazily loaded only when some term exceeds the cap
  for (const [term, subjectSet] of subjectsByTerm) {
    if (subjectSet.size <= MAX_SUBJECTS_PER_POLL) continue;
    if (subjectCursors === null) {
      try {
        const metaDoc = await metaRef.get();
        subjectCursors = (metaDoc.exists && metaDoc.data().subjectCursors) || {};
      } catch (err) {
        console.error('[watch-poller] _meta read failed — cursor restarts at 0:', err.message || err);
        subjectCursors = {};
      }
    }
    const all = [...subjectSet].sort();
    const raw = Number(subjectCursors[term]);
    const start = Number.isInteger(raw) && raw >= 0 ? raw % all.length : 0;
    const window = [];
    for (let i = 0; i < MAX_SUBJECTS_PER_POLL; i++) {
      window.push(all[(start + i) % all.length]);
    }
    console.warn(
      `[watch-poller] WARNING term ${term}: ${all.length} watched subjects exceed ` +
      `MAX_SUBJECTS_PER_POLL=${MAX_SUBJECTS_PER_POLL} — scraping rotating window ` +
      `[${window.join(', ')}]; remaining subjects are covered on later runs.`
    );
    subjectsByTerm.set(term, new Set(window));
    subjectCursors[term] = (start + MAX_SUBJECTS_PER_POLL) % all.length;
  }
  if (subjectCursors !== null) {
    try {
      await metaRef.set({ subjectCursors }, { merge: true });
    } catch (err) {
      console.error('[watch-poller] _meta cursor write failed:', err.message || err);
    }
  }

  // `${term}|${subject}` pairs actually scraped this run (post-cap), so the
  // diff loop can tell "rotated out" apart from "vanished from LOCUS".
  const scrapedSubjects = new Set();
  for (const [term, subjectSet] of subjectsByTerm) {
    for (const subj of subjectSet) scrapedSubjects.add(`${term}|${subj}`);
  }

  const statusByKey = new Map(); // `${term}_${classNumber}` -> fresh LOCUS status
  const { LocusPuppeteerScraper } = require('./scraper-puppeteer');
  const scraper = new LocusPuppeteerScraper();
  try {
    await scraper.init();
    for (const [term, subjectSet] of subjectsByTerm) {
      const subjects = [...subjectSet];
      console.log(`[watch-poller] scraping term ${term}: ${subjects.join(', ')}`);
      const sections = await scraper.scrapeAll(term, subjects, false);
      for (const s of sections) {
        statusByKey.set(`${term}_${String(s.class_number)}`, s.status);
      }
    }
  } catch (err) {
    console.error('[watch-poller] scrape failed — aborting poll:', err.message || err);
    return { error: `scrape failed: ${err.message || err}`, watches: watches.length };
  } finally {
    await scraper.close().catch(() => {});
  }

  // --- d/e. Diff against watchPoller state; queue pushes; update state -----
  // State docs are per-class (shared by all watchers of that class); pushes
  // are per-watching-user. NEVER write to users/{uid}/watches — see header.
  const Timestamp = admin.firestore.Timestamp;
  const now = Timestamp.now();

  // Group watchers by class so each state doc is read/written once.
  const byKey = new Map();
  for (const r of resolved) {
    if (!byKey.has(r.key)) byKey.set(r.key, { section: r.section, termCode: r.termCode, classNumber: r.classNumber, uids: new Set() });
    byKey.get(r.key).uids.add(r.uid);
  }

  const messages = [];
  const messageKeys = []; // messageKeys[i] = watchPoller key that queued messages[i]
  let notified = 0, transitions = 0, firstSightings = 0, checked = 0;

  for (const [key, entry] of byKey) {
    const newStatus = statusByKey.get(key);
    if (newStatus === undefined) {
      if (!scrapedSubjects.has(`${entry.termCode}|${entry.section.subject}`)) {
        console.log(`[watch-poller] ${key}: subject ${entry.section.subject} rotated out this run (subject cap) — state untouched.`);
      } else {
        console.log(`[watch-poller] ${key}: not in scrape results (removed/renumbered?) — state untouched.`);
      }
      continue;
    }
    checked++;

    const stateRef = fdb.collection('watchPoller').doc(key);
    let prev = null;
    try {
      const prevDoc = await stateRef.get();
      prev = prevDoc.exists ? prevDoc.data() : null;
    } catch (err) {
      console.error(`[watch-poller] state read failed for ${key}:`, err.message || err);
      continue; // don't guess — skip this class this round
    }

    let shouldNotify = false;
    if (!prev) {
      // First sighting: record state only, never notify.
      firstSightings++;
    } else {
      const transition = isClosedish(prev.lastStatus) && newStatus === 'Open';
      // A pending marker means a previous poll owed an alert but exp.host
      // never accepted it (network blip / HTTP error) — retry while the class
      // is still Open, even though the closedish->Open edge already passed.
      const retry = prev.notifyPending === true && newStatus === 'Open';
      if (transition) transitions++;
      if (transition || retry) {
        const lastNotifiedMs = prev.notifiedAt && typeof prev.notifiedAt.toMillis === 'function'
          ? prev.notifiedAt.toMillis() : 0;
        if (Date.now() - lastNotifiedMs < NOTIFY_COOLDOWN_MS) {
          console.log(`[watch-poller] ${key}: opened but notified <6h ago — cooldown, skipping.`);
        } else {
          shouldNotify = true;
          if (retry && !transition) {
            console.log(`[watch-poller] ${key}: retrying pushes that were not accepted last poll.`);
          }
        }
      }
    }

    let queuedForKey = 0;
    if (shouldNotify) {
      const sec = entry.section;
      const courseCode = sec.courseCode || `${sec.subject} ${sec.catalogNumber || ''}`.trim();
      for (const uid of entry.uids) {
        let token = null;
        try {
          const userDoc = await fdb.collection('users').doc(uid).get();
          token = userDoc.exists ? userDoc.data().expoPushToken : null;
        } catch (err) {
          console.error(`[watch-poller] user read failed for ${uid}:`, err.message || err);
        }
        if (token && /^ExponentPushToken/.test(token)) {
          messages.push({
            to: token,
            title: `Seat opened: ${courseCode}`,
            body: `${courseCode} Sec ${sec.sectionNumber || '?'} (${meetingSummary(sec)}) is now Open — grab it in LOCUS!`,
            data: { classNumber: entry.classNumber, termCode: entry.termCode },
          });
          messageKeys.push(key);
          queuedForKey++;
        } else {
          console.log(`[watch-poller] ${key}: uid ${uid} has no valid expoPushToken — skipping push.`);
        }
      }
    }

    // Persist fresh status (merge; admin-only collection). notifiedAt is
    // deliberately NOT written here — it is recorded after exp.host accepts
    // the push (below), so a failed send is retried via notifyPending instead
    // of being silently marked as delivered.
    // Steady-state skip: with 20-min polls, unconditionally rewriting every
    // state doc costs ~72 writes/class/day for nothing. Skip when the status
    // is unchanged, no notify bookkeeping needs to change, and checkedAt is
    // still reasonably fresh (rewritten every ~6h as a liveness marker).
    const queuedNotify = shouldNotify && queuedForKey > 0;
    const clearPending = !queuedNotify && prev && prev.notifyPending;
    const checkedAtMs = prev && prev.checkedAt && typeof prev.checkedAt.toMillis === 'function'
      ? prev.checkedAt.toMillis() : 0;
    const checkedAtFresh = Date.now() - checkedAtMs < STATE_REFRESH_MS;
    if (prev && prev.lastStatus === newStatus && !queuedNotify && !clearPending && checkedAtFresh) {
      continue;
    }
    try {
      const state = { lastStatus: newStatus, checkedAt: now };
      if (queuedNotify) {
        state.notifyPending = true;
      } else if (clearPending) {
        // Owed alert is moot (class not Open anymore, cooldown, or no watcher
        // has a valid token) — clear the marker.
        state.notifyPending = admin.firestore.FieldValue.delete();
      }
      await stateRef.set(state, { merge: true });
    } catch (err) {
      console.error(`[watch-poller] state write failed for ${key}:`, err.message || err);
    }
  }

  // Batch every queued message into ONE exp.host request, THEN record
  // notifiedAt only for classes where at least one ticket was accepted.
  // Classes whose pushes all failed keep notifyPending and retry next poll.
  const accepted = await sendExpoPushes(messages);
  const anyAcceptedByKey = new Map();
  accepted.forEach((ok, i) => {
    const k = messageKeys[i];
    anyAcceptedByKey.set(k, anyAcceptedByKey.get(k) || ok);
    if (ok) notified++;
  });
  for (const [k, anyOk] of anyAcceptedByKey) {
    if (!anyOk) {
      console.log(`[watch-poller] ${k}: no push accepted — notifyPending kept, retrying next poll.`);
      continue;
    }
    try {
      await fdb.collection('watchPoller').doc(k).set(
        { notifiedAt: now, notifyPending: admin.firestore.FieldValue.delete() },
        { merge: true }
      );
    } catch (err) {
      console.error(`[watch-poller] notifiedAt write failed for ${k}:`, err.message || err);
    }
  }

  const result = {
    watches: watches.length,
    resolved: resolved.length,
    classesChecked: checked,
    firstSightings,
    transitions,
    pushesQueued: messages.length,
    notified, // pushes ACCEPTED by exp.host (not merely queued)
  };
  console.log('[watch-poller] done:', JSON.stringify(result));
  return result;
}

module.exports = { pollWatches };

// --- CLI: node watch-poller.js [--once] [--term=1266] ------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const termArg = args.find((a) => a.startsWith('--term='));
  const termCode = termArg ? termArg.split('=')[1] : undefined;

  pollWatches({ termCode })
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(result && result.error ? 1 : 0);
    })
    .catch((err) => {
      console.error('[watch-poller] fatal:', err);
      process.exit(1);
    });
}
