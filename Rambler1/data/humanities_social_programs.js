// =============================================================================
// Humanities & Social Sciences Programs — College of Arts and Sciences
// Loyola University Chicago (catalog.luc.edu)
//
// Researched 2026-04-01
//
// Courses marked  isNew: true  ([NEW]) are NOT already in Database.js.
// Courses without isNew already exist in Database.js.
// =============================================================================

export const HUMANITIES_SOCIAL_PROGRAMS = {

  // ===========================================================================
  // 1. Anthropology BA
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/anthropology/anthropology-ba/
  // ===========================================================================
  'Anthropology BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Min 18 credit hours at Loyola. Two Writing Intensive courses (6 hrs) and foreign language at 102-level required.',
    requirements: {
      foundationCourses: [
        { code: 'ANTH 100', name: 'Globalization and Local Cultures', note: 'or ANTH 102' },
        { code: 'ANTH 102', name: 'Culture, Society, and Diversity', note: 'or ANTH 100' },
        { code: 'ANTH 101', name: 'Human Origins', isNew: true },                              // [NEW]
        { code: 'ANTH 231', name: 'Linguistic Anthropology', isNew: true },                     // [NEW]
      ],
      ethnographicRequirement_chooseTwo: [
        { code: 'ANTH 207', name: 'Economies, Culture, and Development', isNew: true },         // [NEW]
        { code: 'ANTH 208', name: 'Language and Identity', isNew: true },                        // [NEW]
        { code: 'ANTH 211', name: 'Peoples of Latin America', isNew: true },                     // [NEW]
        { code: 'ANTH 212', name: 'Peoples of Native North America', isNew: true },              // [NEW]
        { code: 'ANTH 213', name: 'Culture in Africa', isNew: true },                            // [NEW]
        { code: 'ANTH 214', name: 'African-American Anthropology', isNew: true },                // [NEW]
        { code: 'ANTH 215', name: 'Contemporary Japanese Culture', isNew: true },                // [NEW]
        { code: 'ANTH 216', name: 'Cultures of Migration', isNew: true },                        // [NEW]
        { code: 'ANTH 217', name: 'Mexican Culture & Heritage', isNew: true },                   // [NEW]
        { code: 'ANTH 220', name: 'Contemporary Cultures of the Middle East', isNew: true },     // [NEW]
        { code: 'ANTH 222', name: 'Culture in Contemporary Europe', isNew: true },               // [NEW]
        { code: 'ANTH 224', name: 'Social Movements, Culture, and Activism', isNew: true },      // [NEW]
        { code: 'ANTH 225', name: 'Museum Cultures', isNew: true },                              // [NEW]
      ],
      theoreticalRequirement_chooseTwo: [
        { code: 'ANTH 303', name: 'People and Conservation', isNew: true },                      // [NEW]
        { code: 'ANTH 304', name: 'Anthropological Theory', isNew: true },                       // [NEW]
        { code: 'ANTH 305', name: 'Violence and Culture', isNew: true },                         // [NEW]
        { code: 'ANTH 306', name: 'Anthropology and Human Rights', isNew: true },                // [NEW]
        { code: 'ANTH 307', name: 'The Body and Culture', isNew: true },                         // [NEW]
        { code: 'ANTH 309', name: 'Urban Anthropology', isNew: true },                           // [NEW]
        { code: 'ANTH 314', name: 'Applied Anthropology', isNew: true },                         // [NEW]
        { code: 'ANTH 316', name: 'Anthropology of Religion & Ritual', isNew: true },            // [NEW]
        { code: 'ANTH 317', name: 'Ethnographic Methods', isNew: true },                         // [NEW]
        { code: 'ANTH 319', name: 'Anthropology of Tourism', isNew: true },                      // [NEW]
        { code: 'ANTH 321', name: 'Human Rights in Latin America', isNew: true },                // [NEW]
        { code: 'ANTH 330', name: 'Language in Popular Culture', isNew: true },                   // [NEW]
        { code: 'ANTH 332', name: 'Language, Race, and Inequality', isNew: true },                // [NEW]
        { code: 'ANTH 348', name: 'Museum & Material Culture Research', isNew: true },            // [NEW]
        { code: 'ANTH 361', name: 'Issues Cultural Anthropology', isNew: true },                  // [NEW]
        { code: 'ANTH 363', name: 'Issues in Linguistic Anthropology', isNew: true },             // [NEW]
      ],
      archaeologyRequirement_chooseOne: [
        { code: 'ANTH 241', name: 'Principles of Archaeology', isNew: true },                    // [NEW]
        { code: 'ANTH 242', name: 'Mesoamerican Archaeology and Survivance', isNew: true },      // [NEW]
        { code: 'ANTH 243', name: 'North American Archaeology', isNew: true },                   // [NEW]
        { code: 'ANTH 244', name: 'Historical Archaeology', isNew: true },                       // [NEW]
        { code: 'ANTH 245', name: 'Gender in Deep Time', isNew: true },                          // [NEW]
        { code: 'ANTH 246', name: 'Ancient Human-Animal Interactions', isNew: true },             // [NEW]
        { code: 'ANTH 247', name: 'Aliens, Atlantis, and Archaeology', isNew: true },             // [NEW]
      ],
      bioAnthropologyRequirement_chooseOne: [
        { code: 'ANTH 324', name: 'Human Evolution', isNew: true },                              // [NEW]
        { code: 'ANTH 325', name: 'Primatology-Behavior & Ecology', isNew: true },               // [NEW]
        { code: 'ANTH 326', name: 'Human Osteology Lec/Lab', isNew: true },                      // [NEW]
        { code: 'ANTH 327', name: 'Dental Anthropology', isNew: true },                          // [NEW]
      ],
      electives: {
        note: '3 ANTH electives (9 hrs): 1 at any level (100/200/300), 2 at 200/300 level',
        count: 3,
        credits: 9,
      },
    },
  },

  // ===========================================================================
  // 2. Anthropology BS
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/anthropology/anthropology-bs/
  // ===========================================================================
  'Anthropology BS': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Two Writing Intensive courses and foreign language at 102-level required. BS requires ANTH 241 as a foundation course (not required for BA).',
    requirements: {
      foundationCourses: [
        { code: 'ANTH 100', name: 'Globalization and Local Cultures', note: 'or ANTH 102' },
        { code: 'ANTH 102', name: 'Culture, Society, and Diversity', note: 'or ANTH 100' },
        { code: 'ANTH 101', name: 'Human Origins', isNew: true },                               // [NEW]
        { code: 'ANTH 231', name: 'Linguistic Anthropology', isNew: true },                      // [NEW]
        { code: 'ANTH 241', name: 'Principles of Archaeology', isNew: true },                    // [NEW]
      ],
      ethnographicRequirement_chooseOne: [
        { code: 'ANTH 207', name: 'Economies, Culture, and Development', isNew: true },
        { code: 'ANTH 208', name: 'Language and Identity', isNew: true },
        { code: 'ANTH 211', name: 'Peoples of Latin America', isNew: true },
        { code: 'ANTH 212', name: 'Peoples of Native North America', isNew: true },
        { code: 'ANTH 213', name: 'Culture in Africa', isNew: true },
        { code: 'ANTH 214', name: 'African-American Anthropology', isNew: true },
        { code: 'ANTH 215', name: 'Contemporary Japanese Culture', isNew: true },
        { code: 'ANTH 216', name: 'Cultures of Migration', isNew: true },
        { code: 'ANTH 217', name: 'Mexican Culture & Heritage', isNew: true },
        { code: 'ANTH 220', name: 'Contemporary Cultures of the Middle East', isNew: true },
        { code: 'ANTH 222', name: 'Culture in Contemporary Europe', isNew: true },
        { code: 'ANTH 224', name: 'Social Movements, Culture, and Activism', isNew: true },
        { code: 'ANTH 225', name: 'Museum Cultures', isNew: true },
      ],
      archaeologyRequirement_chooseOne: [
        { code: 'ANTH 242', name: 'Mesoamerican Archaeology and Survivance', isNew: true },
        { code: 'ANTH 243', name: 'North American Archaeology', isNew: true },
        { code: 'ANTH 244', name: 'Historical Archaeology', isNew: true },
        { code: 'ANTH 245', name: 'Gender in Deep Time', isNew: true },
        { code: 'ANTH 246', name: 'Ancient Human-Animal Interactions', isNew: true },
        { code: 'ANTH 247', name: 'Aliens, Atlantis, and Archaeology', isNew: true },
        { code: 'ANTH 342', name: 'Rise & Fall of Civilizations', isNew: true },                 // [NEW]
        { code: 'ANTH 360', name: 'Issues in Archaeology', isNew: true },                        // [NEW]
        { code: 'ANTH 365', name: 'Archaeology Lab Methods', isNew: true },                      // [NEW]
        { code: 'ANTH 366', name: 'Lithic Technology', isNew: true },                            // [NEW]
      ],
      theoreticalRequirement_chooseOne: [
        { code: 'ANTH 303', name: 'People and Conservation', isNew: true },
        { code: 'ANTH 304', name: 'Anthropological Theory', isNew: true },
        { code: 'ANTH 305', name: 'Violence and Culture', isNew: true },
        { code: 'ANTH 306', name: 'Anthropology and Human Rights', isNew: true },
        { code: 'ANTH 307', name: 'The Body and Culture', isNew: true },
        { code: 'ANTH 309', name: 'Urban Anthropology', isNew: true },
        { code: 'ANTH 314', name: 'Applied Anthropology', isNew: true },
        { code: 'ANTH 316', name: 'Anthropology of Religion & Ritual', isNew: true },
        { code: 'ANTH 317', name: 'Ethnographic Methods', isNew: true },
        { code: 'ANTH 319', name: 'Anthropology of Tourism', isNew: true },
        { code: 'ANTH 321', name: 'Human Rights in Latin America', isNew: true },
        { code: 'ANTH 330', name: 'Language in Popular Culture', isNew: true },
        { code: 'ANTH 332', name: 'Language, Race, and Inequality', isNew: true },
        { code: 'ANTH 348', name: 'Museum & Material Culture Research', isNew: true },
        { code: 'ANTH 361', name: 'Issues Cultural Anthropology', isNew: true },
        { code: 'ANTH 363', name: 'Issues in Linguistic Anthropology', isNew: true },
      ],
      bioAnthropologyRequirement_chooseTwo: {
        note: 'Select 2 courses; at least one must be from ANTH 324, 325, 326, or 327',
        options: [
          { code: 'ANTH 324', name: 'Human Evolution', isNew: true },
          { code: 'ANTH 325', name: 'Primatology-Behavior & Ecology', isNew: true },
          { code: 'ANTH 326', name: 'Human Osteology Lec/Lab', isNew: true },
          { code: 'ANTH 327', name: 'Dental Anthropology', isNew: true },
        ],
      },
      electives: {
        note: '3 ANTH electives (9 hrs): 1 at any level (100/200/300), 2 at 200/300 level',
        count: 3,
        credits: 9,
      },
    },
  },

  // ===========================================================================
  // 3. Economics BA
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/economics/economics-ba/
  // ===========================================================================
  'Economics BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Students pursuing doctoral study should take full calculus sequence, linear algebra, and advanced statistics. This is the Arts & Sciences Economics BA (distinct from the Quinlan Economics BBA).',
    requirements: {
      mathematicsRequired: [
        { code: 'MATH 130', name: 'Business Calculus', note: 'or MATH 131 Applied Calculus I or MATH 161 Calculus I' },
      ],
      statisticsRequired: [
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
      ],
      foundationEconomics: [
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
        { code: 'ECON 202', name: 'Principles of Macroeconomics' },
      ],
      intermediateRequired: [
        { code: 'ECON 303', name: 'Intermediate Microeconomics' },
        { code: 'ECON 304', name: 'Intermediate Macroeconomics' },
      ],
      electives_chooseSix: {
        note: 'Choose 6 courses from the following 300-level options (only 1 ECON 399 allowed)',
        options: [
          { code: 'ECON 320', name: 'Urban Economics' },
          { code: 'ECON 323', name: 'International Economics' },
          { code: 'ECON 324', name: 'International Monetary Relations' },
          { code: 'ECON 325', name: 'Economics of Growth & Development' },
          { code: 'ECON 327', name: 'American Economic & Business History' },
          { code: 'ECON 328', name: 'Environmental Economics' },
          { code: 'ECON 329', name: 'Health Economics' },
          { code: 'ECON 334', name: 'Economics of Government Expenditures & Taxation' },
          { code: 'ECON 336', name: 'Monetary and Fiscal Policy' },
          { code: 'ECON 346', name: 'Econometrics' },
          { code: 'ECON 360', name: 'Labor Economics' },
          { code: 'ECON 370', name: 'Pricing & Industrial Organization' },
          { code: 'ECON 399', name: 'Special Topics in Economics' },
          { code: 'MATH 360', name: 'Introduction to Game Theory' },
        ],
      },
    },
  },

  // ===========================================================================
  // 4. English BA
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/english/english-ba/
  // ===========================================================================
  'English BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '12 courses (36 hrs), 9 must be at 300-level. At least 1 course must be designated "multicultural." Up to 3 electives may be from UCLR-E 100 and advanced 200-level (ENGL 270+).',
    requirements: {
      literaryTheory_chooseOne: [
        { code: 'ENGL 354', name: 'Contemporary Critical Theory', isNew: true },                 // [NEW]
        { code: 'ENGL 355', name: 'Studies in Literary Criticism', isNew: true },                 // [NEW]
      ],
      shakespeare_chooseOne: [
        { code: 'ENGL 326', name: 'Shakespeare: Selected Major Plays', isNew: true },            // [NEW]
        { code: 'ENGL 327', name: 'Studies in Shakespeare', isNew: true },                       // [NEW]
      ],
      capstone: [
        { code: 'ENGL 390', name: 'Advanced Seminar', isNew: true },                             // [NEW]
      ],
      englishLitBefore1900: {
        note: 'At least 1 course before 1700, at least 1 from 1700-1900, 1 additional from either period (9 hrs total)',
        credits: 9,
      },
      englishLitSince1900: {
        note: '1 course from the designated list (3 hrs)',
        credits: 3,
      },
      electives: {
        note: '5 ENGL elective courses (15 hrs)',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 5. English with Creative Writing Concentration BA
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/english/creative-writing-concentration/
  // ===========================================================================
  'English with Creative Writing Concentration BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '12 courses (36 hrs), 9 must be at 300-level. Emphasizes fiction, poetry, and creative nonfiction. Up to 3 electives from UCLR-E 100 and advanced 200-level (ENGL 270+).',
    requirements: {
      creativeWritingWorkshops: [
        { code: 'ENGL 317', name: 'The Writing of Poetry', isNew: true },                        // [NEW]
        { code: 'ENGL 318', name: 'The Writing of Fiction', isNew: true },                        // [NEW]
        { code: 'ENGL 319', name: 'Writing Creative Nonfiction', isNew: true },                   // [NEW]
      ],
      literaryTheory_chooseOne: [
        { code: 'ENGL 354', name: 'Contemporary Critical Theory', isNew: true },
        { code: 'ENGL 355', name: 'Studies in Literary Criticism', isNew: true },
      ],
      shakespeare_chooseOne: [
        { code: 'ENGL 326', name: 'Shakespeare: Selected Major Plays', isNew: true },
        { code: 'ENGL 327', name: 'Studies in Shakespeare', isNew: true },
      ],
      englishLitBefore1900: {
        note: 'At least 1 course before 1700, at least 1 from 1700-1900 (minimum 9 hrs)',
        credits: 9,
      },
      englishLitSince1900: {
        note: '1 course from the designated list (3 hrs)',
        credits: 3,
      },
      englElective: {
        note: '1 ENGL elective (3 hrs)',
        credits: 3,
      },
      capstone_chooseTwoAdvancedWorkshops: [
        { code: 'ENGL 392', name: 'Advanced Creative Nonfiction Workshop', isNew: true },        // [NEW]
        { code: 'ENGL 397', name: 'Advanced Writing Workshop: Poetry', isNew: true },            // [NEW]
        { code: 'ENGL 398', name: 'Advanced Writing Workshop: Fiction', isNew: true },            // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 6. French BA
  //    Total major credit hours: 30
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/modern-languages-literatures/french-ba/
  // ===========================================================================
  'French BA': {
    totalCredits: 30,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Prerequisites: FREN 101 and FREN 104 (or equivalent). Senior Capstone E-Portfolio required for graduation.',
    requirements: {
      languageAndComposition: [
        { code: 'FREN 250', name: 'French Composition and Conversation I', isNew: true },        // [NEW]
        { code: 'FREN 251', name: 'French Composition and Conversation II', isNew: true },       // [NEW]
      ],
      literatureAndCulture: [
        { code: 'FREN 270', name: 'Main Currents of French Literature & Culture I', isNew: true },   // [NEW]
        { code: 'FREN 271', name: 'Main Currents of French Literature & Culture II', isNew: true },  // [NEW]
      ],
      literaryAnalysis_chooseOne: [
        { code: 'FREN 301', name: 'Stylistics', isNew: true },                                   // [NEW]
        { code: 'FREN 302', name: 'French for Professions', isNew: true },                        // [NEW]
      ],
      historicalPeriod: [
        { code: 'FREN 317', name: 'Le Grand Siecle', isNew: true },                              // [NEW]
      ],
      upperLevelElectives: {
        note: '4 additional FREN 300-level courses (12 hrs)',
        count: 4,
        credits: 12,
      },
    },
  },

  // ===========================================================================
  // 7. History BA
  //    Total major credit hours: 36
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/history/history-ba/
  // ===========================================================================
  'History BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Portfolio required: historiographical essay (from HIST 299) and a 300-level research paper (min 12-15 pages). Min 6 courses at Loyola, min 4 at 300-level.',
    requirements: {
      tier1Foundational_chooseOne: [
        { code: 'HIST 101', name: 'Culture, Power and Identity: Western Ideas & Institutions to 17th Century', isNew: true },  // [NEW]
        { code: 'HIST 102', name: 'Culture, Power and Identity: Western Ideas & Institutions from 17th Century', isNew: true }, // [NEW]
        { code: 'HIST 103', name: 'American Pluralism', isNew: true },                           // [NEW]
        { code: 'HIST 104', name: 'Global History Since 1500', isNew: true },                     // [NEW]
      ],
      tier2HistoricalKnowledge_chooseOne: [
        { code: 'HIST 208', name: 'East Asian History: Themes & Issues', isNew: true },           // [NEW]
        { code: 'HIST 209', name: 'Survey of Islamic History', isNew: true },                     // [NEW]
        { code: 'HIST 210', name: 'Latin American History: Themes & Issues', isNew: true },       // [NEW]
        { code: 'HIST 211', name: 'US History to 1865: Themes & Issues', isNew: true },           // [NEW]
        { code: 'HIST 212', name: 'US History since 1865: Themes & Issues', isNew: true },        // [NEW]
        { code: 'HIST 213', name: 'African History: Themes & Issues', isNew: true },              // [NEW]
      ],
      methodsCourse_chooseOne: [
        { code: 'HIST 299', name: 'Historical Methods', isNew: true },                           // [NEW]
      ],
      upperLevel_oneFromEach: {
        note: 'Select 1 from each of 4 categories: Pre-Modern, Modern European, U.S. History, World History (12 hrs total)',
        credits: 12,
      },
      electives: {
        note: '5 additional history courses at any level (15 hrs)',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 8. Philosophy BA
  //    Total major credit hours: 33
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/philosophy/philosopy-ba/
  // ===========================================================================
  'Philosophy BA': {
    totalCredits: 33,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '11 courses, at least 7 at 300-level. Philosophy majors are exempt from the general LUC PHIL 130 Core requirement. Optional specializations: Ethics & Values, Law/Society/Social Justice, Mind & Science, Existence/Meaning/Culture.',
    requirements: {
      coreRequired: [
        { code: 'PHIL 274', name: 'Logic', isNew: true },                                        // [NEW]
        { code: 'PHIL 301', name: 'Symbolic Logic', isNew: true },                                // [NEW]
        { code: 'PHIL 304', name: 'History of Ancient Philosophy', isNew: true },                  // [NEW]
        { code: 'PHIL 309', name: 'Classical Modern Philosophy', isNew: true },                    // [NEW]
      ],
      ethicsCourse_chooseOne: [
        { code: 'PHIL 181', name: 'Ethics', isNew: true },                                        // [NEW]
        { code: 'PHIL 182', name: 'Social and Political Philosophy', isNew: true },                // [NEW]
        { code: 'PHIL 283', name: 'Business Ethics', isNew: true },                               // [NEW]
        { code: 'PHIL 284', name: 'Health Care Ethics', isNew: true },                             // [NEW]
        { code: 'PHIL 285', name: 'Contemporary Ethical Issues', isNew: true },                    // [NEW]
        { code: 'PHIL 286', name: 'Ethics and Education', isNew: true },                           // [NEW]
        { code: 'PHIL 287', name: 'Environmental Ethics', isNew: true },                           // [NEW]
        { code: 'PHIL 288', name: 'Culture and Civilization', isNew: true },                       // [NEW]
        { code: 'PHIL 289', name: 'Philosophy and Gender', isNew: true },                          // [NEW]
        { code: 'PHIL 321', name: 'Ethics and Society', isNew: true },                             // [NEW]
        { code: 'PHIL 322', name: 'Philosophical Perspectives on Woman', isNew: true },            // [NEW]
        { code: 'PHIL 324', name: 'Topics in Ethics', isNew: true },                               // [NEW]
        { code: 'PHIL 325', name: 'Ethics & Case Based Reasoning', isNew: true },                  // [NEW]
        { code: 'PHIL 329', name: 'International Ethics', isNew: true },                           // [NEW]
        { code: 'PHIL 355', name: 'Neuroethics', isNew: true },                                   // [NEW]
        { code: 'PHIL 369', name: 'Philosophy of Medicine', isNew: true },                         // [NEW]
        { code: 'PHIL 375', name: 'Philosophy of Marxism', isNew: true },                          // [NEW]
        { code: 'PHIL 385', name: 'Environmental Ethics', isNew: true },                           // [NEW]
        { code: 'PHIL 388', name: 'History of Ethics', isNew: true },                              // [NEW]
      ],
      metaphysicsEpistemology_chooseOne: [
        { code: 'PHIL 130', name: 'Philosophy & Persons', isNew: true },                           // [NEW]
        { code: 'PHIL 311', name: 'Issues in Metaphysics', isNew: true },                          // [NEW]
        { code: 'PHIL 330', name: 'Theory of Knowledge', isNew: true },                            // [NEW]
        { code: 'PHIL 380', name: 'Topics in Philosophy of Religion', isNew: true },               // [NEW]
        { code: 'PHIL 381', name: 'Philosophy of Science', isNew: true },                          // [NEW]
        { code: 'PHIL 382', name: 'Philosophy of Social Science', isNew: true },                   // [NEW]
        { code: 'PHIL 383', name: 'Philosophy of Psychology', isNew: true },                       // [NEW]
        { code: 'PHIL 384', name: 'Topics in Philosophy & Science', isNew: true },                 // [NEW]
        { code: 'PHIL 386', name: 'Analytic Philosophy', isNew: true },                            // [NEW]
        { code: 'PHIL 387', name: 'Philosophy of Mind', isNew: true },                             // [NEW]
        { code: 'PHIL 391', name: 'Topics in Philosophy of Religion', isNew: true },               // [NEW]
        { code: 'PHIL 393', name: 'Philosophy & The Human Sciences', isNew: true },                // [NEW]
      ],
      capstoneSeminar_chooseOne: [
        { code: 'PHIL 395', name: 'Seminar in Ancient Philosophy', isNew: true },                  // [NEW]
        { code: 'PHIL 396', name: 'Seminar in Medieval Philosophy', isNew: true },                 // [NEW]
        { code: 'PHIL 397', name: 'Capstone Seminar in Classical Modern Philosophy', isNew: true },// [NEW]
        { code: 'PHIL 398', name: 'Capstone Seminar in Contemporary Philosophy', isNew: true },   // [NEW]
        { code: 'PHIL 399', name: 'Capstone Seminar on a Topic in Philosophy', isNew: true },      // [NEW]
      ],
      electives: {
        note: '5 additional philosophy courses (15 hrs), min 4 at 300-level',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 9. Political Science BA (ADDITIONS to existing data in Database.js)
  //    Total major credit hours: 33
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/political-science/political-science-ba/
  //
  //    NOTE: Core (PLSC 100/101/102/103), quantitative reasoning (PLSC 216),
  //    and some subfield courses already exist in Database.js. Below are the
  //    ADDITIONAL subfield options NOT already captured.
  // ===========================================================================
  'Political Science BA — Additional Subfield Courses': {
    totalCredits: 33,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Foundation: choose 3 of 4 introductory courses (PLSC 100/101/102/103). 1 course from each of 4 subfields. 4 PLSC electives. PLSC 216 required for quantitative reasoning.',
    requirements: {
      americanPolitics_additionalOptions: [
        // Already in DB: PLSC 208, 320, 381, 386, 391
        { code: 'PLSC 202', name: 'Mock Trial', isNew: true },                                    // [NEW]
        { code: 'PLSC 203', name: 'Moot Court', isNew: true },                                    // [NEW]
        { code: 'PLSC 215', name: 'Politics of Marginalized Groups', isNew: true },               // [NEW]
        { code: 'PLSC 218', name: 'African-American Politics', isNew: true },                     // [NEW]
        { code: 'PLSC 236', name: 'Political Communication', isNew: true },                       // [NEW]
        { code: 'PLSC 238', name: 'Political Advocacy', isNew: true },                            // [NEW]
        { code: 'PLSC 251', name: 'Women in American Politics', isNew: true },                    // [NEW]
        { code: 'PLSC 300A', name: 'Contemporary Political Issues: American Politics', isNew: true }, // [NEW]
        { code: 'PLSC 318', name: 'Politics & the Economy', isNew: true },                        // [NEW]
        { code: 'PLSC 319', name: 'Women, Law & Public Policy', isNew: true },                    // [NEW]
        { code: 'PLSC 321', name: 'Constitutional Law-Powers of Government', isNew: true },       // [NEW]
        { code: 'PLSC 322', name: 'Constitutional Law-Rights and Liberties', isNew: true },       // [NEW]
        { code: 'PLSC 323', name: 'Children, Law & Public Policy', isNew: true },                 // [NEW]
        { code: 'PLSC 324', name: 'Civil-Military Relations', isNew: true },                      // [NEW]
        { code: 'PLSC 326', name: 'American National Security', isNew: true },                    // [NEW]
        { code: 'PLSC 327', name: 'Political Psychology', isNew: true },                          // [NEW]
        { code: 'PLSC 328', name: 'Political Behavior', isNew: true },                            // [NEW]
        { code: 'PLSC 329', name: 'Interest Group Politics', isNew: true },                       // [NEW]
        { code: 'PLSC 332', name: 'Politics of American Bureaucracies', isNew: true },            // [NEW]
        { code: 'PLSC 334', name: 'Urban Policies and Problems', isNew: true },                   // [NEW]
        { code: 'PLSC 335', name: 'Urban Semester Seminar', isNew: true },                        // [NEW]
        { code: 'PLSC 357', name: 'Hollywood and Law', isNew: true },                             // [NEW]
        { code: 'PLSC 372', name: 'Crime, Race & Violence', isNew: true },                        // [NEW]
        { code: 'PLSC 376', name: 'Political Behavior and Public Opinion', isNew: true },         // [NEW]
        { code: 'PLSC 377', name: 'American Public Policies', isNew: true },                      // [NEW]
        { code: 'PLSC 378', name: 'Intro to Political Economy', isNew: true },                    // [NEW]
        { code: 'PLSC 379', name: 'The Legislative Process', isNew: true },                       // [NEW]
        { code: 'PLSC 380', name: 'Public Policy Analysis', isNew: true },                        // [NEW]
        { code: 'PLSC 384', name: 'The Judicial Process', isNew: true },                          // [NEW]
        { code: 'PLSC 385', name: 'Introduction to Law', isNew: true },                           // [NEW]
        { code: 'PLSC 387', name: 'Politics and the Press', isNew: true },                        // [NEW]
        { code: 'PLSC 389', name: 'State Politics', isNew: true },                                // [NEW]
        { code: 'PLSC 390', name: 'Urban Politics', isNew: true },                                // [NEW]
        { code: 'PLSC 392', name: 'Environmental Politics', isNew: true },                        // [NEW]
        { code: 'PLSC 393', name: 'Black Politics', isNew: true },                                // [NEW]
        { code: 'PLSC 398', name: 'Washington DC Internship Seminar', isNew: true },              // [NEW]
      ],
      politicalTheory_additionalOptions: [
        // Already in DB: PLSC 301, 302, 304, 307
        { code: 'PLSC 300B', name: 'Contemporary Political Issues: Political Theory', isNew: true },  // [NEW]
        { code: 'PLSC 303', name: 'Conservatism', isNew: true },                                  // [NEW]
        { code: 'PLSC 306', name: 'Modern Political Thought', isNew: true },                      // [NEW]
        { code: 'PLSC 308', name: 'Contemporary Political Thought', isNew: true },                // [NEW]
        { code: 'PLSC 309', name: 'Socialism', isNew: true },                                     // [NEW]
        { code: 'PLSC 310B', name: 'Catholic Political Thought', isNew: true },                   // [NEW]
        { code: 'PLSC 312', name: 'Feminist Theory', isNew: true },                               // [NEW]
        { code: 'PLSC 313', name: 'Resistance and Obligation', isNew: true },                     // [NEW]
        { code: 'PLSC 314', name: 'Liberalism', isNew: true },                                    // [NEW]
        { code: 'PLSC 330', name: 'Global Justice', isNew: true },                                // [NEW]
        { code: 'PLSC 331', name: 'Islamic Political Thought', isNew: true },                     // [NEW]
        { code: 'PLSC 339', name: 'Political Ideologies', isNew: true },                          // [NEW]
        { code: 'PLSC 371', name: 'Roman Law', isNew: true },                                     // [NEW]
        { code: 'PLSC 373', name: 'Politics and Literature', isNew: true },                        // [NEW]
        { code: 'PLSC 388', name: 'The Morality and Legality of War', isNew: true },              // [NEW]
      ],
      comparativePolitics_additionalOptions: [
        // Already in DB: PLSC 336, 342, 343, 347
        { code: 'PLSC 232', name: 'Politics of the United Kingdom', isNew: true },                // [NEW]
        { code: 'PLSC 300C', name: 'Contemporary Political Issues: Comparative Politics', isNew: true }, // [NEW]
        { code: 'PLSC 337', name: 'Terrorism', isNew: true },                                     // [NEW]
        { code: 'PLSC 344', name: 'Contemporary Issues in Latin America', isNew: true },          // [NEW]
        { code: 'PLSC 345', name: 'South & Southeast Asian Politics', isNew: true },              // [NEW]
        { code: 'PLSC 346', name: 'East Asian Politics', isNew: true },                           // [NEW]
        { code: 'PLSC 348', name: 'Soviet & Post-Soviet Politics', isNew: true },                 // [NEW]
        { code: 'PLSC 349', name: 'Eastern European Politics', isNew: true },                     // [NEW]
        { code: 'PLSC 352', name: 'Canadian Politics', isNew: true },                             // [NEW]
        { code: 'PLSC 355C', name: 'Women and Politics: A Cross-National Perspective', isNew: true }, // [NEW]
        { code: 'PLSC 359', name: 'Revolutions', isNew: true },                                   // [NEW]
        { code: 'PLSC 360', name: 'Western European Politics', isNew: true },                     // [NEW]
        { code: 'PLSC 365', name: 'Italian Politics & Government', isNew: true },                 // [NEW]
        { code: 'PLSC 366', name: 'Dictatorship', isNew: true },                                  // [NEW]
        { code: 'PLSC 368', name: 'Politics of the Middle East', isNew: true },                   // [NEW]
        { code: 'PLSC 374', name: 'Democracy', isNew: true },                                     // [NEW]
        { code: 'GLST 303', name: 'Technological Change and Society', isNew: true },              // [NEW]
      ],
      internationalRelations_additionalOptions: [
        // Already in DB: PLSC 213, 325, 353, 364, 350, 362, 363
        { code: 'PLSC 204', name: 'Conflict Management', isNew: true },                           // [NEW]
        { code: 'PLSC 252', name: 'Capitalism and Its Discontents', isNew: true },                // [NEW]
        { code: 'PLSC 300D', name: 'Contemporary Political Issues in International Relations', isNew: true }, // [NEW]
        { code: 'PLSC 316', name: 'Politics of Genocide', isNew: true },                          // [NEW]
        { code: 'PLSC 317', name: 'Politics of International Health', isNew: true },              // [NEW]
        { code: 'PLSC 333', name: 'Crossing Borders: The Politics of Immigration', isNew: true }, // [NEW]
        { code: 'PLSC 340', name: 'International Relations of Africa', isNew: true },             // [NEW]
        { code: 'PLSC 351', name: 'Latin American International System', isNew: true },           // [NEW]
        { code: 'PLSC 354', name: 'Global Environmental Politics', isNew: true },                 // [NEW]
        { code: 'PLSC 356', name: 'Intervent in World Politics', isNew: true },                   // [NEW]
        { code: 'PLSC 358', name: 'War, Peace and Politics', isNew: true },                       // [NEW]
        { code: 'PLSC 358D', name: 'The Scientific Study of War', isNew: true },                  // [NEW]
        { code: 'PLSC 367', name: 'Model United Nations', isNew: true },                          // [NEW]
        { code: 'PLSC 369', name: 'Politics of Energy', isNew: true },                            // [NEW]
        { code: 'GLST 302', name: 'States and Firms', isNew: true },                              // [NEW]
        { code: 'GLST 305', name: 'Globalization and Environmental Sustainability', isNew: true }, // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 10. Psychology BS — SKIP (already fully covered in Database.js)
  // ===========================================================================

  // ===========================================================================
  // 11. Religious Studies BA
  //     Total major credit hours: 36
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/theology/religious-studies-ba/
  // ===========================================================================
  'Religious Studies BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '12 courses: 7 required + 5 electives. At least 5 courses at 300-level or higher.',
    requirements: {
      christianTraditions_chooseOne: [
        { code: 'THEO 100', name: 'Christian Theology', isNew: true },                            // [NEW]
        { code: 'THEO 185', name: 'Christian Ethics', isNew: true },                              // [NEW]
        { code: 'THEO 232', name: 'New Testament', isNew: true },                                 // [NEW]
        { code: 'THEO 265', name: 'Sacraments and the Christian Imagination', isNew: true },      // [NEW]
        { code: 'THEO 267', name: 'Jesus Christ', isNew: true },                                  // [NEW]
        { code: 'THEO 279', name: 'Roman Catholicism', isNew: true },                             // [NEW]
        { code: 'THEO 281', name: 'Christianity Through Time', isNew: true },                     // [NEW]
        { code: 'THEO 317', name: 'Christian Thought: Ancient-Medieval', isNew: true },            // [NEW]
        { code: 'THEO 318', name: 'Christian Thought: Reformation to Modern', isNew: true },       // [NEW]
      ],
      nonChristianTraditions_chooseThree: [
        { code: 'THEO 272', name: 'Judaism', isNew: true },                                       // [NEW]
        { code: 'THEO 282', name: 'Hinduism', isNew: true },                                      // [NEW]
        { code: 'THEO 295', name: 'Islam', isNew: true },                                         // [NEW]
        { code: 'THEO 297', name: 'Buddhism', isNew: true },                                      // [NEW]
        { code: 'THEO 299', name: 'Religions of Asia', isNew: true },                             // [NEW]
      ],
      religiousComparisonsThemes_chooseTwo: [
        { code: 'THEO 107', name: 'Introduction to Religious Studies', isNew: true },              // [NEW]
        { code: 'THEO 186', name: 'Global Religious Ethics', isNew: true },                        // [NEW]
        { code: 'THEO 278', name: 'Religion & Gender', isNew: true },                              // [NEW]
        { code: 'THEO 393', name: 'Seminar', isNew: true },                                       // [NEW]
      ],
      capstone_chooseOne: [
        { code: 'THEO 353', name: 'Religious Traditions', isNew: true },                           // [NEW]
        { code: 'THEO 280', name: 'Religion & Interdisciplinary Studies', isNew: true },           // [NEW]
      ],
      electives: {
        note: '5 courses (15 hrs) at THEO 200+ level; up to 3 may be from other departments',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 12. Sociology BA
  //     Total major credit hours: 34
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/sociology/sociology-ba/
  // ===========================================================================
  'Sociology BA': {
    totalCredits: 34,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'SOCL 205, 206, and 301 must be completed before enrolling in SOCL 365. Three optional concentrations: Health and Community, Social Justice, Research Methods.',
    requirements: {
      coreRequired: [
        { code: 'SOCL 101', name: 'Society in a Global Age', isNew: true },                       // [NEW]
        { code: 'SOCL 205', name: 'Sociological Thought', isNew: true },                          // [NEW]
        { code: 'SOCL 206', name: 'Principles of Social Research', isNew: true },                  // [NEW]
        { code: 'SOCL 301', name: 'Statistics for Social Research', isNew: true },                 // [NEW]
        { code: 'SOCL 365', name: 'Social Theory & Social Research', isNew: true },               // [NEW]
      ],
      electives: {
        note: '6 total electives (18 hrs); 5 must be SOCL 210-380. 1 may be from another social science with departmental approval.',
        count: 6,
        credits: 18,
        sampleOptions: [
          { code: 'SOCL 210', name: 'Gender and Work', isNew: true },
          { code: 'SOCL 212', name: 'Patterns of Criminal Activity', isNew: true },
          { code: 'SOCL 215', name: 'Law & Society', isNew: true },
          { code: 'SOCL 216', name: 'The Sociology of Violence', isNew: true },
          { code: 'SOCL 222', name: 'Poverty & Welfare in America', isNew: true },
          { code: 'SOCL 225', name: 'Sociology of Health Care', isNew: true },
          { code: 'SOCL 230', name: 'Self & Society', isNew: true },
          { code: 'SOCL 234', name: 'City, Suburbs & Beyond', isNew: true },
          { code: 'SOCL 240', name: 'Families', isNew: true },
          { code: 'SOCL 250', name: 'Inequality in Society', isNew: true },
          { code: 'SOCL 252', name: 'Global Inequalities', isNew: true },
          { code: 'SOCL 255', name: 'Deviance and Social Control', isNew: true },
          { code: 'SOCL 260', name: 'Power in Society', isNew: true },
          { code: 'SOCL 261', name: 'Social Movements & Social Change', isNew: true },
          { code: 'SOCL 265', name: 'Globalization & Society', isNew: true },
          { code: 'SOCL 272', name: 'Environmental Sociology', isNew: true },
          { code: 'SOCL 278', name: 'Global Health', isNew: true },
          { code: 'SOCL 302', name: 'Qualitative Research', isNew: true },
          { code: 'SOCL 304', name: 'Global Civil Society and Social Movements', isNew: true },
          { code: 'SOCL 306', name: 'International Development', isNew: true },
          { code: 'SOCL 370', name: 'Undergrad Seminar-Special Topics', isNew: true },
        ],
      },
    },
  },

  // ===========================================================================
  // 13. Sociology-Anthropology BA
  //     Total major credit hours: 36
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/sociology/sociology-anthropology-ba/
  // ===========================================================================
  'Sociology-Anthropology BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Interdisciplinary program combining sociology and anthropology. 12 courses total.',
    requirements: {
      naturalScienceIntro_chooseOne: [
        { code: 'ANTH 101', name: 'Human Origins', isNew: true },
        { code: 'ANTH 103', name: 'Biological Background Human Social Behavior', isNew: true },   // [NEW]
        { code: 'ANTH 104', name: 'The Human Ecological Footprint', isNew: true },                // [NEW]
        { code: 'ANTH 105', name: 'Human Biocultural Diversity', isNew: true },                    // [NEW]
        { code: 'ANTH 106', name: 'Sex, Science and Anthropological Inquiry', isNew: true },       // [NEW]
        { code: 'ANTH 245', name: 'Gender in Deep Time', isNew: true },
      ],
      socialScienceIntro: [
        { code: 'ANTH 100', name: 'Globalization and Local Cultures', note: 'or ANTH 102' },
        { code: 'SOCL 101', name: 'Society in a Global Age', isNew: true },
      ],
      ethnographicArea_chooseOne: {
        note: 'Select 1 ANTH ethnographic area course (e.g., ANTH 207-225)',
        credits: 3,
      },
      theory_chooseOne: [
        { code: 'SOCL 205', name: 'Sociological Thought', isNew: true },
        { code: 'ANTH 304', name: 'Anthropological Theory', isNew: true },
      ],
      methodsCourses: [
        { code: 'SOCL 206', name: 'Principles of Social Research', isNew: true },
      ],
      additionalMethodsCourse_chooseOne: [
        { code: 'ANTH 356', name: 'Bioanthropological Lab Work', isNew: true },                   // [NEW]
        { code: 'ANTH 365', name: 'Archaeology Lab Methods', isNew: true },
        { code: 'SOCL 301', name: 'Statistics for Social Research', isNew: true },
      ],
      anthropologyElectives: {
        note: '2 ANTH electives at 200/300 level or from archaeology/biological anthropology (6 hrs)',
        count: 2,
        credits: 6,
      },
      sociologyElectives: {
        note: '2 SOCL electives from SOCL 121-171 or 200-300 level (6 hrs)',
        count: 2,
        credits: 6,
      },
      theoryMethodsSeminar_chooseOne: [
        { code: 'ANTH 317', name: 'Ethnographic Methods', isNew: true },
        { code: 'SOCL 365', name: 'Social Theory & Social Research', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 14. Spanish BA
  //     Total major credit hours: 30
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/modern-languages-literatures/spanish-ba/
  // ===========================================================================
  'Spanish BA': {
    totalCredits: 30,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'E-Portfolio and personal statement in Spanish required for graduation. Upper-level electives must include at least 1 course on Latin America and at least 1 on Spain.',
    requirements: {
      compositionAndConversation: {
        note: 'Choose one sequence based on speaker background',
        nonNativeSpeakers: [
          { code: 'SPAN 250', name: 'Composition & Conversation I', isNew: true },                // [NEW]
          { code: 'SPAN 251', name: 'Composition & Conversation II', isNew: true },               // [NEW]
        ],
        nativeSpeakers: [
          { code: 'SPAN 252', name: 'Composition & Conversation: Native Speakers', isNew: true }, // [NEW]
          { code: 'SPAN 253', name: 'Advanced Composition & Conversation: Native Speakers', isNew: true }, // [NEW]
        ],
      },
      literatureAndCultureFoundation: [
        { code: 'SPAN 270', name: 'Introduction to Critical Analysis in Spanish', isNew: true },   // [NEW]
      ],
      regionalLiterature_chooseOne: [
        { code: 'SPAN 271', name: 'Introduction to Iberian Literature and Culture', isNew: true }, // [NEW]
        { code: 'SPAN 272', name: 'Introduction to Spanish American Literature and Culture', isNew: true }, // [NEW]
      ],
      upperLevelElectives: {
        note: '6 courses at 300-level (18 hrs); must include at least 1 on Latin America and 1 on Spain',
        count: 6,
        credits: 18,
      },
    },
  },

  // ===========================================================================
  // 15. Theology BA
  //     Total major credit hours: 36
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/theology/theology-ba/
  // ===========================================================================
  'Theology BA': {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '12 courses: 7 required distribution + 5 electives.',
    requirements: {
      doctrine_chooseOne: [
        { code: 'THEO 100', name: 'Christian Theology', isNew: true },
        { code: 'THEO 265', name: 'Sacraments and the Christian Imagination', isNew: true },
        { code: 'THEO 266', name: 'Church & Global Cultures', isNew: true },                      // [NEW]
        { code: 'THEO 267', name: 'Jesus Christ', isNew: true },
      ],
      hebrewBibleOT_chooseOne: [
        { code: 'THEO 231', name: 'Hebrew Bible/Old Testament', isNew: true },                    // [NEW]
        { code: 'THEO 302', name: 'Wisdom Literature and Psalms', isNew: true },                   // [NEW]
        { code: 'THEO 303', name: 'Pentateuch', isNew: true },                                    // [NEW]
        { code: 'THEO 304', name: 'Israel Conquest to Exile', isNew: true },                       // [NEW]
      ],
      newTestament_chooseOne: [
        { code: 'THEO 232', name: 'New Testament', isNew: true },
        { code: 'THEO 311', name: 'The Meaning of Jesus Christ', isNew: true },                    // [NEW]
        { code: 'THEO 313', name: 'Gospels of Matthew, Mark & Luke', isNew: true },                // [NEW]
      ],
      christianThought_chooseOne: [
        { code: 'THEO 317', name: 'Christian Thought: Ancient-Medieval', isNew: true },
        { code: 'THEO 318', name: 'Christian Thought: Reformation to Modern', isNew: true },
      ],
      nonChristianTradition_chooseOne: [
        { code: 'THEO 107', name: 'Introduction to Religious Studies', isNew: true },
        { code: 'THEO 272', name: 'Judaism', isNew: true },
        { code: 'THEO 282', name: 'Hinduism', isNew: true },
        { code: 'THEO 295', name: 'Islam', isNew: true },
        { code: 'THEO 297', name: 'Buddhism', isNew: true },
        { code: 'THEO 299', name: 'Religions of Asia', isNew: true },
        { code: 'THEO 350', name: 'Topics in Islam', isNew: true },                               // [NEW]
        { code: 'THEO 352', name: 'Topics in Buddhism', isNew: true },                            // [NEW]
        { code: 'THEO 353', name: 'Religious Traditions', isNew: true },
        { code: 'THEO 356', name: 'Topics in Judaism', isNew: true },                             // [NEW]
        { code: 'THEO 365', name: 'Women, Gender and Embodiment in Islam', isNew: true },         // [NEW]
        { code: 'THEO 366', name: 'Contemporary Islamic Thought and Movements', isNew: true },    // [NEW]
      ],
      ethics_chooseOne: [
        { code: 'THEO 185', name: 'Christian Ethics', isNew: true },
        { code: 'THEO 186', name: 'Global Religious Ethics', isNew: true },
        { code: 'THEO 203', name: 'Social Justice and Injustice', isNew: true },                   // [NEW]
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis', isNew: true },     // [NEW]
        { code: 'THEO 293', name: 'Christian Marriage', isNew: true },                             // [NEW]
        { code: 'THEO 340', name: 'Foundations of Christian Morality', isNew: true },              // [NEW]
        { code: 'THEO 342', name: 'Perspectives on Life and Death', isNew: true },                 // [NEW]
        { code: 'THEO 343', name: 'Contemporary Christian Sexuality', isNew: true },               // [NEW]
        { code: 'THEO 344', name: 'Theology and Ecology', isNew: true },                          // [NEW]
      ],
      capstone_chooseOne: [
        { code: 'THEO 373', name: 'Theology Capstone', isNew: true },                             // [NEW]
        { code: 'THEO 280', name: 'Religion & Interdisciplinary Studies', isNew: true },
      ],
      electives: {
        note: '5 electives (15 hrs) from any THEO 200+ course or CATH 296',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 16. Women's Studies and Gender Studies BA
  //     Total major credit hours: 36
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/womens-studies-gender-studies/womens-studies-gender-studies-ba/
  // ===========================================================================
  "Women's Studies and Gender Studies BA": {
    totalCredits: 36,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: '12 courses minimum. At least 21 hrs (7 courses) must be 300-level or above. Interdisciplinary program.',
    requirements: {
      coreRequired: [
        { code: 'WSGS 101', name: 'Introduction to WSGS from a Global Perspective', isNew: true },// [NEW]
        { code: 'WSGS 201', name: 'Contemporary Issues in WSGS', isNew: true },                   // [NEW]
        { code: 'WSGS 330', name: 'History of Feminist Thought and Social Action', isNew: true },  // [NEW]
        { code: 'WSGS 391', name: 'WSGS Methodologies', isNew: true },                            // [NEW]
        { code: 'WSGS 398', name: "Women's Studies Internship", isNew: true },                     // [NEW]
        { code: 'WSGS 399', name: 'WSGS Capstone', isNew: true },                                 // [NEW]
      ],
      theoryRequirement_chooseOne: [
        { code: 'PLSC 312', name: 'Feminist Theory', isNew: true },
        { code: 'ENGL 307', name: 'Topics in Feminist and Gender Studies', isNew: true },         // [NEW]
        { code: 'WSGS 380', name: 'Queer Theory: Beyond the Binary', isNew: true },               // [NEW]
      ],
      electives: {
        note: '5 elective courses from WSGS and cross-listed offerings (15 hrs); at least 2 at 300-level or higher',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 17. Classical Civilization BA
  //     Total major credit hours: 30
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/classical-studies/classical-civilization-ba/
  // ===========================================================================
  'Classical Civilization BA': {
    totalCredits: 30,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Portfolio required. Up to 4 courses in Greek (GREK) or Latin (LATN) may substitute for CLST electives. 10 courses total.',
    requirements: {
      coreRequired: [
        { code: 'CLST 275', name: 'World of Classical Greece', isNew: true },                     // [NEW]
        { code: 'CLST 276', name: 'World of Classical Rome', isNew: true },                       // [NEW]
      ],
      literatureRequirement_chooseOne: [
        { code: 'CLST 271', name: 'Classical Mythology', isNew: true },                           // [NEW]
        { code: 'CLST 272', name: 'Heroes & the Classical Epics', isNew: true },                  // [NEW]
        { code: 'CLST 273', name: 'Classical Tragedy', isNew: true },                              // [NEW]
        { code: 'CLST 279', name: 'Classical Rhetoric', isNew: true },                            // [NEW]
        { code: 'CLST 280', name: 'Romance Novel in Ancient World', isNew: true },                // [NEW]
        { code: 'CLST 283', name: 'Classical Comedy & Satire', isNew: true },                     // [NEW]
      ],
      capstoneSequence: [
        { code: 'CLST 383', name: 'The Humanism of Antiquity I', isNew: true },                   // [NEW]
        { code: 'CLST 384', name: 'The Humanism of Antiquity II', isNew: true },                  // [NEW]
      ],
      electives: {
        note: '5 CLST courses at any level; up to 4 can be GREK or LATN (15 hrs)',
        count: 5,
        credits: 15,
      },
    },
  },

  // ===========================================================================
  // 18. Global Studies BA
  //     Total major credit hours: 33
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/global-studies/global-studies-ba/
  // ===========================================================================
  'Global Studies BA': {
    totalCredits: 33,
    school: 'Arts and Sciences',
    degree: 'BA',
    notes: 'Portfolio required before graduation. Intermediate-level modern foreign language proficiency (104-level) required but does not count toward 33-hr total. Up to 4 courses may overlap with other majors/minors.',
    requirements: {
      coreRequired: [
        { code: 'GLST 101', name: 'Introduction to Global Studies', isNew: true },                // [NEW]
        { code: 'ANTH 100', name: 'Globalization and Local Cultures' },
        { code: 'PLSC 102', name: 'International Relations in an Age of Globalization' },
      ],
      upperLevelCore_chooseTwo: [
        { code: 'GLST 301', name: 'Capstone in Global Studies: Directed Readings', isNew: true }, // [NEW]
        { code: 'GLST 302', name: 'States and Firms', isNew: true },
        { code: 'GLST 303', name: 'Technological Change and Society', isNew: true },
        { code: 'GLST 304', name: 'Global Civil Society and Social Movements', isNew: true },     // [NEW]
        { code: 'GLST 305', name: 'Globalization and Environmental Sustainability', isNew: true },
        { code: 'GLST 306', name: 'International Development', isNew: true },                     // [NEW]
        { code: 'GLST 370', name: 'Internship in Global Studies', isNew: true },                   // [NEW]
        { code: 'GLST 398', name: 'Topics in Global Studies', isNew: true },                       // [NEW]
      ],
      electives: {
        note: '6 elective courses (18 hrs) from GLST-tagged courses. At least 2 must focus on specific world regions. Courses from at least 3 different departments. Max 3 from any single department.',
        count: 6,
        credits: 18,
      },
    },
  },

  // ===========================================================================
  // 19. Criminal Justice and Criminology BS — SKIP (already fully covered)
  // ===========================================================================

  // ===========================================================================
  // 20. Cognitive and Behavioral Neuroscience BS
  //     Total major credit hours: 74-76
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/neuroscience/cognitive-behavioral-neuroscience-bs/
  // ===========================================================================
  'Cognitive and Behavioral Neuroscience BS': {
    totalCredits: 75,  // midpoint of 74-76
    school: 'Arts and Sciences',
    degree: 'BS',
    notes: 'Interdisciplinary program spanning biology, psychology, and computer science. Total credits 74-76 depending on course selections.',
    requirements: {
      biologyFoundation: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'BIOL 102', name: 'General Biology II' },
        { code: 'BIOL 112', name: 'General Biology II Lab' },
        { code: 'BIOL 251', name: 'Cell Biology' },
        { code: 'BIOL 282', name: 'Genetics' },
      ],
      biologyLab_chooseOne: [
        { code: 'BIOL 252', name: 'Cell Biology Laboratory', isNew: true },                       // [NEW]
        { code: 'BIOL 283', name: 'Genetics Laboratory' },
      ],
      chemistryFoundation: {
        note: 'Choose one set: CHEM 101/111, CHEM 105, or CHEM 160/161 + CHEM 102/112, CHEM 106, or CHEM 180/181',
        options: [
          { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
          { code: 'CHEM 161', name: 'Chemical Structure and Properties Laboratory' },
          { code: 'CHEM 180', name: 'Chemical Reactivity I' },
          { code: 'CHEM 181', name: 'Chemical Reactivity I Lab' },
        ],
      },
      physicsFoundation: [
        { code: 'PHYS 111', name: 'College Physics I' },
        { code: 'PHYS 111L', name: 'College Physics I Lab' },
        { code: 'PHYS 112', name: 'College Physics II' },
        { code: 'PHYS 112L', name: 'College Physics II Lab' },
      ],
      mathAndStats: [
        { code: 'MATH 131', name: 'Applied Calculus I', note: 'or MATH 161 Calculus I' },
      ],
      stats_chooseOne: [
        { code: 'BIOL 335', name: 'Intro to Biostatistics', isNew: true },                        // [NEW]
        { code: 'PSYC 304', name: 'Statistics' },
      ],
      psychologyFoundation: [
        { code: 'PSYC 101', name: 'General Psychology' },
      ],
      neuroscienceFoundation: [
        { code: 'NEUR 101', name: 'Introduction to Neuroscience' },
        { code: 'BIOL 362', name: 'Neurobiology', isNew: true },                                  // [NEW]
      ],
      behavioralCognitiveNeuroscience_chooseOne: [
        { code: 'PSYC 382', name: 'Learning and Behavior', note: 'or BIOL 284 Behavioral and Cognitive Neuroscience' },
        { code: 'BIOL 284', name: 'Behavioral and Cognitive Neuroscience', isNew: true },          // [NEW]
      ],
      seminar: [
        { code: 'NEUR 300', name: 'Seminar in Neuroscience', isNew: true },                       // [NEW]
      ],
      researchMethods: [
        { code: 'PSYC 306', name: 'Research Methods in Psychology' },
      ],
      computerScience_chooseOne: [
        { code: 'COMP 150', name: 'Introduction to Computing' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'DSCI 101', name: 'Fundamentals of Modern Data Science with R' },
      ],
      lectureElectives_chooseThree: [
        { code: 'BIOL 320', name: 'Animal Behavior', isNew: true },                               // [NEW]
        { code: 'BIOL 351', name: 'Sleep/Circadian Rhythms', isNew: true },                       // [NEW]
        { code: 'BIOL 352', name: 'Neurobiology of Feeding in Health and Disease', isNew: true },  // [NEW]
        { code: 'BIOL 357', name: 'Neural Disease, Degeneration, and Regeneration', isNew: true }, // [NEW]
        { code: 'PSYC 240', name: 'Psychology-Biology of Perception', note: 'or BIOL 240' },
        { code: 'PSYC 251', name: 'Psychology of Language' },
        { code: 'PSYC 332', name: 'Health Psychology', isNew: true },                             // [NEW]
        { code: 'PSYC 350', name: 'Psychopharmacology', isNew: true },                            // [NEW]
        { code: 'PSYC 352', name: 'Neuropsychology', isNew: true },                               // [NEW]
        { code: 'PSYC 355', name: 'Neuroethics', isNew: true, note: 'or PHIL 355' },              // [NEW]
        { code: 'PSYC 378', name: 'Perception and Action', isNew: true },                         // [NEW]
        { code: 'PSYC 383', name: 'Computational Modeling', isNew: true, note: 'or COMP 386' },   // [NEW]
      ],
      labElectives_chooseTwo: [
        { code: 'NEUR 301', name: 'Laboratory in Neuroscience I', isNew: true, note: 'or BIOL 373 or PSYC 388' }, // [NEW]
        { code: 'PSYC 311', name: 'Advanced Lab (option 1)', note: 'Lab in Psychobiology / BIOL 313' },
        { code: 'PSYC 312', name: 'Advanced Lab (option 2)', note: 'Lab in Cognitive Neuroscience' },
        { code: 'PSYC 313', name: 'Advanced Lab (option 3)', note: 'Lab in Behavioral Neuroscience' },
        { code: 'PSYC 314', name: 'Advanced Lab (option 4)', note: 'Lab in Experimental Psych: Cognition' },
        { code: 'PSYC 316', name: 'Advanced Lab (option 6)', note: 'Lab in Experimental Psych: Sense & Perception' },
        { code: 'PSYC 384', name: 'Computational Modeling of the Brain', isNew: true, note: 'or COMP 389' }, // [NEW]
      ],
      capstone: [
        { code: 'PSYC 387', name: 'Seminar in Behavioral and Cognitive Neurosciences', isNew: true }, // [NEW]
      ],
    },
  },

};

// =============================================================================
// SUMMARY OF ALL NEW COURSES (not in Database.js)
// =============================================================================
//
// ANTH: 101, 103, 104, 105, 106, 207, 208, 211, 212, 213, 214, 215, 216, 217,
//       220, 222, 224, 225, 231, 241, 242, 243, 244, 245, 246, 247, 303, 304,
//       305, 306, 307, 309, 314, 316, 317, 319, 321, 324, 325, 326, 327, 330,
//       332, 342, 348, 356, 360, 361, 363, 365, 366
//
// ENGL: 307, 317, 318, 319, 326, 327, 354, 355, 357, 390, 392, 397, 398
//
// FREN: 250, 251, 270, 271, 301, 302, 317
//
// HIST: 101, 102, 103, 104, 208, 209, 210, 211, 212, 213, 299
//
// PHIL: 130, 181, 182, 274, 283, 284, 285, 286, 287, 288, 289, 301, 304, 309,
//       311, 321, 322, 324, 325, 329, 330, 355, 369, 375, 380, 381, 382, 383,
//       384, 385, 386, 387, 388, 391, 393, 395, 396, 397, 398, 399
//
// PLSC (additional): 202, 203, 204, 215, 218, 232, 236, 238, 251, 252, 300A,
//       300B, 300C, 300D, 303, 306, 308, 309, 310B, 312, 313, 314, 316, 317,
//       318, 319, 321, 322, 323, 324, 326, 327, 328, 329, 330, 331, 332, 333,
//       334, 335, 337, 339, 340, 344, 345, 346, 348, 349, 351, 352, 354, 355C,
//       356, 357, 358, 358D, 359, 360, 365, 366, 367, 368, 369, 371, 372, 373,
//       374, 376, 377, 378, 379, 380, 384, 385, 387, 388, 389, 390, 392, 393, 398
//
// SOCL: 101, 205, 206, 210, 212, 215, 216, 222, 225, 230, 234, 240, 250, 252,
//       255, 260, 261, 265, 272, 278, 301, 302, 304, 306, 365, 370
//
// SPAN: 250, 251, 252, 253, 270, 271, 272
//
// THEO: 100, 107, 185, 186, 203, 204, 231, 232, 265, 266, 267, 272, 278, 279,
//       280, 281, 282, 293, 295, 297, 299, 302, 303, 304, 311, 313, 317, 318,
//       340, 342, 343, 344, 350, 352, 353, 356, 365, 366, 373, 393
//
// WSGS: 101, 201, 330, 380, 391, 398, 399
//
// CLST: 271, 272, 273, 275, 276, 279, 280, 283, 383, 384
//
// GLST: 101, 301, 302, 303, 304, 305, 306, 370, 398
//
// BIOL (new for CBN): 252, 284, 320, 335, 351, 352, 357, 362
//
// NEUR (new): 300, 301
//
// PSYC (new for CBN): 332, 350, 352, 355, 378, 383, 384, 387
