// =============================================================================
// scrape-requirements.js — B12: backfill program requirements from the LUC
// academic catalog (catalog.luc.edu, CourseLeaf).
//
// The original catalog ETL left ALL 109 minors (and 39 majors) with zero rows
// in program_courses. This script parses each program page's sc_courselist
// table(s) into required courses and CHOICE GROUPS ("Select one of: ..."),
// writes them to SQLite (program_courses + missing courses) and to Firestore
// (programs/{id}/requiredCourses/* + missing courses/{code} docs). The client
// picks the change up automatically via the catalogDataVersion fingerprint.
//
// Data model: program_courses gains choice_group INTEGER + choose_count
// INTEGER (NULL for plain required rows). requiredCourses docs mirror this as
// {courseCode, requirementType: 'required'|'choice', choiceGroup?, chooseCount?}.
// The client's requirement-progress.js counts a group of M options with
// choose_count N as N units.
//
// Usage:
//   node scrape-requirements.js                  dry run, ALL minors
//   node scrape-requirements.js --name=Philosophy   dry run, matching minors
//   node scrape-requirements.js --apply          parse + write SQLite + Firestore
//   node scrape-requirements.js --name=Philosophy --apply
// After --apply: restart PM2 (server holds the DB image in memory).
// =============================================================================

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const CATALOG_BASE = 'https://catalog.luc.edu';
const DB_PATH = path.join(__dirname, 'locus.db');
const FETCH_DELAY_MS = 350; // politeness between page fetches

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RamblerRegistrar requirements ETL (student project)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    // Transient network flakes silently emptied programs in earlier runs
    // (African Studies 2026-07-09) — one retry with backoff fixes most.
    if (attempt >= 3) throw err;
    await sleep(1500 * attempt);
    return fetchHtml(url, attempt + 1);
  }
}

// "Philosophy Minor" / "Philosophy, Minor" -> "philosophy"
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\bminor\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CODE_RE = /^[A-Z]{2,5} \d{2,3}[A-Z]{0,2}$/;
const WORD_NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };

// A comment opens a choice group when it reads like "Select two ...",
// "Choose one ...", a bare count ("Two PHIL Elective Courses ..."), or an
// "Any ... Course" prose slot (Anthropology minor: one row per slot).
function chooseTrigger(text) {
  return /^(select|choose|take|any)\b/i.test(text.trim()) ||
    /^(one|two|three|four|five|six|\d+)\b[^:]*\bcourses?\b/i.test(text.trim());
}

function parseChooseCount(commentText, hoursText) {
  const t = String(commentText).toLowerCase();
  let m = t.match(/\b(?:select|choose|take)\s+(?:at least\s+)?(\w+)/);
  if (!m) m = t.match(/^\s*(one|two|three|four|five|six|\d+)\b/);
  if (m) {
    if (WORD_NUMS[m[1]] != null) return WORD_NUMS[m[1]];
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 1 && n <= 8) return n;
  }
  const hours = parseFloat(String(hoursText).replace(/[^\d.]/g, ''));
  if (Number.isFinite(hours) && hours >= 3) return Math.max(1, Math.round(hours / 3));
  return 1;
}

// Nearest preceding heading for a table — used to skip "Suggested Sequence"
// sample-track tables that would otherwise double-count requirements.
function tableHeading($, table) {
  let el = $(table).prev();
  for (let i = 0; i < 6 && el.length; i++) {
    const tag = (el[0].tagName || '').toLowerCase();
    if (/^h[1-6]$/.test(tag)) return el.text().trim();
    el = el.prev();
  }
  return '';
}
const SKIP_HEADING_RE = /suggest|sample|typical|sequence|plan of stud|four.year/i;

// Parse every sc_courselist table on a program page into requirement rows:
// [{ code, title, credits, type: 'required' } |
//  { code, title, credits, type: 'choice', group, choose }]
function parseProgramPage(html) {
  const $ = cheerio.load(html);
  const rows = [];
  const oddities = [];
  const groupComments = new Map(); // group id -> comment text
  let groupSeq = 0;
  let currentGroup = null; // { id, choose }

  const tables = $('table.sc_courselist').toArray().filter((t) => {
    const heading = tableHeading($, t);
    if (SKIP_HEADING_RE.test(heading)) {
      oddities.push(`skipped sample-track table under "${heading}"`);
      return false;
    }
    return true;
  });

  $(tables).find('tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const cls = $tr.attr('class') || '';

    // Section headers reset grouping.
    if ($tr.find('span.courselistcomment.areaheader').length) {
      currentGroup = null;
      return;
    }

    // Comment rows: "Select one ..." opens a choice group; anything else closes.
    const $comment = $tr.find('span.courselistcomment').first();
    if ($comment.length && !$tr.find('td.codecol a.code').length) {
      const text = $comment.text().replace(/\u00a0/g, ' ').trim();
      if (chooseTrigger(text)) {
        currentGroup = { id: ++groupSeq, choose: parseChooseCount(text, $tr.find('td.hourscol').text()) };
        groupComments.set(currentGroup.id, text);
      } else {
        currentGroup = null;
      }
      return;
    }

    // Course rows.
    const $codeCell = $tr.find('td.codecol').first();
    const anchors = $codeCell.find('a.code');
    if (!anchors.length) return;

    const indented = $codeCell.find('.blockindent').length > 0;
    const isOr = /\borclass\b/.test(cls);
    const title = $codeCell.nextAll('td').first().text().replace(/\u00a0/g, ' ').trim();
    const hours = parseFloat($tr.find('td.hourscol').text().replace(/[^\d.]/g, ''));
    const credits = Number.isFinite(hours) && hours >= 1 && hours <= 12 ? Math.round(hours) : 3;

    const codes = [];
    anchors.each((_, a) => {
      const code = $(a).text().replace(/\u00a0/g, ' ').trim();
      if (CODE_RE.test(code)) codes.push(code);
      else oddities.push(`unparseable code "${code}"`);
    });
    if (!codes.length) return;
    if (codes.length > 1) oddities.push(`multi-code row (${codes.join(' & ')}) — added individually`);

    for (const code of codes) {
      if (isOr) {
        // "or X" continuation: pair with the previous row as a choose-1 group.
        const prev = rows[rows.length - 1];
        if (prev && prev.type === 'required') {
          const g = { id: ++groupSeq, choose: 1 };
          prev.type = 'choice';
          prev.group = g.id;
          prev.choose = 1;
          rows.push({ code, title, credits, type: 'choice', group: g.id, choose: 1 });
        } else if (prev && prev.type === 'choice') {
          rows.push({ code, title, credits, type: 'choice', group: prev.group, choose: prev.choose });
        } else {
          rows.push({ code, title, credits, type: 'required' });
        }
        continue;
      }
      if (indented && currentGroup) {
        rows.push({ code, title, credits, type: 'choice', group: currentGroup.id, choose: currentGroup.choose });
      } else {
        currentGroup = null; // a plain required row ends any open group
        rows.push({ code, title, credits, type: 'required' });
      }
    }
  });

  // De-dupe by code (PRIMARY KEY is (program_id, course_id)) — first wins.
  const seen = new Set();
  const deduped = [];
  for (const r of rows) {
    if (seen.has(r.code)) { oddities.push(`duplicate ${r.code} dropped`); continue; }
    seen.add(r.code);
    deduped.push(r);
  }
  // Choice groups that got no course rows are prose-only requirements
  // ("Two PHIL Elective Courses at any level"). When the comment names a
  // subject (and optionally a level), model them as SUBJECT ELECTIVES: any
  // course matching subject/level counts (B12 phase 2). Otherwise flag.
  const subjectElectives = [];
  const usedGroups = new Set(deduped.filter((r) => r.type === 'choice').map((r) => r.group));
  for (let g = 1; g <= groupSeq; g++) {
    if (usedGroups.has(g)) continue;
    const text = groupComments.get(g) || '';
    const subjM = text.match(/\b([A-Z]{2,5})\b/); // first code-like token
    if (subjM) {
      // Level floor: collect every course-level number in the comment
      // ("(100-, 200-, or 300-level)", "Any 200 or 300 Level ANTH Course",
      // "Two PHIL 300-level Electives"). Floor = the minimum listed level;
      // a floor of 100 (or "at any level") means no restriction.
      const anyLevel = /any level/i.test(text);
      const levels = [...new Set(
        [...text.matchAll(/\b([1-4]\d{2})\b(?=\s*-?\s*(?:,|or\b|[Ll]evel))/g)].map((m) => parseInt(m[1], 10))
      )];
      const minLevel = anyLevel || levels.length === 0 || Math.min(...levels) <= 100
        ? null
        : Math.min(...levels);
      const count = parseChooseCount(text, '');
      subjectElectives.push({ subject: subjM[1], minLevel, count });
      oddities.push(`subject elective: ${count}× ${subjM[1]}${minLevel ? ` ${minLevel}+` : ''} ("${text.slice(0, 60)}")`);
    } else {
      oddities.push(`prose-only requirement not modeled ("${text.slice(0, 60)}")`);
    }
  }
  // Merge duplicates on (subject, minLevel) — PRIMARY KEY in SQLite.
  const merged = new Map();
  for (const se of subjectElectives) {
    const k = `${se.subject}|${se.minLevel}`;
    if (merged.has(k)) merged.get(k).count += se.count;
    else merged.set(k, { ...se });
  }
  return { rows: deduped, subjectElectives: [...merged.values()], oddities };
}

// Discover undergraduate MAJOR pages: /undergraduate/ links that are neither
// minors nor certificates. Link text usually carries the degree: "Philosophy (BA)".
// Same normalized name can map to several degrees -> array per key.
async function discoverMajors() {
  const html = await fetchHtml(`${CATALOG_BASE}/programs/`);
  const $ = cheerio.load(html);
  const found = new Map(); // norm name -> [{ text, url, degree }]
  $('a[href*="/undergraduate/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (/-minor\/?$/.test(href) || /certificate/.test(href)) return;
    if (!/\/undergraduate\/[^/]+\/.+/.test(href)) return; // skip school landing pages
    const text = $(a).text().replace(/\u00a0/g, ' ').trim();
    if (!text) return;
    const degreeM = text.match(/\(([^)]+)\)\s*$/);
    const degree = degreeM ? degreeM[1].replace(/\./g, '').toUpperCase() : null;
    const bare = text.replace(/\s*\([^)]*\)\s*$/, '');
    const key = normName(bare);
    if (!key) return;
    if (!found.has(key)) found.set(key, []);
    const url = href.startsWith('http') ? href : CATALOG_BASE + href;
    if (!found.get(key).some((e) => e.url === url)) {
      found.get(key).push({ text, url, degree });
    }
  });
  return found;
}

// Discover minor pages from the /programs/ A-Z index.
async function discoverMinors() {
  const html = await fetchHtml(`${CATALOG_BASE}/programs/`);
  const $ = cheerio.load(html);
  const found = new Map(); // norm name -> { text, url }
  $('a[href*="/undergraduate/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!/-minor\/?$/.test(href)) return;
    const text = $(a).text().replace(/\u00a0/g, ' ').trim();
    if (!text) return;
    const key = normName(text);
    if (key && !found.has(key)) {
      found.set(key, { text, url: href.startsWith('http') ? href : CATALOG_BASE + href });
    }
  });
  return found;
}

// Manual URL overrides (B12 phase-2 pass, 2026-07-09): programs whose catalog
// link text can't be auto-matched — Arrupe College AA programs ("Liberal Arts
// with a Concentration in X" vs DB "Liberal Arts with X Concentration"),
// concentration variants, and dual degrees. Keyed by EXACT DB program name.
// "Ancient Greek" (BA) and "Italian" (BA) have NO catalog page (discontinued);
// same for minors "Asian Language and Literatures", "Interreligious and
// Interfaith Studies", "Italian American Studies" — left requirements-unknown.
const URL_OVERRIDES = {
  'Classics with Degree of Distinction': '/undergraduate/arts-sciences/classical-studies/classics-degree-distinction-bac-bsc/',
  'Liberal Arts + Bilingual/Bicultural Education (BSEd)': '/undergraduate/arrupe/liberal-arts-aa-bilingual-bicultural-education-bsed/',
  'Liberal Arts with Communication Concentration': '/undergraduate/arrupe/liberal-arts-aa-communication-concentration/',
  'Liberal Arts with English Concentration': '/undergraduate/arrupe/liberal-arts-aa-english-concentration/',
  'Liberal Arts with History Concentration': '/undergraduate/arrupe/liberal-arts-aa-history-concentration/',
  'Liberal Arts with Pre-STEM Concentration': '/undergraduate/arrupe/liberal-arts-aa-pre-stem-concentration/',
  'Music with Liturgical Music Concentration': '/undergraduate/arts-sciences/fine-performing-arts/music-concentration-liturgical-music-ba/',
  'Music with Vocal Performance Concentration': '/undergraduate/arts-sciences/fine-performing-arts/vocal-performance-concentration/',
  'Nursing (Four-Year)': '/undergraduate/nursing/four-year-bsn/',
  'Physics (BS) + Engineering (BS)': '/undergraduate/arts-sciences/physics/physics-bs-engineering-bs/',
  'Social and Behavioral Sciences + Nursing (BS)': '/undergraduate/arrupe/social-behavioral-sciences-aa-nursing-bs/',
  'Social and Behavioral Sciences with Criminal Justice Concentration': '/undergraduate/arrupe/social-behavioral-sciences-aa-criminal-justice-concentration/',
  'Social and Behavioral Sciences with Political Science Concentration': '/undergraduate/arrupe/social-behavioral-sciences-aa-political-science-concentration/',
  'Social and Behavioral Sciences with Psychology Concentration': '/undergraduate/arrupe/social-behavioral-sciences-aa-psychology-concentration/',
};

(async () => {
  const args = process.argv.slice(2);
  const APPLY = args.includes('--apply');
  const MAJORS = args.includes('--majors');
  const nameArg = (args.find((a) => a.startsWith('--name=')) || '').split('=')[1] || null;

  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  for (const col of ['choice_group INTEGER', 'choose_count INTEGER']) {
    try { db.run(`ALTER TABLE program_courses ADD COLUMN ${col}`); } catch (e) { /* exists */ }
  }
  db.run(`CREATE TABLE IF NOT EXISTS program_subject_electives (
    program_id INTEGER, subject TEXT NOT NULL, min_level INTEGER, count INTEGER DEFAULT 1,
    PRIMARY KEY (program_id, subject, min_level))`);

  const matched = [];
  const unmatched = [];

  if (MAJORS) {
    // Majors mode: ONLY majors with zero requirement rows (never clobber the
    // 82 populated ones). Disambiguate same-name programs by degree.
    const empty = db.exec(`
      SELECT p.id, p.name, p.degree FROM programs p
      WHERE p.type='major'
        AND NOT EXISTS (SELECT 1 FROM program_courses pc WHERE pc.program_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM program_subject_electives se WHERE se.program_id = p.id)
      ORDER BY p.name`)[0];
    const majors = (empty ? empty.values : [])
      .map(([id, name, degree]) => ({ id, name, degree: degree ? String(degree).replace(/\./g, '').toUpperCase() : null }))
      .filter((m) => !nameArg || m.name.toLowerCase().includes(nameArg.toLowerCase()));

    console.log(`Discovering MAJOR pages from ${CATALOG_BASE}/programs/ ...`);
    const catalogMajors = await discoverMajors();
    console.log(`  catalog lists ${catalogMajors.size} major names; DB has ${majors.length} EMPTY major(s) in scope.\n`);

    for (const m of majors) {
      // Manual override first (Arrupe/dual-degree names never auto-match).
      if (URL_OVERRIDES[m.name]) {
        matched.push({ ...m, url: CATALOG_BASE + URL_OVERRIDES[m.name], catalogText: `${m.name} [override]` });
        continue;
      }
      const candidates = catalogMajors.get(normName(m.name)) || [];
      let hit = null;
      if (candidates.length === 1) hit = candidates[0];
      else if (candidates.length > 1 && m.degree) hit = candidates.find((c) => c.degree === m.degree) || null;
      if (hit) matched.push({ ...m, url: hit.url, catalogText: hit.text });
      else unmatched.push(`${m.name}${m.degree ? ` (${m.degree})` : ''}${candidates.length > 1 ? ' [ambiguous]' : ''}`);
    }
    console.log(`Matched ${matched.length}/${majors.length}; unmatched: ${unmatched.length}`);
  } else {
    const minors = db.exec("SELECT id, name FROM programs WHERE type='minor' ORDER BY name")[0].values
      .map(([id, name]) => ({ id, name }))
      .filter((m) => !nameArg || m.name.toLowerCase().includes(nameArg.toLowerCase()));

    console.log(`Discovering minor pages from ${CATALOG_BASE}/programs/ ...`);
    const catalogMinors = await discoverMinors();
    console.log(`  catalog lists ${catalogMinors.size} minor pages; DB has ${minors.length} minor program(s) in scope.\n`);

    for (const m of minors) {
      const hit = catalogMinors.get(normName(m.name));
      if (hit) matched.push({ ...m, url: hit.url, catalogText: hit.text });
      else unmatched.push(m.name);
    }
    console.log(`Matched ${matched.length}/${minors.length}; unmatched: ${unmatched.length}`);
  }
  if (unmatched.length) console.log('  unmatched:', unmatched.join(' | '));

  // Firestore init only when applying.
  let fdb = null, admin = null;
  if (APPLY) {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))) });
    }
    fdb = admin.firestore();
  }

  let totalRows = 0, totalGroups = 0, totalElectives = 0, newCourses = 0, programsWritten = 0, failures = 0;

  for (const prog of matched) {
    await sleep(FETCH_DELAY_MS);
    let parsed;
    try {
      parsed = parseProgramPage(await fetchHtml(prog.url));
    } catch (e) {
      console.log(`✗ ${prog.name}: fetch/parse failed — ${e.message}`);
      failures++;
      continue;
    }
    const { rows, subjectElectives, oddities } = parsed;
    const nGroups = new Set(rows.filter((r) => r.type === 'choice').map((r) => r.group)).size;
    const units = rows.filter((r) => r.type === 'required').length +
      [...new Set(rows.filter((r) => r.type === 'choice').map((r) => r.group))]
        .reduce((s, g) => s + (rows.find((r) => r.group === g)?.choose || 1), 0) +
      subjectElectives.reduce((s, se) => s + se.count, 0);
    console.log(`${APPLY ? '→' : '·'} ${prog.name} (#${prog.id}): ${rows.length} course rows, ${nGroups} choice group(s), ${subjectElectives.length} subject elective(s), ~${units} units${oddities.length ? ` [${oddities.length} oddities]` : ''}`);
    for (const o of oddities.slice(0, 4)) console.log(`    ⚠ ${o}`);
    if (!rows.length && !subjectElectives.length) { failures++; continue; }
    totalRows += rows.length;
    totalGroups += nGroups;
    totalElectives += subjectElectives.length;

    if (!APPLY) continue;

    // ---- SQLite ----
    const courseIds = new Map();
    const createdCodes = [];
    for (const r of rows) {
      let res = db.exec('SELECT id FROM courses WHERE code = ?', [r.code]);
      if (!res[0]) {
        db.run('INSERT INTO courses (code, name, credits, department) VALUES (?, ?, ?, ?)',
          [r.code, r.title || r.code, r.credits, r.code.split(' ')[0]]);
        res = db.exec('SELECT id FROM courses WHERE code = ?', [r.code]);
        newCourses++;
        createdCodes.push(r.code);
      }
      courseIds.set(r.code, res[0].values[0][0]);
    }
    db.run('DELETE FROM program_courses WHERE program_id = ?', [prog.id]);
    for (const r of rows) {
      db.run(
        'INSERT INTO program_courses (program_id, course_id, requirement_type, choice_group, choose_count) VALUES (?, ?, ?, ?, ?)',
        [prog.id, courseIds.get(r.code),
          r.type === 'choice' ? 'choice' : 'required',
          r.type === 'choice' ? r.group : null,
          r.type === 'choice' ? r.choose : null]
      );
    }
    db.run('DELETE FROM program_subject_electives WHERE program_id = ?', [prog.id]);
    for (const se of subjectElectives) {
      db.run(
        'INSERT INTO program_subject_electives (program_id, subject, min_level, count) VALUES (?, ?, ?, ?)',
        [prog.id, se.subject, se.minLevel, se.count]
      );
    }

    // ---- Firestore ----
    const rcCol = fdb.collection('programs').doc(String(prog.id)).collection('requiredCourses');
    const existing = await rcCol.get();
    const batch1 = fdb.batch();
    existing.docs.forEach((d) => batch1.delete(d.ref));
    await batch1.commit();
    let batch = fdb.batch();
    let n = 0;
    for (const r of rows) {
      const docData = { courseCode: r.code, requirementType: r.type === 'choice' ? 'choice' : 'required' };
      if (r.type === 'choice') { docData.choiceGroup = r.group; docData.chooseCount = r.choose; }
      batch.set(rcCol.doc(r.code.replace(/\//g, '_')), docData);
      if (++n >= 400) { await batch.commit(); batch = fdb.batch(); n = 0; }
    }
    for (const se of subjectElectives) {
      const docData = { requirementType: 'subject_elective', subject: se.subject, count: se.count };
      if (se.minLevel != null) docData.minLevel = se.minLevel;
      batch.set(rcCol.doc(`ELECTIVE-${se.subject}-${se.minLevel ?? 'ANY'}`), docData);
      if (++n >= 400) { await batch.commit(); batch = fdb.batch(); n = 0; }
    }
    // New course docs so the client's INNER-JOIN lookups don't drop options.
    for (const code of createdCodes) {
      const r = rows.find((x) => x.code === code);
      batch.set(fdb.collection('courses').doc(code.replace(/\//g, '_')), {
        code, name: r.title || code, credits: r.credits, department: code.split(' ')[0],
      }, { merge: true });
      if (++n >= 400) { await batch.commit(); batch = fdb.batch(); n = 0; }
    }
    if (n > 0) await batch.commit();
    programsWritten++;
  }

  console.log(`\nTOTALS: ${matched.length} matched, ${failures} failed/empty, ${totalRows} course rows, ${totalGroups} choice groups, ${totalElectives} subject electives, ${newCourses} new courses${APPLY ? `, ${programsWritten} programs written` : ' (dry run — nothing written)'}`);

  if (APPLY) {
    const buf = Buffer.from(db.export());
    fs.writeFileSync(DB_PATH + '.tmp', buf);
    fs.renameSync(DB_PATH + '.tmp', DB_PATH);
    console.log('SQLite saved (atomic). RESTART PM2 (server holds the old image in memory).');
    console.log('Client re-sync will trigger automatically via catalogDataVersion on the next firestore-sync run.');
  }
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e); process.exit(1); });
