const puppeteer = require('puppeteer');
const db = require('./db');

// =============================================================================
// LOCUS PeopleSoft Scraper — Puppeteer Version
// Uses headless Chrome to handle PeopleSoft's stateful JavaScript forms
// =============================================================================

const CLASS_SEARCH_URL = 'https://locusguest.luc.edu/psc/cs92gsp/EMPLOYEE/SA/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL';
const INSTITUTION = 'LUCHI';

// Term codes from LOCUS
const TERM_CODES = {
  'Fall 2026': '1266',
  'Spring 2026': '1262',
  'J-term 2026': '1261',
  'Summer 2026': '1264',
  'Winter 2025': '1258',
};

class LocusPuppeteerScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('Launching headless browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await this.page.setViewport({ width: 1280, height: 900 });

    // Set a reasonable timeout
    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  // Wait for PeopleSoft AJAX to complete (spinner disappears)
  async waitForPeopleSoft() {
    try {
      // PeopleSoft shows a processing indicator during AJAX
      await this.page.waitForFunction(() => {
        const processing = document.querySelector('#processing');
        return !processing || processing.style.display === 'none' || processing.style.visibility === 'hidden';
      }, { timeout: 15000 });
    } catch (e) {
      // Timeout is ok — just means no spinner appeared
    }
    // Extra wait for DOM updates
    await new Promise(r => setTimeout(r, 1000));
  }

  // Navigate to class search and wait for form to load
  async loadSearchForm() {
    console.log('Loading class search page...');
    await this.page.goto(CLASS_SEARCH_URL, { waitUntil: 'networkidle2' });

    // Wait for the search form to appear
    await this.page.waitForSelector('[id="CLASS_SRCH_WRK2_STRM$35$"]', { timeout: 15000 });
    console.log('Search form loaded.');
  }

  // Select term from dropdown and wait for AJAX update
  async selectTerm(termCode) {
    console.log(`Selecting term: ${termCode}...`);
    await this.page.select('[id="CLASS_SRCH_WRK2_STRM$35$"]', termCode);
    await this.waitForPeopleSoft();
  }

  // Type subject into the subject field
  async selectSubject(subject) {
    console.log(`Setting subject: ${subject}...`);
    const subjectSelector = '[id="SSR_CLSRCH_WRK_SUBJECT$0"]';
    await this.page.click(subjectSelector, { clickCount: 3 });
    await this.page.type(subjectSelector, subject);
    // Tab out to trigger validation
    await this.page.keyboard.press('Tab');
    await this.waitForPeopleSoft();
  }

  // Uncheck "Show Open Classes Only" if checked
  async uncheckOpenOnly() {
    try {
      const checked = await this.page.$eval(
        '[id="SSR_CLSRCH_WRK_SSR_OPEN_ONLY$5"]',
        el => el.checked
      );
      if (checked) {
        console.log('Unchecking "Show Open Classes Only"...');
        await this.page.click('[id="SSR_CLSRCH_WRK_SSR_OPEN_ONLY$5"]');
        await this.waitForPeopleSoft();
      }
    } catch (e) {
      // Checkbox might not exist or have different ID
    }
  }

  // Click the search button and wait for results
  async clickSearch() {
    console.log('Clicking search...');
    await this.page.click('#CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH');

    // Wait for results, "no results", or the "over 50 classes" warning
    try {
      await this.page.waitForFunction(() => {
        const results = document.querySelector('[id^="DERIVED_CLSRCH_DESCR"]');
        const noResults = document.body.innerText.includes('search returns no results');
        const warning = document.body.innerText.includes('would you like to continue');
        return results || noResults || warning;
      }, { timeout: 20000 });
    } catch (e) {
      console.log('  Timeout waiting for results...');
    }

    // Handle the "over 50 classes" warning — click OK (#ICSave)
    try {
      const okButton = await this.page.$('[id="#ICSave"]');
      if (okButton) {
        console.log('  Clicking OK on "over 50 classes" warning...');
        await okButton.click();
        // Wait for actual results to load
        await this.page.waitForSelector('[id^="DERIVED_CLSRCH_DESCR"]', { timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      // No warning dialog or results already loaded
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  // Extract section data from the results page
  async extractSections(subject) {
    console.log('Extracting sections...');

    const sections = await this.page.evaluate((subj) => {
      const results = [];

      // LOCUS uses GROUPBOX3$N for each course — it contains both the course
      // title text and the MTG_ section rows.  GROUPBOX2GP$N is just the
      // collapsible header and does NOT contain the MTG_ elements.
      let groupIdx = 0;
      while (true) {
        const groupEl = document.getElementById(`win0divSSR_CLSRSLT_WRK_GROUPBOX3$${groupIdx}`);
        if (!groupEl) break;

        // The course title appears as text inside the group, e.g.
        // "COMP  122 - Introduction to Digital Music"
        const groupText = groupEl.textContent.trim();
        const courseMatch = groupText.match(/([A-Z]+)\s+(\d+\w*)\s*-\s*([^\n]+)/);
        const catalogNumber = courseMatch ? courseMatch[2].trim() : '';
        const courseTitle = courseMatch ? courseMatch[3].trim() : '';

        // Find MTG_INSTR spans within this group to get section indices
        const instrEls = groupEl.querySelectorAll('span[id^="MTG_INSTR"]');

        instrEls.forEach(instrEl => {
          const idMatch = instrEl.id.match(/\$(\d+)$/);
          if (!idMatch) return;
          const i = idMatch[1];

          const classNbr = document.getElementById(`MTG_CLASS_NBR$${i}`);
          const className = document.getElementById(`MTG_CLASSNAME$${i}`);
          const dayTime = document.getElementById(`MTG_DAYTIME$${i}`);
          const roomEl = document.getElementById(`MTG_ROOM$${i}`);
          const datesEl = document.getElementById(`MTG_TOPIC$${i}`);
          const campusEl = document.getElementById(`CAMPUS$${i}`);

          // Parse section info from MTG_CLASSNAME: "001-LEC\nRegular"
          const classNameText = className ? className.textContent.trim() : '';
          const sectionMatch = classNameText.match(/(\d+\w*)-(\w+)/);
          const sectionNumber = sectionMatch ? sectionMatch[1] : '';
          const component = sectionMatch ? sectionMatch[2] : '';

          // Get status from icon alt text (Open, Closed, Wait List)
          const statusContainer = document.getElementById(`win0divDERIVED_CLSRCH_SSR_STATUS_LONG$${i}`);
          const statusImg = statusContainer ? statusContainer.querySelector('img') : null;
          const status = statusImg ? statusImg.alt : '';

          const campusText = campusEl ? campusEl.textContent.trim() : '';

          results.push({
            subject: subj,
            catalog_number: catalogNumber,
            title: courseTitle,
            class_number: classNbr ? classNbr.textContent.trim() : '',
            section_number: sectionNumber,
            component: component,
            days_times: dayTime ? dayTime.textContent.trim() : '',
            instructor: instrEl.textContent.trim(),
            room: roomEl ? roomEl.textContent.trim() : '',
            dates: datesEl ? datesEl.textContent.trim() : '',
            campus: campusText,
            instruction_mode: campusText === 'ONLN' ? 'Online' : 'In Person',
            status: status,
          });
        });

        groupIdx++;
      }

      return results;
    }, subject);

    // Post-process: parse days/times and room/building
    const finalSections = sections.map(s => ({
      ...s,
      meeting_days: s.days_times ? s.days_times.replace(/\s*\d+.*/, '') : '',
      meeting_time_start: (s.days_times && s.days_times.match(/(\d+:\d+[AP]M)/)) ? s.days_times.match(/(\d+:\d+[AP]M)/)[1] : '',
      meeting_time_end: (s.days_times && s.days_times.match(/- (\d+:\d+[AP]M)/)) ? s.days_times.match(/- (\d+:\d+[AP]M)/)[1] : '',
      building: s.room ? s.room.split(' - ')[0] : '',
      start_date: s.dates ? s.dates.split(' - ')[0] : '',
      end_date: s.dates ? (s.dates.split(' - ')[1] || '') : '',
    }));

    return finalSections;
  }

  // Fetch enrollment details by clicking into each section's detail page
  // This is slow (~3 sec per section) so only use when needed
  async fetchEnrollmentForSections(sections) {
    console.log(`  Fetching enrollment for ${sections.length} sections...`);
    for (let i = 0; i < sections.length; i++) {
      try {
        // Click the class number link
        const link = await this.page.$(`[id="MTG_CLASS_NBR$${i}"]`);
        if (!link) continue;

        await link.click();
        await new Promise(r => setTimeout(r, 2500));

        // Extract enrollment data from detail page
        const enrollment = await this.page.evaluate(() => {
          const get = (id) => {
            const el = document.getElementById(id);
            return el ? parseInt(el.textContent.trim()) || 0 : 0;
          };
          return {
            enrollment_cap: get('SSR_CLS_DTL_WRK_ENRL_CAP'),
            enrollment_total: get('SSR_CLS_DTL_WRK_ENRL_TOT'),
            available_seats: get('SSR_CLS_DTL_WRK_AVAILABLE_SEATS'),
            waitlist_cap: get('SSR_CLS_DTL_WRK_WAIT_CAP'),
            waitlist_total: get('SSR_CLS_DTL_WRK_WAIT_TOT'),
          };
        });

        sections[i].enrollment_cap = enrollment.enrollment_cap;
        sections[i].enrollment_total = enrollment.enrollment_total;
        sections[i].waitlist_cap = enrollment.waitlist_cap;
        sections[i].waitlist_total = enrollment.waitlist_total;

        // Click "Return to Search Results"
        const returnBtn = await this.page.$('#CLASS_SRCH_WRK2_SSR_PB_BACK');
        if (returnBtn) {
          await returnBtn.click();
          await new Promise(r => setTimeout(r, 2000));
        } else {
          await this.page.goBack();
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {
        // Skip this section if detail fetch fails
      }
    }
    const withData = sections.filter(s => s.enrollment_cap > 0).length;
    console.log(`  Enrollment data: ${withData}/${sections.length} sections`);
    return sections;
  }

  // Parse the course title to extract catalog number and section
  parseCourseTitle(title) {
    // "COMP 170 - 001  Introduction to Object-Oriented Programming"
    const match = title.match(/([A-Z]+)\s*(\d+)\s*-\s*(\d+)\s+(.*)/);
    if (match) {
      return {
        subject: match[1],
        catalog_number: match[2],
        section_number: match[3],
        title: match[4].trim(),
      };
    }
    return { title };
  }

  // Select course career (Undergraduate, Graduate, etc.)
  async selectCareer(career) {
    console.log(`Setting course career: ${career}...`);
    try {
      await this.page.select('select[name*="ACAD_CAREER"]', career);
      await this.waitForPeopleSoft();
    } catch (e) {
      // Career selector might not exist or have different name
    }
  }

  // Scrape all sections for a subject
  // fetchEnrollment: if true, clicks into each section for enrollment numbers (slow)
  async scrapeSubject(termCode, subject, fetchEnrollment = false) {
    await this.selectSubject(subject);
    await this.selectCareer('UGRD');
    await this.uncheckOpenOnly();
    await this.clickSearch();

    // Check for "no results"
    const noResults = await this.page.evaluate(() =>
      document.body.innerText.includes('search returns no results')
    );
    if (noResults) {
      console.log(`  No results for ${subject}`);
      return [];
    }

    // Check for "too many results"
    const tooMany = await this.page.evaluate(() =>
      document.body.innerText.includes('search has exceeded')
    );
    if (tooMany) {
      console.log(`  Too many results for ${subject} — need to narrow search`);
      return [];
    }

    let sections = await this.extractSections(subject);

    // Optionally fetch enrollment details (clicks into each section)
    if (fetchEnrollment && sections.length > 0) {
      sections = await this.fetchEnrollmentForSections(sections);
    }

    return sections;
  }

  // Navigate back to search form for next subject
  async resetSearch() {
    try {
      // Click "New Search" or "Modify Search" button
      const newSearchBtn = await this.page.$('#CLASS_SRCH_WRK2_SSR_PB_NEW_SEARCH');
      const modifyBtn = await this.page.$('#CLASS_SRCH_WRK2_SSR_PB_MODIFY');

      if (newSearchBtn) {
        await newSearchBtn.click();
        await this.waitForPeopleSoft();
      } else if (modifyBtn) {
        await modifyBtn.click();
        await this.waitForPeopleSoft();
      } else {
        // Reload the page
        await this.loadSearchForm();
      }
    } catch (e) {
      await this.loadSearchForm();
    }
  }

  // Scrape all subjects for a term
  async scrapeAll(termCode, subjects, fetchEnrollment = false) {
    await this.loadSearchForm();
    await this.selectTerm(termCode);

    const allSections = [];

    for (const subject of subjects) {
      console.log(`\n--- Scraping ${subject} ---`);
      try {
        const sections = await this.scrapeSubject(termCode, subject, fetchEnrollment);
        allSections.push(...sections);
        console.log(`  Found ${sections.length} sections for ${subject}`);

        // Go back to search form for next subject
        if (subjects.indexOf(subject) < subjects.length - 1) {
          await this.resetSearch();
          await new Promise(r => setTimeout(r, 1500)); // Rate limit
        }
      } catch (err) {
        console.error(`  Error scraping ${subject}: ${err.message}`);
        // Try to recover by reloading
        try {
          await this.loadSearchForm();
          await this.selectTerm(termCode);
        } catch (e) {
          console.error('  Recovery failed:', e.message);
        }
      }
    }

    return allSections;
  }
}

// =============================================================================
// SUBJECTS TO SCRAPE
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

async function scrape(termCode, subjectsToScrape, fetchEnrollment = false) {
  const subjects = subjectsToScrape || SUBJECTS;
  const code = termCode || '1266'; // Default to Fall 2026

  console.log(`\nStarting LOCUS Puppeteer scrape for term ${code}${fetchEnrollment ? ' (with enrollment data)' : ''}`);
  console.log(`Scraping ${subjects.length} departments...\n`);

  const scraper = new LocusPuppeteerScraper();

  try {
    await scraper.init();
    const sections = await scraper.scrapeAll(code, subjects, fetchEnrollment);

    console.log(`\nTotal sections found: ${sections.length}`);

    // Store in database
    await db.initDb();
    db.clearSections(code);
    for (const section of sections) {
      db.insertSection(code, section);
    }
    db.recordScrape(code, `Term ${code}`);

    // Bump catalog version
    const newVersion = db.bumpVersion();
    console.log(`Stored ${sections.length} sections. Catalog version: ${newVersion}`);

    // Take enrollment snapshot for trend tracking
    const snapshotCount = db.snapshotEnrollment(code);
    console.log(`Enrollment snapshot: ${snapshotCount} sections recorded`);

    db.close();
    return sections;
  } finally {
    await scraper.close();
  }
}

// Run if called directly
// Usage: node scraper-puppeteer.js [termCode] [subjects] [--enrollment]
// Examples:
//   node scraper-puppeteer.js                    — scrape all depts, no enrollment
//   node scraper-puppeteer.js 1266 COMP          — scrape COMP only
//   node scraper-puppeteer.js 1266 COMP --enrollment  — scrape COMP with enrollment numbers
//   node scraper-puppeteer.js --enrollment        — scrape all depts with enrollment
if (require.main === module) {
  const args = process.argv.slice(2).filter(a => a !== '--enrollment');
  const fetchEnrollment = process.argv.includes('--enrollment');
  const termCode = args[0] && !args[0].startsWith('-') ? args[0] : undefined;
  const subjects = args[1] ? args[1].split(',') : undefined;

  scrape(termCode, subjects, fetchEnrollment)
    .then((sections) => {
      console.log('\nScrape complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Scrape failed:', err);
      process.exit(1);
    });
}

module.exports = { scrape, LocusPuppeteerScraper, SUBJECTS, TERM_CODES };
