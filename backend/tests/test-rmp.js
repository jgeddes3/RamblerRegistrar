/**
 * Test 2: RMP Professor ↔ Course Matching
 *
 * Tests with known professor names and verifies course code normalization.
 */

const path = require('path');
const db = require('../db');

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql';
const RMP_AUTH = 'Basic dGVzdDp0ZXN0';
const LOYOLA_SCHOOL_ID = 'U2Nob29sLTU0MA==';

const PREFIX_ALIASES = {
  'CS': 'COMP', 'POLS': 'PLSC', 'SOC': 'SOCL', 'BIO': 'BIOL', 'ISOM': 'INFS',
};

function normalizeRmpCourseCode(rmpCode) {
  let cleaned = rmpCode.trim().replace(/-/g, ' ');
  if (cleaned.length > 10 || !/\d/.test(cleaned)) return null;
  cleaned = cleaned.replace(/([A-Za-z]+)\s*(\d+)/, '$1 $2').toUpperCase();
  const parts = cleaned.split(' ');
  if (parts.length === 2 && PREFIX_ALIASES[parts[0]]) {
    parts[0] = PREFIX_ALIASES[parts[0]];
    cleaned = parts.join(' ');
  }
  return cleaned;
}

async function rmpFetch(query, variables) {
  const response = await fetch(RMP_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': RMP_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`RMP API ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function searchTeachers(text) {
  const data = await rmpFetch(`
    query($text: String!, $schoolID: ID!) {
      newSearch {
        teachers(query: { text: $text, schoolID: $schoolID }) {
          edges { node { id firstName lastName department avgRating numRatings } }
        }
      }
    }
  `, { text, schoolID: LOYOLA_SCHOOL_ID });
  return data.newSearch.teachers.edges.map(e => e.node);
}

async function getTeacherDetail(id) {
  const data = await rmpFetch(`
    query($id: ID!) {
      node(id: $id) {
        ... on Teacher {
          id firstName lastName department avgRating avgDifficulty numRatings wouldTakeAgainPercent
          courseCodes { courseName courseCount }
        }
      }
    }
  `, { id });
  return data.node;
}

async function testRmpMatching() {
  console.log('='.repeat(60));
  console.log('TEST 2: RMP PROFESSOR ↔ COURSE MATCHING');
  console.log('='.repeat(60));

  await db.initDb();
  const allCourses = db.getCourses();
  const courseCodeSet = new Set(allCourses.map(c => c.code));
  console.log(`\nDatabase has ${allCourses.length} courses`);

  // Test with known professor names at Loyola
  const testProfessors = [
    { name: 'Laufer', expectedDept: 'Computer Science' },
    { name: 'Honig', expectedDept: 'Computer Science' },
    { name: 'Yacobellis', expectedDept: 'Computer Science' },
    { name: 'Smith', expectedDept: 'various' },
    { name: 'Johnson', expectedDept: 'various' },
  ];

  const overallStats = { professors: 0, rmpCourses: 0, normalized: 0, matched: 0, garbage: 0 };

  for (const testProf of testProfessors) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Searching: "${testProf.name}"`);
    console.log('─'.repeat(60));

    try {
      const results = await searchTeachers(testProf.name);
      console.log(`  Found ${results.length} professors`);

      for (const teacher of results.slice(0, 3)) {
        await sleep(400);
        try {
          const detail = await getTeacherDetail(teacher.id);
          const rawCourses = detail.courseCodes || [];
          overallStats.professors++;

          console.log(`\n  ${detail.firstName} ${detail.lastName} (${detail.department}) — ${detail.avgRating}/5 (${detail.numRatings} ratings)`);

          if (rawCourses.length === 0) {
            console.log('    No courses listed on RMP');
            continue;
          }

          // Normalize and match
          for (const rc of rawCourses) {
            overallStats.rmpCourses++;
            const normalized = normalizeRmpCourseCode(rc.courseName);

            if (normalized === null) {
              overallStats.garbage++;
              console.log(`    ✗ "${rc.courseName}" → GARBAGE (filtered out)`);
              continue;
            }

            overallStats.normalized++;
            const matched = courseCodeSet.has(normalized);
            if (matched) overallStats.matched++;

            const icon = matched ? '✓' : '○';
            console.log(`    ${icon} "${rc.courseName}" → "${normalized}" ${matched ? '→ IN DB' : '→ not in DB'} (${rc.courseCount} ratings)`);
          }
        } catch (e) {
          console.log(`    Error: ${e.message}`);
        }
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Professors checked:    ${overallStats.professors}`);
  console.log(`RMP course entries:    ${overallStats.rmpCourses}`);
  console.log(`Garbage filtered out:  ${overallStats.garbage}`);
  console.log(`Successfully normalized: ${overallStats.normalized}`);
  console.log(`Matched to our DB:     ${overallStats.matched}`);
  console.log(`Not in our DB:         ${overallStats.normalized - overallStats.matched}`);
  if (overallStats.normalized > 0) {
    console.log(`Match rate:            ${Math.round(overallStats.matched / overallStats.normalized * 100)}%`);
  }

  db.close();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testRmpMatching().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
