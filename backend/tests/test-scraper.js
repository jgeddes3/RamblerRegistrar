/**
 * Test 1: LOCUS Scraper — Session, Parsing, Rate Limiting
 *
 * Tests the PeopleSoft scraper against Loyola's live LOCUS system.
 * Only scrapes ONE department (COMP) to be respectful of the server.
 */

const path = require('path');
const fs = require('fs');
const { LocusScraper } = require('../scraper');

const SAMPLES_DIR = path.join(__dirname, 'samples');

async function testScraper() {
  console.log('='.repeat(60));
  console.log('TEST 1: LOCUS SCRAPER');
  console.log('='.repeat(60));

  const scraper = new LocusScraper();
  const timings = [];
  const results = { session: false, search: false, parse: false, sections: 0 };

  // --- Test 1a: Session initialization ---
  console.log('\n[1a] Initializing LOCUS session...');
  const sessionStart = Date.now();
  try {
    const html = await scraper.initSession();
    const sessionTime = Date.now() - sessionStart;
    timings.push({ step: 'initSession', ms: sessionTime });

    results.session = true;
    console.log(`  ✓ Session established in ${sessionTime}ms`);
    console.log(`  ICSID: ${scraper.icsid ? scraper.icsid.substring(0, 15) + '...' : 'NONE'}`);
    console.log(`  Cookies: ${scraper.cookies ? scraper.cookies.substring(0, 50) + '...' : 'NONE'}`);

    // Save raw HTML for inspection
    fs.writeFileSync(path.join(SAMPLES_DIR, 'locus-init.html'), html);
    console.log(`  Saved raw HTML to tests/samples/locus-init.html (${html.length} bytes)`);
  } catch (err) {
    console.log(`  ✗ Session failed: ${err.message}`);
    console.log('\n  LOCUS may be down, blocking requests, or the URL has changed.');
    console.log('  URL tested: https://locus.luc.edu/psp/cs92gsp_1/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL');
    printSummary(results, timings);
    return;
  }

  // --- Test 1b: Search submission ---
  console.log('\n[1b] Submitting search for COMP department...');
  // Wait before next request (be polite)
  await sleep(2000);
  timings.push({ step: 'delay', ms: 2000 });

  const searchStart = Date.now();
  try {
    const searchHtml = await scraper.submitSearch('2269', 'COMP'); // Fall 2026
    const searchTime = Date.now() - searchStart;
    timings.push({ step: 'submitSearch', ms: searchTime });

    results.search = true;
    console.log(`  ✓ Search completed in ${searchTime}ms`);
    console.log(`  Response size: ${searchHtml.length} bytes`);

    // Save raw search results
    fs.writeFileSync(path.join(SAMPLES_DIR, 'locus-search-COMP.html'), searchHtml);
    console.log(`  Saved raw HTML to tests/samples/locus-search-COMP.html`);

    // Check for common PeopleSoft error messages
    if (searchHtml.includes('The search returns no results')) {
      console.log('  ⚠ LOCUS returned "no results" — term code may be wrong or COMP not offered this term');
    } else if (searchHtml.includes('Your search has exceeded')) {
      console.log('  ⚠ LOCUS says too many results — need to narrow search');
    }

    // --- Test 1c: HTML parsing ---
    console.log('\n[1c] Parsing search results...');
    const sections = scraper.parseSections(searchHtml, 'COMP');
    results.parse = sections.length > 0;
    results.sections = sections.length;

    if (sections.length > 0) {
      console.log(`  ✓ Parsed ${sections.length} sections`);

      // Print sample sections
      console.log('\n  Sample sections:');
      console.log('  ' + '-'.repeat(80));
      const sample = sections.slice(0, 10);
      for (const sec of sample) {
        const instructor = sec.instructor || 'N/A';
        const daysTime = sec.days_times || sec.meeting_days || 'N/A';
        const room = sec.room || 'N/A';
        const status = sec.status || 'N/A';
        console.log(`  ${sec.subject || ''} ${sec.catalog_number || ''}-${sec.section_number || ''} | ${instructor} | ${daysTime} | ${room} | ${status}`);
      }
      if (sections.length > 10) {
        console.log(`  ... and ${sections.length - 10} more`);
      }

      // Stats
      const withInstructor = sections.filter(s => s.instructor && s.instructor !== 'N/A' && s.instructor !== '').length;
      const withTime = sections.filter(s => (s.days_times || s.meeting_days) && (s.days_times || s.meeting_days) !== '').length;
      const withRoom = sections.filter(s => s.room && s.room !== '').length;

      console.log(`\n  Data quality:`);
      console.log(`    Sections with instructor: ${withInstructor}/${sections.length}`);
      console.log(`    Sections with time:       ${withTime}/${sections.length}`);
      console.log(`    Sections with room:       ${withRoom}/${sections.length}`);
    } else {
      console.log('  ✗ No sections parsed from HTML');
      console.log('  The HTML structure may not match our selectors.');
      console.log('  Check tests/samples/locus-search-COMP.html to see the actual structure.');
    }
  } catch (err) {
    console.log(`  ✗ Search failed: ${err.message}`);
  }

  printSummary(results, timings);
}

function printSummary(results, timings) {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Session init:  ${results.session ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Search submit: ${results.search ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`HTML parsing:  ${results.parse ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Sections found: ${results.sections}`);

  console.log('\nTimings:');
  let totalMs = 0;
  for (const t of timings) {
    console.log(`  ${t.step}: ${t.ms}ms`);
    totalMs += t.ms;
  }
  console.log(`  Total: ${totalMs}ms`);

  if (!results.session) {
    console.log('\n⚠ ACTION NEEDED: LOCUS session could not be established.');
    console.log('  - Check if LOCUS is accessible: https://locus.luc.edu');
    console.log('  - The guest access URL may have changed');
    console.log('  - Loyola may block automated requests');
  }
  if (results.search && !results.parse) {
    console.log('\n⚠ ACTION NEEDED: Search succeeded but parsing failed.');
    console.log('  - Open tests/samples/locus-search-COMP.html in a browser');
    console.log('  - Identify the HTML structure for course sections');
    console.log('  - Update scraper.js parseSections() selectors to match');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testScraper().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
