// =============================================================================
// fill-stats.js — per-term course fill-speed analysis + Firestore uploader.
//
// Computes, per course (subject + catalog number), how fast it filled during a
// term's registration period, using the enrollment_history table in locus.db
// (READ-ONLY: sql.js loads the file into memory; nothing is written back).
//
// Methodology (vetted against Fall-2026 / term 1266 data):
//   1. Dedup snapshots: per (class_number, calendar day) keep the row with MAX
//      enrollment_total (tie -> later snapshot).
//   2. Inflection detection: find the day main registration opened, from
//      matched-section day-over-day enrollment deltas within the window
//      starting at the first day of positive enrollment activity (+21 days):
//        rule (a) first day with delta >= 1000 seats AND >= 5x previous day;
//        fallback (b) first day >= max(500, 35% of window max delta);
//        fallback (c) the max-delta day.
//   3. Per course: aggregate SUM(enrollment)/SUM(cap) across sections (cap>0)
//      per day; daysTo90 = days from inflection to first day at >= 90% full.
//   4. Classification (only courses with final aggregate cap >= 15):
//        day1-2      daysTo90 <= 2
//        first-week  daysTo90 <= 7
//        steady      reached 90% later, or never reached 90% but ended >= 60%
//        open        never reached 90% and ended < 60% full
//      NOTE: 'open' is often freshman-reserved core seats that fill at summer
//      orientation — it must NOT be treated as a scarcity signal.
//   5. capChanged: aggregate cap changed > 20% between first and last snapshot
//      day (percent-full for these courses is an estimate).
//
// Usage:
//   node fill-stats.js <termCode>            # analyze + print summary
//   node fill-stats.js <termCode> --upload   # also write results to Firestore:
//     - courses/{SUBJ NUM} set-merge  fillStats: { termCode, class, daysTo90,
//         dateAt90, finalPct, capChanged, computedAt }   (every classified course)
//     - meta/fillStats = { termCode, counts, inflectionDate, computedAt }
//   Writes use the Admin SDK (serviceAccountKey.json) in batches of <= 450.
// =============================================================================

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'locus.db');

// ---- date helpers -----------------------------------------------------------
const dayOf = (s) => String(s).slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const diffDays = (a, b) =>
  Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 86400000);

// ---- analysis ----------------------------------------------------------------
function analyzeTerm(termCode) {
  const SQLPromise = initSqlJs();
  return SQLPromise.then((SQL) => {
    const db = new SQL.Database(fs.readFileSync(DB_PATH)); // in-memory copy: read-only
    const stmt = db.prepare(
      `SELECT class_number, subject, catalog_number,
              enrollment_cap, enrollment_total, snapshot_date
       FROM enrollment_history WHERE term_code = ?`
    );
    stmt.bind([String(termCode)]);

    // Dedup: per (class_number, day) keep row with MAX enrollment (tie -> later snapshot).
    const secDay = new Map(); // class_number -> Map(day -> {enr, cap, snap, subject, catalog})
    let nRows = 0;
    while (stmt.step()) {
      const r = stmt.getAsObject();
      nRows++;
      const d = dayOf(r.snapshot_date);
      let m = secDay.get(r.class_number);
      if (!m) { m = new Map(); secDay.set(r.class_number, m); }
      const prev = m.get(d);
      if (!prev || r.enrollment_total > prev.enr ||
          (r.enrollment_total === prev.enr && r.snapshot_date > prev.snap)) {
        m.set(d, {
          enr: r.enrollment_total || 0, cap: r.enrollment_cap || 0,
          snap: r.snapshot_date, subject: r.subject || '', catalog: r.catalog_number || '',
        });
      }
    }
    stmt.free();
    db.close();
    if (nRows === 0) throw new Error(`No enrollment_history rows for term ${termCode}`);

    const allDays = [...new Set([...secDay.values()].flatMap((m) => [...m.keys()]))].sort();

    // Matched-section day-over-day deltas.
    const dailyDeltas = []; // {date, matchedDelta}
    for (let i = 1; i < allDays.length; i++) {
      const p = allDays[i - 1], d = allDays[i];
      let matched = 0;
      for (const m of secDay.values()) {
        const a = m.get(p), b = m.get(d);
        if (a && b) matched += b.enr - a.enr;
      }
      dailyDeltas.push({ date: d, matchedDelta: matched });
    }

    // Inflection window: first day with positive activity, +21 days.
    const firstActive = dailyDeltas.find((r) => r.matchedDelta > 0);
    if (!firstActive) throw new Error(`No enrollment activity found for term ${termCode}`);
    const windowEnd = addDays(firstActive.date, 21);
    const win = dailyDeltas.filter((r) => r.date >= firstActive.date && r.date <= windowEnd);
    const maxWinDelta = Math.max(...win.map((r) => r.matchedDelta));

    let inflectionDate = null, inflectionRule = null;
    const winStartIdx = dailyDeltas.findIndex((r) => r.date === win[0].date);
    for (let i = 0; i < win.length; i++) {
      const prev = i > 0 ? win[i - 1].matchedDelta
        : (winStartIdx > 0 ? dailyDeltas[winStartIdx - 1].matchedDelta : 0);
      const cur = win[i].matchedDelta;
      if (cur >= 1000 && prev >= 0 && cur >= 5 * Math.max(prev, 1)) {
        inflectionDate = win[i].date; inflectionRule = 'a: >=1000 seats and >=5x previous day';
        break;
      }
    }
    if (!inflectionDate) {
      for (const r of win) {
        if (r.matchedDelta >= Math.max(500, 0.35 * maxWinDelta)) {
          inflectionDate = r.date; inflectionRule = 'b: first >= max(500, 35% of window max)';
          break;
        }
      }
    }
    if (!inflectionDate) {
      inflectionDate = win.reduce((b, r) => (r.matchedDelta > (b ? b.matchedDelta : -1) ? r : b), null).date;
      inflectionRule = 'c: max window delta';
    }

    // Course identity per section = subject/catalog from the LATEST day with
    // non-empty values (early snapshots can have blank catalog_number).
    const courses = new Map(); // 'SUBJ NUM' -> {subject, catalog, sections:Set}
    for (const [cn, m] of secDay) {
      let best = null, bestDay = '';
      for (const [d, rec] of m) {
        if (rec.subject && rec.catalog && d > bestDay) { best = rec; bestDay = d; }
      }
      if (!best) continue;
      const key = best.subject + ' ' + best.catalog;
      let c = courses.get(key);
      if (!c) { c = { subject: best.subject, catalog: best.catalog, sections: new Set() }; courses.set(key, c); }
      c.sections.add(cn);
    }

    // Per-course aggregate timelines + classification.
    const courseResults = [];
    for (const [key, c] of courses) {
      const series = [];
      for (const d of allDays) {
        let enr = 0, cap = 0;
        for (const cn of c.sections) {
          const rec = secDay.get(cn).get(d);
          if (rec && rec.cap > 0) { enr += rec.enr; cap += rec.cap; }
        }
        if (cap > 0) series.push({ date: d, enr, cap, pct: enr / cap });
      }
      if (!series.length) continue;
      const firstS = series[0], lastS = series[series.length - 1];
      let dateAt90 = null;
      for (const s of series) {
        if (s.pct >= 0.90) { dateAt90 = s.date; break; }
      }
      const daysTo90 = dateAt90 ? diffDays(dateAt90, inflectionDate) : null;
      const finalPct = +(lastS.pct * 100).toFixed(1);

      let cls = null;
      if (lastS.cap >= 15) {
        if (daysTo90 !== null && daysTo90 <= 2) cls = 'day1-2';
        else if (daysTo90 !== null && daysTo90 <= 7) cls = 'first-week';
        else if (daysTo90 !== null) cls = 'steady';
        else if (finalPct < 60) cls = 'open';
        else cls = 'steady';
      }

      const capChanged = firstS.cap > 0 && Math.abs(lastS.cap - firstS.cap) / firstS.cap > 0.20;

      courseResults.push({
        key, subject: c.subject, catalog: c.catalog,
        cap: lastS.cap, capFirstDay: firstS.cap,
        daysTo90, dateAt90, finalPct, capChanged, class: cls,
      });
    }
    courseResults.sort((a, b) => (a.daysTo90 ?? 9999) - (b.daysTo90 ?? 9999) || b.cap - a.cap);

    const classified = courseResults.filter((c) => c.class);
    const counts = {};
    for (const c of classified) counts[c.class] = (counts[c.class] || 0) + 1;
    counts.totalClassified = classified.length;
    counts.excludedSmallCap = courseResults.length - classified.length;

    return {
      termCode: String(termCode), inflectionDate, inflectionRule,
      firstDay: allDays[0], lastDay: allDays[allDays.length - 1],
      counts, courseResults, classified,
    };
  });
}

// ---- Firestore upload ---------------------------------------------------------
async function uploadToFirestore(analysis) {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))),
    });
  }
  const fdb = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;

  // Batched writer (Firestore limit 500 ops/commit; stay at <= 450).
  let batch = fdb.batch();
  let n = 0, total = 0;
  const flush = async () => { if (n > 0) { await batch.commit(); batch = fdb.batch(); n = 0; } };
  const setMerge = async (ref, data) => {
    batch.set(ref, data, { merge: true });
    total++;
    if (++n >= 450) await flush();
  };

  for (const c of analysis.classified) {
    await setMerge(fdb.collection('courses').doc(c.key), {
      fillStats: {
        termCode: analysis.termCode,
        class: c.class,
        daysTo90: c.daysTo90,          // nullable
        dateAt90: c.dateAt90,          // nullable
        finalPct: c.finalPct,
        capChanged: c.capChanged,
        computedAt: FieldValue.serverTimestamp(),
      },
    });
  }
  await setMerge(fdb.collection('meta').doc('fillStats'), {
    termCode: analysis.termCode,
    counts: analysis.counts,
    inflectionDate: analysis.inflectionDate,
    computedAt: FieldValue.serverTimestamp(),
  });
  await flush();
  return total;
}

// ---- CLI -----------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const termCode = args.find((a) => !a.startsWith('--'));
  const doUpload = args.includes('--upload');
  if (!termCode) {
    console.error('Usage: node fill-stats.js <termCode> [--upload]');
    process.exit(1);
  }

  const analysis = await analyzeTerm(termCode);

  console.log(`=== Fill-stats for term ${analysis.termCode} ===`);
  console.log(`Snapshot range: ${analysis.firstDay} .. ${analysis.lastDay}`);
  console.log(`Inflection (main registration opened): ${analysis.inflectionDate}  [rule ${analysis.inflectionRule}]`);
  console.log(`Counts: ${JSON.stringify(analysis.counts)}`);
  const capChangedCount = analysis.classified.filter((c) => c.capChanged).length;
  console.log(`capChanged (>20% aggregate cap churn): ${capChangedCount} of ${analysis.counts.totalClassified} classified`);
  console.log('\n--- day1-2 courses ---');
  for (const c of analysis.classified.filter((c) => c.class === 'day1-2')) {
    console.log(`${c.key}  cap=${c.cap}  daysTo90=${c.daysTo90}  at90=${c.dateAt90}  final=${c.finalPct}%${c.capChanged ? '  [capChanged]' : ''}`);
  }
  console.log('\n--- first-week courses ---');
  for (const c of analysis.classified.filter((c) => c.class === 'first-week')) {
    console.log(`${c.key}  cap=${c.cap}  daysTo90=${c.daysTo90}  at90=${c.dateAt90}  final=${c.finalPct}%${c.capChanged ? '  [capChanged]' : ''}`);
  }

  if (doUpload) {
    console.log('\nUploading to Firestore...');
    const written = await uploadToFirestore(analysis);
    console.log(`Wrote ${written} docs (${analysis.counts.totalClassified} courses + 1 meta/fillStats summary).`);
  } else {
    console.log('\n(dry run — pass --upload to write to Firestore)');
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { analyzeTerm, uploadToFirestore };
