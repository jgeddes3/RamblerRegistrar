// Database.js startup + catalog sync, with sqlite and Firestore faked.

import { buildBatchInserts } from '../sql-batch';

jest.mock('../firebaseConfig', () => ({ db: {}, auth: { currentUser: { uid: 'anon' } } }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
  doc: jest.fn((_db, ...segs) => ({ path: segs.join('/') })),
}));
jest.mock('../firestore-guards', () => ({ getDoc: jest.fn(), getDocs: jest.fn() }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

// Database.js keeps module state (the handle, the in-flight sync), so each
// test loads a fresh copy, along with the fresh mocks it will import.
let Database, getDoc, getDocs, openDatabaseAsync;

// A tiny in-memory stand-in for the sqlite handle: tracks row counts per table
// and every statement run.
const makeFakeDb = ({ courses = 0, version = null } = {}) => {
  const counts = { courses, programs: 0, program_courses: 0, prerequisites: 0 };
  const statements = [];
  return {
    counts,
    statements,
    execAsync: jest.fn(async (sql) => {
      statements.push(sql.trim().split('\n')[0]);
      const del = /^DELETE FROM (\w+)/.exec(sql.trim());
      if (del) counts[del[1]] = 0;
    }),
    runAsync: jest.fn(async (sql, params) => {
      statements.push(sql.trim().split('\n')[0]);
      const ins = /INTO (\w+) \(([^)]*)\)/.exec(sql);
      if (ins && counts[ins[1]] !== undefined) counts[ins[1]] += params.length / ins[2].split(',').length;
    }),
    getFirstAsync: jest.fn(async (sql) => {
      if (/COUNT\(\*\)/.test(sql)) return { n: counts.courses };
      if (/catalog_version/.test(sql)) return version ? { value: version } : null;
      return null;
    }),
    getAllAsync: jest.fn(async () => Array.from({ length: counts.courses }, (_, i) => ({ code: `C ${i}` }))),
  };
};

const snapOf = (docs) => ({
  empty: docs.length === 0,
  docs: docs.map(([id, data]) => ({ id, data: () => data })),
});
const COURSES = Array.from({ length: 200 }, (_, i) => [`COMP ${100 + i}`, { code: `COMP ${100 + i}`, name: `Course ${i}`, prerequisites: i ? ['COMP 100'] : [] }]);

const serveCatalog = ({ version = 'v2', hold = null } = {}) => {
  getDoc.mockImplementation(async () => {
    if (hold) await hold;
    return { exists: () => true, data: () => ({ catalogDataVersion: version }) };
  });
  getDocs.mockImplementation(async (ref) => {
    if (ref.path === 'courses') return snapOf(COURSES);
    if (ref.path === 'programs') return snapOf([['12', { name: 'Computer Science', type: 'major' }]]);
    return snapOf([['COMP 100', { courseCode: 'COMP 100' }], ['COMP 101', { courseCode: 'COMP 101' }]]);
  });
};

beforeEach(() => {
  jest.resetModules();
  ({ getDoc, getDocs } = require('../firestore-guards'));
  ({ openDatabaseAsync } = require('expo-sqlite'));
  jest.spyOn(console, 'log').mockImplementation(() => {});
  Database = require('../Database');
});
afterEach(() => console.log.mockRestore());

const open = (fake) => openDatabaseAsync.mockResolvedValue(fake);

describe('buildBatchInserts', () => {
  test('packs rows into multi-row statements under the parameter limit', () => {
    const rows = Array.from({ length: 5 }, (_, i) => [i, `n${i}`]);
    expect(buildBatchInserts('t', ['id', 'name'], rows, 4)).toEqual([
      { sql: 'INSERT OR REPLACE INTO t (id, name) VALUES (?, ?), (?, ?)', params: [0, 'n0', 1, 'n1'] },
      { sql: 'INSERT OR REPLACE INTO t (id, name) VALUES (?, ?), (?, ?)', params: [2, 'n2', 3, 'n3'] },
      { sql: 'INSERT OR REPLACE INTO t (id, name) VALUES (?, ?)', params: [4, 'n4'] },
    ]);
  });
  test('no rows, no statements', () => {
    expect(buildBatchInserts('t', ['id'], [])).toEqual([]);
  });
});

describe('initDatabase', () => {
  test('with a cached catalog, startup does not wait for the server', async () => {
    const fake = makeFakeDb({ courses: 50, version: 'v1' });
    open(fake);
    let release;
    serveCatalog({ hold: new Promise((r) => { release = r; }) });

    await Database.initDatabase(); // resolves while the version read is still hanging
    expect(getDoc).toHaveBeenCalled();
    expect(fake.counts.courses).toBe(50);

    release();
    await Database.syncFromServer(); // joins the background sync already in flight
    expect(fake.counts.courses).toBe(200);
  });

  test('with an empty cache (first launch), startup waits for the catalog', async () => {
    const fake = makeFakeDb({ courses: 0 });
    open(fake);
    serveCatalog();
    await Database.initDatabase();
    expect(fake.counts.courses).toBe(200);
    expect(fake.counts.prerequisites).toBe(199);
    expect(fake.counts.program_courses).toBe(2);
  });
});

describe('syncFromServer', () => {
  test('writes the catalog in a few batched statements, not one per row', async () => {
    const fake = makeFakeDb({ courses: 0 });
    open(fake);
    serveCatalog();
    await Database.initDatabase();
    // 200 courses + 199 prerequisites + 1 program + 2 program courses + version
    expect(fake.runAsync.mock.calls.length).toBeLessThan(12);
  });

  test('a read during the rewrite waits for it instead of seeing a half-filled cache', async () => {
    const fake = makeFakeDb({ courses: 50, version: 'v1' });
    open(fake);
    serveCatalog();
    await Database.initDatabase();

    // Start a read at the moment the rewrite has just emptied the table.
    let readDuringRewrite;
    const realExec = fake.execAsync.getMockImplementation();
    fake.execAsync.mockImplementation(async (sql) => {
      await realExec(sql);
      if (/^DELETE FROM courses/.test(sql.trim())) readDuringRewrite = Database.fetchCourses();
    });
    await Database.syncFromServer();
    await Database.syncFromServer();
    if (!readDuringRewrite) {
      // the background sync from initDatabase had already finished: force one
      getDoc.mockImplementation(async () => ({ exists: () => true, data: () => ({ catalogDataVersion: 'v3' }) }));
      fake.getFirstAsync.mockImplementation(async (sql) => (/COUNT/.test(sql) ? { n: fake.counts.courses } : { value: 'v2' }));
      await Database.syncFromServer();
    }
    expect((await readDuringRewrite).length).toBe(200);
  });

  test('an empty cache is retried on demand by ensureCatalog', async () => {
    const fake = makeFakeDb({ courses: 0 });
    open(fake);
    getDoc.mockRejectedValue(new Error('offline'));
    getDocs.mockRejectedValue(new Error('offline'));
    await Database.initDatabase(); // offline first launch: nothing cached
    expect(fake.counts.courses).toBe(0);

    serveCatalog();
    await Database.ensureCatalog();
    expect(fake.counts.courses).toBe(200);
  });
});
