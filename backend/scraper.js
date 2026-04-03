const cheerio = require('cheerio');
const db = require('./db');

// =============================================================================
// LOCUS PeopleSoft Scraper for Loyola University Chicago
// =============================================================================

const LOCUS_GUEST_BASE = 'https://locusguest.luc.edu';
const LOCUS_LOGIN_URL = `${LOCUS_GUEST_BASE}/psp/cs92gsp/?cmd=login&languageCd=ENG`;
const CLASS_SEARCH_URL = `${LOCUS_GUEST_BASE}/psc/cs92gsp/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL`;

// PeopleSoft requires stateful sessions — we track cookies and ICSID tokens
class LocusScraper {
  constructor() {
    this.cookies = '';
    this.icsid = '';
  }

  // Make a request with session cookies
  async request(url, options = {}) {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': this.cookies,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers, redirect: 'follow' });

    // Capture set-cookie headers for session tracking
    const setCookies = response.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      const newCookies = setCookies.map(c => c.split(';')[0]).join('; ');
      this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies;
    }

    return response;
  }

  // Extract ICSID token from PeopleSoft HTML (handles both single and double quotes)
  extractICSID(html) {
    const match = html.match(/name=['"]ICSID['"]\s+id=['"]ICSID['"]\s+value=['"]([^'"]+)['"]/);
    return match ? match[1] : this.icsid;
  }

  // Initialize session — PeopleSoft requires a cookie handshake before class search
  async initSession() {
    console.log('Initializing LOCUS session...');
    this.cookies = '';

    // Step 1: Hit the guest login page (manual redirect to capture cookies)
    const loginResponse = await fetch(LOCUS_LOGIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'manual',
    });

    const setCookies1 = loginResponse.headers.getSetCookie?.() || [];
    this.cookies = setCookies1.map(c => c.split(';')[0]).join('; ');

    // Step 1b: Follow the redirect to collect additional session cookies
    if (loginResponse.status === 302) {
      const redirectUrl = loginResponse.headers.get('location');
      const fullUrl = redirectUrl.startsWith('http') ? redirectUrl : `${LOCUS_GUEST_BASE}${redirectUrl}`;
      const followRes = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': this.cookies,
        },
      });
      const extraCookies = (followRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]);
      if (extraCookies.length > 0) {
        this.cookies += '; ' + extraCookies.join('; ');
      }
      await followRes.text(); // consume body
    }

    // Step 2: Hit the class search page with all cookies
    const searchResponse = await fetch(CLASS_SEARCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': this.cookies,
      },
      redirect: 'follow',
    });

    // Capture any new cookies from this response
    const setCookies2 = searchResponse.headers.getSetCookie?.() || [];
    if (setCookies2.length > 0) {
      this.cookies += '; ' + setCookies2.map(c => c.split(';')[0]).join('; ');
    }

    const html = await searchResponse.text();
    this.icsid = this.extractICSID(html);

    if (!this.icsid) {
      throw new Error('Failed to extract ICSID from LOCUS. The page structure may have changed.');
    }

    console.log(`Session initialized. ICSID: ${this.icsid.substring(0, 10)}...`);
    return html;
  }

  // Submit a search form to PeopleSoft
  async submitSearch(term, subject) {
    const formData = new URLSearchParams({
      'ICAJAX': '1',
      'ICSID': this.icsid,
      'ICAction': 'CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH',
      'CLASS_SRCH_WRK2_INSTITUTION$31$': 'LUCP1',
      'CLASS_SRCH_WRK2_STRM$35$': term,
      'CLASS_SRCH_WRK2_SUBJECT$108$': subject,
      'CLASS_SRCH_WRK2_SSR_EXACT_MATCH1': 'E',
      'CLASS_SRCH_WRK2_CATALOG_NBR$8$': '',
      'CLASS_SRCH_WRK2_ACAD_CAREER': '',
      'CLASS_SRCH_WRK2_SSR_OPEN_ONLY$chk': 'N',
    });

    const response = await this.request(CLASS_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const html = await response.text();
    this.icsid = this.extractICSID(html) || this.icsid;
    return html;
  }

  // Parse course sections from search results HTML
  parseSections(html, subject) {
    const $ = cheerio.load(html);
    const sections = [];

    // PeopleSoft renders results in a table with specific IDs
    // The exact selectors depend on LOCUS's HTML structure
    $('tr[id^="trSSR_CLSRCH_MTG"]').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      // Try to extract section data from the row
      const section = {
        subject: subject,
        catalog_number: '',
        section_number: '',
        class_number: '',
        title: '',
        instructor: '',
        meeting_days: '',
        meeting_time_start: '',
        meeting_time_end: '',
        room: '',
        enrollment_cap: 0,
        enrollment_total: 0,
        waitlist_cap: 0,
        waitlist_total: 0,
        instruction_mode: '',
        component: '', // LEC, LAB, DIS, SEM
        status: '', // Open, Closed, Waitlist
      };

      sections.push(section);
    });

    // Alternative parsing: PeopleSoft sometimes uses different structures
    // Look for the class search results table
    $('table.PSLEVEL1GRIDNBO tr').each((i, row) => {
      if (i === 0) return; // Skip header

      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const text = cells.map((_, cell) => $(cell).text().trim()).get();

      if (text.length >= 6) {
        sections.push({
          subject: subject,
          raw_data: text,
          class_number: text[0] || '',
          section_info: text[1] || '',
          days_times: text[2] || '',
          room: text[3] || '',
          instructor: text[4] || '',
          dates: text[5] || '',
          status: text[6] || '',
        });
      }
    });

    // Also try generic table row parsing as fallback
    if (sections.length === 0) {
      $('span[id^="MTG_INSTR"]').each((i, el) => {
        const instructor = $(el).text().trim();
        const dayTimeEl = $(`span[id="MTG_SCHED$${i}"]`);
        const roomEl = $(`span[id="MTG_LOC$${i}"]`);
        const datesEl = $(`span[id="MTG_DATE$${i}"]`);

        if (instructor) {
          sections.push({
            subject: subject,
            instructor: instructor,
            days_times: dayTimeEl.text().trim(),
            room: roomEl.text().trim(),
            dates: datesEl.text().trim(),
          });
        }
      });
    }

    return sections;
  }

  // Scrape all sections for a given term and list of subjects
  async scrapeAll(term, subjects) {
    await this.initSession();
    const allSections = [];

    for (const subject of subjects) {
      console.log(`Scraping ${subject}...`);
      try {
        const html = await this.submitSearch(term, subject);
        const sections = this.parseSections(html, subject);
        allSections.push(...sections);
        console.log(`  Found ${sections.length} sections for ${subject}`);

        // Be polite — don't hammer the server
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Re-initialize session for next search (PeopleSoft is stateful)
        await this.initSession();
      } catch (err) {
        console.error(`  Error scraping ${subject}: ${err.message}`);
      }
    }

    return allSections;
  }
}

// =============================================================================
// DEPARTMENT SUBJECTS TO SCRAPE
// =============================================================================

const SUBJECTS = [
  'COMP', 'BIOL', 'CHEM', 'PHYS', 'MATH', 'STAT', 'PSYC', 'PLSC',
  'ECON', 'ACCT', 'FINC', 'MARK', 'MGMT', 'COMM', 'ENGL', 'HIST',
  'PHIL', 'SOCL', 'ANTH', 'GNUR', 'MSN', 'MCN', 'CMAN', 'CJC',
  'EXCM', 'NEUR', 'ENVS', 'PUBH', 'HSM', 'SOWK', 'EDUC', 'CIEP',
  'TLSC', 'ELPS', 'INFS', 'SCMG', 'HRER', 'ENTR', 'SPRT', 'IBUS',
  'ETHC', 'FNAR', 'MUSC', 'THTR', 'DANC', 'SPAN', 'FREN', 'THEO',
  'WSGS', 'CLST', 'GLST',
];

// =============================================================================
// MAIN SCRAPE FUNCTION
// =============================================================================

async function scrape(term) {
  const termCode = term || getCurrentTerm();
  console.log(`\nStarting LOCUS scrape for term ${termCode}`);
  console.log(`Scraping ${SUBJECTS.length} departments...\n`);

  const scraper = new LocusScraper();
  const sections = await scraper.scrapeAll(termCode, SUBJECTS);

  console.log(`\nTotal sections found: ${sections.length}`);

  // Store in database
  db.clearSections(termCode);
  for (const section of sections) {
    db.insertSection(termCode, section);
  }

  console.log(`Stored ${sections.length} sections in database for term ${termCode}`);

  // Auto-bump catalog version so mobile apps know to re-sync
  db.recordScrape(termCode, `Term ${termCode}`);
  const newVersion = db.bumpVersion();
  console.log(`Catalog version bumped to ${newVersion}`);

  return sections;
}

// PeopleSoft term codes: 4-digit year + semester (1=Spring, 5=Summer, 9=Fall)
// Example: Fall 2026 = 2269, Spring 2027 = 2271
function getCurrentTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Registration typically opens for next semester
  if (month >= 10) {
    // Fall: register for Spring
    return `${(year + 1).toString().substring(2)}71`; // e.g., 2271
  } else if (month >= 3) {
    // Spring: register for Fall
    return `${year.toString().substring(2)}69`; // e.g., 2269
  } else {
    // Jan-Feb: still registering for Spring
    return `${year.toString().substring(2)}71`;
  }
}

// Run if called directly
if (require.main === module) {
  const term = process.argv[2];
  scrape(term)
    .then(() => {
      console.log('Scrape complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Scrape failed:', err);
      process.exit(1);
    });
}

module.exports = { scrape, LocusScraper, SUBJECTS };
