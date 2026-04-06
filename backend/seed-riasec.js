/**
 * Seed RIASEC recommendation data into locus.db
 * Run: node seed-riasec.js
 *
 * Seeds:
 * 1. riasec_recommendations — maps RIASEC codes to recommended programs
 * 2. major_focus_areas — specialization tracks within majors
 * 3. focus_area_riasec — RIASEC dimension weights per focus area
 * 4. focus_area_courses — key courses per focus area
 */

const db = require('./db');

async function seed() {
  const database = await db.initDb();

  // Helper to find program ID by name — prefer exact match, then partial
  function findProgram(name) {
    // Try exact match first (majors only)
    const exact = database.prepare('SELECT id FROM programs WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1');
    exact.bind([name, 'major']);
    let id = null;
    if (exact.step()) {
      id = exact.getAsObject().id;
    }
    exact.free();
    if (id) return id;

    // Fall back to partial match (majors only)
    const partial = database.prepare('SELECT id FROM programs WHERE LOWER(name) LIKE LOWER(?) AND type = ? LIMIT 1');
    partial.bind([`%${name}%`, 'major']);
    if (partial.step()) {
      id = partial.getAsObject().id;
    }
    partial.free();
    return id;
  }

  // =========================================================================
  // RIASEC CODE → MAJOR RECOMMENDATIONS (for undecided students)
  // =========================================================================

  const codeToMajors = {
    RI: ['Bioinformatics', 'Forensic Science', 'Environmental Science', 'Exercise Science', 'Physics'],
    IR: ['Biology', 'Chemistry', 'Computer Science', 'Physics', 'Biochemistry'],
    IA: ['Philosophy', 'English', 'Cognitive and Behavioral Neuroscience', 'Psychology', 'Film and Digital Media'],
    AI: ['Film and Digital Media', 'Communication Studies', 'Visual Communication', 'English', 'Multimedia Journalism'],
    IS: ['Psychology', 'Public Health', 'Nursing (Four-Year)', 'Cognitive and Behavioral Neuroscience', 'Biology'],
    SI: ['Nursing (Four-Year)', 'Social Work', 'Elementary Education', 'Public Health', 'Exercise Science'],
    AS: ['Theatre', 'Music', 'Multimedia Journalism', 'Communication Studies', 'Dance'],
    SA: ['Elementary Education', 'Communication Studies', 'Music', 'Social Work', 'English'],
    AE: ['Marketing', 'Advertising & Public Relations', 'Film and Digital Media', 'Visual Communication', 'Entrepreneurship'],
    EA: ['Marketing', 'Multimedia Journalism', 'Sport Management', 'Communication Studies', 'Entrepreneurship'],
    SE: ['Political Science', 'Elementary Education', 'Social Work', 'Public Health', 'Communication Studies'],
    ES: ['Management', 'Human Resource Management', 'Communication Studies', 'Political Science', 'Social Work'],
    EC: ['Finance', 'Management', 'Supply Chain Management', 'Accounting', 'Economics'],
    CE: ['Accounting', 'Information Systems and Analytics', 'Accounting and Analytics', 'Finance', 'Economics'],
    EI: ['Economics', 'Political Science', 'Healthcare Administration', 'International Business', 'Data Science'],
    IE: ['Economics', 'Political Science', 'Philosophy', 'Computer Science', 'Statistics'],
    CI: ['Accounting', 'Statistics', 'Computer Science', 'Data Science', 'Mathematics'],
    IC: ['Mathematics', 'Computer Science', 'Statistics', 'Bioinformatics', 'Physics'],
    RC: ['Information Technology', 'Exercise Science', 'Environmental Science', 'Healthcare Administration', 'Forensic Science'],
    CR: ['Accounting', 'Information Systems and Analytics', 'Supply Chain Management', 'Forensic Science', 'Information Technology'],
    RS: ['Nursing (Four-Year)', 'Exercise Science', 'Public Health', 'Environmental Science', 'Elementary Education'],
    SR: ['Nursing (Four-Year)', 'Exercise Science', 'Public Health', 'Social Work', 'Elementary Education'],
    RA: ['Visual Communication', 'Environmental Science', 'Drawing, Painting and Printmaking', 'Dance', 'Theatre'],
    AR: ['Drawing, Painting and Printmaking', 'Visual Communication', 'Sculpture and Ceramics', 'Dance', 'Theatre'],
  };

  const rationales = {
    RI: 'You combine hands-on building with deep investigation',
    IR: 'You lead with analysis and love applied problem-solving',
    IA: 'You blend intellectual curiosity with creative expression',
    AI: 'You express ideas through creative media with intellectual depth',
    IS: 'You analyze systems to help people — the analytical helper',
    SI: 'You care deeply about people and back it up with evidence',
    AS: 'You create art that connects with and serves people',
    SA: 'You help and inspire through creative expression',
    AE: 'You combine creativity with strategic business thinking',
    EA: 'You lead with ambition and use creativity to get there',
    SE: 'You want to lead movements that help people',
    ES: 'You persuade and organize to serve communities',
    EC: 'You lead with strategic vision backed by data',
    CE: 'You organize systems and lead with precision',
    EI: 'You think strategically and lead with intellectual rigor',
    IE: 'You combine deep thinking with leadership ambition',
    CI: 'You bring precision to complex analytical problems',
    IC: 'You systematically research and analyze',
    RC: 'You build practical, organized systems',
    CR: 'You bring reliability and precision to hands-on work',
    RS: 'You use hands-on skills to directly help people',
    SR: 'You care actively — you help with action, not just words',
    RA: 'You make tangible things with artistic vision',
    AR: 'You craft art with your hands',
  };

  console.log('Seeding RIASEC recommendations...');
  let recsInserted = 0;

  for (const [code, majors] of Object.entries(codeToMajors)) {
    for (let rank = 0; rank < majors.length; rank++) {
      const progId = findProgram(majors[rank]);
      if (progId) {
        database.run(
          `INSERT OR IGNORE INTO riasec_recommendations (code, program_id, rank, rationale) VALUES (?, ?, ?, ?)`,
          [code, progId, rank + 1, rationales[code] || '']
        );
        recsInserted++;
      } else {
        console.log(`  [SKIP] No program found for: ${majors[rank]}`);
      }
    }
  }
  console.log(`  Inserted ${recsInserted} recommendations`);

  // =========================================================================
  // FOCUS AREAS FOR TOP MAJORS (with RIASEC tags and courses)
  // =========================================================================

  const focusAreaData = [
    // Computer Science
    { major: 'Computer Science', areas: [
      { name: 'Systems & Algorithms', desc: 'Deep into how computers work, optimization, architecture', riasec: { I: 2, C: 1 }, courses: ['COMP 363', 'COMP 310', 'COMP 264'] },
      { name: 'Creative Computing & UX', desc: 'Human-computer interaction, web, design thinking', riasec: { I: 1, A: 2 }, courses: ['COMP 341', 'COMP 424', 'COMP 271'] },
      { name: 'Tech Leadership', desc: 'Ethics, management, product strategy', riasec: { I: 1, E: 2 }, courses: ['COMP 317', 'COMP 390'] },
      { name: 'Research & Data Science', desc: 'Computational biology, statistics, ML', riasec: { I: 3 }, courses: ['COMP 383', 'STAT 203', 'COMP 363'] },
      { name: 'Infrastructure & Security', desc: 'Networks, operating systems, cybersecurity', riasec: { R: 2, C: 1 }, courses: ['COMP 264', 'COMP 310', 'COMP 343'] },
    ]},
    // Nursing
    { major: 'Nursing', areas: [
      { name: 'Clinical Research', desc: 'Evidence-based practice, clinical trials', riasec: { S: 1, I: 2 }, courses: ['GNUR 360', 'STAT 203'] },
      { name: 'Bedside & Community', desc: 'Direct patient care, pediatrics, community health', riasec: { S: 2, R: 1 }, courses: ['MSN 277', 'MCN 273'] },
      { name: 'Nursing Leadership', desc: 'Management, policy, healthcare admin', riasec: { S: 1, E: 2 }, courses: ['GNUR 383'] },
      { name: 'Technical/Surgical', desc: 'OR nursing, CRNA track, ICU, trauma', riasec: { R: 2, I: 1 }, courses: ['MSN 377'] },
    ]},
    // Psychology
    { major: 'Psychology', areas: [
      { name: 'Clinical Psychology', desc: 'Therapy, counseling, mental health', riasec: { I: 1, S: 2 }, courses: ['PSYC 331', 'PSYC 346'] },
      { name: 'Research Psychology', desc: 'PhD track, neuroscience, experimental', riasec: { I: 3 }, courses: ['PSYC 304', 'PSYC 306', 'NEUR 101'] },
      { name: 'Applied / Organizational', desc: 'HR, organizational behavior, leadership', riasec: { S: 1, E: 2 }, courses: ['PSYC 374'] },
      { name: 'Creative / Cognitive', desc: 'UX research, media psychology, cognitive science', riasec: { I: 1, A: 2 }, courses: ['PSYC 250'] },
    ]},
    // Biology
    { major: 'Biology', areas: [
      { name: 'Pre-Med / Clinical', desc: 'Medical school preparation, patient-focused', riasec: { I: 2, S: 1 }, courses: ['BIOL 251', 'CHEM 101', 'PHYS 111'] },
      { name: 'Research / PhD Track', desc: 'Lab research, genetics, molecular biology', riasec: { I: 3 }, courses: ['BIOL 282', 'BIOL 301'] },
      { name: 'Ecology & Field', desc: 'Environmental work, field research, conservation', riasec: { R: 2, I: 1 }, courses: ['BIOL 260', 'ENVS 201'] },
      { name: 'Biotech & Bioinformatics', desc: 'Computational biology, data-driven research', riasec: { I: 2, R: 1 }, courses: ['COMP 383', 'BIOL 388'] },
    ]},
    // Accounting
    { major: 'Accounting', areas: [
      { name: 'Tax', desc: 'Deep tax code knowledge, compliance', riasec: { C: 3 }, courses: ['ACCT 304', 'ACCT 404'] },
      { name: 'Audit', desc: 'Reviewing companies, testing controls', riasec: { C: 2, E: 1 }, courses: ['ACCT 303', 'ACCT 403'] },
      { name: 'Forensic Accounting', desc: 'Investigating fraud, financial crime', riasec: { I: 2, C: 2 }, courses: ['ACCT 315'] },
      { name: 'Analytics & Info Systems', desc: 'Data science meets accounting', riasec: { I: 2, C: 1, R: 1 }, courses: ['ISSCM 241', 'ACCT 315'] },
      { name: 'Corporate Finance', desc: 'CFO track, strategic decisions', riasec: { E: 2, C: 1 }, courses: ['FIN 300', 'FIN 340'] },
    ]},
    // Political Science
    { major: 'Political Science', areas: [
      { name: 'Pre-Law', desc: 'Legal reasoning, constitutional analysis', riasec: { E: 2, I: 1 }, courses: ['PLSC 300', 'PLSC 370'] },
      { name: 'Policy & Public Admin', desc: 'Government, public policy analysis', riasec: { I: 1, S: 1, E: 1 }, courses: ['PLSC 302', 'PLSC 340'] },
      { name: 'International Relations', desc: 'Global politics, diplomacy', riasec: { S: 1, E: 2 }, courses: ['PLSC 303', 'PLSC 320'] },
      { name: 'Political Theory', desc: 'Philosophy of politics, ethics', riasec: { I: 2, A: 1 }, courses: ['PLSC 301'] },
      { name: 'Campaigns & Leadership', desc: 'Electoral politics, advocacy, organizing', riasec: { E: 3 }, courses: ['PLSC 340', 'COMM 201'] },
    ]},
    // Marketing
    { major: 'Marketing', areas: [
      { name: 'Digital Marketing & Analytics', desc: 'Data-driven marketing, SEO, social media metrics', riasec: { E: 1, I: 1, C: 1 }, courses: ['MKTG 360', 'MKTG 370'] },
      { name: 'Brand Strategy & Creative', desc: 'Brand building, advertising, creative campaigns', riasec: { A: 2, E: 1 }, courses: ['MKTG 340', 'MKTG 350'] },
      { name: 'Sales & Business Development', desc: 'Client relations, revenue growth', riasec: { E: 3 }, courses: ['MKTG 320', 'MGMT 301'] },
      { name: 'Consumer Psychology', desc: 'Understanding buyer behavior, market research', riasec: { I: 2, S: 1 }, courses: ['MKTG 310', 'PSYC 101'] },
    ]},
    // Communication
    { major: 'Communication', areas: [
      { name: 'Public Relations', desc: 'Media relations, crisis communication, reputation', riasec: { E: 2, S: 1 }, courses: ['COMM 320', 'COMM 370'] },
      { name: 'Digital Media Production', desc: 'Video, podcasting, content creation', riasec: { A: 2, R: 1 }, courses: ['COMM 310', 'COMM 340'] },
      { name: 'Interpersonal & Health Comm', desc: 'Counseling communication, health messaging', riasec: { S: 2, I: 1 }, courses: ['COMM 301', 'COMM 380'] },
      { name: 'Organizational Communication', desc: 'Corporate communication, leadership', riasec: { E: 2, C: 1 }, courses: ['COMM 350', 'MGMT 301'] },
    ]},
    // English
    { major: 'English', areas: [
      { name: 'Creative Writing', desc: 'Fiction, poetry, personal narrative', riasec: { A: 3 }, courses: ['ENGL 280', 'ENGL 380'] },
      { name: 'Literary Analysis', desc: 'Critical theory, close reading, academic research', riasec: { I: 2, A: 1 }, courses: ['ENGL 300', 'ENGL 390'] },
      { name: 'Professional Writing', desc: 'Technical writing, editing, publishing', riasec: { C: 1, E: 1, A: 1 }, courses: ['ENGL 313', 'ENGL 315'] },
      { name: 'Pre-Law Rhetoric', desc: 'Argumentation, legal writing prep', riasec: { E: 2, I: 1 }, courses: ['ENGL 300', 'PLSC 370'] },
    ]},
    // Education
    { major: 'Education', areas: [
      { name: 'Elementary Education', desc: 'K-8 classroom teaching', riasec: { S: 2, A: 1 }, courses: ['CIEP 201', 'CIEP 301'] },
      { name: 'Secondary STEM Education', desc: 'High school math/science teaching', riasec: { S: 2, I: 1 }, courses: ['CIEP 344', 'CIEP 345'] },
      { name: 'Special Education', desc: 'Learning differences, inclusive education', riasec: { S: 3 }, courses: ['CIEP 350', 'CIEP 355'] },
      { name: 'Educational Leadership', desc: 'Administration, policy, curriculum design', riasec: { S: 1, E: 2 }, courses: ['CIEP 370', 'ELPS 401'] },
    ]},
  ];

  console.log('\nSeeding focus areas for top majors...');
  let areasInserted = 0;

  for (const { major, areas } of focusAreaData) {
    const progId = findProgram(major);
    if (!progId) {
      console.log(`  [SKIP] No program found for: ${major}`);
      continue;
    }

    for (const area of areas) {
      // Insert focus area
      database.run(
        `INSERT OR IGNORE INTO major_focus_areas (program_id, name, description) VALUES (?, ?, ?)`,
        [progId, area.name, area.desc]
      );

      // Get the ID
      const areaStmt = database.prepare('SELECT id FROM major_focus_areas WHERE program_id = ? AND name = ?');
      areaStmt.bind([progId, area.name]);
      let areaId = null;
      if (areaStmt.step()) {
        areaId = areaStmt.getAsObject().id;
      }
      areaStmt.free();
      if (!areaId) continue;

      // Insert RIASEC weights
      for (const [dim, weight] of Object.entries(area.riasec)) {
        database.run(
          `INSERT OR IGNORE INTO focus_area_riasec (focus_area_id, dimension, weight) VALUES (?, ?, ?)`,
          [areaId, dim, weight]
        );
      }

      // Insert course links
      for (const code of (area.courses || [])) {
        database.run(
          `INSERT OR IGNORE INTO focus_area_courses (focus_area_id, course_code) VALUES (?, ?)`,
          [areaId, code]
        );
      }

      areasInserted++;
    }
  }

  console.log(`  Inserted ${areasInserted} focus areas`);

  // Save
  db.save();
  db.close();
  console.log('\nDone! RIASEC data seeded successfully.');
}

seed().catch(console.error);
