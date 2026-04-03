// =============================================================================
// STEM Programs — College of Arts and Sciences
// Loyola University Chicago (catalog.luc.edu)
//
// Researched 2026-03-31
//
// Courses marked [NEW] are NOT already in Database.js.
// Courses without a tag already exist in Database.js.
// =============================================================================

export const STEM_PROGRAMS = {

  // ===========================================================================
  // 1. Biochemistry BS
  //    Total major credit hours: 73
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/chemistry-biochemistry/biochemistry-bs/
  // ===========================================================================
  'Biochemistry BS': {
    totalCredits: 73,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Math prerequisite: students not placing into MATH 118 or higher cannot start the Chemistry sequence until MATH 117 is completed with C- or better.',
    requirements: {
      chemistryRequired: [
        { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
        { code: 'CHEM 161', name: 'Chemical Structure and Properties Laboratory' },
        { code: 'CHEM 180', name: 'Chemical Reactivity I' },
        { code: 'CHEM 181', name: 'Chemical Reactivity I Lab' },
        { code: 'CHEM 240', name: 'Chemical Reactivity II' },
        { code: 'CHEM 242', name: 'Chemical Synthesis Laboratory', isNew: true },             // [NEW]
        { code: 'CHEM 260', name: 'Quantitative Methods in Chemistry', isNew: true },         // [NEW]
        { code: 'CHEM 272', name: 'Analytical Chemistry Laboratory', isNew: true },           // [NEW]
        { code: 'CHEM 305', name: 'Physical Biochemistry for the Biological Sciences', isNew: true }, // [NEW]
        { code: 'CHEM 306', name: 'Physical Biochemistry Lab', isNew: true },                 // [NEW]
        { code: 'CHEM 307', name: 'Inorganic Chemistry', isNew: true },                       // [NEW]
        { code: 'CHEM 370', name: 'Biochemistry I', isNew: true },                            // [NEW]
        { code: 'CHEM 371', name: 'Biochemistry II', isNew: true },                           // [NEW]
        { code: 'CHEM 372', name: 'Biochemistry Laboratory I', isNew: true },                 // [NEW]
        { code: 'CHEM 373', name: 'Biochemistry Laboratory II', isNew: true },                // [NEW]
      ],
      biochemistryElectives_chooseTwo: {
        note: 'Choose 2: one must be a Focus Elective, the other can be any from either list',
        focusElectives: [
          { code: 'CHEM 365', name: 'Proteomics', isNew: true },                              // [NEW]
          { code: 'CHEM 385', name: 'Advanced Enzyme Kinetics and Mechanisms', isNew: true },  // [NEW]
          { code: 'CHEM 386', name: 'The Chemistry of Enzymes', isNew: true },                 // [NEW]
          { code: 'CHEM 387', name: 'Plant Biochemistry', isNew: true },                       // [NEW]
          { code: 'CHEM 388', name: 'Biophysical Chemistry', isNew: true },                    // [NEW]
        ],
        additionalElectives: [
          { code: 'CHEM 323', name: 'Medicinal Chemistry', isNew: true },                     // [NEW]
          { code: 'CHEM 396', name: 'Special Topics in Biochemistry', isNew: true },           // [NEW]
          { code: 'BIOL 380', name: 'Biology Elective', isNew: true },                        // [NEW]
          { code: 'BIOL 382', name: 'Biology Elective', isNew: true },                        // [NEW]
          { code: 'BIOL 388', name: 'Bioinformatics', isNew: true },                          // [NEW]
          { code: 'BIOL 389', name: 'Biology Elective', isNew: true },                        // [NEW]
        ],
      },
      physicsRequired: [
        { code: 'PHYS 111', name: 'College Physics I' },
        { code: 'PHYS 111L', name: 'College Physics I Lab' },
        { code: 'PHYS 112', name: 'College Physics II' },
        { code: 'PHYS 112L', name: 'College Physics II Lab' },
      ],
      mathematicsRequired: [
        { code: 'MATH 131', name: 'Applied Calculus I', note: 'or MATH 161 Calculus I' },
        { code: 'MATH 132', name: 'Applied Calculus II', note: 'or MATH 162 Calculus II' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
      ],
      biologyRequired: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'BIOL 102', name: 'General Biology II' },
        { code: 'BIOL 112', name: 'General Biology II Lab' },
        { code: 'BIOL 251', name: 'Cell Biology' },
        { code: 'BIOL 282', name: 'Genetics' },
        { code: 'BIOL 283', name: 'Genetics Laboratory', isNew: true },                      // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 2. Bioinformatics BS
  //    Total major credit hours: 60
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/bioinformatics/bioinformatics-bs/
  // ===========================================================================
  'Bioinformatics BS': {
    totalCredits: 60,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: '120 credit hours required for graduation. Research credit (1-4 hrs) required via BIOI 397/398/399.',
    requirements: {
      biologyFundamentals: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 282', name: 'Genetics' },
        { code: 'BIOL 283', name: 'Genetics Laboratory', isNew: true },                      // [NEW]
      ],
      chemistryFundamentals: [
        { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
        { code: 'CHEM 180', name: 'Chemical Reactivity I' },
        { code: 'CHEM 240', name: 'Chemical Reactivity II' },
        { code: 'CHEM 260', name: 'Quantitative Methods in Chemistry', isNew: true },         // [NEW]
        { code: 'CHEM 361', name: 'Principles of Biochemistry', isNew: true },                // [NEW]
      ],
      computerScienceFundamentals: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'MATH 215', name: 'Object-Oriented Programming with Mathematics', isNew: true }, // [NEW]
        { code: 'COMP 231', name: 'Data Structures & Algorithms for Informatics', isNew: true }, // [NEW]
      ],
      mathStatisticsFundamentals: [
        { code: 'MATH 131', name: 'Applied Calculus I' },
        { code: 'MATH 132', name: 'Applied Calculus II' },
        { code: 'STAT 335', name: 'Introduction to Biostatistics', isNew: true },             // [NEW]
      ],
      bioinformaticsCore: [
        { code: 'BIOL 387', name: 'Genomics', isNew: true, note: 'or BIOL 392 Metagenomics' }, // [NEW]
        { code: 'BIOL 388', name: 'Bioinformatics', isNew: true },                            // [NEW]
        { code: 'COMP 383', name: 'Computational Biology', isNew: true },                     // [NEW]
        { code: 'STAT 337', name: 'Quantitative Methods in Bioinformatics', isNew: true, note: 'or STAT 336 Advanced Biostatistics' }, // [NEW]
      ],
      bioinformaticsElectives_chooseTwo: [
        { code: 'BIOL 390', name: 'Molecular Biology Laboratory', isNew: true },              // [NEW]
        { code: 'BIOI 365', name: 'Exploring Proteins', isNew: true, note: 'or CHEM 365 Proteomics' }, // [NEW]
        { code: 'COMP 353', name: 'Database Programming', isNew: true, note: 'or COMP 379 Machine Learning' }, // [NEW]
      ],
      bioinformaticsResearch_chooseOne: [
        { code: 'BIOI 397', name: 'Bioinformatics Survey', isNew: true },                     // [NEW]
        { code: 'BIOI 398', name: 'Bioinformatics Internship', isNew: true },                 // [NEW]
        { code: 'BIOI 399', name: 'Bioinformatics Research', isNew: true },                   // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 3. Cybersecurity BS
  //    Total major credit hours: 61-62
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/computer-science/cybersecurity-bs/
  // ===========================================================================
  'Cybersecurity BS': {
    totalCredits: 61,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: '61-62 credit hours for the major depending on calculus choice. Plus University Core and College requirements.',
    requirements: {
      majorRequired: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'COMP 163', name: 'Discrete Structures', note: 'or MATH 201' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 264', name: 'Introduction to Computer Systems' },
        { code: 'COMP 271', name: 'Data Structures I' },
        { code: 'COMP 301', name: 'Introduction to Computer Security', isNew: true },         // [NEW]
        { code: 'COMP 310', name: 'Operating Systems' },
        { code: 'COMP 317', name: 'Social, Legal, and Ethical Issues in Computing' },
        { code: 'COMP 340', name: 'Computer Forensics', isNew: true },                        // [NEW]
        { code: 'COMP 343', name: 'Computer Networks', isNew: true },                         // [NEW]
        { code: 'COMP 347', name: 'Intrusion Detection and Security', isNew: true },          // [NEW]
        { code: 'COMP 348', name: 'Network Security', isNew: true },                          // [NEW]
        { code: 'COMP 349', name: 'Wireless Networking and Security', isNew: true },           // [NEW]
        { code: 'COMP 352', name: 'Computer Vulnerabilities', isNew: true },                   // [NEW]
        { code: 'MATH 131', name: 'Applied Calculus I', note: 'or MATH 161 Calculus I' },
      ],
      practicumCapstone_choose6hrs: [
        { code: 'COMP 312', name: 'Open Source Software Practicum', isNew: true },            // [NEW]
        { code: 'COMP 344', name: 'Computer Forensics Practicum', isNew: true },              // [NEW]
        { code: 'COMP 390', name: 'Broadening Participation in STEM', isNew: true },          // [NEW]
        { code: 'COMP 391', name: 'Internship in Computer Science', isNew: true },            // [NEW]
        { code: 'COMP 398', name: 'Independent Study', isNew: true },                         // [NEW]
      ],
      restrictedElectives_7hrs: {
        note: 'Select 7 credit hours from the following',
        options: [
          { code: 'CJC 354', name: 'Computer Crime and Forensics', isNew: true },             // [NEW]
          { code: 'COMP 272', name: 'Data Structures II' },
          // Plus any 300-level COMP courses
        ],
      },
      freeElective_3hrs: {
        note: 'Select 3 credit hours: COMP 125, COMP 150, or 300-level COMP course',
        options: [
          { code: 'COMP 125', name: 'Visual Information Processing', isNew: true },           // [NEW]
          { code: 'COMP 150', name: 'Introduction to Computing', isNew: true },               // [NEW]
        ],
      },
    },
  },

  // ===========================================================================
  // 4. Data Science BS
  //    Total major credit hours: 59
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/data-science/data-science-bs/
  // ===========================================================================
  'Data Science BS': {
    totalCredits: 59,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Students develop skills in R and Python. Capstone consulting class is a key component.',
    requirements: {
      mathRequired: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 212', name: 'Linear Algebra', isNew: true },                            // [NEW]
      ],
      statisticsRequired: [
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
        { code: 'STAT 308', name: 'Applied Regression Analysis', isNew: true },               // [NEW]
        { code: 'STAT 310', name: 'Categorical Data Analysis', isNew: true },                 // [NEW]
        // Plus 6 credits of STAT 300-level electives (excluding STAT 335 and STAT 337)
      ],
      computerScienceRequired: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'COMP 215', name: 'Object-Oriented Programming with Mathematics', isNew: true, note: 'also listed as MATH 215' }, // [NEW]
        { code: 'COMP 231', name: 'Data Structures & Algorithms for Informatics', isNew: true }, // [NEW]
        { code: 'COMP 353', name: 'Database Programming', isNew: true },                      // [NEW]
        // Plus 6 credits of COMP 300-level electives (excluding COMP 391)
      ],
      dataScienceCore: [
        { code: 'COMP 317', name: 'Social, Legal, and Ethical Issues in Computing' },
        { code: 'DSCI 101', name: 'Fundamentals of Modern Data Science with R', isNew: true }, // [NEW]
        { code: 'STAT 338', name: 'Predictive Analytics', isNew: true, note: 'or COMP 379 Machine Learning' }, // [NEW]
      ],
      capstone: [
        { code: 'COMP 358', name: 'Big Data Analytics', isNew: true },                        // [NEW]
        { code: 'DSCI 399', name: 'Data Science Internship', isNew: true, note: 'or STAT 370 Data Science Consulting' }, // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 5. Engineering: Biomedical Engineering BS
  //    Total major credit hours: 86 (129 total with university core)
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/engineering/biomedical-engineering-bs/
  // ===========================================================================
  'Engineering: Biomedical Engineering BS': {
    totalCredits: 86,
    totalDegreeCredits: 129,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Biomedical engineers blend traditional engineering with biological sciences and medicine. Prepares students for medical device design and FDA processes.',
    requirements: {
      engineeringDesign: [
        { code: 'ENGR 101', name: 'Introduction to Engineering Design', isNew: true },        // [NEW]
        { code: 'ENGR 201', name: 'Experiential Engineering', isNew: true },                  // [NEW]
      ],
      engineeringCore: [
        { code: 'ENGR 102', name: 'Engineering Freshman Seminar', isNew: true },              // [NEW]
        { code: 'ENGR 321', name: 'Electronic Circuits & Devices', isNew: true },             // [NEW]
        { code: 'ENGR 322', name: 'Chemical & Thermal Processes', isNew: true },              // [NEW]
        { code: 'ENGR 323', name: 'Digital Electronic & Computer Engineering', isNew: true }, // [NEW]
        { code: 'ENGR 324', name: 'Mechanics', isNew: true },                                 // [NEW]
        { code: 'ENGR 324L', name: 'Core Engineering Lab', isNew: true },                     // [NEW]
        { code: 'ENGR 325', name: 'Materials Engineering', isNew: true },                      // [NEW]
      ],
      engineeringSystems: [
        { code: 'ENGR 311', name: 'Engineering Systems I', isNew: true },                     // [NEW]
        { code: 'ENGR 312', name: 'Engineering Systems II', isNew: true },                    // [NEW]
        { code: 'ENGR 313', name: 'Engineering Systems III', isNew: true },                   // [NEW]
      ],
      biomedicalSpecialty: [
        { code: 'ENGR 341', name: 'Medical Device Systems', isNew: true },                    // [NEW]
        { code: 'ENGR 341L', name: 'Medical Device Systems Laboratory', isNew: true },        // [NEW]
        { code: 'ENGR 342', name: 'Medical Device Software Development I', isNew: true },     // [NEW]
        { code: 'ENGR 343', name: 'Medical Device Software Development II', isNew: true },    // [NEW]
        { code: 'ENGR 381', name: 'Biomedical Engineering Capstone Design I', isNew: true },  // [NEW]
        { code: 'ENGR 391', name: 'Biomedical Engineering Capstone Design II', isNew: true }, // [NEW]
      ],
      mathematicsAndScience: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'CHEM 171', name: 'General Chemistry', isNew: true },                         // [NEW]
        { code: 'CHEM 173', name: 'General Chemistry Lab', isNew: true },                     // [NEW]
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 266', name: 'Differential Equations and Linear Algebra', isNew: true }, // [NEW]
        { code: 'PHYS 121', name: 'College Physics I with Calculus', isNew: true },           // [NEW]
        { code: 'PHYS 122', name: 'College Physics II with Calculus', isNew: true },          // [NEW]
        { code: 'PHYS 112L', name: 'College Physics Lab II' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
      ],
    },
  },

  // ===========================================================================
  // 6. Engineering: Computer Engineering BS
  //    Total major credit hours: 86 (129 total with university core)
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/engineering/computer-engineering-bs/
  // ===========================================================================
  'Engineering: Computer Engineering BS': {
    totalCredits: 86,
    totalDegreeCredits: 129,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Computer engineers design and integrate hardware and software components, learn about microelectronic chips, circuit boards, networks, and AI.',
    requirements: {
      engineeringDesign: [
        { code: 'ENGR 101', name: 'Introduction to Engineering Design', isNew: true },        // [NEW]
        { code: 'ENGR 201', name: 'Experiential Engineering', isNew: true },                  // [NEW]
      ],
      engineeringCore: [
        { code: 'ENGR 102', name: 'Engineering Freshman Seminar', isNew: true },              // [NEW]
        { code: 'ENGR 321', name: 'Electronic Circuits & Devices', isNew: true },             // [NEW]
        { code: 'ENGR 322', name: 'Chemical & Thermal Processes', isNew: true },              // [NEW]
        { code: 'ENGR 323', name: 'Digital Electronic & Computer Engineering', isNew: true }, // [NEW]
        { code: 'ENGR 324', name: 'Mechanics', isNew: true },                                 // [NEW]
        { code: 'ENGR 324L', name: 'Core Engineering Lab', isNew: true },                     // [NEW]
        { code: 'ENGR 325', name: 'Materials Engineering', isNew: true },                      // [NEW]
      ],
      engineeringSystems: [
        { code: 'ENGR 311', name: 'Engineering Systems I', isNew: true },                     // [NEW]
        { code: 'ENGR 312', name: 'Engineering Systems II', isNew: true },                    // [NEW]
        { code: 'ENGR 313', name: 'Engineering Systems III', isNew: true },                   // [NEW]
      ],
      computerEngineeringSpecialty: [
        { code: 'ENGR 351', name: 'Electronic Circuit Analysis and Design', isNew: true },    // [NEW]
        { code: 'ENGR 351L', name: 'Circuit Design Laboratory', isNew: true },                // [NEW]
        { code: 'ENGR 352', name: 'Methods and Algorithms for Computer Engineers', isNew: true }, // [NEW]
        { code: 'ENGR 353', name: 'Programmable Systems', isNew: true },                      // [NEW]
        { code: 'ENGR 382', name: 'Computer Engineering Capstone Design I', isNew: true },    // [NEW]
        { code: 'ENGR 392', name: 'Computer Engineering Capstone Design II', isNew: true },   // [NEW]
      ],
      mathematicsAndScience: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'CHEM 171', name: 'General Chemistry', isNew: true },                         // [NEW]
        { code: 'CHEM 173', name: 'General Chemistry Lab', isNew: true },                     // [NEW]
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 266', name: 'Differential Equations and Linear Algebra', isNew: true }, // [NEW]
        { code: 'PHYS 121', name: 'College Physics I with Calculus', isNew: true },           // [NEW]
        { code: 'PHYS 122', name: 'College Physics II with Calculus', isNew: true },          // [NEW]
        { code: 'PHYS 112L', name: 'College Physics Lab II' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
      ],
    },
  },

  // ===========================================================================
  // 7. Engineering: Environmental Engineering BS
  //    Total major credit hours: 86 (129 total with university core)
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/engineering/environmental-engineering-bs/
  // ===========================================================================
  'Engineering: Environmental Engineering BS': {
    totalCredits: 86,
    totalDegreeCredits: 129,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Environmental engineers identify, analyze and design solutions to environmental problems, focusing on water, wastewater, air quality, and solids.',
    requirements: {
      engineeringDesign: [
        { code: 'ENGR 101', name: 'Introduction to Engineering Design', isNew: true },        // [NEW]
        { code: 'ENGR 201', name: 'Experiential Engineering', isNew: true },                  // [NEW]
      ],
      engineeringCore: [
        { code: 'ENGR 102', name: 'Engineering Freshman Seminar', isNew: true },              // [NEW]
        { code: 'ENGR 321', name: 'Electronic Circuits & Devices', isNew: true },             // [NEW]
        { code: 'ENGR 322', name: 'Chemical & Thermal Processes', isNew: true },              // [NEW]
        { code: 'ENGR 323', name: 'Digital Electronic & Computer Engineering', isNew: true }, // [NEW]
        { code: 'ENGR 324', name: 'Mechanics', isNew: true },                                 // [NEW]
        { code: 'ENGR 324L', name: 'Core Engineering Lab', isNew: true },                     // [NEW]
        { code: 'ENGR 325', name: 'Materials Engineering', isNew: true },                      // [NEW]
      ],
      engineeringSystems: [
        { code: 'ENGR 311', name: 'Engineering Systems I', isNew: true },                     // [NEW]
        { code: 'ENGR 312', name: 'Engineering Systems II', isNew: true },                    // [NEW]
        { code: 'ENGR 313', name: 'Engineering Systems III', isNew: true },                   // [NEW]
      ],
      environmentalSpecialty: [
        { code: 'ENGR 361', name: 'Fundamentals of Environmental Engineering', isNew: true }, // [NEW]
        { code: 'ENGR 361L', name: 'Fundamentals of Environmental Engineering Lab', isNew: true }, // [NEW]
        { code: 'ENGR 362', name: 'Water & Wastewater Engineering', isNew: true },            // [NEW]
        { code: 'ENGR 363', name: 'Contemporary Environmental Engineering Challenges', isNew: true }, // [NEW]
        { code: 'ENGR 383', name: 'Environmental Engineering Capstone Design I', isNew: true }, // [NEW]
        { code: 'ENGR 393', name: 'Environmental Engineering Capstone Design II', isNew: true }, // [NEW]
      ],
      mathematicsAndScience: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'CHEM 171', name: 'General Chemistry', isNew: true },                         // [NEW]
        { code: 'CHEM 173', name: 'General Chemistry Lab', isNew: true },                     // [NEW]
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 266', name: 'Differential Equations and Linear Algebra', isNew: true }, // [NEW]
        { code: 'PHYS 121', name: 'College Physics I with Calculus', isNew: true },           // [NEW]
        { code: 'PHYS 122', name: 'College Physics II with Calculus', isNew: true },          // [NEW]
        { code: 'PHYS 112L', name: 'College Physics Lab II' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
      ],
    },
  },

  // ===========================================================================
  // 8. Forensic Science BS
  //    Total major credit hours: 86-88
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/forensic-science/forensic-science-bs/
  // ===========================================================================
  'Forensic Science BS': {
    totalCredits: 86,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Fully accredited by FEPAC. 86-88 credit hours. Covers pattern, biology-DNA, and chemistry tracks. Math prerequisite same as Biochemistry.',
    requirements: {
      laboratoryScienceCourses: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'BIOL 102', name: 'General Biology II' },
        { code: 'BIOL 112', name: 'General Biology II Lab' },
        { code: 'BIOL 282', name: 'Genetics' },
        { code: 'BIOL 283', name: 'Genetics Laboratory', isNew: true },                      // [NEW]
        { code: 'BIOL 366', name: 'Cell Physiology & Biochemistry', isNew: true, note: 'or CHEM 361' }, // [NEW]
        { code: 'BIOL 366L', name: 'Cell Physiology & Biochemistry Lab', isNew: true },       // [NEW]
        { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
        { code: 'CHEM 161', name: 'Chemical Structure and Properties Laboratory' },
        { code: 'CHEM 180', name: 'Chemical Reactivity I' },
        { code: 'CHEM 181', name: 'Chemical Reactivity I Lab' },
        { code: 'CHEM 240', name: 'Chemical Reactivity II' },
        { code: 'CHEM 241', name: 'Chemical Reactivity II Laboratory' },
        { code: 'CHEM 260', name: 'Quantitative Methods in Chemistry', isNew: true },         // [NEW]
        { code: 'CHEM 272', name: 'Analytical Chemistry Laboratory', isNew: true },           // [NEW]
        { code: 'CHEM 280', name: 'Environmental & Chemical Analysis', isNew: true },         // [NEW]
        { code: 'PHYS 111', name: 'College Physics I' },
        { code: 'PHYS 111L', name: 'College Physics I Lab' },
        { code: 'PHYS 112', name: 'College Physics II' },
        { code: 'PHYS 112L', name: 'College Physics II Lab' },
      ],
      forensicScienceAndCriminalJustice: [
        { code: 'CJC 101', name: 'Criminal Justice in a Global Context' },
        { code: 'FRSC 340', name: 'Introduction to Forensic Science', isNew: true },          // [NEW]
        { code: 'FRSC 341', name: 'Forensic Ethics and Professional Practice', isNew: true }, // [NEW]
        { code: 'FRSC 342', name: 'Expert Witness Testimony and Court Room Demeanor', isNew: true }, // [NEW]
        { code: 'FRSC 343', name: 'Physical Organic Chemistry for Forensic Science', isNew: true }, // [NEW]
        { code: 'FRSC 350', name: 'Pattern Evidence I', isNew: true },                        // [NEW]
        { code: 'FRSC 350L', name: 'Pattern Evidence I Lab', isNew: true },                   // [NEW]
        { code: 'FRSC 360', name: 'Forensic Drug Chemistry I', isNew: true },                 // [NEW]
        { code: 'FRSC 360L', name: 'Forensic Drug Chemistry I Lab', isNew: true },            // [NEW]
        { code: 'FRSC 370', name: 'Forensic Biology', isNew: true },                          // [NEW]
        { code: 'FRSC 370L', name: 'Forensic Biology Lab', isNew: true },                     // [NEW]
      ],
      forensicCapstone_chooseOne: [
        { code: 'FRSC 361', name: 'Forensic Toxicology I', isNew: true },                     // [NEW]
        { code: 'FRSC 361L', name: 'Forensic Toxicology I Lab', isNew: true },                // [NEW]
        { code: 'FRSC 371', name: 'Forensic Molecular Biology', isNew: true },                // [NEW]
        { code: 'ANTH 396', name: 'Internship in Anthropology', isNew: true },                // [NEW]
      ],
      ancillaryCourses: [
        { code: 'MATH 131', name: 'Applied Calculus I' },
        { code: 'MATH 132', name: 'Applied Calculus II' },
        { code: 'STAT 335', name: 'Introduction to Biostatistics', isNew: true, note: 'or BIOL 335' }, // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 9. Applied Mathematics BS
  //    Total major credit hours: 55-58
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/mathematics-statistics/applied-mathematics-bs/
  // ===========================================================================
  'Applied Mathematics BS': {
    totalCredits: 55,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: '55-58 credit hours depending on CS sequence chosen. At least 21 credits must be completed at Loyola. Waivers for Quantitative and Scientific core.',
    requirements: {
      calculusSequence: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true, note: 'or MATH 162A' },         // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true, note: 'or MATH 263A' }, // [NEW]
      ],
      coreMathematics: [
        { code: 'MATH 201', name: 'Introduction to Discrete Mathematics & Number Theory', isNew: true }, // [NEW]
        { code: 'MATH 212', name: 'Linear Algebra', isNew: true },                            // [NEW]
        { code: 'MATH 264', name: 'Ordinary Differential Equations', isNew: true },           // [NEW]
      ],
      physicsRequired: [
        { code: 'PHYS 121', name: 'College Physics I with Calculus', isNew: true },           // [NEW]
        { code: 'PHYS 111L', name: 'College Physics Laboratory I' },
      ],
      computerScience_chooseOneSequence: {
        note: 'Choose one CS sequence',
        optionA: [
          { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
          { code: 'COMP 271', name: 'Data Structures I' },
          { code: 'COMP 272', name: 'Data Structures II' },
        ],
        optionB: [
          { code: 'MATH 215', name: 'Object-Oriented Programming with Mathematics', isNew: true }, // [NEW]
          { code: 'COMP 231', name: 'Data Structures & Algorithms for Informatics', isNew: true }, // [NEW]
        ],
      },
      additionalScience_chooseOne: {
        note: 'Select one 3-credit science course',
        options: [
          { code: 'BIOL 101', name: 'General Biology I' },
          { code: 'BIOL 102', name: 'General Biology II' },
          { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
          { code: 'PHYS 122', name: 'College Physics II with Calculus', isNew: true },        // [NEW]
        ],
      },
      statistics_chooseOnePair: {
        note: 'Choose one pair of statistics courses',
        optionA: [
          { code: 'MATH 304', name: 'Introduction to Probability', isNew: true },             // [NEW]
          { code: 'MATH 305', name: 'Introduction to Mathematical Statistics', isNew: true },  // [NEW]
        ],
        optionB: [
          { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
          { code: 'STAT 308', name: 'Applied Regression Analysis', isNew: true },             // [NEW]
        ],
      },
      requiredAppliedMath: [
        { code: 'MATH 309', name: 'Numerical Methods', isNew: true },                         // [NEW]
        { code: 'MATH 356', name: 'Introduction to Mathematical Modeling', isNew: true },     // [NEW]
      ],
      appliedMathElectives_chooseTwo: [
        { code: 'MATH 318', name: 'Applied Mathematics Elective', isNew: true },              // [NEW]
        { code: 'MATH 331', name: 'Cryptography', isNew: true },                              // [NEW]
        { code: 'MATH 345', name: 'Applied Math Elective', isNew: true, note: 'or STAT 388' }, // [NEW]
        { code: 'MATH 358', name: 'Applied Math Elective', isNew: true },                     // [NEW]
        { code: 'MATH 360', name: 'Applied Math Elective', isNew: true },                     // [NEW]
        { code: 'MATH 365', name: 'Applied Math Elective', isNew: true },                     // [NEW]
        { code: 'MATH 366', name: 'Applied Math Elective', isNew: true },                     // [NEW]
        { code: 'MATH 388', name: 'Applied Math Elective', isNew: true },                     // [NEW]
        { code: 'STAT 321', name: 'Computational Aspects of Modeling and Simulation', isNew: true }, // [NEW]
      ],
      generalUpperLevelElective: {
        note: '3 credit hours of any 300-level MATH or approved 300-level STAT course',
      },
    },
  },

  // ===========================================================================
  // 10. Statistics BS
  //     Total major credit hours: 48
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/mathematics-statistics/statistics-bs/
  // ===========================================================================
  'Statistics BS': {
    totalCredits: 48,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Waivers for both Quantitative and Scientific core. Schedule depends heavily on initial math placement (MATH 100 to MATH 263).',
    requirements: {
      mathematicsFoundation: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 212', name: 'Linear Algebra', isNew: true },                            // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
      ],
      statisticsCore: [
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics', note: 'or STAT 335 Introduction to Biostatistics' },
        { code: 'STAT 303', name: 'SAS Programming & Applied Statistics', isNew: true },      // [NEW]
        { code: 'STAT 304', name: 'Introduction to Probability', isNew: true },               // [NEW]
        { code: 'STAT 305', name: 'Introduction to Mathematical Statistics', isNew: true },    // [NEW]
        { code: 'STAT 307', name: 'Statistical Design & Analysis of Experiments', isNew: true }, // [NEW] (capstone)
        { code: 'STAT 308', name: 'Applied Regression Analysis', isNew: true },               // [NEW]
      ],
      scienceRequirement_chooseTwo: {
        note: 'Select two courses (6 credit hours) from sciences',
        options: [
          { code: 'BIOL 101', name: 'General Biology I' },
          { code: 'BIOL 102', name: 'General Biology II' },
          { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
          { code: 'PHYS 121', name: 'College Physics I with Calculus', isNew: true },         // [NEW]
          // Other science options available
        ],
      },
      electives_chooseThree: {
        note: '9 credit hours from advanced statistics courses',
        options: [
          { code: 'STAT 310', name: 'Categorical Data Analysis', isNew: true },               // [NEW]
          { code: 'STAT 321', name: 'Computational Aspects of Modeling and Simulation', isNew: true }, // [NEW]
          { code: 'STAT 335', name: 'Introduction to Biostatistics', isNew: true },            // [NEW]
          { code: 'STAT 336', name: 'Advanced Biostatistics', isNew: true },                   // [NEW]
          { code: 'STAT 337', name: 'Quantitative Methods in Bioinformatics', isNew: true },   // [NEW]
          { code: 'STAT 338', name: 'Predictive Analytics', isNew: true },                     // [NEW]
          // Other 300-level STAT courses available
        ],
      },
    },
  },

  // ===========================================================================
  // 11. Mathematics BS
  //     Total major credit hours: 51
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/mathematics-statistics/mathematics-bs/
  // ===========================================================================
  'Mathematics BS': {
    totalCredits: 51,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Waivers for both Quantitative and Scientific core. Schedule depends on initial math placement.',
    requirements: {
      foundationalRequirements: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 201', name: 'Introduction to Discrete Mathematics & Number Theory', isNew: true }, // [NEW]
        { code: 'MATH 212', name: 'Linear Algebra', isNew: true },                            // [NEW]
        { code: 'MATH 215', name: 'Object-Oriented Programming with Mathematics', isNew: true, note: 'or COMP 170' }, // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 264', name: 'Ordinary Differential Equations', isNew: true },           // [NEW]
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics', note: 'or MATH 304/STAT 304' },
      ],
      modernAlgebra_chooseOneSequence: {
        note: 'Select one 2-course sequence (6 credits)',
        optionA: [
          { code: 'MATH 313', name: 'Abstract Algebra', isNew: true },                        // [NEW]
          { code: 'MATH 314', name: 'Advanced Topics Abstract Algebra', isNew: true },         // [NEW]
        ],
        optionB: [
          { code: 'MATH 313', name: 'Abstract Algebra', isNew: true },                        // [NEW]
          { code: 'MATH 315', name: 'Advanced Topics in Linear Algebra', isNew: true },        // [NEW]
        ],
      },
      analysis_chooseOneSequence: {
        note: 'Select one 2-course sequence (6 credits)',
        optionA: [
          { code: 'MATH 351', name: 'Introduction to Real Analysis I', isNew: true },         // [NEW]
          { code: 'MATH 352', name: 'Introduction to Real Analysis II', isNew: true },         // [NEW]
        ],
        optionB: [
          { code: 'MATH 351', name: 'Introduction to Real Analysis I', isNew: true },         // [NEW]
          { code: 'MATH 353', name: 'Introduction to Complex Analysis', isNew: true },         // [NEW]
        ],
      },
      upperDivisionElectives: {
        note: 'Two 300-level mathematics electives (6 credits)',
      },
      scienceRequirement: {
        note: 'Two courses (6 credits) from biology, chemistry, environmental science, physics, or anthropology',
      },
    },
  },

  // ===========================================================================
  // 12. Mathematics and Computer Science BS
  //     Total major credit hours: 60
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/mathematics-statistics/mathematics-computer-science-bs/
  // ===========================================================================
  'Mathematics and Computer Science BS': {
    totalCredits: 60,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Combined major in both mathematics and computer science.',
    requirements: {
      mathRequired: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 201', name: 'Introduction to Discrete Mathematics & Number Theory', isNew: true }, // [NEW]
        { code: 'MATH 212', name: 'Linear Algebra', isNew: true },                            // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 264', name: 'Ordinary Differential Equations', isNew: true },           // [NEW]
        { code: 'MATH 313', name: 'Abstract Algebra', isNew: true },                          // [NEW]
        { code: 'MATH 351', name: 'Introduction to Real Analysis I', isNew: true },           // [NEW]
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics', note: 'or MATH 304/STAT 304' },
      ],
      mathElectives_chooseTwo: {
        note: '6 credit hours selected from the following',
        options: [
          { code: 'MATH 309', name: 'Numerical Methods', isNew: true },                       // [NEW]
          { code: 'MATH 314', name: 'Advanced Topics Abstract Algebra', isNew: true },         // [NEW]
          { code: 'MATH 315', name: 'Advanced Topics in Linear Algebra', isNew: true },        // [NEW]
          { code: 'MATH 318', name: 'Mathematics Elective', isNew: true },                     // [NEW]
          { code: 'MATH 331', name: 'Cryptography', isNew: true },                            // [NEW]
          { code: 'MATH 352', name: 'Introduction to Real Analysis II', isNew: true },         // [NEW]
          { code: 'MATH 353', name: 'Introduction to Complex Analysis', isNew: true },         // [NEW]
          { code: 'MATH 356', name: 'Introduction to Mathematical Modeling', isNew: true },    // [NEW]
          { code: 'MATH 358', name: 'Mathematics Elective', isNew: true },                     // [NEW]
          { code: 'MATH 365', name: 'Mathematics Elective', isNew: true },                     // [NEW]
          { code: 'MATH 366', name: 'Mathematics Elective', isNew: true },                     // [NEW]
          { code: 'MATH 386', name: 'Mathematics Elective', isNew: true },                     // [NEW]
        ],
      },
      computerScienceRequired: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 264', name: 'Introduction to Computer Systems' },
        { code: 'COMP 271', name: 'Data Structures I' },
        { code: 'COMP 272', name: 'Data Structures II' },
        { code: 'COMP 363', name: 'Design and Analysis Computer Algorithms' },
      ],
      csElectives_chooseTwo: {
        note: '6 credit hours selected from the following',
        options: [
          { code: 'BIOL 388', name: 'Bioinformatics', isNew: true },                          // [NEW]
          { code: 'MATH 328', name: 'Algebraic Coding Theory', isNew: true },                 // [NEW]
          { code: 'MATH 331', name: 'Cryptography', isNew: true },                            // [NEW]
          { code: 'STAT 321', name: 'Computational Aspects of Modeling and Simulation', isNew: true }, // [NEW]
          // Any 300-level COMP course
        ],
      },
    },
  },

  // ===========================================================================
  // 13. Physics BS
  //     Total major credit hours: 56
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/physics/physics-bs/
  // ===========================================================================
  'Physics BS': {
    totalCredits: 56,
    totalDegreeCredits: 120,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Grade of C- or better required in all physics courses. 120 total hours for degree.',
    requirements: {
      physicsCore: [
        { code: 'PHYS 121', name: 'College Physics I with Calculus Lecture/Discussion', isNew: true }, // [NEW]
        { code: 'PHYS 111L', name: 'College Physics Laboratory I' },
        { code: 'PHYS 122', name: 'College Physics II with Calculus Lecture/Discussion', isNew: true }, // [NEW]
        { code: 'PHYS 112L', name: 'College Physics Lab II' },
        { code: 'PHYS 126F', name: 'Freshman Projects', isNew: true },                        // [NEW]
        { code: 'PHYS 130', name: 'Introduction to Computational Physics', isNew: true },     // [NEW]
        { code: 'PHYS 235', name: 'Modern Physics', isNew: true },                            // [NEW]
        { code: 'PHYS 235L', name: 'Modern Physics Laboratory', isNew: true },                // [NEW]
        { code: 'PHYS 301', name: 'Mathematical Methods in Physics', isNew: true },           // [NEW]
        { code: 'PHYS 303', name: 'Electronics I', isNew: true },                             // [NEW]
        { code: 'PHYS 303L', name: 'Electronics Laboratory', isNew: true },                   // [NEW]
        { code: 'PHYS 310', name: 'Optics', isNew: true },                                    // [NEW]
        { code: 'PHYS 310L', name: 'Optics Lab', isNew: true },                               // [NEW]
        { code: 'PHYS 314', name: 'Theoretical Mechanics I', isNew: true },                   // [NEW]
        { code: 'PHYS 328', name: 'Thermal Physical & Statistical Mechanics', isNew: true },  // [NEW]
        { code: 'PHYS 338', name: 'Advanced Physics Laboratory', isNew: true },               // [NEW]
        { code: 'PHYS 351', name: 'Electricity and Magnetism I', isNew: true },               // [NEW]
        { code: 'PHYS 361', name: 'Quantum Mechanics I', isNew: true },                       // [NEW]
      ],
      mathematicsRequired: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 264', name: 'Ordinary Differential Equations', isNew: true },           // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 14. Physics with Computer Science BS
  //     Total major credit hours: 75
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/physics/physics-computer-science-bs/
  // ===========================================================================
  'Physics with Computer Science BS': {
    totalCredits: 75,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Preparation for graduate study in physics, applied physics, computer science, computational physics, or engineering. Similar to Theoretical Physics/Applied Math option with CS replacing some math.',
    requirements: {
      physicsCourses: [
        { code: 'PHYS 121', name: 'College Physics I with Calculus Lecture/Discussion', isNew: true }, // [NEW]
        { code: 'PHYS 111L', name: 'College Physics Laboratory I' },
        { code: 'PHYS 122', name: 'College Physics II with Calculus Lecture/Discussion', isNew: true }, // [NEW]
        { code: 'PHYS 112L', name: 'College Physics Lab II' },
        { code: 'PHYS 126F', name: 'Freshman Projects', isNew: true },                        // [NEW]
        { code: 'PHYS 235', name: 'Modern Physics', isNew: true },                            // [NEW]
        { code: 'PHYS 235L', name: 'Modern Physics Laboratory', isNew: true },                // [NEW]
        { code: 'PHYS 301', name: 'Mathematical Methods in Physics', isNew: true },           // [NEW]
        { code: 'PHYS 303', name: 'Electronics I', isNew: true },                             // [NEW]
        { code: 'PHYS 303L', name: 'Electronics Laboratory', isNew: true },                   // [NEW]
        { code: 'PHYS 310', name: 'Optics', isNew: true },                                    // [NEW]
        { code: 'PHYS 310L', name: 'Optics Lab', isNew: true },                               // [NEW]
        { code: 'PHYS 314', name: 'Theoretical Mechanics I', isNew: true },                   // [NEW]
        { code: 'PHYS 351', name: 'Electricity and Magnetism I', isNew: true },               // [NEW]
        { code: 'PHYS 361', name: 'Quantum Mechanics I', isNew: true },                       // [NEW]
      ],
      mathematicsRequired: [
        { code: 'MATH 161', name: 'Calculus I', isNew: true },                                // [NEW]
        { code: 'MATH 162', name: 'Calculus II', isNew: true },                               // [NEW]
        { code: 'MATH 263', name: 'Multivariable Calculus', isNew: true },                    // [NEW]
        { code: 'MATH 264', name: 'Ordinary Differential Equations', isNew: true },           // [NEW]
      ],
      computerScienceRequired: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 264', name: 'Introduction to Computer Systems' },
        { code: 'COMP 271', name: 'Data Structures I' },
        { code: 'COMP 272', name: 'Data Structures II' },
      ],
      csDiscrete_chooseOne: [
        { code: 'COMP 163', name: 'Discrete Structures' },
        { code: 'MATH 201', name: 'Introduction to Discrete Mathematics & Number Theory', isNew: true }, // [NEW]
      ],
      csAlgorithm_chooseOne: [
        { code: 'COMP 313', name: 'Object-Oriented Design', isNew: true },                    // [NEW]
        { code: 'COMP 363', name: 'Design and Analysis Computer Algorithms' },
      ],
      electives_chooseTwo: {
        note: 'Select 2 elective courses from the following',
        options: [
          { code: 'BIOL 388', name: 'Bioinformatics', isNew: true },                          // [NEW]
          { code: 'BIOL 392', name: 'Metagenomics', isNew: true },                            // [NEW]
          { code: 'MATH 309', name: 'Numerical Methods', isNew: true },                       // [NEW]
          { code: 'MATH 328', name: 'Algebraic Coding Theory', isNew: true },                 // [NEW]
          { code: 'MATH 331', name: 'Cryptography', isNew: true },                            // [NEW]
          { code: 'PHYS 328', name: 'Thermal Physical & Statistical Mechanics', isNew: true }, // [NEW]
          { code: 'PHYS 338', name: 'Advanced Physics Laboratory', isNew: true },             // [NEW]
          { code: 'STAT 321', name: 'Computational Aspects of Modeling and Simulation', isNew: true }, // [NEW]
          // Plus any 300-level COMP course
        ],
      },
    },
  },

  // ===========================================================================
  // 15. Information Technology BS
  //     Total major credit hours: 49
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/computer-science/information-technology-bs/
  // ===========================================================================
  'Information Technology BS': {
    totalCredits: 49,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Focuses on planning, designing, implementing, and administering voice and data communication networks.',
    requirements: {
      statistics_chooseOne: [
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
        { code: 'ISSCM 241', name: 'Business Statistics' },
        { code: 'PSYC 304', name: 'Statistics' },
      ],
      coreComputing: [
        { code: 'COMP 141', name: 'Introduction to Computing Tools and Techniques' },
        { code: 'COMP 163', name: 'Discrete Structures' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 251', name: 'Introduction to Database Systems', isNew: true },          // [NEW]
        { code: 'COMP 264', name: 'Introduction to Computer Systems', note: 'or COMP 271 Data Structures I' },
        { code: 'COMP 301', name: 'Introduction to Computer Security', isNew: true },         // [NEW]
        { code: 'COMP 317', name: 'Social, Legal, and Ethical Issues in Computing' },
        { code: 'COMP 377', name: 'IT Project Management', isNew: true, note: 'or ISSCM 349 Project Management' }, // [NEW]
      ],
      databaseDataElectives_choose6hrs: [
        { code: 'COMP 305', name: 'Database Administration', isNew: true },                   // [NEW]
        { code: 'COMP 306', name: 'Data Mining', isNew: true },                               // [NEW]
        { code: 'COMP 343', name: 'Computer Networks', isNew: true },                         // [NEW]
        { code: 'COMP 353', name: 'Database Programming', isNew: true },                      // [NEW]
      ],
      practicumCapstone_choose6hrs: [
        { code: 'COMP 312', name: 'Open Source Software Practicum', isNew: true },            // [NEW]
        { code: 'COMP 390', name: 'Broadening Participation in STEM', isNew: true },          // [NEW]
        { code: 'COMP 391', name: 'Internship in Computer Science', isNew: true },            // [NEW]
        { code: 'COMP 398', name: 'Independent Study', isNew: true },                         // [NEW]
      ],
      electives: {
        note: '10 credit hours of general electives',
      },
    },
  },
};

// =============================================================================
// Summary of ALL NEW course codes (not in Database.js)
// =============================================================================
// ANTH: ANTH 396
// BIOL: BIOL 283, BIOL 366, BIOL 366L, BIOL 380, BIOL 382, BIOL 387, BIOL 388,
//       BIOL 389, BIOL 390, BIOL 392
// BIOI: BIOI 365, BIOI 397, BIOI 398, BIOI 399
// CHEM: CHEM 171, CHEM 173, CHEM 242, CHEM 260, CHEM 272, CHEM 280, CHEM 305,
//       CHEM 306, CHEM 307, CHEM 323, CHEM 361, CHEM 365, CHEM 370, CHEM 371,
//       CHEM 372, CHEM 373, CHEM 385, CHEM 386, CHEM 387, CHEM 388, CHEM 396
// CJC:  CJC 354
// COMP: COMP 125, COMP 150, COMP 215, COMP 231, COMP 251, COMP 301, COMP 305,
//       COMP 306, COMP 312, COMP 313, COMP 340, COMP 343, COMP 344, COMP 347,
//       COMP 348, COMP 349, COMP 352, COMP 353, COMP 358, COMP 377, COMP 379,
//       COMP 383, COMP 390, COMP 391, COMP 398
// DSCI: DSCI 101, DSCI 399
// ENGR: ENGR 101, ENGR 102, ENGR 201, ENGR 311, ENGR 312, ENGR 313, ENGR 321,
//       ENGR 322, ENGR 323, ENGR 324, ENGR 324L, ENGR 325, ENGR 341, ENGR 341L,
//       ENGR 342, ENGR 343, ENGR 351, ENGR 351L, ENGR 352, ENGR 353, ENGR 361,
//       ENGR 361L, ENGR 362, ENGR 363, ENGR 381, ENGR 382, ENGR 383, ENGR 391,
//       ENGR 392, ENGR 393
// FRSC: FRSC 340, FRSC 341, FRSC 342, FRSC 343, FRSC 350, FRSC 350L, FRSC 360,
//       FRSC 360L, FRSC 361, FRSC 361L, FRSC 370, FRSC 370L, FRSC 371
// MATH: MATH 161, MATH 162, MATH 201, MATH 212, MATH 215, MATH 263, MATH 264,
//       MATH 266, MATH 304, MATH 305, MATH 309, MATH 313, MATH 314, MATH 315,
//       MATH 318, MATH 328, MATH 331, MATH 345, MATH 351, MATH 352, MATH 353,
//       MATH 356, MATH 358, MATH 360, MATH 365, MATH 366, MATH 386, MATH 388
// PHYS: PHYS 121, PHYS 122, PHYS 126F, PHYS 130, PHYS 235, PHYS 235L, PHYS 301,
//       PHYS 303, PHYS 303L, PHYS 310, PHYS 310L, PHYS 314, PHYS 328, PHYS 338,
//       PHYS 351, PHYS 361
// STAT: STAT 303, STAT 304, STAT 305, STAT 307, STAT 308, STAT 310, STAT 321,
//       STAT 335, STAT 336, STAT 337, STAT 338
