// =============================================================================
// One-off (re-runnable) backfill: corrected + expanded campus building
// coordinates -> SQLite (locus.db) AND Firestore `buildings` collection.
//
// Why: the original seed rows were hand-rounded and several buildings shared
// identical points (Dumbach = Cudahy Library, Life Science = Flanner,
// Piper = Coffey), so map pins rendered stacked and looked missing. Buildings
// that host classes at WTC (Schreiber, School of COMM) and several LSC halls
// (BVM, Rooney, Alfie, Francis, Ralph Arnold Annex, 6347 N Broadway) had no
// row at all. Coordinates are OSM building centroids (Nominatim, 2026-07).
//
// firestore-sync.js does not sync buildings, so this writes Firestore itself.
// Touches ONLY the `buildings` table and ONLY the `buildings` collection.
//
// Usage (from backend/):  node fix-buildings.js
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const initSqlJs = require('sql.js');
const admin = require('firebase-admin');

const DB_PATH = path.join(__dirname, 'locus.db');

// Names must keep matching LOCUS `building` strings by substring — the app
// matches the longest building name contained in (or containing) the raw
// section value (e.g. raw "BVM" -> "BVM Hall", "Francis Hall 142" ->
// "Francis Hall"). Rooney Hall is the Mundelein auditorium wing (own address);
// Alfie Hall is the Norville practice facility.
const BUILDINGS = [
  ['Cuneo Hall', '6430 N Kenmore Ave', 41.99922, -87.65732, 'LSC'],
  ['Information Commons', '6501 N Kenmore Ave', 42.00032, -87.65632, 'LSC'],
  ['Dumbach Hall', '6474 N Kenmore Ave', 42.00045, -87.65786, 'LSC'],
  ['Crown Center', '1001 W Loyola Ave', 42.00120, -87.65657, 'LSC'],
  ['Mundelein Center', '1032 W Sheridan Rd', 41.99866, -87.65657, 'LSC'],
  ['Life Science Building', '1050 W Sheridan Rd', 41.99859, -87.65769, 'LSC'],
  ['Cudahy Science Hall', '6460 N Kenmore Ave', 41.99979, -87.65773, 'LSC'],
  ['Sullivan Center', '6339 N Sheridan Rd', 41.99780, -87.65503, 'LSC'],
  ['Inst for Env Sust', '6349 N Kenmore Ave', 41.99758, -87.65663, 'LSC'],
  ['Damen Student Center', '6511 N Winthrop Ave', 42.00043, -87.65975, 'LSC'],
  ['Piper Hall', '970 W Sheridan Rd', 41.99867, -87.65555, 'LSC'],
  ['Coffey Hall', '1000 W Sheridan Rd', 41.99897, -87.65550, 'LSC'],
  ['Flanner Hall', '1068 W Sheridan Rd', 41.99860, -87.65831, 'LSC'],
  ['Cudahy Library', '6515 N Kenmore Ave', 42.00076, -87.65684, 'LSC'],
  ['BVM Hall', '6364 N Sheridan Rd', 41.99796, -87.65667, 'LSC'],
  ['Rooney Hall', '1020 W Sheridan Rd', 41.99831, -87.65667, 'LSC'],
  ['Alfie Hall', '1109 W Loyola Ave', 42.00128, -87.65909, 'LSC'],
  ['Francis Hall', '6314 N Winthrop Ave', 41.99706, -87.65885, 'LSC'],
  ['Ralph Arnold Annex', '1131 W Sheridan Rd', 41.99829, -87.65888, 'LSC'],
  ['6347 N Broadway', '6347 N Broadway', 41.99776, -87.66005, 'LSC'],
  ['Corboy Law Center', '25 E Pearson St', 41.89715, -87.62716, 'WTC'],
  ['Schreiber Center', '16 E Pearson St', 41.89778, -87.62784, 'WTC'],
  ['School of COMM', '51 E Pearson St', 41.89746, -87.62656, 'WTC'],
];

// Same id scheme as migrate-to-firestore.js — keeps doc ids stable.
function sanitizeId(s) {
  return String(s).replace(/\//g, '_').replace(/^\.+$/, '_').trim().slice(0, 400) || '_';
}
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

// Rough meters between two points at Chicago's latitude — used only as a
// pre-write sanity check that no two pins stack.
function metersApart(a, b) {
  const dLat = (a[2] - b[2]) * 111320;
  const dLon = (a[3] - b[3]) * 111320 * Math.cos((41.95 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function sanityCheck() {
  for (let i = 0; i < BUILDINGS.length; i++) {
    for (let j = i + 1; j < BUILDINGS.length; j++) {
      const d = metersApart(BUILDINGS[i], BUILDINGS[j]);
      if (d < 15) {
        throw new Error(`Pins would stack: ${BUILDINGS[i][0]} and ${BUILDINGS[j][0]} are ${d.toFixed(1)}m apart`);
      }
    }
  }
  for (const [name, , lat, lon, campus] of BUILDINGS) {
    const ok = campus === 'WTC'
      ? lat >= 41.894 && lat <= 41.900 && lon >= -87.632 && lon <= -87.622
      : lat >= 41.995 && lat <= 42.005 && lon >= -87.664 && lon <= -87.653;
    if (!ok) throw new Error(`${name} is outside the ${campus} campus bounding box (${lat}, ${lon})`);
  }
}

// pm2 may not exist on this box — treat any failure as "nothing running".
function stopPm2Writers() {
  let list = [];
  try {
    list = JSON.parse(execSync('pm2 jlist', { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    console.log('pm2 not available (or no daemon) — assuming no poller/scraper is running.');
    return [];
  }
  const stopped = [];
  for (const p of list) {
    const online = p.pm2_env && p.pm2_env.status === 'online';
    if (online && /rambler|poller|scraper|backend/i.test(p.name || '')) {
      console.log(`Stopping pm2 process "${p.name}" before touching locus.db...`);
      execSync(`pm2 stop ${JSON.stringify(p.name)}`, { stdio: 'inherit' });
      stopped.push(p.name);
    }
  }
  if (list.length && !stopped.length) console.log('pm2 running but no rambler process online — nothing stopped.');
  return stopped;
}

function restartPm2(names) {
  for (const name of names) {
    console.log(`Restarting pm2 process "${name}"...`);
    try {
      execSync(`pm2 start ${JSON.stringify(name)}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`FAILED to restart "${name}" — restart it manually: pm2 start ${name}`);
    }
  }
}

async function updateSqlite() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  for (const [name, address, latitude, longitude, campus] of BUILDINGS) {
    db.run(
      `INSERT INTO buildings (name, address, latitude, longitude, campus)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         address = excluded.address,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         campus = excluded.campus`,
      [name, address, latitude, longitude, campus]
    );
  }
  const res = db.exec('SELECT COUNT(*) FROM buildings');
  const count = res[0].values[0][0];
  // Atomic swap, same as db.js save() — never leave locus.db half-written.
  const buffer = Buffer.from(db.export());
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, DB_PATH);
  db.close();
  console.log(`SQLite: upserted ${BUILDINGS.length} buildings (table now has ${count} rows).`);
}

async function updateFirestore() {
  const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const fdb = admin.firestore();
  const batch = fdb.batch();
  for (const [name, address, latitude, longitude, campus] of BUILDINGS) {
    batch.set(
      fdb.collection('buildings').doc(sanitizeId(name)),
      clean({ name, address, latitude, longitude, campus })
    );
  }
  await batch.commit();
  console.log(`Firestore: wrote ${BUILDINGS.length} buildings docs.`);
}

async function main() {
  sanityCheck();
  const stopped = stopPm2Writers();
  try {
    await updateSqlite();
  } finally {
    restartPm2(stopped);
  }
  await updateFirestore();
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((err) => { console.error('fix-buildings failed:', err); process.exit(1); });
