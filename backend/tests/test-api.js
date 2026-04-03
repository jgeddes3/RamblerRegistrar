/**
 * Test 3: Backend API — Full Endpoint Verification
 *
 * Requires the server to be running on port 3001.
 * Run: node server.js (in another terminal), then: node tests/test-api.js
 */

const BASE = 'http://localhost:3001/api';

async function testEndpoint(name, url, checks = {}) {
  const start = Date.now();
  try {
    const opts = checks.method === 'POST'
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checks.body || {}) }
      : {};

    const response = await fetch(`${BASE}${url}`, opts);
    const ms = Date.now() - start;
    const data = await response.json();

    const passed = [];
    const failed = [];

    // Check status code
    if (checks.expectStatus) {
      if (response.status === checks.expectStatus) passed.push(`status ${response.status}`);
      else failed.push(`expected status ${checks.expectStatus}, got ${response.status}`);
    } else {
      if (response.ok) passed.push(`status ${response.status}`);
      else failed.push(`status ${response.status}`);
    }

    // Check if response is array with items
    if (checks.isArray) {
      if (Array.isArray(data) && data.length > 0) passed.push(`array with ${data.length} items`);
      else if (Array.isArray(data)) failed.push('empty array');
      else failed.push('expected array');
    }

    // Check if response is object with specific keys
    if (checks.hasKeys) {
      for (const key of checks.hasKeys) {
        if (data[key] !== undefined) passed.push(`has .${key}`);
        else failed.push(`missing .${key}`);
      }
    }

    // Check minimum count
    if (checks.minCount && Array.isArray(data)) {
      if (data.length >= checks.minCount) passed.push(`≥${checks.minCount} items`);
      else failed.push(`only ${data.length} items, expected ≥${checks.minCount}`);
    }

    const status = failed.length === 0 ? '✓' : '✗';
    console.log(`${status} ${name.padEnd(40)} ${ms}ms`);
    if (passed.length > 0) console.log(`    passed: ${passed.join(', ')}`);
    if (failed.length > 0) console.log(`    FAILED: ${failed.join(', ')}`);

    return { name, passed: failed.length === 0, ms, data };
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`✗ ${name.padEnd(40)} ${ms}ms`);
    console.log(`    ERROR: ${err.message}`);
    return { name, passed: false, ms, error: err.message };
  }
}

async function testApi() {
  console.log('='.repeat(60));
  console.log('TEST 3: BACKEND API ENDPOINTS');
  console.log('='.repeat(60));
  console.log(`Testing against ${BASE}\n`);

  // First check if server is running
  try {
    await fetch(`${BASE}/health`);
  } catch (e) {
    console.log('✗ Server is not running on port 3001');
    console.log('  Start it first: cd backend && node server.js');
    process.exit(1);
  }

  const results = [];

  // --- Health ---
  results.push(await testEndpoint('Health check', '/health', { hasKeys: ['status', 'timestamp'] }));

  // --- Catalog endpoints ---
  console.log('\n--- Catalog ---');
  results.push(await testEndpoint('Programs (all)', '/programs', { isArray: true, minCount: 200 }));
  results.push(await testEndpoint('Programs (majors only)', '/programs?type=major', { isArray: true, minCount: 100 }));
  results.push(await testEndpoint('Programs (minors only)', '/programs?type=minor', { isArray: true, minCount: 100 }));

  // Get a program ID for detail test
  const programsResult = results[results.length - 3];
  const sampleProgramId = programsResult.data && programsResult.data[0] ? programsResult.data[0].id : 1;
  results.push(await testEndpoint('Program detail with courses', `/programs/${sampleProgramId}`, { hasKeys: ['name', 'type', 'courses'] }));

  results.push(await testEndpoint('Courses (all)', '/courses', { isArray: true, minCount: 1000 }));
  results.push(await testEndpoint('Course search (calculus)', '/courses/search?q=calculus', { isArray: true }));
  results.push(await testEndpoint('Course by code (COMP 170)', `/courses/${encodeURIComponent('COMP 170')}`, { hasKeys: ['code', 'name', 'credits'] }));
  results.push(await testEndpoint('Prerequisites (COMP 271)', `/prerequisites/${encodeURIComponent('COMP 271')}`, { isArray: true }));

  // --- Sync endpoints ---
  console.log('\n--- Sync ---');
  results.push(await testEndpoint('Catalog version', '/sync/version', { hasKeys: ['version'] }));

  const syncStart = Date.now();
  results.push(await testEndpoint('Full catalog sync', '/sync/catalog', { hasKeys: ['programs', 'courses', 'prerequisites'] }));
  const syncResult = results[results.length - 1];
  if (syncResult.data) {
    console.log(`    Catalog payload: ${syncResult.data.programs?.length || 0} programs, ${syncResult.data.courses?.length || 0} courses, ${syncResult.data.prerequisites?.length || 0} prereqs`);
  }

  // --- Section endpoints (may be empty if no scrape has run) ---
  console.log('\n--- Sections ---');
  results.push(await testEndpoint('Terms', '/terms', { isArray: false })); // may be empty array
  results.push(await testEndpoint('Sections (no term)', '/sections/2269', { isArray: false }));

  // --- Auth protection ---
  console.log('\n--- Auth ---');
  results.push(await testEndpoint('Scrape (no auth token)', '/scrape', {
    method: 'POST',
    body: { termCode: '2269' },
    expectStatus: 401,
  }));

  // --- Summary ---
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalMs = results.reduce((sum, r) => sum + r.ms, 0);
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(`Total time: ${totalMs}ms`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  ✗ ${r.name}`);
    }
  }
}

testApi().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
