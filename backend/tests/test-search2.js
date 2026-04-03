const fs = require('fs');
const cheerio = require('cheerio');

const LOCUS_GUEST_BASE = 'https://locusguest.luc.edu';
const LOCUS_LOGIN_URL = `${LOCUS_GUEST_BASE}/psp/cs92gsp/?cmd=login&languageCd=ENG`;
const CLASS_SEARCH_URL = `${LOCUS_GUEST_BASE}/psc/cs92gsp/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL`;

async function getCookies() {
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
  return cookies;
}

async function test() {
  const cookies = await getCookies();

  // Load form page
  const r2 = await fetch(CLASS_SEARCH_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': cookies },
  });
  const formHtml = await r2.text();

  const $ = cheerio.load(formHtml);

  // Collect ALL form fields from win0 form
  const formFields = {};
  $('input').each((i, el) => {
    const name = $(el).attr('name');
    const val = $(el).attr('value') || '';
    if (name) formFields[name] = val;
  });
  $('select').each((i, el) => {
    const name = $(el).attr('name');
    const selected = $(el).find('option[selected]').attr('value') || $(el).find('option').first().attr('value') || '';
    if (name) formFields[name] = selected;
  });

  console.log('Total form fields:', Object.keys(formFields).length);

  // Override the fields we want to set
  formFields['ICAction'] = 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH';
  formFields['CLASS_SRCH_WRK2_INSTITUTION$31$'] = 'LUCHI';
  formFields['CLASS_SRCH_WRK2_STRM$35$'] = '1266';  // Fall 2026
  formFields['CLASS_SRCH_WRK2_SUBJECT$108$'] = 'COMP';
  formFields['CLASS_SRCH_WRK2_SSR_EXACT_MATCH1'] = 'E';
  formFields['CLASS_SRCH_WRK2_CATALOG_NBR$8$'] = '';
  formFields['CLASS_SRCH_WRK2_ACAD_CAREER'] = '';
  formFields['CLASS_SRCH_WRK2_SSR_OPEN_ONLY$chk'] = 'N';

  const body = new URLSearchParams(formFields).toString();
  console.log('POST body length:', body.length);

  console.log('\nSubmitting search...');
  const r3 = await fetch(CLASS_SEARCH_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: body,
  });

  const resultHtml = await r3.text();
  console.log('Response size:', resultHtml.length);

  fs.writeFileSync('tests/samples/locus-results2-COMP.html', resultHtml);

  // Check for results
  const has = (s) => resultHtml.includes(s);
  console.log('Has DERIVED_CLSRCH_DESCR (course titles):', has('DERIVED_CLSRCH_DESCR'));
  console.log('Has SSR_CLSRCH_RSLT (results):', has('SSR_CLSRCH_RSLT'));
  console.log('Has MTG_SCHED (schedule):', has('MTG_SCHED'));
  console.log('Has MTG_INSTR (instructor):', has('MTG_INSTR'));
  console.log('Has no results:', has('search returns no results'));
  console.log('Has SSR_CLSRCH_ENTRY (still on form):', has('SSR_CLSRCH_ENTRY'));
  console.log('Has CLASS_SRCH_RSLT (result table):', has('CLASS_SRCH_RSLT'));
  console.log('Has win0divDERIVED_CLSRCH:', has('win0divDERIVED_CLSRCH'));

  // Look for any recognizable section data
  const courseMatches = resultHtml.match(/COMP\s*\d{3}/g) || [];
  console.log('\nCOMP course codes found in response:', [...new Set(courseMatches)].join(', ') || 'none');
}

test().catch(e => console.error('Error:', e.message));
