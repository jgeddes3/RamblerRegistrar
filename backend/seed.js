/**
 * seed.js - Reads source data files directly and populates locus.db.
 *
 * Usage:  node seed.js
 *
 * Data sources:
 *   1. LUC_Programs_Data.js — majors, minors, and top-12 major requirements
 *   2. quinlan_remaining.js — 8 additional BBA programs
 *   3. stem_programs.js — 15 STEM programs
 *   4. humanities_social_programs.js — 18 humanities/social programs
 *   5. comm_arts_programs.js — 15 communication/arts programs
 *   6. education_health_sw_programs.js — 10 education/health/SW programs + credit overrides
 *   7. environmental_cps_programs.js — 13 environmental/CPS programs
 *   8. stem_descriptions.js — 51 STEM course descriptions
 *   9. nonstem_descriptions.js — 236 non-STEM course descriptions
 *  10. program_descriptions.js — 224 program descriptions
 */

const fs   = require('fs');
const path = require('path');
const db   = require('./db');

// ============================================================================
// HELPER: Load an ES-module data file by stripping `export` and evaluating
// ============================================================================

function loadDataFile(relPath, exportNames) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ERROR: File not found: ${fullPath}`);
    return null;
  }
  let source = fs.readFileSync(fullPath, 'utf-8');
  // Strip ES module export keywords
  source = source.replace(/export const /g, 'const ');
  source = source.replace(/export default /g, 'const _default_ = ');
  // Build return statement
  const returnObj = exportNames.map(n => n).join(', ');
  const fn = new Function(source + `\nreturn { ${returnObj} };`);
  return fn();
}

// ============================================================================
// DEPARTMENT / SUBJECT-AREA MAPS
// ============================================================================

const DEPT_MAP = {
  'COMP': 'Computer Science', 'MATH': 'Mathematics', 'STAT': 'Statistics',
  'BIOL': 'Biology', 'CHEM': 'Chemistry', 'PHYS': 'Physics',
  'PSYC': 'Psychology', 'NEUR': 'Neuroscience',
  'ACCT': 'Accounting', 'ECON': 'Economics', 'FINC': 'Finance',
  'MARK': 'Marketing', 'MGMT': 'Management', 'ISSCM': 'Information Systems & Supply Chain',
  'QUIN': 'Quinlan School of Business',
  'GNUR': 'Nursing', 'NURS': 'Nursing', 'MSN': 'Nursing', 'MCN': 'Nursing', 'CMAN': 'Nursing',
  'EXCM': 'Exercise Science',
  'CJC':  'Criminal Justice',
  'PLSC': 'Political Science', 'SOCL': 'Sociology', 'ANTH': 'Anthropology',
  'HIST': 'History', 'ENGL': 'English', 'PHIL': 'Philosophy',
  'THEO': 'Theology', 'RELS': 'Religious Studies',
  'COMM': 'Communication', 'JOUR': 'Journalism',
  'SOWK': 'Social Work',
  'EDUC': 'Education', 'CIEP': 'Education', 'TLSC': 'Education', 'ELPS': 'Education',
  'SPAN': 'Spanish', 'FREN': 'French', 'ITAL': 'Italian', 'GRMN': 'German',
  'LATN': 'Latin', 'GREK': 'Greek',
  'ENVS': 'Environmental Science', 'SEST': 'Environmental Sustainability',
  'ARTS': 'Fine Arts', 'MUSC': 'Music', 'THTR': 'Theatre', 'DANC': 'Dance',
  'CPST': 'Computer Science (Applied)',
  'UCWR': 'University Core Writing', 'UNIV': 'University Core',
  'HONR': 'Honors',
  'PUBH': 'Public Health', 'HSM': 'Health Systems Management',
  'PLST': 'Paralegal Studies',
  'IPMM': 'Interdisciplinary Studies',
  'WSGS': "Women's Studies & Gender Studies",
  'CLST': 'Classical Studies',
  'INDS': 'Interdisciplinary Studies',
  'INFS': 'Information Systems', 'SCMG': 'Supply Chain Management',
  'LREB': 'Legal Studies', 'ETHC': 'Ethics',
  'HRER': 'Human Resource Management', 'IBUS': 'International Business',
  'ENTR': 'Entrepreneurship', 'SPRT': 'Sport Management',
  'BIOI': 'Bioinformatics',
  'GLST': 'Global Studies',
};

function getDepartment(prefix) {
  return DEPT_MAP[prefix] || prefix;
}

function getSubjectArea(prefix) {
  const stem = ['COMP','MATH','STAT','BIOL','CHEM','PHYS','NEUR','CPST','ENVS','SEST','BIOI'];
  const business = ['ACCT','ECON','FINC','MARK','MGMT','ISSCM','QUIN','HSM','INFS','SCMG','LREB','ETHC','HRER','IBUS','ENTR','SPRT'];
  const health = ['GNUR','NURS','EXCM','PUBH','MSN','MCN','CMAN'];
  const social = ['PSYC','CJC','PLSC','SOCL','ANTH','SOWK','WSGS'];
  const arts = ['ARTS','MUSC','THTR','DANC','COMM','JOUR'];
  const education = ['EDUC','CIEP','TLSC','ELPS'];

  if (stem.includes(prefix))      return 'STEM';
  if (business.includes(prefix))  return 'Business';
  if (health.includes(prefix))    return 'Health Sciences';
  if (social.includes(prefix))    return 'Social Sciences';
  if (arts.includes(prefix))      return 'Arts & Communication';
  if (education.includes(prefix)) return 'Education';
  return 'Humanities';
}

// Credit overrides from the old seed.js
const CREDIT_OVERRIDES = {
  'COMP 383': 4, 'MATH 161': 4, 'MATH 162': 4, 'MATH 130': 4,
  'MATH 263': 4, 'EXCM 201': 4, 'EXCM 385': 4,
  'GNUR 293': 4, 'BIOL 242': 4, 'BIOL 243': 4,
  'GNUR 207': 2, 'GNUR 290': 2, 'GNUR 297': 2, 'EXCM 210': 2, 'EXCM 375': 2,
  'GNUR 102': 1, 'PSYC 201': 1, 'COMM 100': 1, 'UNIV 101': 1,
  'QUIN 101': 0, 'QUIN 102': 1, 'QUIN 202': 2,
  'EXCM 395': 6, 'MATH 108': 3, 'PHYS 101': 3,
  'HSM 120': 1, 'HSM 200': 2, 'HSM 360': 6,
  'SOWK 330': 4, 'SOWK 340': 4, 'SOWK 362': 1,
  'PLST 331': 2, 'PLST 332': 2, 'PLST 333': 2, 'PLST 335': 2,
  'PLST 339': 2, 'PLST 340': 2, 'PLST 341': 2, 'PLST 342': 2,
  'PLST 345': 2, 'PLST 362': 2, 'PLST 363': 2,
  'CHEM 105': 4, 'CHEM 106': 4, 'CHEM 221': 4, 'CHEM 222': 4,
  'BIOL 205': 4, 'PHYS 125': 4,
  'CIEP M43': 3, 'UCWR 110': 3,
  'SCMG 396': 0,
};

function getCredits(code, name) {
  if (code in CREDIT_OVERRIDES) return CREDIT_OVERRIDES[code];
  const isLab = (/lab/i.test(name) || code.endsWith('L'));
  return isLab ? 1 : 3;
}

function getLearningStyle(code, name) {
  const isLab = /lab/i.test(name) || code.endsWith('L');
  return isLab ? 'hands-on' : 'lecture-based';
}

function getAssessmentType(code, name) {
  const isLab = /lab/i.test(name) || code.endsWith('L');
  return isLab ? 'project-based' : 'exam';
}

const esc = (str) => str.replace(/'/g, "''");

// ============================================================================
// PREREQUISITE DATA (136 pairs)
// ============================================================================

const PREREQUISITES = [
  // COMP
  { course: 'COMP 264', prereq: 'COMP 141' },
  { course: 'COMP 264', prereq: 'COMP 170' },
  { course: 'COMP 271', prereq: 'COMP 141' },
  { course: 'COMP 271', prereq: 'COMP 170' },
  { course: 'COMP 272', prereq: 'COMP 271' },
  { course: 'COMP 310', prereq: 'COMP 264' },
  { course: 'COMP 310', prereq: 'COMP 271' },
  { course: 'COMP 363', prereq: 'COMP 272' },
  { course: 'COMP 371', prereq: 'COMP 264' },
  { course: 'COMP 371', prereq: 'COMP 272' },
  { course: 'COMP 383', prereq: 'COMP 271' },

  // BIOL
  { course: 'BIOL 102', prereq: 'BIOL 101' },
  { course: 'BIOL 102', prereq: 'BIOL 111' },
  { course: 'BIOL 112', prereq: 'BIOL 101' },
  { course: 'BIOL 112', prereq: 'BIOL 111' },
  { course: 'BIOL 251', prereq: 'BIOL 101' },
  { course: 'BIOL 251', prereq: 'BIOL 111' },
  { course: 'BIOL 251', prereq: 'CHEM 160' },
  { course: 'BIOL 265', prereq: 'BIOL 102' },
  { course: 'BIOL 265', prereq: 'BIOL 112' },
  { course: 'BIOL 265', prereq: 'CHEM 160' },
  { course: 'BIOL 282', prereq: 'BIOL 102' },
  { course: 'BIOL 282', prereq: 'BIOL 112' },
  { course: 'BIOL 282', prereq: 'CHEM 160' },

  // CHEM
  { course: 'CHEM 180', prereq: 'CHEM 160' },
  { course: 'CHEM 181', prereq: 'CHEM 160' },
  { course: 'CHEM 181', prereq: 'CHEM 161' },
  { course: 'CHEM 240', prereq: 'CHEM 180' },
  { course: 'CHEM 240', prereq: 'CHEM 181' },
  { course: 'CHEM 241', prereq: 'CHEM 180' },
  { course: 'CHEM 241', prereq: 'CHEM 181' },
  { course: 'CHEM 260', prereq: 'CHEM 180' },
  { course: 'CHEM 260', prereq: 'CHEM 181' },
  { course: 'CHEM 260', prereq: 'MATH 131' },
  { course: 'CHEM 261', prereq: 'CHEM 180' },
  { course: 'CHEM 261', prereq: 'CHEM 181' },
  { course: 'CHEM 261', prereq: 'MATH 131' },

  // PHYS
  { course: 'PHYS 112', prereq: 'PHYS 111' },
  { course: 'PHYS 112L', prereq: 'PHYS 111L' },

  // MATH
  { course: 'MATH 118', prereq: 'MATH 117' },
  { course: 'MATH 131', prereq: 'MATH 118' },
  { course: 'MATH 132', prereq: 'MATH 131' },
  { course: 'MATH 130', prereq: 'MATH 110' },
  { course: 'MATH 161', prereq: 'MATH 118' },
  { course: 'MATH 162', prereq: 'MATH 161' },

  // PSYC
  { course: 'PSYC 201', prereq: 'PSYC 101' },
  { course: 'PSYC 235', prereq: 'PSYC 101' },
  { course: 'PSYC 237', prereq: 'PSYC 101' },
  { course: 'PSYC 240', prereq: 'PSYC 101' },
  { course: 'PSYC 250', prereq: 'PSYC 101' },
  { course: 'PSYC 273', prereq: 'PSYC 101' },
  { course: 'PSYC 274', prereq: 'PSYC 101' },
  { course: 'PSYC 275', prereq: 'PSYC 101' },
  { course: 'PSYC 304', prereq: 'PSYC 101' },
  { course: 'PSYC 306', prereq: 'PSYC 304' },
  { course: 'PSYC 307', prereq: 'PSYC 101' },
  { course: 'PSYC 331', prereq: 'PSYC 101' },
  { course: 'PSYC 346', prereq: 'PSYC 273' },
  { course: 'PSYC 360', prereq: 'PSYC 101' },
  { course: 'PSYC 374', prereq: 'PSYC 101' },
  { course: 'PSYC 382', prereq: 'NEUR 101' },

  // STAT
  { course: 'STAT 203', prereq: 'MATH 132' },

  // ACCT
  { course: 'ACCT 202', prereq: 'ACCT 201' },
  { course: 'ACCT 303', prereq: 'ACCT 202' },
  { course: 'ACCT 304', prereq: 'ACCT 303' },
  { course: 'ACCT 311', prereq: 'ACCT 303' },
  { course: 'ACCT 317', prereq: 'ACCT 303' },
  { course: 'ACCT 328', prereq: 'ACCT 201' },
  { course: 'ACCT 328', prereq: 'ACCT 202' },

  // ECON
  { course: 'ECON 303', prereq: 'ECON 201' },
  { course: 'ECON 303', prereq: 'ECON 202' },

  // FINC
  { course: 'FINC 334', prereq: 'ECON 201' },
  { course: 'FINC 334', prereq: 'ACCT 201' },
  { course: 'FINC 334', prereq: 'ISSCM 241' },
  { course: 'FINC 335', prereq: 'FINC 334' },
  { course: 'FINC 301', prereq: 'ECON 201' },
  { course: 'FINC 301', prereq: 'ISSCM 241' },

  // MGMT
  { course: 'MGMT 304', prereq: 'MGMT 201' },
  { course: 'MGMT 304', prereq: 'MARK 201' },
  { course: 'MGMT 304', prereq: 'FINC 301' },
  { course: 'MGMT 360', prereq: 'MGMT 201' },

  // MARK
  { course: 'MARK 310', prereq: 'MARK 201' },
  { course: 'MARK 311', prereq: 'MARK 310' },
  { course: 'MARK 390', prereq: 'MARK 310' },
  { course: 'MARK 390', prereq: 'FINC 301' },

  // ETHC
  { course: 'ETHC 341', prereq: 'MGMT 201' },
  { course: 'ETHC 341', prereq: 'ECON 202' },

  // COMM
  { course: 'COMM 200', prereq: 'COMM 175' },
  { course: 'COMM 215', prereq: 'COMM 175' },
  { course: 'COMM 227', prereq: 'COMM 175' },
  { course: 'COMM 230', prereq: 'COMM 175' },
  { course: 'COMM 231', prereq: 'COMM 175' },
  { course: 'COMM 234', prereq: 'COMM 175' },
  { course: 'COMM 237', prereq: 'COMM 175' },
  { course: 'COMM 273', prereq: 'COMM 175' },
  { course: 'COMM 277', prereq: 'COMM 175' },
  { course: 'COMM 307', prereq: 'COMM 175' },
  { course: 'COMM 361', prereq: 'COMM 200' },
  { course: 'COMM 365', prereq: 'COMM 175' },
  { course: 'COMM 367', prereq: 'COMM 175' },
  { course: 'COMM 368', prereq: 'COMM 175' },

  // GNUR
  { course: 'GNUR 158',  prereq: 'GNUR 157' },
  { course: 'GNUR 158',  prereq: 'GNUR 160' },
  { course: 'GNUR 158L', prereq: 'GNUR 157L' },
  { course: 'GNUR 238',  prereq: 'GNUR 157' },
  { course: 'GNUR 238',  prereq: 'GNUR 158' },
  { course: 'GNUR 238',  prereq: 'GNUR 160' },
  { course: 'GNUR 293',  prereq: 'GNUR 157' },
  { course: 'GNUR 293',  prereq: 'GNUR 158' },
  { course: 'GNUR 293',  prereq: 'GNUR 160' },
  { course: 'GNUR 294',  prereq: 'GNUR 293' },
  { course: 'GNUR 294',  prereq: 'GNUR 203' },
  { course: 'GNUR 294',  prereq: 'GNUR 238' },
  { course: 'GNUR 294',  prereq: 'GNUR 297' },
  { course: 'GNUR 360',  prereq: 'PSYC 304' },
  { course: 'GNUR 361',  prereq: 'GNUR 360' },
  { course: 'GNUR 361',  prereq: 'GNUR 294' },
  { course: 'GNUR 383',  prereq: 'GNUR 360' },

  // EXCM
  { course: 'EXCM 201', prereq: 'EXCM 101' },
  { course: 'EXCM 210', prereq: 'EXCM 201' },
  { course: 'EXCM 301', prereq: 'EXCM 201' },
  { course: 'EXCM 345', prereq: 'EXCM 101' },
  { course: 'EXCM 345', prereq: 'EXCM 201' },
  { course: 'EXCM 364', prereq: 'EXCM 201' },
  { course: 'EXCM 368', prereq: 'EXCM 201' },
  { course: 'EXCM 375', prereq: 'EXCM 201' },
  { course: 'EXCM 375', prereq: 'EXCM 364' },
  { course: 'EXCM 382', prereq: 'EXCM 201' },
  { course: 'EXCM 382', prereq: 'STAT 103' },
  { course: 'EXCM 385', prereq: 'PHYS 112' },
  { course: 'EXCM 387', prereq: 'EXCM 385' },
  { course: 'EXCM 390', prereq: 'EXCM 201' },
  { course: 'EXCM 390', prereq: 'PSYC 273' },
  { course: 'EXCM 395', prereq: 'EXCM 201' },

  // CJC
  { course: 'CJC 201', prereq: 'CJC 101' },
  { course: 'CJC 205', prereq: 'CJC 101' },
];

// ============================================================================
// COURSE EXTRACTION: recursively walk an object and collect {code, name} pairs
// ============================================================================

function extractCourses(obj, results) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object' && item.code && item.name) {
        // Normalize code: take the first alternative (e.g. "CHEM 160/101/105" -> "CHEM 160")
        const code = item.code.split('/')[0].trim();
        results.push({ code, name: item.name });
      } else if (item && typeof item === 'object') {
        extractCourses(item, results);
      }
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key === 'note' || key === 'notes' || key === 'electivesNote' ||
          key === 'additionalElectives' && typeof val === 'string' ||
          key === 'specialRequirements' || key === 'totalCredits' ||
          key === 'school' || key === 'degree' || key === 'totalCredits') {
        continue; // skip metadata strings
      }
      extractCourses(val, results);
    }
  }
}

// ============================================================================
// QUINLAN REMAINING: map variable names to program names
// ============================================================================

const QUINLAN_PROGRAMS = {
  'Entrepreneurship': { degree: 'BBA', required: 'entrepreneurshipRequired', electives: 'entrepreneurshipElectives' },
  'Human Resource Management': { degree: 'BBA', required: 'humanResourceManagementRequired', electives: 'humanResourceManagementElectives' },
  'Information Systems and Analytics': { degree: 'BBA', required: 'informationSystemsRequired', electives: ['informationSystemsProgrammingChoice', 'informationSystemsElectives'] },
  'International Business': { degree: 'BBA', required: 'internationalBusinessRequired', electives: 'internationalBusinessElectives' },
  'Sport Management': { degree: 'BBA', required: 'sportManagementRequired', electives: 'sportManagementElectives' },
  'Supply Chain Management': { degree: 'BBA', required: 'supplyChainManagementRequired', electives: ['supplyChainManagementPrimaryElectives', 'supplyChainManagementAdditionalElectives'] },
  'Economics': { degree: 'BBA', required: 'economicsRequired', electives: 'economicsElectives' },
  'Accounting and Analytics': { degree: 'BBA', required: 'accountingAnalyticsRequired', electives: ['accountingAnalyticsElectives', 'accountingAnalyticsCPATrack'] },
};

// ============================================================================
// MAIN
// ============================================================================

async function seed() {
  console.log('=== Loyola University Chicago - Catalog Seed ===\n');

  // --- Init DB ---
  console.log('Initializing database...');
  await db.initDb();

  // Clear existing catalog data so we can reseed cleanly
  console.log('Clearing existing catalog data...');
  db.runSql('DELETE FROM program_courses;');
  db.runSql('DELETE FROM prerequisites;');
  db.runSql('DELETE FROM courses;');
  db.runSql('DELETE FROM programs;');
  db.save();

  // ========================================================================
  // STEP 1: Load all data files
  // ========================================================================
  console.log('\n--- Loading data files ---');

  const lucData = loadDataFile(
    '../Rambler1/LUC_Programs_Data.js',
    ['UNDERGRADUATE_MAJORS', 'UNDERGRADUATE_MINORS', 'MAJOR_REQUIREMENTS']
  );
  console.log(`  LUC_Programs_Data.js: ${lucData.UNDERGRADUATE_MAJORS.length} majors, ${lucData.UNDERGRADUATE_MINORS.length} minors, ${Object.keys(lucData.MAJOR_REQUIREMENTS).length} detailed programs`);

  const quinlanData = loadDataFile(
    '../Rambler1/data/quinlan_remaining.js',
    [
      'entrepreneurshipRequired', 'entrepreneurshipElectives',
      'humanResourceManagementRequired', 'humanResourceManagementElectives',
      'informationSystemsRequired', 'informationSystemsProgrammingChoice', 'informationSystemsElectives',
      'internationalBusinessRequired', 'internationalBusinessElectives',
      'sportManagementRequired', 'sportManagementElectives',
      'supplyChainManagementRequired', 'supplyChainManagementPrimaryElectives', 'supplyChainManagementAdditionalElectives',
      'economicsRequired', 'economicsElectives',
      'accountingAnalyticsRequired', 'accountingAnalyticsElectives', 'accountingAnalyticsCPATrack',
      'newCourses',
    ]
  );
  console.log(`  quinlan_remaining.js: loaded (${quinlanData.newCourses.length} new courses)`);

  const stemData = loadDataFile('../Rambler1/data/stem_programs.js', ['STEM_PROGRAMS']);
  console.log(`  stem_programs.js: ${Object.keys(stemData.STEM_PROGRAMS).length} programs`);

  const humData = loadDataFile('../Rambler1/data/humanities_social_programs.js', ['HUMANITIES_SOCIAL_PROGRAMS']);
  console.log(`  humanities_social_programs.js: ${Object.keys(humData.HUMANITIES_SOCIAL_PROGRAMS).length} programs`);

  const commData = loadDataFile('../Rambler1/data/comm_arts_programs.js', ['COMM_ARTS_PROGRAMS']);
  console.log(`  comm_arts_programs.js: ${Object.keys(commData.COMM_ARTS_PROGRAMS).length} programs`);

  const eduData = loadDataFile('../Rambler1/data/education_health_sw_programs.js', ['EDUCATION_HEALTH_SW_PROGRAMS', 'EDUCATION_HEALTH_SW_CREDIT_OVERRIDES']);
  console.log(`  education_health_sw_programs.js: ${Object.keys(eduData.EDUCATION_HEALTH_SW_PROGRAMS).length} programs`);

  const envData = loadDataFile('../Rambler1/data/environmental_cps_programs.js', ['ENVIRONMENTAL_CPS_PROGRAMS']);
  console.log(`  environmental_cps_programs.js: ${Object.keys(envData.ENVIRONMENTAL_CPS_PROGRAMS).length} programs`);

  const stemDescData = loadDataFile('../Rambler1/data/stem_descriptions.js', ['STEM_DESCRIPTIONS']);
  console.log(`  stem_descriptions.js: ${Object.keys(stemDescData.STEM_DESCRIPTIONS).length} course descriptions`);

  const nonstemDescData = loadDataFile('../Rambler1/data/nonstem_descriptions.js', ['NONSTEM_DESCRIPTIONS']);
  console.log(`  nonstem_descriptions.js: ${Object.keys(nonstemDescData.NONSTEM_DESCRIPTIONS).length} course descriptions`);

  const progDescData = loadDataFile('../Rambler1/data/program_descriptions.js', ['PROGRAM_DESCRIPTIONS']);
  console.log(`  program_descriptions.js: ${Object.keys(progDescData.PROGRAM_DESCRIPTIONS).length} program descriptions`);

  // Merge education credit overrides into the main map
  if (eduData.EDUCATION_HEALTH_SW_CREDIT_OVERRIDES) {
    Object.assign(CREDIT_OVERRIDES, eduData.EDUCATION_HEALTH_SW_CREDIT_OVERRIDES);
  }

  // ========================================================================
  // STEP 2: Seed programs (121 majors + 109 minors)
  // ========================================================================
  console.log('\n--- Seeding programs ---');
  let programCount = 0;

  // Insert majors
  for (const m of lucData.UNDERGRADUATE_MAJORS) {
    db.runSql(`INSERT OR IGNORE INTO programs (name, type, degree, school) VALUES ('${esc(m.name)}', 'major', '${esc(m.degree)}', '${esc(m.school)}');`);
    programCount++;
  }
  console.log(`  Inserted ${programCount} majors`);

  // Insert minors
  let minorCount = 0;
  for (const m of lucData.UNDERGRADUATE_MINORS) {
    db.runSql(`INSERT OR IGNORE INTO programs (name, type, degree, school) VALUES ('${esc(m.name)}', 'minor', 'Minor', '${esc(m.school)}');`);
    minorCount++;
  }
  console.log(`  Inserted ${minorCount} minors`);
  programCount += minorCount;
  db.save();

  // ========================================================================
  // STEP 3: Seed courses
  // ========================================================================
  console.log('\n--- Seeding courses ---');

  // Collect all courses from all sources into a deduplicated map
  const courseMap = new Map(); // code -> name

  // 3a. From MAJOR_REQUIREMENTS in LUC_Programs_Data.js
  for (const [progName, progData] of Object.entries(lucData.MAJOR_REQUIREMENTS)) {
    const courses = [];
    extractCourses(progData, courses);
    for (const c of courses) {
      if (!courseMap.has(c.code)) courseMap.set(c.code, c.name);
    }
  }

  // 3b. From quinlan_remaining.js (all exported arrays)
  const quinlanArrayKeys = Object.keys(quinlanData).filter(k => Array.isArray(quinlanData[k]));
  for (const key of quinlanArrayKeys) {
    for (const item of quinlanData[key]) {
      if (item.code && item.name && !courseMap.has(item.code)) {
        courseMap.set(item.code, item.name);
      }
    }
  }

  // 3c. From the 5 detailed program data files
  const programDataSets = [
    stemData.STEM_PROGRAMS,
    humData.HUMANITIES_SOCIAL_PROGRAMS,
    commData.COMM_ARTS_PROGRAMS,
    eduData.EDUCATION_HEALTH_SW_PROGRAMS,
    envData.ENVIRONMENTAL_CPS_PROGRAMS,
  ];
  for (const dataSet of programDataSets) {
    for (const [progName, progData] of Object.entries(dataSet)) {
      const courses = [];
      extractCourses(progData, courses);
      for (const c of courses) {
        if (!courseMap.has(c.code)) courseMap.set(c.code, c.name);
      }
    }
  }

  // 3d. Insert all courses into the database
  let courseCount = 0;
  for (const [code, name] of courseMap) {
    const prefix = code.replace(/\s.*$/, '');
    const dept = getDepartment(prefix);
    const area = getSubjectArea(prefix);
    const credits = getCredits(code, name);
    const learningStyle = getLearningStyle(code, name);
    const assessmentType = getAssessmentType(code, name);
    const workStyle = 'mixed';
    const teachingStyle = 'structured';

    db.runSql(
      `INSERT OR IGNORE INTO courses (code, name, credits, department, subject_area, learning_style, work_style, teaching_style, assessment_type) VALUES ('${esc(code)}', '${esc(name)}', ${credits}, '${esc(dept)}', '${esc(area)}', '${learningStyle}', '${workStyle}', '${teachingStyle}', '${assessmentType}');`
    );
    courseCount++;
  }
  console.log(`  Inserted ${courseCount} unique courses`);
  db.save();

  // ========================================================================
  // STEP 4: Seed program_courses
  // ========================================================================
  console.log('\n--- Seeding program_courses ---');
  let linkCount = 0;
  let linkErrors = 0;

  // Helper: link all courses from a program data object to a program
  function linkProgramCourses(programName, degree, progData, reqType) {
    const courses = [];
    extractCourses(progData, courses);
    for (const c of courses) {
      try {
        db.runSql(
          `INSERT OR IGNORE INTO program_courses (program_id, course_id, requirement_type) SELECT p.id, c.id, '${esc(reqType)}' FROM programs p, courses c WHERE p.name = '${esc(programName)}' AND p.degree = '${esc(degree)}' AND c.code = '${esc(c.code)}';`
        );
        linkCount++;
      } catch (err) {
        linkErrors++;
      }
    }
  }

  // 4a. From MAJOR_REQUIREMENTS (LUC_Programs_Data.js)
  for (const [progKey, progData] of Object.entries(lucData.MAJOR_REQUIREMENTS)) {
    // progKey format: "Biology BS", "Nursing BSN", etc.
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4b. From STEM_PROGRAMS
  for (const [progKey, progData] of Object.entries(stemData.STEM_PROGRAMS)) {
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4c. From HUMANITIES_SOCIAL_PROGRAMS
  for (const [progKey, progData] of Object.entries(humData.HUMANITIES_SOCIAL_PROGRAMS)) {
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4d. From COMM_ARTS_PROGRAMS
  for (const [progKey, progData] of Object.entries(commData.COMM_ARTS_PROGRAMS)) {
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4e. From EDUCATION_HEALTH_SW_PROGRAMS
  for (const [progKey, progData] of Object.entries(eduData.EDUCATION_HEALTH_SW_PROGRAMS)) {
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4f. From ENVIRONMENTAL_CPS_PROGRAMS
  for (const [progKey, progData] of Object.entries(envData.ENVIRONMENTAL_CPS_PROGRAMS)) {
    const degree = progData.degree || progKey.split(' ').pop();
    const name = progKey.replace(/\s+(BS|BA|BBA|BSN|BSEd|BSW|AA)$/, '');
    linkProgramCourses(name, degree, progData, 'required');
  }

  // 4g. Quinlan remaining programs
  // These share the Quinlan business core from Finance BBA / Accounting BBA etc.
  // The quinlan_remaining.js only has major-specific courses. Link those.
  for (const [progName, config] of Object.entries(QUINLAN_PROGRAMS)) {
    const degree = config.degree;
    // Link required courses
    if (config.required && quinlanData[config.required]) {
      for (const c of quinlanData[config.required]) {
        try {
          db.runSql(
            `INSERT OR IGNORE INTO program_courses (program_id, course_id, requirement_type) SELECT p.id, c.id, 'required' FROM programs p, courses c WHERE p.name = '${esc(progName)}' AND p.degree = '${esc(degree)}' AND c.code = '${esc(c.code)}';`
          );
          linkCount++;
        } catch (err) { linkErrors++; }
      }
    }
    // Link elective courses
    const electiveKeys = Array.isArray(config.electives) ? config.electives : [config.electives];
    for (const eKey of electiveKeys) {
      if (quinlanData[eKey]) {
        for (const c of quinlanData[eKey]) {
          try {
            db.runSql(
              `INSERT OR IGNORE INTO program_courses (program_id, course_id, requirement_type) SELECT p.id, c.id, 'elective' FROM programs p, courses c WHERE p.name = '${esc(progName)}' AND p.degree = '${esc(degree)}' AND c.code = '${esc(c.code)}';`
            );
            linkCount++;
          } catch (err) { linkErrors++; }
        }
      }
    }
  }

  console.log(`  Linked ${linkCount} program-course relationships (${linkErrors} errors)`);
  db.save();

  // ========================================================================
  // STEP 5: Seed prerequisites
  // ========================================================================
  console.log('\n--- Seeding prerequisites ---');
  let prereqCount = 0;
  let prereqErrors = 0;

  for (const p of PREREQUISITES) {
    try {
      db.runSql(
        `INSERT OR IGNORE INTO prerequisites (course_code, prerequisite_code) VALUES ('${esc(p.course)}', '${esc(p.prereq)}');`
      );
      prereqCount++;
    } catch (err) {
      prereqErrors++;
    }
  }
  console.log(`  Inserted ${prereqCount} prerequisite pairs (${prereqErrors} errors)`);
  db.save();

  // ========================================================================
  // STEP 6: Seed course descriptions
  // ========================================================================
  console.log('\n--- Seeding course descriptions ---');
  let descCount = 0;

  const allDescriptions = {
    ...stemDescData.STEM_DESCRIPTIONS,
    ...nonstemDescData.NONSTEM_DESCRIPTIONS,
  };

  for (const [code, data] of Object.entries(allDescriptions)) {
    const desc = typeof data === 'string' ? data : data.description;
    const semester = (typeof data === 'object' && data.semester) ? data.semester : null;
    if (desc) {
      db.runSql(`UPDATE courses SET description = '${esc(desc)}' WHERE code = '${esc(code)}';`);
      descCount++;
    }
    if (semester) {
      db.runSql(`UPDATE courses SET semester = '${esc(semester)}' WHERE code = '${esc(code)}';`);
    }
  }
  console.log(`  Updated ${descCount} course descriptions`);
  db.save();

  // ========================================================================
  // STEP 7: Seed program descriptions
  // ========================================================================
  console.log('\n--- Seeding program descriptions ---');
  let progDescCount = 0;

  for (const [key, desc] of Object.entries(progDescData.PROGRAM_DESCRIPTIONS)) {
    // Key format: "name|type|degree"
    const parts = key.split('|');
    if (parts.length !== 3) continue;
    const [pName, pType, pDegree] = parts;
    db.runSql(`UPDATE programs SET description = '${esc(desc)}' WHERE name = '${esc(pName)}' AND type = '${esc(pType)}' AND degree = '${esc(pDegree)}';`);
    progDescCount++;
  }
  console.log(`  Updated ${progDescCount} program descriptions`);
  db.save();

  // ========================================================================
  // STEP 8: Set catalog version
  // ========================================================================
  const version = new Date().toISOString().split('T')[0];
  db.setCatalogVersion(version);
  console.log(`\nCatalog version set to ${version}`);

  // Final save
  db.save();

  // ========================================================================
  // SUMMARY
  // ========================================================================
  const programs    = db.getPrograms();
  const courses     = db.getCourses();
  const prereqs     = db.getPrerequisites('COMP 271');
  const catalog     = db.getFullCatalog();

  console.log('\n=== SEED SUMMARY ===');
  console.log(`  Programs:            ${programs.length}`);
  console.log(`  Courses:             ${courses.length}`);
  console.log(`  Program-courses:     ${catalog.programCourses.length}`);
  console.log(`  Prerequisites:       ${catalog.prerequisites.length}`);
  console.log(`  COMP 271 prereqs:    ${prereqs.length} (${prereqs.map(p => p.prerequisite_code).join(', ')})`);
  console.log(`  Catalog version:     ${db.getCatalogVersion()}`);

  db.close();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
