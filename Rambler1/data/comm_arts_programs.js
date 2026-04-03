// =============================================================================
// School of Communication + Fine & Performing Arts Programs
// Loyola University Chicago (catalog.luc.edu)
//
// Researched 2026-04-01
//
// Courses marked  isNew: true  are NOT already in Database.js.
// Courses without isNew already exist in Database.js.
//
// Communication Studies BA is intentionally OMITTED (already done).
// =============================================================================

export const COMM_ARTS_PROGRAMS = {

  // ===========================================================================
  // SCHOOL OF COMMUNICATION
  // ===========================================================================
  //
  // All SOC programs share these Foundation Courses (10 credit hours):
  //   COMM 100  SOC Career Prep Seminar (1)
  //   COMM 175  Introduction to Communication (3)
  //   COMM 200  Digital Communication and Society (3)
  //   COMM 215  Ethics & Communication (3)
  //
  // All SOC students must also complete:
  //   - Two Writing Intensive courses (6 hrs)
  //   - Foreign language at 102-level or higher (3 hrs) OR competency test
  //   - University Core
  //   - At least one Engaged Learning course
  //   - UNIV 101 (standard undergraduates)
  // ===========================================================================

  // ===========================================================================
  // 1. Advertising Creative BA
  //    Total major credit hours: 52
  //    Source: catalog.luc.edu/undergraduate/communication/advertising-creative/advertising-creative-ba/
  // ===========================================================================
  'Advertising Creative BA': {
    totalCredits: 52,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Professional portfolio development required (Portfolio I and Portfolio II courses)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      socFoundation: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 215', name: 'Ethics & Communication' },
      ],
      coreRequired: [
        { code: 'COMM 210', name: 'Principles of Public Relations', isNew: true },           // [NEW]
        { code: 'COMM 211', name: 'Principles of Advertising', isNew: true },                // [NEW]
        { code: 'COMM 213', name: 'Digital Foundations', isNew: true },                       // [NEW]
        { code: 'MARK 201', name: 'Principles of Marketing' },
      ],
      researchCourse_chooseOne: [
        { code: 'COMM 363', name: 'Research Methods in Advertising/Public Relations', isNew: true }, // [NEW]
        { code: 'ISSCM 241', name: 'Business Statistics' },
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
      ],
      specializedFocus: [
        { code: 'COMM 214', name: 'Introduction to Creative Concepts 1', isNew: true },      // [NEW]
        { code: 'COMM 266', name: 'Advertising Copywriting', isNew: true },                  // [NEW]
        { code: 'COMM 290', name: 'Branding and Positioning', isNew: true },                 // [NEW]
        { code: 'COMM 329', name: 'Advertising and Public Relations Design', isNew: true },  // [NEW] (or COMM 330)
        { code: 'COMM 344', name: 'Portfolio I', isNew: true },                              // [NEW]
      ],
      internshipCapstone: [
        { code: 'COMM 389', name: 'Advertising Creative Capstone: Portfolio II', isNew: true }, // [NEW]
        { code: 'COMM 391', name: 'Advertising/Public Relations Internship', isNew: true },  // [NEW]
      ],
      electives: {
        note: 'Two electives from approved list (6 hrs); at least one must be a COMM course',
        options: [
          { code: 'COMM 330', name: 'Intermediate Advertising Design', isNew: true },        // [NEW]
        ],
      },
    },
  },

  // ===========================================================================
  // 2. Advertising & Public Relations BA
  //    Total major credit hours: 46
  //    Source: catalog.luc.edu/undergraduate/communication/advertising-public-relations/public-relations-ba/
  // ===========================================================================
  'Advertising & Public Relations BA': {
    totalCredits: 46,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Students choose one of three tracks: Advertising, Public Relations, or Integrated',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      socFoundation: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 215', name: 'Ethics & Communication' },
      ],
      coreRequired: [
        { code: 'COMM 210', name: 'Principles of Public Relations', isNew: true },           // [NEW]
        { code: 'COMM 211', name: 'Principles of Advertising', isNew: true },                // [NEW]
        { code: 'COMM 213', name: 'Digital Foundations', isNew: true },                       // [NEW]
        { code: 'MARK 201', name: 'Principles of Marketing' },
      ],
      researchCourse_chooseOne: [
        { code: 'COMM 363', name: 'Research Methods in Advertising/Public Relations', isNew: true }, // [NEW]
        { code: 'ISSCM 241', name: 'Business Statistics' },
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
      ],
      advertisingTrack: [
        { code: 'COMM 214', name: 'Introduction to Creative Concepts 1', isNew: true },      // [NEW]
        { code: 'COMM 317', name: 'Media Planning', isNew: true },                           // [NEW]
        { code: 'COMM 331', name: 'Social Media Advertising', isNew: true },                 // [NEW]
        { code: 'COMM 334', name: 'Mobile Advertising', isNew: true },                       // [NEW]
        { code: 'COMM 336', name: 'Search & Display Advertising', isNew: true },             // [NEW]
      ],
      publicRelationsTrack: [
        { code: 'COMM 314', name: 'Public Relations Cases', isNew: true },                   // [NEW]
        { code: 'COMM 318', name: 'Public Relations Writing 1', isNew: true },               // [NEW]
        { code: 'COMM 313', name: 'Corporate and Organizational Communication', isNew: true }, // [NEW]
        { code: 'COMM 320', name: 'Public Service Communication' },
        { code: 'COMM 375', name: 'Media Relations', isNew: true },                          // [NEW]
      ],
      integratedTrack: {
        note: 'Choose 3 courses from the combined Advertising and PR track lists above (9 hrs)',
      },
      internshipCapstone: [
        { code: 'COMM 386', name: 'Advertising/Public Relations Capstone', isNew: true },    // [NEW]
        { code: 'COMM 391', name: 'Advertising/Public Relations Internship', isNew: true },  // [NEW]
      ],
      electives: {
        note: 'Two COMM electives from approved list (6 hrs)',
        communicationOptions: [
          { code: 'COMM 101', name: 'Public Speaking & Critical Thinking', isNew: true },    // [NEW]
          { code: 'COMM 103', name: 'Business & Professional Speaking' },
          { code: 'COMM 205', name: 'Reporting Basics I: Writing and Interviewing', isNew: true }, // [NEW]
          { code: 'COMM 212', name: 'International Advertising', isNew: true },              // [NEW]
          { code: 'COMM 266', name: 'Advertising Copywriting', isNew: true },                // [NEW]
          { code: 'COMM 268', name: 'Persuasion' },
          { code: 'COMM 278', name: 'International Public Relations', isNew: true },         // [NEW]
          { code: 'COMM 282', name: 'Media Law', isNew: true },                              // [NEW]
          { code: 'COMM 290', name: 'Branding and Positioning', isNew: true },               // [NEW]
          { code: 'COMM 296', name: 'Themes in Advertising/Public Relations', isNew: true }, // [NEW]
          { code: 'COMM 311', name: 'Health Communication', isNew: true },                   // [NEW]
          { code: 'COMM 312', name: 'Special Events Planning', isNew: true },                // [NEW]
          { code: 'COMM 321', name: 'Advertising Campaigns', isNew: true },                  // [NEW]
          { code: 'COMM 329', name: 'Advertising and Public Relations Design', isNew: true }, // [NEW]
          { code: 'COMM 330', name: 'Intermediate Advertising Design', isNew: true },        // [NEW]
          { code: 'COMM 335', name: 'AI in Advertising', isNew: true },                      // [NEW]
          { code: 'COMM 337', name: 'AD/PR Multimedia Commercial Production', isNew: true }, // [NEW]
          { code: 'COMM 345', name: 'Student Agency', isNew: true },                         // [NEW]
          { code: 'COMM 370', name: 'Special Topics in Advertising & Public Relations', isNew: true }, // [NEW]
          { code: 'COMM 398', name: 'Directed Study', isNew: true },                         // [NEW]
        ],
        interdisciplinaryOptions: [
          { code: 'FNAR 132', name: 'Visual Communication I', isNew: true },                 // [NEW]
          { code: 'FNAR 233', name: 'Digital Media Design', isNew: true },                   // [NEW]
          { code: 'FNAR 383', name: 'Interactive Design', isNew: true },                     // [NEW]
          { code: 'MARK 310', name: 'Consumer Behavior' },
          { code: 'MARK 311', name: 'Marketing Research' },
          { code: 'MARK 363', name: 'International Marketing' },
          { code: 'MARK 380', name: 'Digital Marketing', isNew: true },                      // [NEW]
        ],
      },
    },
  },

  // ===========================================================================
  // 3. Advocacy and Social Change BA
  //    Total major credit hours: 43
  //    Source: catalog.luc.edu/undergraduate/communication/advocacy-social-change/advocacy-social-change-ba/
  // ===========================================================================
  'Advocacy and Social Change BA': {
    totalCredits: 43,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      socFoundation: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 215', name: 'Ethics & Communication' },
        // Note: COMM 360 can substitute for COMM 215
      ],
      theoryCriticalAnalysis_chooseThree: {
        note: 'Choose 3 courses (9 hrs); one must be COMM 220 or COMM 268',
        options: [
          { code: 'COMM 201', name: 'Media Theory and Criticism' },
          { code: 'COMM 220', name: 'Introduction to Rhetoric' },
          { code: 'COMM 227', name: 'Social Justice & Communication' },
          { code: 'COMM 258', name: 'Game Studies' },
          { code: 'COMM 268', name: 'Persuasion' },
          { code: 'COMM 272', name: 'Intercultural Communication' },
          { code: 'COMM 277', name: 'Organizational Communication' },
          { code: 'COMM 280', name: 'Media Technology & Society' },
          { code: 'COMM 379', name: 'Digital Sustainability' },
        ],
      },
      appliedCourses: {
        note: 'COMM 230 required + choose 2 more (9 hrs total)',
        required: [
          { code: 'COMM 230', name: 'Argumentation & Advocacy' },
        ],
        chooseTwo: [
          { code: 'COMM 231', name: 'Conflict Management and Communication' },
          { code: 'COMM 236', name: 'Persuasive Presentations' },
          { code: 'COMM 237', name: 'Small Group Communication' },
          { code: 'COMM 306', name: 'Environmental Advocacy' },
          { code: 'COMM 309', name: 'Designing Media for Social Change' },
          { code: 'COMM 323', name: 'Remixing Culture' },
        ],
      },
      researchMethods_chooseOne: [
        { code: 'COMM 361', name: 'New Media Criticism' },
        { code: 'COMM 365', name: 'Naturalistic Methods Communication Research' },
        { code: 'COMM 367', name: 'Rhetorical Criticism' },
        { code: 'COMM 368', name: 'Ethnographic Research Methods in Communication' },
      ],
      electives: {
        note: 'Four additional elective courses from approved COMM list (12 hrs)',
      },
    },
  },

  // ===========================================================================
  // 4. Film and Digital Media: Film and Media Production Track BA
  //    Total major credit hours: 43
  //    Source: catalog.luc.edu/undergraduate/communication/film-digital-media/film-media-production-track-ba/
  // ===========================================================================
  'Film and Digital Media: Film and Media Production Track BA': {
    totalCredits: 43,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      coreRequired: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 130', name: 'Intro to Audio Production', isNew: true },                // [NEW]
        { code: 'COMM 135', name: 'Intro to Video Production', isNew: true },                // [NEW]
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 201', name: 'Media Theory and Criticism' },
        { code: 'COMM 202', name: 'Story for Film and Television 1', isNew: true },          // [NEW]
        { code: 'COMM 274', name: 'Introduction to Cinema', isNew: true },                   // [NEW]
        { code: 'COMM 350', name: 'Producing for Film & Digital Media', isNew: true },       // [NEW]
      ],
      productionElectives_chooseTwo: {
        note: 'Choose 2 production electives (6 hrs)',
        options: [
          { code: 'COMM 205', name: 'Reporting Basics I: Writing and Interviewing', isNew: true },
          { code: 'COMM 207', name: 'Photojournalism', isNew: true },                        // [NEW]
          { code: 'COMM 210', name: 'Principles of Public Relations', isNew: true },
          { code: 'COMM 211', name: 'Principles of Advertising', isNew: true },
          { code: 'COMM 232', name: 'Radio Production', isNew: true },                       // [NEW]
          { code: 'COMM 275', name: 'Web Design and Usability', isNew: true },               // [NEW]
          { code: 'COMM 299', name: 'Special Topics: Film Production', isNew: true },        // [NEW]
          { code: 'COMM 308', name: 'Advanced Audio Production', isNew: true },              // [NEW]
          { code: 'COMM 310', name: 'Cinematography', isNew: true },                         // [NEW]
          { code: 'COMM 326', name: 'Directing', isNew: true },                              // [NEW]
          { code: 'COMM 333', name: 'Digital Editing', isNew: true },                        // [NEW]
          { code: 'COMM 337', name: 'AD/PR Multimedia Commercial Production', isNew: true },
          { code: 'COMM 338', name: 'Advanced Film Production', isNew: true },               // [NEW]
          { code: 'COMM 339', name: 'Video Documentary' },
          { code: 'COMM 345', name: 'Student Agency', isNew: true },
          { code: 'COMM 357', name: 'Programming Film & Media: Festivals, TV & Digital', isNew: true }, // [NEW]
          { code: 'COMM 359', name: 'Virtual Production', isNew: true },                     // [NEW]
          { code: 'COMM 373', name: 'Digital Storytelling Abroad', isNew: true },             // [NEW]
          { code: 'COMM 374', name: 'Film Production Abroad', isNew: true },                 // [NEW]
          { code: 'COMM 384', name: 'Advanced Directing', isNew: true },                     // [NEW]
          { code: 'COMM 405', name: 'Graduate Production Workshop', isNew: true },           // [NEW]
          { code: 'COMM 425', name: 'Graduate Directing Workshop', isNew: true },            // [NEW]
          { code: 'COMP 125', name: 'Visual Information Processing' },
          { code: 'COMP 150', name: 'Introduction to Computing' },
          { code: 'FNAR 132', name: 'Visual Communication I', isNew: true },
          { code: 'FNAR 219', name: 'Photography: Digital Imaging', isNew: true },           // [NEW]
          { code: 'FNAR 232', name: 'Visual Communication II', isNew: true },                // [NEW]
          { code: 'FNAR 233', name: 'Digital Media Design', isNew: true },
          { code: 'FNAR 234', name: 'Animation Fundamentals', isNew: true },                 // [NEW]
          { code: 'FNAR 332', name: 'Visual Communication III', isNew: true },               // [NEW]
          { code: 'FNAR 334', name: 'Motion Design', isNew: true },                          // [NEW]
          { code: 'FNAR 383', name: 'Interactive Design', isNew: true },
          { code: 'MUSC 122', name: 'Music for Film and Television', isNew: true },          // [NEW]
          { code: 'MUSC 201', name: 'Electronic Music', isNew: true },                       // [NEW]
          { code: 'MUSC 246', name: 'Music Technology', isNew: true },                       // [NEW]
          { code: 'THTR 204', name: 'Stagecraft', isNew: true },                             // [NEW]
          { code: 'THTR 252', name: 'Theatrical Design I', isNew: true },                    // [NEW]
          { code: 'THTR 261', name: 'Beginning Acting', isNew: true },                       // [NEW]
        ],
      },
      mediaStudiesElectives_chooseTwo: {
        note: 'Choose 2 media studies electives (6 hrs)',
        options: [
          { code: 'COMM 203', name: 'Topics in Cinema History', isNew: true },               // [NEW]
          { code: 'COMM 258', name: 'Game Studies' },
          { code: 'COMM 261', name: 'Perspectives on International Media', isNew: true },    // [NEW]
          { code: 'COMM 280', name: 'Media Technology & Society' },
          { code: 'COMM 322', name: 'International Cinema', isNew: true },                   // [NEW]
          { code: 'COMM 323', name: 'Remixing Culture' },
          { code: 'COMM 324', name: 'Film Genre', isNew: true },                             // [NEW]
          { code: 'COMM 360', name: 'Digital Media Ethics', isNew: true },                   // [NEW]
          { code: 'COMM 361', name: 'New Media Criticism' },
        ],
      },
      internship: [
        { code: 'COMM 394', name: 'Film & Digital Media Internship', isNew: true },          // [NEW]
      ],
      capstone_chooseOne: [
        { code: 'COMM 338', name: 'Advanced Film Production', isNew: true },
        { code: 'COMM 339', name: 'Video Documentary' },
        { code: 'COMM 388', name: 'Film and Digital Media Capstone', isNew: true },          // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 5. Film and Digital Media: International Programming Track BA
  //    Total major credit hours: 43
  //    Source: catalog.luc.edu/undergraduate/communication/film-digital-media/international-programming-track-ba/
  // ===========================================================================
  'Film and Digital Media: International Programming Track BA': {
    totalCredits: 43,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      coreRequired: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 201', name: 'Media Theory and Criticism' },
        { code: 'COMM 202', name: 'Story for Film and Television 1', isNew: true },
        { code: 'COMM 274', name: 'Introduction to Cinema', isNew: true },
        { code: 'COMM 350', name: 'Producing for Film & Digital Media', isNew: true },
      ],
      productionCourse_chooseOne: [
        { code: 'COMM 130', name: 'Intro to Audio Production', isNew: true },
        { code: 'COMM 135', name: 'Intro to Video Production', isNew: true },
        { code: 'COMM 275', name: 'Web Design and Usability', isNew: true },
      ],
      mediaStudiesRequired_chooseOne: [
        { code: 'COMM 203', name: 'Topics in Cinema History', isNew: true },
        { code: 'COMM 324', name: 'Film Genre', isNew: true },
      ],
      mediaStudiesElectives_chooseThree: {
        note: 'Choose 3 media studies electives (9 hrs)',
        options: [
          { code: 'COMM 203', name: 'Topics in Cinema History', isNew: true },
          { code: 'COMM 258', name: 'Game Studies' },
          { code: 'COMM 261', name: 'Perspectives on International Media', isNew: true },
          { code: 'COMM 280', name: 'Media Technology & Society' },
          { code: 'COMM 322', name: 'International Cinema', isNew: true },
          { code: 'COMM 323', name: 'Remixing Culture' },
          { code: 'COMM 324', name: 'Film Genre', isNew: true },
          { code: 'COMM 360', name: 'Digital Media Ethics', isNew: true },
          { code: 'COMM 361', name: 'New Media Criticism' },
          { code: 'ENGL 359', name: 'Film and Literature', isNew: true },                    // [NEW]
          { code: 'FNAR 365', name: 'History of Photography', isNew: true },                 // [NEW]
          { code: 'FNAR 390', name: 'Art History: Methods and Research', isNew: true },       // [NEW]
          { code: 'GERM 370', name: 'German Cinema', isNew: true },                          // [NEW]
          { code: 'LITR 204', name: 'Literature and Film', isNew: true },                    // [NEW]
          { code: 'LITR 219', name: 'Media and Culture', isNew: true },                      // [NEW]
          { code: 'LITR 244', name: 'Topics in Literature and Film', isNew: true },          // [NEW]
          { code: 'LITR 264', name: 'Topics in Global Literature', isNew: true },            // [NEW]
          { code: 'LITR 267', name: 'World Literature', isNew: true },                       // [NEW]
          { code: 'LITR 284', name: 'Topics in Literary Studies', isNew: true },             // [NEW]
        ],
      },
      majorElectives_chooseTwo: {
        note: 'Choose 2 major electives from production, media studies, or additional options (6 hrs)',
      },
      internship: [
        { code: 'COMM 394', name: 'Film & Digital Media Internship', isNew: true },
      ],
      capstone_chooseOne: [
        { code: 'COMM 357', name: 'Programming Film & Media: Festivals, TV & Digital', isNew: true },
        { code: 'COMM 388', name: 'Film and Digital Media Capstone', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 6. Multimedia Journalism BA
  //    Total major credit hours: 46
  //    Source: catalog.luc.edu/undergraduate/communication/multimedia-journalism/multimedia-journalism-ba/
  // ===========================================================================
  'Multimedia Journalism BA': {
    totalCredits: 46,
    school: 'Communication',
    degree: 'BA',
    specialRequirements: [
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
      'Access to Convergence Studio, Owl Lab, and WLUW radio station',
    ],
    requirements: {
      socFoundation: [
        { code: 'COMM 100', name: 'SOC Career Prep Seminar' },
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 215', name: 'Ethics & Communication' },
      ],
      journalismFoundation: [
        { code: 'COMM 145', name: 'Video for Journalists', isNew: true },                    // [NEW]
        { code: 'COMM 205', name: 'Reporting Basics I: Writing and Interviewing', isNew: true }, // [NEW]
        { code: 'COMM 208', name: 'Reporting Basics II: Technology for Journalists', isNew: true }, // [NEW]
      ],
      researchMethods: [
        { code: 'COMM 362', name: 'Multimedia Journalism Research Methods', isNew: true },   // [NEW]
      ],
      values: [
        { code: 'COMM 279', name: 'Critical Issues in Journalism', isNew: true },            // [NEW]
        { code: 'COMM 282', name: 'Media Law', isNew: true },                                // [NEW]
      ],
      intermediateCourses_chooseThree: {
        note: 'Choose 3 from the following (9 hrs)',
        options: [
          { code: 'COMM 207', name: 'Photojournalism', isNew: true },
          { code: 'COMM 256', name: 'Broadcast Newswriting', isNew: true },                  // [NEW]
          { code: 'COMM 259', name: 'News Editing', isNew: true },                           // [NEW]
          { code: 'COMM 260', name: 'Environmental Journalism', isNew: true },               // [NEW]
          { code: 'COMM 262', name: 'Feature & Opinion Writing', isNew: true },              // [NEW]
          { code: 'COMM 263', name: 'Editorial Design I: Newspaper & Online', isNew: true }, // [NEW]
          { code: 'COMM 265', name: 'Sports Broadcasting', isNew: true },                    // [NEW]
          { code: 'COMM 275', name: 'Web Design and Usability', isNew: true },
          { code: 'COMM 311', name: 'Health Communication', isNew: true },
          { code: 'COMM 372', name: 'Special Topics: Multimedia Journalism', isNew: true },  // [NEW]
        ],
      },
      advancedCourses_chooseTwo: {
        note: 'Choose 2 from the following (6 hrs)',
        options: [
          { code: 'COMM 315', name: 'Advanced Reporting Topics', isNew: true },              // [NEW]
          { code: 'COMM 327', name: 'Mastering Video Reporting and Storytelling', isNew: true }, // [NEW]
          { code: 'COMM 328', name: 'Editorial Design II: Magazine & Interactive', isNew: true }, // [NEW]
          { code: 'COMM 332', name: 'Investigative & Public Affairs Reporting', isNew: true }, // [NEW]
          { code: 'COMM 339', name: 'Video Documentary' },
          { code: 'COMM 358', name: 'Newscasting and Producing', isNew: true },              // [NEW]
          { code: 'COMM 373', name: 'Digital Storytelling Abroad', isNew: true },
          { code: 'COMM 398', name: 'Directed Study', isNew: true },
        ],
      },
      internship: [
        { code: 'COMM 392', name: 'Multimedia Journalism Internship', isNew: true },         // [NEW]
      ],
    },
  },

  // ===========================================================================
  // FINE AND PERFORMING ARTS (College of Arts and Sciences)
  // ===========================================================================
  //
  // All College of Arts & Sciences students must complete:
  //   - Two Writing Intensive courses (6 hrs)
  //   - Foreign language at 102-level or higher (3 hrs) or competency test
  //   - University Core
  //   - At least one Engaged Learning course
  //   - UNIV 101 (standard undergraduates)
  // ===========================================================================

  // ===========================================================================
  // 7. Art History BA
  //    Total major credit hours: 42
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/art-history-ba/
  // ===========================================================================
  'Art History BA': {
    totalCredits: 42,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Senior thesis required (FNAR 391)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'FNAR 199', name: 'Art and Visual Culture', isNew: true },                   // [NEW]
        { code: 'FNAR 200', name: 'Global Art History: Prehistoric to 600 CE', isNew: true }, // [NEW]
        { code: 'FNAR 201', name: 'Global Art History: 600-1800CE', isNew: true },           // [NEW]
        { code: 'FNAR 202', name: 'Global Art History: Modern Art', isNew: true },           // [NEW]
      ],
      studioArt_chooseOne: [
        { code: 'FNAR 113', name: 'Drawing I', isNew: true },                                // [NEW]
        { code: 'FNAR 114', name: 'Painting I', isNew: true },                               // [NEW]
        { code: 'FNAR 120', name: 'Ceramics: Handbuilding', isNew: true },                   // [NEW]
        { code: 'FNAR 121', name: 'Ceramics: Wheelthrowing', isNew: true },                  // [NEW]
        { code: 'FNAR 124', name: 'Sculpture Foundations', isNew: true },                     // [NEW]
      ],
      earlyModernArt_chooseOne: [
        { code: 'FNAR 338', name: 'Medieval Art', isNew: true },                             // [NEW]
        { code: 'FNAR 343', name: 'Baroque Art', isNew: true },                              // [NEW]
        { code: 'FNAR 344', name: 'Early Italian Renaissance Art', isNew: true },            // [NEW]
        { code: 'FNAR 345', name: 'Italian High Renaissance and Mannerist Art', isNew: true }, // [NEW]
        { code: 'FNAR 349', name: 'Art and the Catholic Tradition', isNew: true },           // [NEW]
        { code: 'FNAR 360', name: 'Picturing Women in Renaissance and Baroque Art', isNew: true }, // [NEW]
      ],
      nonWesternArt_chooseTwo: [
        { code: 'FNAR 351', name: 'Latin American Art I: Ancient to 19th Century', isNew: true }, // [NEW]
        { code: 'FNAR 352', name: 'Islam and Visual Culture', isNew: true },                 // [NEW]
        { code: 'FNAR 355', name: 'Art of Africa', isNew: true },                            // [NEW]
        { code: 'FNAR 357', name: 'South Asian Visual Culture', isNew: true },               // [NEW]
        { code: 'FNAR 358', name: 'Chinese Art and Culture', isNew: true },                  // [NEW]
        { code: 'FNAR 359', name: 'Japanese Art and Culture', isNew: true },                 // [NEW]
      ],
      modernArtWestern_chooseOne: [
        { code: 'FNAR 207', name: 'Women, Art, and Society', isNew: true },                  // [NEW]
        { code: 'FNAR 304', name: 'Paris in the Nineteenth Century', isNew: true },          // [NEW]
        { code: 'FNAR 305', name: 'American Art to 1945', isNew: true },                     // [NEW]
        { code: 'FNAR 306', name: 'Contemporary Art 1945-Present', isNew: true },           // [NEW]
        { code: 'FNAR 365', name: 'History of Photography', isNew: true },                   // [NEW]
      ],
      artHistoryElectives: {
        note: 'Three additional art history courses from above lists (9 hrs)',
      },
      capstone: [
        { code: 'FNAR 390', name: 'Art History: Methods and Research', isNew: true },        // [NEW]
        { code: 'FNAR 391', name: 'Senior Thesis in Art History', isNew: true },             // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 8. Dance BA
  //    Total major credit hours: 40
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/dance-ba/
  // ===========================================================================
  'Dance BA': {
    totalCredits: 40,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Senior Showcase Capstone performance required (DANC 380)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
      'Multiple courses require repeat enrollment (e.g., Ballet IV x4, Ballet V x4)',
    ],
    requirements: {
      foundationCourses: [
        { code: 'DANC 250', name: 'Historical Contexts in Contemporary Dance Practice', isNew: true }, // [NEW]
        { code: 'DANC 270', name: 'Dance Kinesiology', isNew: true },                        // [NEW]
        { code: 'THTR 321C', name: 'Practicum: Costumes', isNew: true },                     // [NEW] (or THTR 321E)
      ],
      appliedCourses: [
        { code: 'DANC 224', name: 'Majors Modern II', isNew: true },                         // [NEW] (repeat 2x, 1 hr each)
        { code: 'DANC 232', name: 'Jazz Dance II: Theories and Techniques', isNew: true },   // [NEW] (or DANC 331; 2 hrs)
        { code: 'DANC 275', name: 'Global Influences on Contemporary Dance Practice', isNew: true }, // [NEW] (2 hrs)
        { code: 'DANC 312', name: 'Pointe I: Theory and Techniques', isNew: true },          // [NEW] (repeat 2x, 1 hr each; or DANC 314)
        { code: 'DANC 314', name: 'Pointe II: Continuing Pointework', isNew: true },         // [NEW]
        { code: 'DANC 324', name: 'Modern III: Theory and Techniques', isNew: true },        // [NEW] (repeat 2x, 1 hr each)
        { code: 'DANC 331', name: 'Jazz Dance III: Intermediate Jazz Dance Theories and Techniques', isNew: true }, // [NEW]
        { code: 'DANC 341', name: 'Ballet IV: Anatomical Foundations and Cultural Context', isNew: true }, // [NEW] (repeat 4x, 1 hr each)
        { code: 'DANC 343', name: 'Ballet V: Advancing Ballet: Contemporary Methodologies in Applied Ballet', isNew: true }, // [NEW] (repeat 4x, 1 hr each)
      ],
      electives_4hrs: {
        note: 'Choose 4 hrs from the following',
        options: [
          { code: 'DANC 260', name: 'Topics in Dance', isNew: true },                        // [NEW]
          { code: 'DANC 261', name: 'Topics in Applied Dance', isNew: true },                // [NEW]
          { code: 'DANC 280', name: 'Dance & Disability: Interdisciplinary Theory & Applied Movement Practices', isNew: true }, // [NEW]
          { code: 'DANC 395', name: 'Independent Study', isNew: true },                      // [NEW]
          { code: 'DANC 397', name: 'Fieldwork in Chicago - Dance', isNew: true },           // [NEW]
          { code: 'DANC 398', name: 'Research in Dance', isNew: true },                      // [NEW]
        ],
      },
      synthesisCourses: [
        { code: 'DANC 323', name: 'Rehearsal and Performance', isNew: true },                // [NEW] (repeat 2x, 1 hr each)
        { code: 'DANC 360', name: 'Dance Pedagogy', isNew: true },                           // [NEW]
        { code: 'DANC 370', name: 'Dance Composition', isNew: true },                        // [NEW]
        { code: 'DANC 380', name: 'Senior Showcase Capstone', isNew: true },                 // [NEW]
        { code: 'DANC 394', name: 'Internship in Dance', isNew: true },                      // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 9. Drawing, Painting and Printmaking BA
  //    Total major credit hours: 45
  //    Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/drawing-painting-printmaking-ba/
  // ===========================================================================
  'Drawing, Painting and Printmaking BA': {
    totalCredits: 45,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Capstone exhibition/portfolio required (FNAR 398)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'FNAR 110', name: 'Foundations of Visual Art', isNew: true },                 // [NEW]
        { code: 'FNAR 113', name: 'Drawing I', isNew: true },                                // [NEW]
      ],
      artHistory: [
        { code: 'FNAR 201', name: 'Global Art History: 600-1800CE', isNew: true },
        { code: 'FNAR 202', name: 'Global Art History: Modern Art', isNew: true },
      ],
      appliedCourses: [
        { code: 'FNAR 114', name: 'Painting I', isNew: true },                               // [NEW]
        { code: 'FNAR 115', name: 'Foundations of Photography', isNew: true },                // [NEW]
        { code: 'FNAR 118', name: 'Printmaking I', isNew: true },                            // [NEW]
        { code: 'FNAR 213', name: 'Drawing II', isNew: true },                               // [NEW]
        { code: 'FNAR 214', name: 'Painting II', isNew: true },                              // [NEW]
        { code: 'FNAR 311', name: 'Advanced Studio', isNew: true },                          // [NEW]
      ],
      appliedChoices: [
        { code: 'FNAR 120', name: 'Ceramics: Handbuilding', isNew: true, note: 'or FNAR 124 Sculpture Foundations' },
        { code: 'FNAR 190', name: 'Color Theory', isNew: true, note: 'or FNAR 233 Digital Media Design' },
      ],
      synthesisCourses: [
        { code: 'FNAR 388', name: 'Critical Approaches to Visual Art', isNew: true },        // [NEW]
        { code: 'FNAR 398', name: 'Fine Arts Capstone', isNew: true },                       // [NEW]
      ],
      elective_chooseOne: [
        { code: 'FNAR 218', name: 'Printmaking II', isNew: true },                           // [NEW]
        { code: 'FNAR 368', name: 'Fine Arts Internship', isNew: true },                     // [NEW]
      ],
    },
  },

  // ===========================================================================
  // 10. Music BA
  //     Total major credit hours: 42
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/music-ba/
  // ===========================================================================
  'Music BA': {
    totalCredits: 42,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Solo recital (MUSC 387) or Lecture/Recital (MUSC 388) capstone required',
      'Applied music lessons preferably on same instrument throughout',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      musicTheory: [
        { code: 'MUSC 144', name: 'Music Theory I', isNew: true },                           // [NEW]
        { code: 'MUSC 145', name: 'Musicianship Lab I', isNew: true },                       // [NEW]
        { code: 'MUSC 244', name: 'Music Theory II', isNew: true },                          // [NEW]
        { code: 'MUSC 245', name: 'Musicianship Lab II', isNew: true },                      // [NEW]
        { code: 'MUSC 344', name: 'Music Theory III', isNew: true },                         // [NEW]
      ],
      musicHistory: {
        required: [
          { code: 'MUSC 353', name: 'Music History II', isNew: true },                       // [NEW]
        ],
        chooseOne: [
          { code: 'MUSC 252', name: 'Music History I', isNew: true },                        // [NEW]
          { code: 'MUSC 256', name: 'Jazz Music History', isNew: true },                     // [NEW]
          { code: 'MUSC 354', name: 'Music History III', isNew: true },                      // [NEW]
        ],
      },
      appliedMusicLessons: {
        note: '6 credits from MUSC 280A-Z or MUSC 380A-Z (various instruments)',
        options: [
          { code: 'MUSC 280', name: 'Applied Music Lessons (various instruments)', isNew: true }, // [NEW]
          { code: 'MUSC 380', name: 'Advanced Applied Music Lessons (various instruments)', isNew: true }, // [NEW]
        ],
      },
      ensembles: {
        note: '6 credits from ensemble courses',
        options: [
          { code: 'MUSC 105', name: 'University Chorale', isNew: true },                     // [NEW]
          { code: 'MUSC 107', name: 'Concert Choir', isNew: true },                          // [NEW]
          { code: 'MUSC 108', name: 'Loyola Symphony Orchestra', isNew: true },              // [NEW]
          { code: 'MUSC 109', name: 'Jazz Ensemble', isNew: true },                          // [NEW]
          { code: 'MUSC 110', name: 'Chamber Music', isNew: true },                          // [NEW]
          { code: 'MUSC 111', name: 'Wind Ensemble', isNew: true },                          // [NEW]
          { code: 'MUSC 207', name: 'Vocal Jazz Ensemble', isNew: true },                    // [NEW]
          { code: 'MUSC 289', name: 'Accompanying', isNew: true },                           // [NEW]
          { code: 'MUSC 290', name: 'Jazz Combo', isNew: true },                             // [NEW]
        ],
      },
      seniorCapstone_chooseOne: [
        { code: 'MUSC 387', name: 'Solo Recital', isNew: true },                             // [NEW]
        { code: 'MUSC 388', name: 'Lecture/Recital', isNew: true },                          // [NEW]
      ],
      generalMusicElectives: {
        note: '12 credits of general music electives',
      },
    },
  },

  // ===========================================================================
  // 11. Music with Jazz Studies Concentration BA
  //     Total major credit hours: 39
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/jazz-studies-concentration/
  // ===========================================================================
  'Music with Jazz Studies Concentration BA': {
    totalCredits: 39,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Solo recital required as capstone (MUSC 387)',
      'Performance degree preparing students for jazz performance careers',
      'Applied music credits preferably on same instrument; multiple approved case-by-case',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      musicTheory: [
        { code: 'MUSC 144', name: 'Music Theory I', isNew: true },
        { code: 'MUSC 145', name: 'Musicianship Lab I', isNew: true },
        { code: 'MUSC 244', name: 'Music Theory II', isNew: true },
        { code: 'MUSC 245', name: 'Musicianship Lab II', isNew: true },
        { code: 'MUSC 344', name: 'Music Theory III', isNew: true },
      ],
      musicHistory: [
        { code: 'MUSC 256', name: 'Jazz Music History', isNew: true },
        { code: 'MUSC 353', name: 'Music History II', isNew: true },
      ],
      appliedMusicLessons: {
        note: '6 credits from MUSC 280A-Z or MUSC 380A-Z',
        options: [
          { code: 'MUSC 280', name: 'Applied Music Lessons (various instruments)', isNew: true },
          { code: 'MUSC 380', name: 'Advanced Applied Music Lessons (various instruments)', isNew: true },
        ],
      },
      jazzEnsemble: {
        note: '6 credits of MUSC 109 Jazz Ensemble (1 hr each, taken 6 semesters)',
        course: { code: 'MUSC 109', name: 'Jazz Ensemble', isNew: true },
      },
      jazzStudiesCourses: [
        { code: 'MUSC 185', name: 'Jazz Improvisation', isNew: true },                       // [NEW]
        { code: 'MUSC 248', name: 'Jazz Composition and Arranging', isNew: true },           // [NEW]
        { code: 'MUSC 385', name: 'Jazz Improvisation II', isNew: true },                    // [NEW]
      ],
      seniorCapstone: [
        { code: 'MUSC 387', name: 'Solo Recital', isNew: true },
      ],
      electives: {
        note: '3 credits of additional music electives (applied lessons, ensembles, or other MUSC courses)',
      },
    },
  },

  // ===========================================================================
  // 12. Theatre BA
  //     Total major credit hours: 47
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/theatre-ba/
  // ===========================================================================
  'Theatre BA': {
    totalCredits: 47,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Capstone directing project required (THTR 375)',
      'Minimum 6 hrs practicum in various theatre production roles',
      'Transfer students must complete minimum 24 credit hours at Loyola',
      'BA (not BFA) emphasizes interdisciplinary liberal arts approach',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'THTR 203', name: 'Dramatic & Theatrical Process', isNew: true },            // [NEW] (or THTR 100)
        { code: 'THTR 252', name: 'Theatrical Design I', isNew: true },                      // [NEW]
        { code: 'THTR 261', name: 'Beginning Acting', isNew: true },                         // [NEW]
        { code: 'THTR 364', name: 'Theatre History and Literature I', isNew: true },         // [NEW]
        { code: 'THTR 365', name: 'Theatre History and Literature II', isNew: true },        // [NEW]
        { code: 'THTR 366', name: 'Theatre History and Literature III', isNew: true },       // [NEW]
        { code: 'THTR 367', name: 'Theatre History and Literature IV', isNew: true },        // [NEW]
        { code: 'THTR 375', name: 'Play Direction: Theater Capstone', isNew: true },         // [NEW]
      ],
      emphasisCourse_chooseOne: [
        { code: 'THTR 267', name: 'Acting Theories & Techniques II', isNew: true },          // [NEW]
        { code: 'THTR 352', name: 'Theatrical Design II', isNew: true },                     // [NEW]
      ],
      practicum: {
        note: 'Minimum 6 credit hours from practicum courses',
        options: [
          { code: 'THTR 321C', name: 'Practicum: Costumes', isNew: true },                   // [NEW]
          { code: 'THTR 321S', name: 'Practicum: Scenic', isNew: true },                     // [NEW]
          { code: 'THTR 321E', name: 'Practicum: Electrics', isNew: true },                  // [NEW]
          { code: 'THTR 321R', name: 'Theatre Practicum: Running Crew', isNew: true },       // [NEW]
          { code: 'THTR 321P', name: 'Theatre Practicum: Production Staff', isNew: true },   // [NEW]
        ],
      },
      electives: {
        note: '12 credits of THTR electives; minimum 3 hrs must be Engaged Learning',
      },
    },
  },

  // ===========================================================================
  // 13. Photography and Video Art BA
  //     Total major credit hours: 45
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/photography-video-art-ba/
  // ===========================================================================
  'Photography and Video Art BA': {
    totalCredits: 45,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Students must develop cohesive bodies of work for public presentations and build portfolios',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'FNAR 110', name: 'Foundations of Visual Art', isNew: true },
        { code: 'FNAR 113', name: 'Drawing I', isNew: true },
      ],
      artHistory: [
        { code: 'FNAR 365', name: 'History of Photography', isNew: true },
        { code: 'FNAR 202', name: 'Global Art History: Modern Art', isNew: true, note: 'or FNAR 306 Contemporary Art 1945-Present' },
      ],
      appliedCourses: [
        { code: 'FNAR 115', name: 'Foundations of Photography', isNew: true },
        { code: 'FNAR 216', name: 'Lighting Techniques for Photography and Video Art', isNew: true }, // [NEW]
        { code: 'FNAR 219', name: 'Photography: Digital Imaging', isNew: true },             // [NEW]
        { code: 'FNAR 315', name: 'Photography: Films and Cameras', isNew: true },           // [NEW]
        { code: 'FNAR 320', name: 'Video Art', isNew: true },                                // [NEW]
        { code: 'FNAR 132', name: 'Visual Communication I', isNew: true, note: 'or FNAR 233 Digital Media Design' },
        { code: 'FNAR 114', name: 'Painting I', isNew: true, note: 'or FNAR 118 Printmaking I' },
        { code: 'FNAR 124', name: 'Sculpture Foundations', isNew: true, note: 'or FNAR 120 Ceramics: Handbuilding' },
      ],
      synthesisCourses: [
        { code: 'FNAR 388', name: 'Critical Approaches to Visual Art', isNew: true },
        { code: 'FNAR 398', name: 'Fine Arts Capstone', isNew: true },
      ],
      elective: {
        note: 'One additional studio or art history course not previously taken (3 hrs)',
      },
    },
  },

  // ===========================================================================
  // 14. Sculpture and Ceramics BA
  //     Total major credit hours: 42
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/sculpture-ceramics-ba/
  // ===========================================================================
  'Sculpture and Ceramics BA': {
    totalCredits: 42,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Capstone exhibition/portfolio required (FNAR 398)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'FNAR 110', name: 'Foundations of Visual Art', isNew: true },
        { code: 'FNAR 113', name: 'Drawing I', isNew: true },
      ],
      artHistory: [
        { code: 'FNAR 200', name: 'Global Art History: Prehistoric to 600 CE', isNew: true, note: 'or FNAR 201' },
        { code: 'FNAR 202', name: 'Global Art History: Modern Art', isNew: true },
      ],
      appliedCourses: [
        { code: 'FNAR 115', name: 'Foundations of Photography', isNew: true },
        { code: 'FNAR 120', name: 'Ceramics: Handbuilding', isNew: true, note: 'or FNAR 121 Ceramics: Wheelthrowing' },
        { code: 'FNAR 124', name: 'Sculpture Foundations', isNew: true },
        { code: 'FNAR 222', name: 'Sculpture/Ceramics: Intermediate Ceramics', isNew: true }, // [NEW]
        { code: 'FNAR 322', name: 'Sculpture & Ceramics: Advanced Studio', isNew: true },   // [NEW]
      ],
      appliedChoices: [
        { code: 'FNAR 114', name: 'Painting I', isNew: true, note: 'or FNAR 118 Printmaking I' },
        { code: 'FNAR 132', name: 'Visual Communication I', isNew: true, note: 'or FNAR 190 Color Theory' },
      ],
      studioElective_chooseOne: [
        { code: 'FNAR 120', name: 'Ceramics: Handbuilding', isNew: true },
        { code: 'FNAR 121', name: 'Ceramics: Wheelthrowing', isNew: true },
        { code: 'FNAR 123', name: 'Sculpture: Metal Casting and Fabrication', isNew: true }, // [NEW]
        { code: 'FNAR 368', name: 'Fine Arts Internship', isNew: true },
      ],
      synthesisCourses: [
        { code: 'FNAR 388', name: 'Critical Approaches to Visual Art', isNew: true },
        { code: 'FNAR 398', name: 'Fine Arts Capstone', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 15. Visual Communication BA
  //     Total major credit hours: 45
  //     Source: catalog.luc.edu/undergraduate/arts-sciences/fine-performing-arts/visual-communication-ba/
  // ===========================================================================
  'Visual Communication BA': {
    totalCredits: 45,
    school: 'Arts and Sciences',
    degree: 'BA',
    specialRequirements: [
      'Internship required (FNAR 380)',
      'Two Writing Intensive courses (6 hrs)',
      'Foreign language at 102-level or higher (3 hrs) or competency test',
    ],
    requirements: {
      foundationCourses: [
        { code: 'FNAR 113', name: 'Drawing I', isNew: true },
        { code: 'FNAR 112', name: 'Two-Dimensional Design', isNew: true },                   // [NEW]
        { code: 'FNAR 190', name: 'Color Theory', isNew: true },                             // [NEW]
      ],
      artHistory_chooseOne: [
        { code: 'FNAR 202', name: 'Global Art History: Modern Art', isNew: true },
        { code: 'FNAR 364', name: 'History of Graphic Design', isNew: true },                // [NEW]
      ],
      appliedCourses: [
        { code: 'FNAR 115', name: 'Foundations of Photography', isNew: true },
        { code: 'FNAR 132', name: 'Visual Communication I', isNew: true },
        { code: 'FNAR 232', name: 'Visual Communication II', isNew: true },                  // [NEW]
        { code: 'FNAR 233', name: 'Digital Media Design', isNew: true },                     // [NEW]
        { code: 'FNAR 332', name: 'Visual Communication III', isNew: true },                 // [NEW]
        { code: 'FNAR 333', name: 'Explorations in Typography', isNew: true },               // [NEW]
        { code: 'FNAR 334', name: 'Motion Design', isNew: true },                            // [NEW]
        { code: 'FNAR 382', name: 'Visual Communication IV', isNew: true },                  // [NEW]
        { code: 'FNAR 383', name: 'Interactive Design', isNew: true },                       // [NEW]
      ],
      synthesisCourses: [
        { code: 'FNAR 380', name: 'Internship I', isNew: true },                             // [NEW]
        { code: 'FNAR 398', name: 'Fine Arts Capstone', isNew: true },
      ],
    },
  },

};

// =============================================================================
// SUMMARY OF ALL NEW COURSES (not already in Database.js)
// =============================================================================
//
// NEW COMM courses (School of Communication):
//   COMM 101  Public Speaking & Critical Thinking
//   COMM 130  Intro to Audio Production
//   COMM 135  Intro to Video Production
//   COMM 145  Video for Journalists
//   COMM 202  Story for Film and Television 1
//   COMM 203  Topics in Cinema History
//   COMM 205  Reporting Basics I: Writing and Interviewing
//   COMM 207  Photojournalism
//   COMM 208  Reporting Basics II: Technology for Journalists
//   COMM 210  Principles of Public Relations
//   COMM 211  Principles of Advertising
//   COMM 212  International Advertising
//   COMM 213  Digital Foundations
//   COMM 214  Introduction to Creative Concepts 1
//   COMM 232  Radio Production
//   COMM 256  Broadcast Newswriting
//   COMM 259  News Editing
//   COMM 260  Environmental Journalism
//   COMM 261  Perspectives on International Media
//   COMM 262  Feature & Opinion Writing
//   COMM 263  Editorial Design I: Newspaper & Online
//   COMM 265  Sports Broadcasting
//   COMM 266  Advertising Copywriting
//   COMM 274  Introduction to Cinema
//   COMM 275  Web Design and Usability
//   COMM 278  International Public Relations
//   COMM 279  Critical Issues in Journalism
//   COMM 282  Media Law
//   COMM 290  Branding and Positioning
//   COMM 296  Themes in Advertising/Public Relations
//   COMM 299  Special Topics: Film Production
//   COMM 308  Advanced Audio Production
//   COMM 310  Cinematography
//   COMM 311  Health Communication
//   COMM 312  Special Events Planning
//   COMM 313  Corporate and Organizational Communication
//   COMM 314  Public Relations Cases
//   COMM 315  Advanced Reporting Topics
//   COMM 317  Media Planning
//   COMM 318  Public Relations Writing 1
//   COMM 321  Advertising Campaigns
//   COMM 322  International Cinema
//   COMM 324  Film Genre
//   COMM 326  Directing
//   COMM 327  Mastering Video Reporting and Storytelling
//   COMM 328  Editorial Design II: Magazine & Interactive
//   COMM 329  Advertising and Public Relations Design
//   COMM 330  Intermediate Advertising Design
//   COMM 331  Social Media Advertising
//   COMM 332  Investigative & Public Affairs Reporting
//   COMM 333  Digital Editing
//   COMM 334  Mobile Advertising
//   COMM 335  AI in Advertising
//   COMM 336  Search & Display Advertising
//   COMM 337  AD/PR Multimedia Commercial Production
//   COMM 338  Advanced Film Production
//   COMM 344  Portfolio I
//   COMM 345  Student Agency
//   COMM 350  Producing for Film & Digital Media
//   COMM 357  Programming Film & Media: Festivals, TV & Digital
//   COMM 358  Newscasting and Producing
//   COMM 359  Virtual Production
//   COMM 360  Digital Media Ethics
//   COMM 362  Multimedia Journalism Research Methods
//   COMM 363  Research Methods in Advertising/Public Relations
//   COMM 370  Special Topics in Advertising & Public Relations
//   COMM 372  Special Topics: Multimedia Journalism
//   COMM 373  Digital Storytelling Abroad
//   COMM 374  Film Production Abroad
//   COMM 375  Media Relations
//   COMM 384  Advanced Directing
//   COMM 386  Advertising/Public Relations Capstone
//   COMM 388  Film and Digital Media Capstone
//   COMM 389  Advertising Creative Capstone: Portfolio II
//   COMM 391  Advertising/Public Relations Internship
//   COMM 392  Multimedia Journalism Internship
//   COMM 394  Film & Digital Media Internship
//   COMM 398  Directed Study
//   COMM 405  Graduate Production Workshop
//   COMM 425  Graduate Directing Workshop
//
// NEW FNAR courses (Fine Arts):
//   FNAR 110  Foundations of Visual Art
//   FNAR 112  Two-Dimensional Design
//   FNAR 113  Drawing I
//   FNAR 114  Painting I
//   FNAR 115  Foundations of Photography
//   FNAR 118  Printmaking I
//   FNAR 120  Ceramics: Handbuilding
//   FNAR 121  Ceramics: Wheelthrowing
//   FNAR 123  Sculpture: Metal Casting and Fabrication
//   FNAR 124  Sculpture Foundations
//   FNAR 132  Visual Communication I
//   FNAR 190  Color Theory
//   FNAR 199  Art and Visual Culture
//   FNAR 200  Global Art History: Prehistoric to 600 CE
//   FNAR 201  Global Art History: 600-1800CE
//   FNAR 202  Global Art History: Modern Art
//   FNAR 207  Women, Art, and Society
//   FNAR 213  Drawing II
//   FNAR 214  Painting II
//   FNAR 216  Lighting Techniques for Photography and Video Art
//   FNAR 218  Printmaking II
//   FNAR 219  Photography: Digital Imaging
//   FNAR 222  Sculpture/Ceramics: Intermediate Ceramics
//   FNAR 232  Visual Communication II
//   FNAR 233  Digital Media Design
//   FNAR 234  Animation Fundamentals
//   FNAR 304  Paris in the Nineteenth Century
//   FNAR 305  American Art to 1945
//   FNAR 306  Contemporary Art 1945-Present
//   FNAR 311  Advanced Studio
//   FNAR 315  Photography: Films and Cameras
//   FNAR 320  Video Art
//   FNAR 322  Sculpture & Ceramics: Advanced Studio
//   FNAR 332  Visual Communication III
//   FNAR 333  Explorations in Typography
//   FNAR 334  Motion Design
//   FNAR 338  Medieval Art
//   FNAR 343  Baroque Art
//   FNAR 344  Early Italian Renaissance Art
//   FNAR 345  Italian High Renaissance and Mannerist Art
//   FNAR 349  Art and the Catholic Tradition
//   FNAR 351  Latin American Art I: Ancient to 19th Century
//   FNAR 352  Islam and Visual Culture
//   FNAR 355  Art of Africa
//   FNAR 357  South Asian Visual Culture
//   FNAR 358  Chinese Art and Culture
//   FNAR 359  Japanese Art and Culture
//   FNAR 360  Picturing Women in Renaissance and Baroque Art
//   FNAR 364  History of Graphic Design
//   FNAR 365  History of Photography
//   FNAR 368  Fine Arts Internship
//   FNAR 380  Internship I
//   FNAR 382  Visual Communication IV
//   FNAR 383  Interactive Design
//   FNAR 388  Critical Approaches to Visual Art
//   FNAR 390  Art History: Methods and Research
//   FNAR 391  Senior Thesis in Art History
//   FNAR 398  Fine Arts Capstone
//
// NEW DANC courses (Dance):
//   DANC 224  Majors Modern II
//   DANC 232  Jazz Dance II: Theories and Techniques
//   DANC 250  Historical Contexts in Contemporary Dance Practice
//   DANC 260  Topics in Dance
//   DANC 261  Topics in Applied Dance
//   DANC 270  Dance Kinesiology
//   DANC 275  Global Influences on Contemporary Dance Practice
//   DANC 280  Dance & Disability: Interdisciplinary Theory & Applied Movement Practices
//   DANC 312  Pointe I: Theory and Techniques
//   DANC 314  Pointe II: Continuing Pointework
//   DANC 323  Rehearsal and Performance
//   DANC 324  Modern III: Theory and Techniques
//   DANC 331  Jazz Dance III: Intermediate Jazz Dance Theories and Techniques
//   DANC 341  Ballet IV: Anatomical Foundations and Cultural Context
//   DANC 343  Ballet V: Advancing Ballet: Contemporary Methodologies
//   DANC 360  Dance Pedagogy
//   DANC 370  Dance Composition
//   DANC 380  Senior Showcase Capstone
//   DANC 394  Internship in Dance
//   DANC 395  Independent Study
//   DANC 397  Fieldwork in Chicago - Dance
//   DANC 398  Research in Dance
//
// NEW MUSC courses (Music):
//   MUSC 105  University Chorale
//   MUSC 107  Concert Choir
//   MUSC 108  Loyola Symphony Orchestra
//   MUSC 109  Jazz Ensemble
//   MUSC 110  Chamber Music
//   MUSC 111  Wind Ensemble
//   MUSC 122  Music for Film and Television
//   MUSC 144  Music Theory I
//   MUSC 145  Musicianship Lab I
//   MUSC 185  Jazz Improvisation
//   MUSC 201  Electronic Music
//   MUSC 207  Vocal Jazz Ensemble
//   MUSC 244  Music Theory II
//   MUSC 245  Musicianship Lab II
//   MUSC 246  Music Technology
//   MUSC 248  Jazz Composition and Arranging
//   MUSC 252  Music History I
//   MUSC 256  Jazz Music History
//   MUSC 280  Applied Music Lessons (various instruments)
//   MUSC 289  Accompanying
//   MUSC 290  Jazz Combo
//   MUSC 344  Music Theory III
//   MUSC 353  Music History II
//   MUSC 354  Music History III
//   MUSC 380  Advanced Applied Music Lessons (various instruments)
//   MUSC 385  Jazz Improvisation II
//   MUSC 387  Solo Recital
//   MUSC 388  Lecture/Recital
//
// NEW THTR courses (Theatre):
//   THTR 100  Intro to Theatre Experience
//   THTR 203  Dramatic & Theatrical Process
//   THTR 204  Stagecraft
//   THTR 252  Theatrical Design I
//   THTR 261  Beginning Acting
//   THTR 267  Acting Theories & Techniques II
//   THTR 321C Practicum: Costumes
//   THTR 321E Practicum: Electrics
//   THTR 321P Theatre Practicum: Production Staff
//   THTR 321R Theatre Practicum: Running Crew
//   THTR 321S Practicum: Scenic
//   THTR 352  Theatrical Design II
//   THTR 364  Theatre History and Literature I
//   THTR 365  Theatre History and Literature II
//   THTR 366  Theatre History and Literature III
//   THTR 367  Theatre History and Literature IV
//   THTR 375  Play Direction: Theater Capstone
//
// NEW interdisciplinary courses:
//   ENGL 359  Film and Literature
//   GERM 370  German Cinema
//   LITR 204  Literature and Film
//   LITR 219  Media and Culture
//   LITR 244  Topics in Literature and Film
//   LITR 264  Topics in Global Literature
//   LITR 267  World Literature
//   LITR 284  Topics in Literary Studies
//   MARK 380  Digital Marketing
//
// EXISTING courses shared with these programs (already in Database.js):
//   COMM 100, COMM 103, COMM 175, COMM 200, COMM 201, COMM 204, COMM 215,
//   COMM 220, COMM 227, COMM 230, COMM 231, COMM 236, COMM 237, COMM 258,
//   COMM 268, COMM 272, COMM 277, COMM 280, COMM 306, COMM 307, COMM 309,
//   COMM 320, COMM 323, COMM 339, COMM 361, COMM 365, COMM 367, COMM 368,
//   COMM 379, COMM 381, COMM 393
//   COMP 125, COMP 150
//   ISSCM 241
//   MARK 201, MARK 310, MARK 311, MARK 363
//   STAT 103
// =============================================================================
