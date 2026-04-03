/**
 * seed-core.js — Seeds the Loyola University Chicago Core Curriculum data
 * Based on the official 2025-2026 LUC catalog.
 *
 * Run once:  node seed-core.js
 */

const db = require('./db');

async function seedCore() {
  await db.initDb();

  // Check if core_areas already has data
  const existing = db.getCoreAreas();
  if (existing.length > 0) {
    console.log(`Core areas already seeded (${existing.length} areas found). Skipping.`);
    db.close();
    return;
  }

  console.log('Seeding core curriculum data...\n');

  // Helper to insert a core area and return its id
  function insertArea(name, category, tier, parentAreaId, coursesRequired, credits, description) {
    db.runSql(
      `INSERT INTO core_areas (name, category, tier, parent_area_id, courses_required, credits, description)
       VALUES ('${name.replace(/'/g, "''")}', '${category}', ${tier ? `'${tier}'` : 'NULL'}, ${parentAreaId || 'NULL'}, ${coursesRequired || 1}, ${credits || 3}, ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'})`
    );
    // Get the id of the row we just inserted
    const rows = db.getCoreAreas();
    return rows[rows.length - 1].id;
  }

  // Helper to insert course options for a core area
  function insertCourseOptions(coreAreaId, courses, isRequired) {
    for (const code of courses) {
      db.runSql(
        `INSERT OR IGNORE INTO core_course_options (core_area_id, course_code, is_required)
         VALUES (${coreAreaId}, '${code}', ${isRequired ? 1 : 0})`
      );
    }
  }

  // Helper to insert a school override
  function insertOverride(school, coreAreaId, overrideType, substituteCourse, notes) {
    db.runSql(
      `INSERT OR IGNORE INTO core_school_overrides (school, core_area_id, override_type, substitute_course, notes)
       VALUES ('${school.replace(/'/g, "''")}', ${coreAreaId}, '${overrideType}', ${substituteCourse ? `'${substituteCourse}'` : 'NULL'}, ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'})`
    );
  }

  // Helper to ensure a course code exists in the courses table
  function ensureCourse(code, name) {
    db.runSql(
      `INSERT OR IGNORE INTO courses (code, name, credits, department, subject_area)
       VALUES ('${code}', '${(name || code).replace(/'/g, "''")}', 3, '${code.split(' ')[0]}', '${code.split(' ')[0]}')`
    );
  }

  // =========================================================================
  // ONE-COURSE AREAS
  // =========================================================================

  // 1. College Writing Seminar
  const writingSeminarId = insertArea('College Writing Seminar', 'one-course', null, null, 1, 3, null);
  insertCourseOptions(writingSeminarId, ['UCWR 110'], true);

  // 2. Artistic Knowledge
  const artisticId = insertArea('Artistic Knowledge', 'one-course', null, null, 1, 3, null);
  insertCourseOptions(artisticId, [
    'CLST 206', 'CLST 207', 'COMM 274', 'DANC 111', 'DANC 121', 'DANC 131',
    'ENGL 317', 'ENGL 318', 'ENGL 319',
    'FNAR 113', 'FNAR 114', 'FNAR 115', 'FNAR 120', 'FNAR 121', 'FNAR 124',
    'FNAR 199', 'FNAR 200', 'FNAR 201', 'FNAR 202',
    'MUSC 101', 'MUSC 102', 'MUSC 103', 'MUSC 105', 'MUSC 107', 'MUSC 109',
    'MUSC 110', 'MUSC 142',
    'THTR 100', 'THTR 252', 'THTR 261',
  ], false);

  // 3. Quantitative Knowledge
  const quantitativeId = insertArea('Quantitative Knowledge', 'one-course', null, null, 1, 3, null);
  insertCourseOptions(quantitativeId, [
    'CJC 206', 'COMP 122', 'COMP 125', 'COMP 150', 'ISSCM 241',
    'MATH 108', 'PLSC 216', 'STAT 103',
  ], false);

  // 4. Ethical Knowledge
  const ethicalId = insertArea('Ethical Knowledge', 'one-course', null, null, 1, 3, null);
  insertCourseOptions(ethicalId, [
    'PHIL 181', 'PHIL 182', 'THEO 185', 'THEO 186',
  ], false);

  // =========================================================================
  // TIERED AREAS
  // =========================================================================

  // 5. Historical Knowledge
  const historicalT1Id = insertArea('Historical Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(historicalT1Id, [
    'HIST 101', 'HIST 102', 'HIST 103', 'HIST 104',
  ], false);

  const historicalT2Id = insertArea('Historical Knowledge - Tier 2', 'tiered', 'tier2', historicalT1Id, 1, 3, null);
  insertCourseOptions(historicalT2Id, [
    'ANTH 107', 'CLST 274', 'CLST 275', 'CLST 276', 'CLST 277',
    'HIST 208', 'HIST 209', 'HIST 210', 'HIST 211', 'HIST 212', 'HIST 213',
  ], false);

  // 6. Literary Knowledge
  const literaryT1Id = insertArea('Literary Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(literaryT1Id, [
    'UCLR 100C', 'UCLR 100E', 'UCLR 100M',
  ], false);

  const literaryT2Id = insertArea('Literary Knowledge - Tier 2', 'tiered', 'tier2', literaryT1Id, 1, 3, null);
  insertCourseOptions(literaryT2Id, [
    'CLST 271', 'CLST 272', 'CLST 273', 'CLST 279', 'CLST 280', 'CLST 283',
    'ENGL 271', 'ENGL 272', 'ENGL 273', 'ENGL 274', 'ENGL 282', 'ENGL 283',
    'ENGL 284', 'ENGL 287', 'ENGL 288', 'ENGL 290',
    'LITR 200', 'LITR 202', 'LITR 238', 'LITR 245', 'LITR 280', 'LITR 283',
  ], false);

  // 7. Philosophical Knowledge
  const philosophicalT1Id = insertArea('Philosophical Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(philosophicalT1Id, ['PHIL 130'], true);

  const philosophicalT2Id = insertArea('Philosophical Knowledge - Tier 2', 'tiered', 'tier2', philosophicalT1Id, 1, 3, null);
  insertCourseOptions(philosophicalT2Id, [
    'PHIL 271', 'PHIL 272', 'PHIL 273', 'PHIL 274', 'PHIL 275', 'PHIL 277',
    'PHIL 279', 'PHIL 284', 'PHIL 286', 'PHIL 287', 'PHIL 288',
    'PLSC 100', 'PSYC 280',
  ], false);

  // 8. Scientific Knowledge
  const scientificT1Id = insertArea('Scientific Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(scientificT1Id, ['ENVS 101'], true);

  const scientificT2Id = insertArea('Scientific Knowledge - Tier 2', 'tiered', 'tier2', scientificT1Id, 1, 3, null);
  insertCourseOptions(scientificT2Id, [
    'ANTH 101', 'ANTH 103', 'ANTH 104', 'ANTH 105', 'ANTH 106',
    'BIOL 110', 'ENVS 207', 'ENVS 218', 'ENVS 223', 'ENVS 224', 'ENVS 226',
    'ENVS 273', 'ENVS 283', 'PHYS 101', 'PHYS 102', 'PHYS 106',
  ], false);

  // 9. Societal & Cultural Knowledge
  const societalT1Id = insertArea('Societal & Cultural Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(societalT1Id, [
    'ANTH 100', 'PLSC 102', 'PSYC 100', 'SOCL 101', 'WSGS 101',
  ], false);

  const societalT2Id = insertArea('Societal & Cultural Knowledge - Tier 2', 'tiered', 'tier2', societalT1Id, 1, 3, null);
  insertCourseOptions(societalT2Id, [
    'ANTH 102', 'ANTH 203', 'ANTH 208', 'CJC 345', 'CJC 370', 'CJC 372',
    'ECON 201', 'ECON 202', 'PLSC 101', 'PLSC 103',
    'PSYC 101', 'PSYC 238', 'PSYC 275',
    'SOCL 121', 'SOCL 122', 'SOCL 125', 'SOCL 145', 'SOCL 171', 'SOCL 250',
    'WSGS 201',
  ], false);

  // 10. Theological Knowledge
  const theologicalT1Id = insertArea('Theological Knowledge - Tier 1', 'tiered', 'tier1', null, 1, 3, null);
  insertCourseOptions(theologicalT1Id, [
    'THEO 100', 'THEO 107',
  ], false);

  const theologicalT2Id = insertArea('Theological Knowledge - Tier 2', 'tiered', 'tier2', theologicalT1Id, 1, 3, null);
  insertCourseOptions(theologicalT2Id, [
    'THEO 114', 'THEO 203', 'THEO 204', 'THEO 231', 'THEO 232',
    'THEO 265', 'THEO 266', 'THEO 267', 'THEO 272', 'THEO 276',
    'THEO 278', 'THEO 279', 'THEO 280', 'THEO 281', 'THEO 282',
    'THEO 293', 'THEO 295', 'THEO 297', 'THEO 299',
  ], false);

  // =========================================================================
  // ADDITIONAL REQUIREMENTS
  // =========================================================================

  const fysId = insertArea('First Year Seminar', 'one-course', null, null, 1, 1, null);
  insertCourseOptions(fysId, ['UNIV 101'], true);

  const engagedId = insertArea('Engaged Learning', 'one-course', null, null, 1, 3,
    'Fulfilled through courses in core, major, minor, or electives including study abroad, service-learning, undergraduate research, etc.');

  // =========================================================================
  // SCHOOL OVERRIDES
  // =========================================================================

  // -- Honors overrides --
  insertOverride('Honors', writingSeminarId, 'waived', null, 'Waived by completing all HONR 100-level courses');
  insertOverride('Honors', artisticId, 'waived', null, 'Waived by HONR 102 + D102');
  insertOverride('Honors', ethicalId, 'waived', null, 'Waived by HONR 301 Capstone');
  insertOverride('Honors', literaryT1Id, 'waived', null, 'Waived by HONR 102 + D102');
  insertOverride('Honors', philosophicalT1Id, 'waived', null, 'Waived by HONR 101 + D101');
  insertOverride('Honors', theologicalT1Id, 'waived', null, 'Waived by HONR 101 + D101');
  insertOverride('Honors', historicalT2Id, 'waived', null, 'Waived by HONR 200-level courses');
  insertOverride('Honors', literaryT2Id, 'waived', null, 'Waived by HONR 200-level courses');
  insertOverride('Honors', scientificT2Id, 'waived', null, 'Waived by HONR 200-level courses');
  insertOverride('Honors', societalT2Id, 'waived', null, 'Waived by HONR 200-level courses');

  // -- Business overrides --
  insertOverride('Business', quantitativeId, 'double-count', 'ISSCM 241', 'Satisfied by Business Statistics');
  insertOverride('Business', societalT2Id, 'double-count', 'ECON 201', 'Satisfied by Principles of Microeconomics');
  insertOverride('Business', philosophicalT2Id, 'double-count', null, 'Satisfied by business major coursework');

  // -- Nursing 4-year overrides --
  insertOverride('Nursing', scientificT1Id, 'double-count', null, 'Satisfied by nursing science courses');
  insertOverride('Nursing', quantitativeId, 'double-count', null, 'Satisfied by nursing major coursework');

  // -- Nursing Accelerated: ALL areas waived --
  const allAreaIds = [
    writingSeminarId, artisticId, quantitativeId, ethicalId,
    historicalT1Id, historicalT2Id,
    literaryT1Id, literaryT2Id,
    philosophicalT1Id, philosophicalT2Id,
    scientificT1Id, scientificT2Id,
    societalT1Id, societalT2Id,
    theologicalT1Id, theologicalT2Id,
    fysId, engagedId,
  ];
  for (const areaId of allAreaIds) {
    insertOverride('Nursing Accelerated', areaId, 'waived', null, 'Waived for accelerated nursing program');
  }

  // -- Education overrides --
  insertOverride('Education', literaryT2Id, 'double-count', 'CIEP 206', 'Satisfied by Children\'s Literature');
  insertOverride('Education', historicalT2Id, 'double-count', 'ELPS 219', 'Satisfied by History of American Education');
  insertOverride('Education', philosophicalT2Id, 'double-count', 'ELPS 302', 'Satisfied by Philosophy of Education');

  // =========================================================================
  // ENSURE ALL REFERENCED COURSE CODES EXIST IN courses TABLE
  // =========================================================================

  // Collect all course codes from core_course_options
  const allCoreAreas = db.getCoreAreas();
  const allCourseCodes = new Set();
  for (const area of allCoreAreas) {
    for (const opt of area.courseOptions) {
      allCourseCodes.add(opt.course_code);
    }
  }

  // Also add substitute courses from overrides
  const allOverrideCourses = ['ISSCM 241', 'ECON 201', 'CIEP 206', 'ELPS 219', 'ELPS 302'];
  for (const code of allOverrideCourses) {
    allCourseCodes.add(code);
  }

  let coursesAdded = 0;
  for (const code of allCourseCodes) {
    const existing = db.getCourseByCode(code);
    if (!existing) {
      ensureCourse(code, code);
      coursesAdded++;
    }
  }

  // Save to disk
  db.save();

  // =========================================================================
  // SUMMARY
  // =========================================================================

  const finalAreas = db.getCoreAreas();
  let totalOptions = 0;
  for (const area of finalAreas) {
    totalOptions += area.courseOptions.length;
  }

  console.log('Core curriculum seeding complete!');
  console.log(`  Core areas:          ${finalAreas.length}`);
  console.log(`  Course options:      ${totalOptions}`);
  console.log(`  Courses added:       ${coursesAdded}`);
  console.log(`  School overrides:    Honors (10), Business (3), Nursing (2), Nursing Accelerated (${allAreaIds.length}), Education (3)`);

  db.close();
}

seedCore().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
