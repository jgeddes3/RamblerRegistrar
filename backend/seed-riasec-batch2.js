/**
 * Seed RIASEC focus-area data for STEM majors (batch 2)
 * Run: node seed-riasec-batch2.js
 *
 * Seeds major_focus_areas, focus_area_riasec, and focus_area_courses
 * for 19 STEM programs at Loyola University Chicago.
 */

const db = require('./db');

const batch2 = [
  // =========================================================================
  // 1. Applied Mathematics
  // =========================================================================
  { major: 'Applied Mathematics', areas: [
    { name: 'Computational Mathematics', desc: 'Numerical methods, scientific computing, and simulation', riasec: { I: 3, R: 1 }, courses: ['MATH 309', 'MATH 351', 'MATH 264'] },
    { name: 'Mathematical Modeling', desc: 'Building models for real-world systems in science and engineering', riasec: { I: 2, R: 2 }, courses: ['MATH 263', 'MATH 304', 'MATH 360'] },
    { name: 'Optimization & Operations', desc: 'Linear programming, optimization theory, and decision science', riasec: { I: 2, C: 2 }, courses: ['MATH 355', 'MATH 320', 'MATH 351'] },
    { name: 'Data-Driven Mathematics', desc: 'Statistical modeling and data analysis with mathematical rigor', riasec: { I: 2, C: 1 }, courses: ['STAT 303', 'MATH 263', 'STAT 335'] },
  ]},

  // =========================================================================
  // 2. Biochemistry
  // =========================================================================
  { major: 'Biochemistry', areas: [
    { name: 'Pre-Med Biochemistry', desc: 'Preparation for medical school with clinical science focus', riasec: { I: 2, S: 1 }, courses: ['CHEM 223', 'CHEM 301', 'BIOL 251'] },
    { name: 'Protein & Structural Biology', desc: 'Protein chemistry, enzymology, and macromolecular structure', riasec: { I: 3 }, courses: ['CHEM 301', 'CHEM 302', 'CHEM 320'] },
    { name: 'Pharmaceutical Sciences', desc: 'Drug design, pharmacology, and medicinal chemistry', riasec: { I: 2, R: 1 }, courses: ['CHEM 325', 'CHEM 301', 'CHEM 335'] },
    { name: 'Biotech & Industry', desc: 'Industrial applications of biochemistry and biotechnology careers', riasec: { I: 1, E: 2 }, courses: ['CHEM 302', 'CHEM 370', 'BIOL 388'] },
  ]},

  // =========================================================================
  // 3. Bioinformatics
  // =========================================================================
  { major: 'Bioinformatics', areas: [
    { name: 'Genomics & Sequence Analysis', desc: 'DNA/RNA sequencing, genome assembly, and comparative genomics', riasec: { I: 3 }, courses: ['COMP 383', 'BIOL 388', 'BIOL 282'] },
    { name: 'Computational Drug Discovery', desc: 'Molecular docking, pharmacogenomics, and drug target identification', riasec: { I: 2, R: 1 }, courses: ['COMP 383', 'CHEM 301', 'BIOL 388'] },
    { name: 'Biostatistics & Data Mining', desc: 'Statistical methods for high-throughput biological data', riasec: { I: 2, C: 1 }, courses: ['STAT 303', 'COMP 383', 'STAT 335'] },
    { name: 'Software for Biology', desc: 'Building bioinformatics pipelines, databases, and visualization tools', riasec: { I: 1, R: 2 }, courses: ['COMP 271', 'COMP 383', 'COMP 363'] },
  ]},

  // =========================================================================
  // 4. Biophysics
  // =========================================================================
  { major: 'Biophysics', areas: [
    { name: 'Molecular Biophysics', desc: 'Physical principles of biomolecular structure and dynamics', riasec: { I: 3 }, courses: ['PHYS 325', 'BIOL 282', 'CHEM 301'] },
    { name: 'Medical Physics', desc: 'Imaging, radiation therapy, and diagnostic physics', riasec: { I: 2, S: 1 }, courses: ['PHYS 301', 'PHYS 340', 'BIOL 251'] },
    { name: 'Computational Biophysics', desc: 'Simulation and modeling of biological systems at atomic scale', riasec: { I: 2, R: 1 }, courses: ['PHYS 325', 'COMP 383', 'MATH 263'] },
    { name: 'Experimental Biophysics', desc: 'Hands-on lab techniques in spectroscopy, microscopy, and instrumentation', riasec: { R: 2, I: 2 }, courses: ['PHYS 235', 'PHYS 236', 'BIOL 282'] },
  ]},

  // =========================================================================
  // 5. Biology with Ecology Emphasis
  // =========================================================================
  { major: 'Biology with Ecology Emphasis', areas: [
    { name: 'Conservation Biology', desc: 'Endangered species management, habitat restoration, and biodiversity', riasec: { I: 2, S: 1 }, courses: ['BIOL 260', 'BIOL 370', 'BIOL 375'] },
    { name: 'Field Ecology', desc: 'Fieldwork-intensive study of ecosystems, populations, and communities', riasec: { R: 2, I: 1 }, courses: ['BIOL 260', 'BIOL 335', 'BIOL 370'] },
    { name: 'Environmental Science & Policy', desc: 'Applying ecological science to environmental regulation and advocacy', riasec: { I: 1, S: 1, E: 1 }, courses: ['BIOL 260', 'BIOL 375', 'BIOL 390'] },
    { name: 'Aquatic & Marine Ecology', desc: 'Freshwater and marine ecosystem research and management', riasec: { R: 2, I: 2 }, courses: ['BIOL 260', 'BIOL 370', 'BIOL 340'] },
  ]},

  // =========================================================================
  // 6. Biology with Molecular Biology Emphasis
  // =========================================================================
  { major: 'Biology with Molecular Biology Emphasis', areas: [
    { name: 'Genetics & Genomics', desc: 'Gene expression, molecular genetics, and genome-scale analysis', riasec: { I: 3 }, courses: ['BIOL 282', 'BIOL 388', 'BIOL 301'] },
    { name: 'Cell Biology & Disease', desc: 'Cellular mechanisms of disease, cancer biology, and immunology', riasec: { I: 2, S: 1 }, courses: ['BIOL 280', 'BIOL 325', 'BIOL 330'] },
    { name: 'Biotechnology & Lab Research', desc: 'Recombinant DNA, cloning techniques, and hands-on lab skills', riasec: { R: 2, I: 1 }, courses: ['BIOL 282', 'BIOL 292', 'BIOL 301'] },
    { name: 'Pre-Med Molecular', desc: 'Molecular-level preparation for medical or dental school', riasec: { I: 2, S: 1 }, courses: ['BIOL 251', 'BIOL 280', 'CHEM 223'] },
  ]},

  // =========================================================================
  // 7. Chemistry
  // =========================================================================
  { major: 'Chemistry', areas: [
    { name: 'Organic & Medicinal Chemistry', desc: 'Synthesis, reaction mechanisms, and drug development', riasec: { I: 2, R: 1 }, courses: ['CHEM 223', 'CHEM 224', 'CHEM 325'] },
    { name: 'Analytical & Environmental Chemistry', desc: 'Instrumentation, chemical analysis, and environmental monitoring', riasec: { R: 2, I: 1 }, courses: ['CHEM 310', 'CHEM 312', 'CHEM 340'] },
    { name: 'Physical & Theoretical Chemistry', desc: 'Thermodynamics, quantum chemistry, and computational methods', riasec: { I: 3 }, courses: ['CHEM 315', 'CHEM 316', 'CHEM 320'] },
    { name: 'Materials & Industrial Chemistry', desc: 'Polymer science, materials characterization, and industry applications', riasec: { R: 2, E: 1 }, courses: ['CHEM 330', 'CHEM 335', 'CHEM 370'] },
  ]},

  // =========================================================================
  // 8. Cybersecurity
  // =========================================================================
  { major: 'Cybersecurity', areas: [
    { name: 'Network Security & Defense', desc: 'Firewalls, intrusion detection, and network hardening', riasec: { R: 2, C: 1 }, courses: ['COMP 343', 'COMP 349', 'COMP 310'] },
    { name: 'Penetration Testing & Ethical Hacking', desc: 'Offensive security, vulnerability assessment, and red-teaming', riasec: { R: 2, I: 1 }, courses: ['COMP 349', 'COMP 264', 'COMP 343'] },
    { name: 'Security Policy & Governance', desc: 'Risk management, compliance frameworks, and security leadership', riasec: { E: 2, C: 1 }, courses: ['COMP 317', 'COMP 349', 'COMP 390'] },
    { name: 'Cryptography & Secure Software', desc: 'Encryption algorithms, secure coding practices, and protocol design', riasec: { I: 2, C: 1 }, courses: ['COMP 363', 'COMP 349', 'COMP 271'] },
    { name: 'Digital Forensics', desc: 'Incident response, evidence recovery, and forensic analysis', riasec: { I: 2, R: 1 }, courses: ['COMP 349', 'COMP 310', 'COMP 317'] },
  ]},

  // =========================================================================
  // 9. Data Science
  // =========================================================================
  { major: 'Data Science', areas: [
    { name: 'Machine Learning & AI', desc: 'Predictive modeling, neural networks, and intelligent systems', riasec: { I: 3 }, courses: ['COMP 378', 'STAT 338', 'COMP 363'] },
    { name: 'Data Engineering', desc: 'Databases, data pipelines, and large-scale data infrastructure', riasec: { R: 2, C: 1 }, courses: ['COMP 353', 'COMP 310', 'COMP 271'] },
    { name: 'Statistical Analytics', desc: 'Regression, Bayesian methods, and rigorous statistical inference', riasec: { I: 2, C: 1 }, courses: ['STAT 303', 'STAT 335', 'STAT 338'] },
    { name: 'Business Analytics', desc: 'Data-driven decision making, visualization, and consulting', riasec: { E: 2, I: 1 }, courses: ['STAT 303', 'COMP 353', 'STAT 336'] },
    { name: 'Biomedical Data Science', desc: 'Applying data science to healthcare, genomics, and clinical data', riasec: { I: 2, S: 1 }, courses: ['COMP 383', 'STAT 335', 'BIOL 388'] },
  ]},

  // =========================================================================
  // 10. Engineering: Biomedical Engineering
  // =========================================================================
  { major: 'Engineering: Biomedical Engineering', areas: [
    { name: 'Biomechanics & Devices', desc: 'Medical device design, prosthetics, and biomechanical analysis', riasec: { R: 3, I: 1 }, courses: ['PHYS 111', 'PHYS 112', 'BIOL 251'] },
    { name: 'Tissue Engineering & Biomaterials', desc: 'Regenerative medicine, scaffold design, and biocompatibility', riasec: { I: 2, R: 1 }, courses: ['CHEM 101', 'BIOL 280', 'BIOL 325'] },
    { name: 'Biomedical Signal Processing', desc: 'Medical imaging, EEG/ECG analysis, and diagnostic systems', riasec: { I: 2, R: 2 }, courses: ['PHYS 301', 'MATH 263', 'COMP 271'] },
    { name: 'Clinical Engineering', desc: 'Hospital-based engineering, regulatory affairs, and patient safety', riasec: { R: 1, S: 2 }, courses: ['BIOL 251', 'PHYS 111', 'CHEM 101'] },
  ]},

  // =========================================================================
  // 11. Engineering: Computer Engineering
  // =========================================================================
  { major: 'Engineering: Computer Engineering', areas: [
    { name: 'Embedded Systems', desc: 'Microcontrollers, firmware, and real-time system design', riasec: { R: 3 }, courses: ['COMP 264', 'COMP 310', 'PHYS 236'] },
    { name: 'Digital Systems & VLSI', desc: 'Digital logic, FPGA programming, and chip design', riasec: { R: 2, I: 1 }, courses: ['COMP 264', 'PHYS 236', 'MATH 263'] },
    { name: 'Networking & IoT', desc: 'Computer networks, Internet of Things, and distributed systems', riasec: { R: 2, E: 1 }, courses: ['COMP 343', 'COMP 310', 'COMP 264'] },
    { name: 'Robotics & Automation', desc: 'Control systems, sensor integration, and autonomous machines', riasec: { R: 2, I: 2 }, courses: ['COMP 264', 'PHYS 301', 'MATH 263'] },
  ]},

  // =========================================================================
  // 12. Engineering: Environmental Engineering
  // =========================================================================
  { major: 'Engineering: Environmental Engineering', areas: [
    { name: 'Water & Wastewater Treatment', desc: 'Water quality engineering, treatment systems, and remediation', riasec: { R: 2, I: 1 }, courses: ['CHEM 101', 'CHEM 102', 'PHYS 111'] },
    { name: 'Air Quality & Climate', desc: 'Atmospheric pollution control, emissions modeling, and climate science', riasec: { I: 2, R: 1 }, courses: ['CHEM 101', 'MATH 263', 'PHYS 112'] },
    { name: 'Sustainability & Green Design', desc: 'Sustainable infrastructure, renewable energy, and life-cycle assessment', riasec: { I: 1, S: 1, E: 1 }, courses: ['CHEM 101', 'PHYS 111', 'MATH 263'] },
    { name: 'Environmental Data & Modeling', desc: 'GIS, computational modeling, and environmental data analysis', riasec: { I: 2, C: 1 }, courses: ['STAT 303', 'COMP 271', 'MATH 263'] },
  ]},

  // =========================================================================
  // 13. Mathematics
  // =========================================================================
  { major: 'Mathematics', areas: [
    { name: 'Pure Mathematics', desc: 'Abstract algebra, real analysis, and proof-based theory', riasec: { I: 3 }, courses: ['MATH 313', 'MATH 304', 'MATH 305'] },
    { name: 'Applied & Computational Math', desc: 'Numerical analysis, differential equations, and scientific computing', riasec: { I: 2, R: 1 }, courses: ['MATH 264', 'MATH 309', 'MATH 351'] },
    { name: 'Actuarial & Financial Math', desc: 'Probability, risk modeling, and insurance mathematics', riasec: { I: 1, C: 2 }, courses: ['MATH 263', 'STAT 303', 'MATH 355'] },
    { name: 'Pre-Graduate Research', desc: 'Preparation for PhD programs with focus on independent research', riasec: { I: 3, A: 1 }, courses: ['MATH 313', 'MATH 314', 'MATH 399'] },
  ]},

  // =========================================================================
  // 14. Mathematics and Computer Science
  // =========================================================================
  { major: 'Mathematics and Computer Science', areas: [
    { name: 'Algorithm Theory', desc: 'Complexity theory, graph algorithms, and combinatorial optimization', riasec: { I: 3 }, courses: ['COMP 363', 'MATH 313', 'MATH 353'] },
    { name: 'Machine Learning & AI', desc: 'Statistical learning theory, neural networks, and data science', riasec: { I: 2, R: 1 }, courses: ['COMP 378', 'STAT 338', 'MATH 263'] },
    { name: 'Cryptography & Security', desc: 'Number theory applications to cryptographic systems and protocols', riasec: { I: 2, C: 1 }, courses: ['MATH 313', 'COMP 363', 'COMP 349'] },
    { name: 'Software Engineering & Systems', desc: 'Building large-scale software with mathematical foundations', riasec: { R: 2, C: 1 }, courses: ['COMP 330', 'COMP 271', 'COMP 310'] },
  ]},

  // =========================================================================
  // 15. Mathematics - Education Track
  // =========================================================================
  { major: 'Mathematics - Education Track', areas: [
    { name: 'Secondary Math Teaching', desc: 'High school mathematics instruction and pedagogy', riasec: { S: 2, I: 1 }, courses: ['MATH 162', 'MATH 212', 'MATH 263'] },
    { name: 'Curriculum & Assessment Design', desc: 'Developing math curricula, rubrics, and standardized assessments', riasec: { S: 1, C: 2 }, courses: ['MATH 313', 'MATH 304', 'STAT 103'] },
    { name: 'Math Outreach & Equity', desc: 'Community math engagement, tutoring programs, and inclusive teaching', riasec: { S: 3 }, courses: ['MATH 162', 'STAT 103', 'MATH 131'] },
    { name: 'STEM Integration', desc: 'Cross-disciplinary teaching connecting math to science and technology', riasec: { S: 2, A: 1 }, courses: ['MATH 263', 'COMP 125', 'STAT 203'] },
  ]},

  // =========================================================================
  // 16. Physics
  // =========================================================================
  { major: 'Physics', areas: [
    { name: 'Experimental Physics', desc: 'Laboratory techniques, instrumentation, and data acquisition', riasec: { R: 2, I: 1 }, courses: ['PHYS 235', 'PHYS 236', 'PHYS 301'] },
    { name: 'Theoretical Physics', desc: 'Classical and quantum mechanics, electrodynamics, and field theory', riasec: { I: 3 }, courses: ['PHYS 301', 'PHYS 302', 'PHYS 320'] },
    { name: 'Astrophysics & Cosmology', desc: 'Stellar physics, galaxy formation, and observational astronomy', riasec: { I: 2, A: 1 }, courses: ['PHYS 302', 'PHYS 330', 'PHYS 340'] },
    { name: 'Applied & Engineering Physics', desc: 'Electronics, optics, and physics for industry applications', riasec: { R: 2, I: 2 }, courses: ['PHYS 236', 'PHYS 310', 'PHYS 314'] },
  ]},

  // =========================================================================
  // 17. Physics with Computer Science
  // =========================================================================
  { major: 'Physics with Computer Science', areas: [
    { name: 'Computational Physics', desc: 'Physics simulation, Monte Carlo methods, and high-performance computing', riasec: { I: 2, R: 1 }, courses: ['PHYS 301', 'COMP 264', 'COMP 363'] },
    { name: 'Data-Intensive Physics', desc: 'Big data analysis for particle physics, astrophysics, and sensors', riasec: { I: 2, C: 1 }, courses: ['PHYS 302', 'COMP 353', 'STAT 303'] },
    { name: 'Scientific Software Development', desc: 'Building research tools, visualization software, and lab automation', riasec: { R: 2, I: 1 }, courses: ['COMP 271', 'COMP 330', 'PHYS 236'] },
    { name: 'Quantum Computing', desc: 'Quantum information, qubit simulation, and quantum algorithm design', riasec: { I: 3 }, courses: ['PHYS 320', 'COMP 363', 'MATH 313'] },
  ]},

  // =========================================================================
  // 18. Statistics
  // =========================================================================
  { major: 'Statistics', areas: [
    { name: 'Applied Statistics & Consulting', desc: 'Real-world data analysis, client consulting, and report writing', riasec: { I: 1, E: 1, C: 1 }, courses: ['STAT 303', 'STAT 336', 'STAT 388'] },
    { name: 'Biostatistics', desc: 'Clinical trial design, epidemiology, and public health analytics', riasec: { I: 2, S: 1 }, courses: ['STAT 303', 'STAT 335', 'STAT 351'] },
    { name: 'Mathematical Statistics', desc: 'Probability theory, inference, and asymptotic methods for PhD prep', riasec: { I: 3 }, courses: ['STAT 304', 'STAT 307', 'STAT 308'] },
    { name: 'Computational Statistics', desc: 'Simulation, resampling, Bayesian computing, and machine learning', riasec: { I: 2, R: 1 }, courses: ['STAT 338', 'STAT 340', 'STAT 335'] },
    { name: 'Data Analytics & Visualization', desc: 'Dashboards, exploratory analysis, and business intelligence', riasec: { C: 2, A: 1 }, courses: ['STAT 336', 'STAT 303', 'STAT 388'] },
  ]},

  // =========================================================================
  // 19. Theoretical Physics and Applied Mathematics
  // =========================================================================
  { major: 'Theoretical Physics and Applied Mathematics', areas: [
    { name: 'Mathematical Physics', desc: 'Group theory, differential geometry, and physics formalism', riasec: { I: 3 }, courses: ['PHYS 320', 'MATH 305', 'MATH 314'] },
    { name: 'Quantum Theory', desc: 'Quantum mechanics, quantum field theory, and foundational questions', riasec: { I: 3 }, courses: ['PHYS 320', 'PHYS 302', 'MATH 306'] },
    { name: 'Nonlinear Dynamics & Chaos', desc: 'Dynamical systems, pattern formation, and complex systems', riasec: { I: 2, A: 1 }, courses: ['MATH 264', 'MATH 309', 'PHYS 301'] },
    { name: 'Cosmology & Relativity', desc: 'General relativity, cosmological models, and spacetime geometry', riasec: { I: 3, A: 1 }, courses: ['PHYS 302', 'PHYS 330', 'MATH 305'] },
    { name: 'Computational Methods', desc: 'Numerical PDE solvers, simulations, and scientific computing', riasec: { I: 2, R: 1 }, courses: ['MATH 351', 'MATH 309', 'COMP 271'] },
  ]},
];

// =============================================================================
// SEED LOGIC (same pattern as seed-riasec.js)
// =============================================================================

async function seed() {
  const database = await db.initDb();

  // Helper to find program ID by name — prefer exact match, then partial
  function findProgram(name) {
    const exact = database.prepare('SELECT id FROM programs WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1');
    exact.bind([name, 'major']);
    let id = null;
    if (exact.step()) {
      id = exact.getAsObject().id;
    }
    exact.free();
    if (id) return id;

    const partial = database.prepare('SELECT id FROM programs WHERE LOWER(name) LIKE LOWER(?) AND type = ? LIMIT 1');
    partial.bind([`%${name}%`, 'major']);
    if (partial.step()) {
      id = partial.getAsObject().id;
    }
    partial.free();
    return id;
  }

  console.log('Seeding STEM focus areas (batch 2)...');
  let areasInserted = 0;

  for (const { major, areas } of batch2) {
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

    console.log(`  ${major}: ${areas.length} focus areas`);
  }

  console.log(`\nInserted ${areasInserted} focus areas across ${batch2.length} STEM majors.`);

  // Save
  db.save();
  db.close();
  console.log('Done! STEM focus area data seeded successfully.');
}

seed().catch(console.error);
