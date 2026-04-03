const fs = require('fs');
const cheerio = require('cheerio');

const LOCUS_GUEST_BASE = 'https://locusguest.luc.edu';
const LOCUS_LOGIN_URL = `${LOCUS_GUEST_BASE}/psp/cs92gsp/?cmd=login&languageCd=ENG`;
const CLASS_SEARCH_URL = `${LOCUS_GUEST_BASE}/psc/cs92gsp/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL`;

async function test() {
  // Step 1: Get cookies
  let cookies = '';
  const r1 = await fetch(LOCUS_LOGIN_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    redirect: 'manual',
  });
  cookies = (r1.headers.getSetCookie() || []).map(c => c.split(';')[0]).join('; ');

  if (r1.status === 302) {
    const loc = r1.headers.get('location');
    const r1b = await fetch(loc.startsWith('http') ? loc : LOCUS_GUEST_BASE + loc, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': cookies },
    });
    const extra = (r1b.headers.getSetCookie() || []).map(c => c.split(';')[0]);
    if (extra.length > 0) cookies += '; ' + extra.join('; ');
    await r1b.text();
  }

  // Step 2: Load search form
  const r2 = await fetch(CLASS_SEARCH_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': cookies },
    redirect: 'follow',
  });
  const formHtml = await r2.text();
  const formCookies = (r2.headers.getSetCookie() || []).map(c => c.split(';')[0]);
  if (formCookies.length > 0) cookies += '; ' + formCookies.join('; ');

  // Extract ICSID
  const icsidMatch = formHtml.match(/name=['"]ICSID['"]\s+id=['"]ICSID['"]\s+value=['"]([^'"]+)['"]/);
  const icsid = icsidMatch ? icsidMatch[1] : null;
  console.log('ICSID:', icsid ? icsid.substring(0, 15) + '...' : 'NONE');

  // Extract ICStateNum
  const stateMatch = formHtml.match(/name=['"]ICStateNum['"]\s+.*?value=['"](\d+)['"]/);
  const stateNum = stateMatch ? stateMatch[1] : '1';
  console.log('ICStateNum:', stateNum);

  // Step 3: Submit search with CORRECT parameters
  const formData = new URLSearchParams({
    'ICAJAX': '1',
    'ICSID': icsid,
    'ICType': 'Panel',
    'ICElementNum': '0',
    'ICStateNum': stateNum,
    'ICAction': 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
    'CLASS_SRCH_WRK2_INSTITUTION$31$': 'LUCHI',  // Fixed: was LUCP1
    'CLASS_SRCH_WRK2_STRM$35$': '1266',          // Fixed: Fall 2026 = 1266
    'CLASS_SRCH_WRK2_SUBJECT$108$': 'COMP',
    'CLASS_SRCH_WRK2_SSR_EXACT_MATCH1': 'E',
    'CLASS_SRCH_WRK2_CATALOG_NBR$8$': '',
    'CLASS_SRCH_WRK2_ACAD_CAREER': '',
    'CLASS_SRCH_WRK2_SSR_OPEN_ONLY$chk': 'N',
  });

  console.log('\nSubmitting search for COMP Fall 2026...');
  const r3 = await fetch(CLASS_SEARCH_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: formData.toString(),
  });

  const searchHtml = await r3.text();
  console.log('Response size:', searchHtml.length);

  fs.writeFileSync('tests/samples/locus-results-COMP.html', searchHtml);
  console.log('Saved to tests/samples/locus-results-COMP.html');

  // Check what we got
  const hasResults = searchHtml.includes('DERIVED_CLSRCH_DESCR');
  const hasNoResults = searchHtml.includes('search returns no results');
  const hasTooMany = searchHtml.includes('search has exceeded');
  const hasError = searchHtml.includes('errorCode');
  console.log('Has course titles (DERIVED_CLSRCH_DESCR):', hasResults);
  console.log('Has "no results" message:', hasNoResults);
  console.log('Has "too many results":', hasTooMany);
  console.log('Has error:', hasError);

  if (hasResults) {
    // Parse results
    const $ = cheerio.load(searchHtml);

    // PeopleSoft course results use DERIVED_CLSRCH_DESCR$N for course titles
    const courseTitles = [];
    for (let i = 0; i < 50; i++) {
      const titleEl = $(`#DERIVED_CLSRCH_DESCR\\$${i}`);
      if (titleEl.length === 0) break;
      courseTitles.push(titleEl.text().trim());
    }

    console.log('\nCourse titles found:', courseTitles.length);
    courseTitles.slice(0, 10).forEach(t => console.log('  ' + t));

    // Look for section details
    for (let i = 0; i < 3; i++) {
      const section = $(`#MTG_CLASS_NBR\\$${i}`).text().trim();
      const daysTime = $(`#MTG_DAYTIME\\$${i}`).text().trim();
      const instructor = $(`#MTG_INSTR\\$${i}`).text().trim();
      const room = $(`#MTG_ROOM\\$${i}`).text().trim();
      const dates = $(`#MTG_DATES\\$${i}`).text().trim();
      if (section || instructor || daysTime) {
        console.log(`\n  Section ${i}: ${section} | ${daysTime} | ${instructor} | ${room} | ${dates}`);
      }
    }

    // Try alternate ID patterns
    console.log('\n--- Searching alternate ID patterns ---');
    const altPatterns = ['MTG_SCHED', 'MTG_LOC', 'MTG_INSTR', 'MTG_DATE', 'CLASS_NBR', 'SSR_CLSRCH_MTG1', 'ENRL_CAP', 'ENRL_TOT'];
    for (const p of altPatterns) {
      for (let i = 0; i < 3; i++) {
        const el = $(`#${p}\\$${i}`);
        const el2 = $(`[id='${p}$${i}']`);
        const val = (el.text() || el2.text()).trim();
        if (val) console.log(`  ${p}$${i} = "${val}"`);
      }
    }
  }
}

test().catch(e => console.error('Error:', e.message));
