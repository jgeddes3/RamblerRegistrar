const puppeteer = require('puppeteer');
const db = require('./db');
const { registrationTermFor, termLabelFor } = require('./terms');

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

// Turn the raw text of a section detail page's enrollment fields into numbers.
// Returns null when cap or total is missing/unparseable: that means the read
// failed (LOCUS dropped the session or we never reached the detail page), and
// the caller must not treat it as a real 0/0. Waitlist fields are optional.
function parseEnrollmentFields(raw) {
  const num = (text) => {
    if (text === null || text === undefined) return null;
    const n = parseInt(String(text).trim(), 10);
    return Number.isNaN(n) ? null : n;
  };
  const cap = num(raw.cap);
  const total = num(raw.total);
  if (cap === null || total === null) return null;
  return {
    enrollment_cap: cap,
    enrollment_total: total,
    waitlist_cap: num(raw.waitCap) ?? 0,
    waitlist_total: num(raw.waitTotal) ?? 0,
  };
}

// Close the page and browser without ever waiting forever. A Chrome that hangs
// on close() used to leave scrape()/pollWatches() pending, which kept
// scrapeInProgress/pollInProgress set in server.js and silently skipped every
// later scrape and poll. After timeoutMs the browser process is killed.
async function closeBrowserBounded(browser, page, { timeoutMs = 15000, settleMs = 2000 } = {}) {
  const withTimeout = (promise) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('close timed out')), timeoutMs);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
  try {
    await withTimeout(page ? page.close() : null).catch(() => {});
    await new Promise((r) => setTimeout(r, settleMs)); // Let Chrome release file locks
    await withTimeout(browser.close());
  } catch (e) {
    // Graceful close failed or hung — force kill so the lock can be released.
    console.error(`Browser close failed (${e.message}) — killing the browser process.`);
    try { browser.process()?.kill('SIGKILL'); } catch (k) {}
  }
}

// Which LOCUS row holds a section's detail link: the row index recorded when
// the section was extracted, else its position in the list (older callers).
function enrollmentRowIndex(section, position) {
  const row = section ? section.row_index : undefined;
  return Number.isInteger(row) && row >= 0 ? row : position;
}

// Does a row's class-number link belong to this section?
function sameClassNumber(linkText, classNumber) {
  const a = String(linkText == null ? '' : linkText).trim();
  return a !== '' && a === String(classNumber == null ? '' : classNumber).trim();
}

// Class numbers of the sections that carry an enrollment read from this run
// (a failed read leaves the fields off entirely; a real 0 counts as read).
function freshEnrollmentClassNumbers(sections) {
  const fresh = new Set();
  for (const s of sections || []) {
    if (s.enrollment_cap !== undefined && s.enrollment_cap !== null) fresh.add(String(s.class_number));
  }
  return fresh;
}

class LocusPuppeteerScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('Launching headless browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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
      await closeBrowserBounded(this.browser, this.page);
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

  // Put the form on termCode unless it already is. A reloaded form comes back
  // on LOCUS's default term, and a search there returns "no results" (or
  // another term's sections) for the subject.
  async ensureTerm(termCode) {
    const current = await this.page.$eval('[id="CLASS_SRCH_WRK2_STRM$35$"]', (el) => el.value);
    if (current !== String(termCode)) await this.selectTerm(String(termCode));
  }

  // Type subject into the subject field
  async selectSubject(subject) {
    console.log(`Setting subject: ${subject}...`);
    const subjectSelector = '[id="SSR_CLSRCH_WRK_SUBJECT$0"]';
    // Clear field completely before typing
    await this.page.click(subjectSelector, { clickCount: 3 });
    await this.page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 300));
    await this.page.click(subjectSelector);
    await this.page.type(subjectSelector, subject, { delay: 50 });
    // Tab out to trigger validation
    await this.page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 1000));
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
            // LOCUS's own row number for this section: the detail link and
            // every MTG_ field for it are suffixed with it.
            row_index: Number(i),
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
  // A section whose read fails is left WITHOUT enrollment fields, so
  // db.insertSection keeps its last known numbers rather than saving 0/0.
  async fetchEnrollmentForSections(sections) {
    console.log(`  Fetching enrollment for ${sections.length} sections...`);
    let read = 0;
    for (let i = 0; i < sections.length; i++) {
      try {
        // Click the class number link for THIS section's row. The row number
        // comes from LOCUS, not from the section's position in our list (the
        // two differ whenever a row is skipped or numbering has a gap), and
        // the link's text must be this section's class number. Otherwise the
        // numbers on the detail page belong to a different section: skip, and
        // the previous numbers are kept.
        const link = await this.page.$(`[id="MTG_CLASS_NBR$${enrollmentRowIndex(sections[i], i)}"]`);
        if (!link) continue;
        const linkText = await this.page.evaluate((el) => el.textContent, link);
        if (!sameClassNumber(linkText, sections[i].class_number)) continue;

        await link.click();
        await new Promise(r => setTimeout(r, 2500));

        // Raw field text from the detail page; null when a field is absent
        // (we are not actually on a detail page).
        const raw = await this.page.evaluate(() => {
          const text = (id) => {
            const el = document.getElementById(id);
            return el ? el.textContent : null;
          };
          return {
            cap: text('SSR_CLS_DTL_WRK_ENRL_CAP'),
            total: text('SSR_CLS_DTL_WRK_ENRL_TOT'),
            waitCap: text('SSR_CLS_DTL_WRK_WAIT_CAP'),
            waitTotal: text('SSR_CLS_DTL_WRK_WAIT_TOT'),
          };
        });
        const enrollment = parseEnrollmentFields(raw);
        if (enrollment) {
          // Stamped at the read, not at the end-of-subject save.
          Object.assign(sections[i], enrollment, { enrollment_read_at: new Date().toISOString() });
          read++;
        }

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
    const missed = sections.length - read;
    console.log(`  Enrollment data: ${read}/${sections.length} sections` +
      (missed ? ` (${missed} not read, previous numbers kept)` : ''));
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
    await this.ensureTerm(termCode);
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

  // Scrape all subjects for a term — restarts browser every BATCH_SIZE departments
  // to avoid PeopleSoft stale session issues.
  // onSubjectComplete(sections) is called after each successful subject scrape,
  // allowing the caller to persist data incrementally so partial runs aren't lost.
  // shouldRetry(subject, sections): B9 guard — when a subject's result set
  // collapses vs. what we already know (LOCUS partial-render flake), retry
  // the subject ONCE before accepting it.
  async scrapeAll(termCode, subjects, fetchEnrollment = false, onSubjectComplete = null, shouldRetry = null) {
    const BATCH_SIZE = fetchEnrollment ? 5 : 15;
    const allSections = [];

    for (let batchStart = 0; batchStart < subjects.length; batchStart += BATCH_SIZE) {
      const batch = subjects.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(subjects.length / BATCH_SIZE);

      // Fresh browser session for each batch
      if (batchStart > 0) {
        console.log(`\n=== Restarting browser for batch ${batchNum}/${totalBatches} ===`);
        await this.close();
        await this.init();
      }

      await this.loadSearchForm();
      await this.selectTerm(termCode);

      for (let i = 0; i < batch.length; i++) {
        const subject = batch[i];
        console.log(`\n--- Scraping ${subject} (${batchStart + i + 1}/${subjects.length}) ---`);
        try {
          let sections = await this.scrapeSubject(termCode, subject, fetchEnrollment);
          // B9: a collapsed result set is usually a partially-rendered LOCUS
          // page, not a mass cancellation (observed 2026-07-06: CHEM returned
          // 1 of ~156). One retry recovers it most of the time.
          if (shouldRetry && sections.length > 0 && shouldRetry(subject, sections)) {
            console.log(`  ${subject}: only ${sections.length} section(s) — looks partial, retrying once...`);
            try {
              await this.resetSearch();
              await this.selectTerm(termCode);
              const second = await this.scrapeSubject(termCode, subject, fetchEnrollment);
              if (second.length > sections.length) {
                console.log(`  ${subject}: retry recovered ${second.length} sections.`);
                sections = second;
              } else {
                console.log(`  ${subject}: retry did not improve (${second.length}) — keeping first result.`);
              }
            } catch (retryErr) {
              console.log(`  ${subject}: retry failed (${retryErr.message}) — keeping first result.`);
            }
          }
          allSections.push(...sections);
          console.log(`  Found ${sections.length} sections for ${subject}`);

          // Persist this subject's sections immediately so a later crash
          // doesn't lose them. Caught locally so a transient DB issue doesn't
          // kill the in-memory accumulation.
          if (onSubjectComplete && sections.length > 0) {
            try {
              onSubjectComplete(sections);
            } catch (saveErr) {
              console.error(`  Failed to save sections for ${subject}: ${saveErr.message}`);
            }
          }

          // Go back to search form for next subject
          if (i < batch.length - 1) {
            try {
              await this.resetSearch();
            } catch (e) {
              await this.loadSearchForm();
              await this.selectTerm(termCode);
            }
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch (err) {
          console.error(`  Error scraping ${subject}: ${err.message}`);
          try {
            await this.loadSearchForm();
            await this.selectTerm(termCode);
          } catch (e) {
            console.error('  Recovery failed:', e.message);
          }
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

// Term scraped when none is given: the one students are registering for today
// (same rule as the app — see terms.js).
function defaultScrapeTerm(now = new Date()) {
  return registrationTermFor(now).code;
}

async function scrape(termCode, subjectsToScrape, fetchEnrollment = false) {
  const subjects = subjectsToScrape || SUBJECTS;
  const code = termCode || defaultScrapeTerm();

  console.log(`\nStarting LOCUS Puppeteer scrape for term ${code}${fetchEnrollment ? ' (with enrollment data)' : ''}`);
  console.log(`Scraping ${subjects.length} departments...\n`);

  // Initialize DB upfront so per-subject saves can persist immediately
  await db.initDb();

  const scraper = new LocusPuppeteerScraper();
  let savedCount = 0;
  const freshEnrollment = new Set(); // class numbers with an enrollment read this run
  let scrapeError = null;
  let allSections = [];

  try {
    await scraper.init();

    // B9 retry baseline: what the DB already holds per subject. A fresh scrape
    // returning < half of a known-healthy count (min 8) is treated as a
    // partial LOCUS render and retried once inside scrapeAll.
    const priorCounts = {};
    for (const subject of subjects) {
      try {
        priorCounts[subject] = db.getSectionsForSubject(code, subject).length;
      } catch (e) {
        priorCounts[subject] = 0;
      }
    }
    const shouldRetry = (subject, sections) =>
      (priorCounts[subject] || 0) >= 8 && sections.length < (priorCounts[subject] || 0) / 2;

    // Per-subject callback inserts each subject's sections immediately,
    // so partial data is preserved even if a later subject crashes the run.
    allSections = await scraper.scrapeAll(code, subjects, fetchEnrollment, (newSections) => {
      for (const section of newSections) {
        db.insertSection(code, section);
      }
      for (const classNumber of freshEnrollmentClassNumbers(newSections)) {
        freshEnrollment.add(classNumber);
      }
      // A successful subject scrape is authoritative for that subject: rows
      // absent from it were cancelled/renumbered in LOCUS. Without this, ghost
      // rows linger in SQLite forever and firestore-sync re-uploads them as
      // live daily (B3). Only fires on non-empty results — see scrapeAll.
      const subj = newSections[0].subject;
      const stale = db.deleteStaleSections(code, subj, newSections.map((s) => s.class_number));
      if (stale > 0) console.log(`  Pruned ${stale} stale ${subj} section(s) no longer in LOCUS`);
      db.save(); // one batched disk write per subject (B5) — not per section
      savedCount += newSections.length;
    }, shouldRetry);

    console.log(`\nTotal sections found: ${allSections.length}`);
  } catch (err) {
    scrapeError = err;
    console.error(`\nScrape interrupted: ${err.message}`);
    console.log(`Sections saved before interruption: ${savedCount}`);
  } finally {
    // Finalize whatever we got — even partial data is useful.
    // Wrapped so a transient save() failure (e.g. EPERM if the 4 PM backup has
    // locus.db open during the atomic rename) can't skip scraper.close() below
    // or mask the original scrapeError. Data stays in memory; a later save
    // (or the next run) re-persists the full DB image.
    if (savedCount > 0) {
      try {
        db.recordScrape(code, termLabelFor(code));
        const newVersion = db.bumpVersion();
        console.log(`Stored ${savedCount} sections. Catalog version: ${newVersion}`);

        // Only sections whose numbers were read this run: preserved numbers
        // from a failed read must not be recorded as today's reading.
        const snapshotCount = db.snapshotEnrollment(code, freshEnrollment);
        console.log(`Enrollment snapshot: ${snapshotCount} sections recorded`);
      } catch (finalizeErr) {
        console.error(`Finalize failed (data retained in memory): ${finalizeErr.message}`);
      }

      // Dual-write the finalized term to Firestore. Non-fatal: SQLite stays the
      // source of truth during the migration, so a Firestore hiccup never fails
      // the scrape — the next run re-syncs.
      try {
        const { syncTermToFirestore } = require('./firestore-sync');
        const fsResult = await syncTermToFirestore(code);
        console.log(`Firestore sync: ${fsResult.written} written / ${fsResult.skipped} unchanged of ${fsResult.sections} sections, ${fsResult.instructors} instructor(s) updated, ${fsResult.pruned} marked removed`);
      } catch (fsErr) {
        console.error(`Firestore sync failed (SQLite remains source of truth): ${fsErr.message}`);
      }
    }

    await scraper.close();
    // Only close the shared DB handle when run as a standalone script. When the
    // server imports and runs this in-process (cron or /api/scrape), closing
    // would free the server's live handle and break subsequent API queries.
    if (require.main === module) db.close();
  }

  // Re-throw so the cron's retry logic can react to failures
  if (scrapeError) throw scrapeError;
  return allSections;
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

  // The CLI saves the whole DB image; refuse while the server is up (--force overrides).
  require('./cli-guard').requireServerStopped('scraper-puppeteer.js')
    .then(() => scrape(termCode, subjects, fetchEnrollment))
    .then((sections) => {
      console.log('\nScrape complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Scrape failed:', err);
      process.exit(1);
    });
}

module.exports = { scrape, defaultScrapeTerm, LocusPuppeteerScraper, SUBJECTS, TERM_CODES, parseEnrollmentFields, closeBrowserBounded,
  enrollmentRowIndex, sameClassNumber, freshEnrollmentClassNumbers };
