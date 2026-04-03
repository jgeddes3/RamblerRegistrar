// =============================================================================
// Quinlan School of Business - Remaining BBA Major-Specific Requirements
// Source: catalog.luc.edu (fetched March 2026)
//
// These are the MAJOR-SPECIFIC courses only. All Quinlan BBA programs share:
//   Business Core: ACCT 201, ACCT 202, ECON 201, ECON 202, FINC 301/334,
//     INFS 247, INFS 343, ISSCM 241, LREB 315, MARK 201, MGMT 201,
//     MGMT 304, SCMG 232
//   Program Requirements: COMM 103, MATH 130/131, ETHC 341, QUIN 101,
//     QUIN 102, QUIN 202
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENTREPRENEURSHIP BBA  (Total: 75 credit hours | Major: 15 hours)
//    Required: 3 courses (9 hrs) + 2 electives (6 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const entrepreneurshipRequired = [
  { code: 'ENTR 201', name: 'Introduction to Entrepreneurship' },
  { code: 'ENTR 345', name: 'Entrepreneurial Marketing' },
  { code: 'ENTR 390', name: 'Entrepreneurship Strategies - Capstone' },
];

export const entrepreneurshipElectives = [
  // Select 2 (6 hrs); max one ENTR 399
  { code: 'ENTR 311', name: 'Social Entrepreneurship' },
  { code: 'ENTR 313', name: 'Entrepreneurship - Global Opportunity Scan' },
  { code: 'ISSCM 349', name: 'Project Management' },
  { code: 'ENTR 395', name: 'Independent Study' },
  { code: 'ENTR 399', name: 'Selected Topics in Entrepreneurship' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. HUMAN RESOURCE MANAGEMENT BBA  (Total: 75 credit hours | Major: 15 hours)
//    Required: 1 course (3 hrs) + 4 electives (12 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const humanResourceManagementRequired = [
  { code: 'HRER 301', name: 'Principles of HR Management' },  // already in DB
];

export const humanResourceManagementElectives = [
  // Select 4 (12 hrs)
  { code: 'HRER 311', name: 'Employment Relations' },
  { code: 'HRER 313', name: 'Compensation Management' },
  { code: 'HRER 317', name: 'Human Resource Staffing' },
  { code: 'HRER 322', name: 'Human Resource Development' },
  { code: 'HRER 329', name: 'Global HR and Organizational Behavior' },
  { code: 'HRER 364', name: 'Negotiations for HR Professionals' },
  { code: 'HRER 395', name: 'Independent Study in Human Resources and Employment Relations' },
  { code: 'HRER 399', name: 'Special Topics in Human Resources and Employment Relations' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. INFORMATION SYSTEMS AND ANALYTICS BBA  (Total: 78 credit hours | Major: 18 hours)
//    Required: 3 courses (9 hrs) + 1 programming choice (3 hrs) + 2 electives (6 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const informationSystemsRequired = [
  { code: 'INFS 346', name: 'Database & Data Warehousing Systems' },
  { code: 'INFS 347', name: 'Systems Analysis & Design' },
  { code: 'INFS 360', name: 'Data Visualization & Business Intelligence' },
];

export const informationSystemsProgrammingChoice = [
  // Select 1 (3 hrs)
  { code: 'INFS 394', name: 'Programming in Python' },
  { code: 'INFS 397', name: 'VBA Programming with MS Office' },
];

export const informationSystemsElectives = [
  // Select 2 (6 hrs); the unchosen programming course may count as one
  { code: 'INFS 336', name: 'Global Perspectives on Digital Business' },
  { code: 'INFS 348', name: 'Advanced Data Analytics and AI' },
  { code: 'INFS 362', name: 'User Experience (UX) and Biometrics' },
  { code: 'INFS 395', name: 'Independent Study in Information Systems' },
  { code: 'INFS 399', name: 'Special Topics in Information Systems' },
  { code: 'ISSCM 349', name: 'Project Management' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERNATIONAL BUSINESS BBA  (Total: 75 credit hours | Major: 18 hours)
//    Required: 2 courses (6 hrs) + 4 electives (12 hrs)
//    Unique: Mandatory study abroad (min 1 semester), foreign language through 103-level
// ─────────────────────────────────────────────────────────────────────────────
export const internationalBusinessRequired = [
  { code: 'IBUS 201', name: 'Introduction to International Business' },
  { code: 'IBUS 315', name: 'International Management' },
];

export const internationalBusinessElectives = [
  // Select 4 (12 hrs)
  { code: 'ACCT 306', name: 'Advanced Financial Accounting' },
  { code: 'ECON 323', name: 'International Economics' },
  { code: 'ECON 324', name: 'International Monetary Relations' },
  { code: 'ECON 325', name: 'Economics of Growth & Development' },
  { code: 'ENTR 313', name: 'Entrepreneurship - Global Opportunity Scan' },
  { code: 'FINC 355', name: 'International Finance Management' },
  { code: 'HRER 329', name: 'Global HR and Organizational Behavior' },
  { code: 'INFS 336', name: 'Global Perspectives on Digital Business' },
  { code: 'MARK 363', name: 'International Marketing' },
  { code: 'SCMG 338', name: 'Global Supply Chain Management I' },
  { code: 'SPRT 345', name: 'Globalization of Sport Industry' },
  { code: 'ANTH 100', name: 'Globalization and Local Cultures' },
  { code: 'ANTH 102', name: 'Culture, Society, and Diversity' },
  { code: 'PLSC 350', name: 'Politics of International Economic Relations' },
  { code: 'PLSC 362', name: 'Politics Developing Societies' },
  { code: 'PLSC 363', name: 'International Politics' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. SPORT MANAGEMENT BBA  (Total: 78 credit hours | Major: 18 hours)
//    Required: 1 course (3 hrs) + 5 electives (15 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const sportManagementRequired = [
  { code: 'SPRT 130', name: 'The Business of Sports' },
];

export const sportManagementElectives = [
  // Select 5 (15 hrs); max one SPRT 399
  { code: 'SPRT 320', name: 'Social Aspects of Sport Management' },
  { code: 'SPRT 335', name: 'Fundamentals of Sport Finance' },
  { code: 'SPRT 339', name: 'Sports Facility Management and Operations' },
  { code: 'SPRT 345', name: 'Globalization of Sport Industry' },
  { code: 'SPRT 365', name: 'Fundamentals Sport Marketing' },
  { code: 'SPRT 375', name: 'Sport Media' },
  { code: 'SPRT 380', name: 'Legal Aspects in Sport Management' },
  { code: 'SPRT 385', name: 'Sport Analytics' },
  { code: 'SPRT 395', name: 'Independent Study' },
  { code: 'SPRT 399', name: 'Special Topics in Sport Management' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUPPLY CHAIN MANAGEMENT BBA  (Total: 78 credit hours | Major: 18 hours)
//    Required: 2 courses + 1 seminar (6 hrs + 0 hrs)
//    + 3 primary electives (9 hrs) + 1 additional elective (3 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const supplyChainManagementRequired = [
  { code: 'SCMG 338', name: 'Global Supply Chain Management I' },
  { code: 'SCMG 340', name: 'Global Supply Chain Management II' },
  { code: 'SCMG 396', name: 'Supply Chain Seminar' },  // 0 credit hours
];

export const supplyChainManagementPrimaryElectives = [
  // Select at least 3 (9 hrs)
  { code: 'SCMG 337', name: 'Fundamentals of Lean Production' },
  { code: 'SCMG 341', name: 'Quality Management & Continuing Improvement' },
  { code: 'SCMG 342', name: 'Supply Chain Modeling' },
  { code: 'SCMG 346', name: 'Sustainable Supply Chain' },
  { code: 'SCMG 383', name: 'Management of Service Operations' },
];

export const supplyChainManagementAdditionalElectives = [
  // Select 1 (3 hrs), or a 4th from the primary electives above
  { code: 'INFS 347', name: 'Systems Analysis & Design' },
  { code: 'ISSCM 349', name: 'Project Management' },
  { code: 'ISSCM 393', name: 'Requirements Analysis and Communication' },
  { code: 'SCMG 395', name: 'Independent Study in Operations Management' },
  { code: 'SCMG 399', name: 'Special Topics in Operations Management' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 7. ECONOMICS BBA  (Total: 78 credit hours | Major: 18 hours)
//    Required: 2 courses (6 hrs) + 4 electives (12 hrs)
// ─────────────────────────────────────────────────────────────────────────────
export const economicsRequired = [
  { code: 'ECON 303', name: 'Intermediate Microeconomics' },  // already in DB
  { code: 'ECON 304', name: 'Intermediate Macroeconomics' },
];

export const economicsElectives = [
  // Select 4 (12 hrs)
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
];

// ─────────────────────────────────────────────────────────────────────────────
// 8. ACCOUNTING AND ANALYTICS BBA  (Total: 84 credit hours | Major: 24 hours)
//    Required: 5 courses (15 hrs) + 3 analytics electives (9 hrs)
//    Note: CPA-track students take additional courses (ACCT 304, 306, 307, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const accountingAnalyticsRequired = [
  { code: 'ACCT 303', name: 'Intermediate Accounting I' },    // already in DB
  { code: 'ACCT 311', name: 'Auditing & Internal Control Systems' },  // already in DB
  { code: 'ACCT 317', name: 'Managerial Accounting' },        // already in DB
  { code: 'ACCT 328', name: 'Concepts in Taxation' },         // already in DB
  { code: 'INFS 346', name: 'Database & Data Warehousing Systems' },
];

export const accountingAnalyticsElectives = [
  // Select 3 (9 hrs)
  { code: 'INFS 348', name: 'Advanced Data Analytics and AI' },
  { code: 'INFS 360', name: 'Data Visualization & Business Intelligence' },
  { code: 'INFS 394', name: 'Programming in Python' },
  { code: 'SCMG 489', name: 'Supply Chain Analytics' },
  { code: 'INFS 494', name: 'Data Mining' },
  { code: 'INFS 791', name: 'Programming for Business Decision Making' },
];

// Optional CPA-track additional courses (not required for the BBA itself)
export const accountingAnalyticsCPATrack = [
  { code: 'ACCT 304', name: 'Intermediate Accounting II' },   // already in DB
  { code: 'ACCT 306', name: 'Advanced Financial Accounting' },
  { code: 'ACCT 307', name: 'Adv Accounting: Not-For-Profit Entities & Adv Financial Accounting Topics' },
  { code: 'ACCT 308', name: 'Accounting Information Systems and Sustainability Reporting' },
  { code: 'ACCT 323', name: 'Advanced CPA Topics' },
  { code: 'ACCT 326', name: 'Fraud Investigation' },
  { code: 'ACCT 341', name: 'Advanced Studies in Taxation' },
  { code: 'ACCT 399', name: 'Special Topics in Accounting' },
];


// =============================================================================
// NEW COURSES NOT YET IN Database.js
// These courses appear in the programs above but are not yet in the courses table.
// They need to be added to Database.js seedCourses() to be usable.
// =============================================================================
export const newCourses = [
  // --- ENTR (Entrepreneurship) ---
  { code: 'ENTR 201', name: 'Introduction to Entrepreneurship' },
  { code: 'ENTR 311', name: 'Social Entrepreneurship' },
  { code: 'ENTR 313', name: 'Entrepreneurship - Global Opportunity Scan' },
  { code: 'ENTR 345', name: 'Entrepreneurial Marketing' },
  { code: 'ENTR 390', name: 'Entrepreneurship Strategies - Capstone' },
  { code: 'ENTR 395', name: 'Independent Study' },
  { code: 'ENTR 399', name: 'Selected Topics in Entrepreneurship' },

  // --- HRER (Human Resource and Employment Relations) ---
  // HRER 301 already in DB
  { code: 'HRER 311', name: 'Employment Relations' },
  { code: 'HRER 313', name: 'Compensation Management' },
  { code: 'HRER 317', name: 'Human Resource Staffing' },
  { code: 'HRER 322', name: 'Human Resource Development' },
  { code: 'HRER 329', name: 'Global HR and Organizational Behavior' },
  { code: 'HRER 364', name: 'Negotiations for HR Professionals' },
  { code: 'HRER 395', name: 'Independent Study in Human Resources and Employment Relations' },
  { code: 'HRER 399', name: 'Special Topics in Human Resources and Employment Relations' },

  // --- INFS (Information Systems) ---
  // INFS 247, INFS 343 already in DB
  { code: 'INFS 336', name: 'Global Perspectives on Digital Business' },
  { code: 'INFS 346', name: 'Database & Data Warehousing Systems' },
  { code: 'INFS 347', name: 'Systems Analysis & Design' },
  { code: 'INFS 348', name: 'Advanced Data Analytics and AI' },
  { code: 'INFS 360', name: 'Data Visualization & Business Intelligence' },
  { code: 'INFS 362', name: 'User Experience (UX) and Biometrics' },
  { code: 'INFS 394', name: 'Programming in Python' },
  { code: 'INFS 395', name: 'Independent Study in Information Systems' },
  { code: 'INFS 397', name: 'VBA Programming with MS Office' },
  { code: 'INFS 399', name: 'Special Topics in Information Systems' },
  { code: 'INFS 494', name: 'Data Mining' },
  { code: 'INFS 791', name: 'Programming for Business Decision Making' },

  // --- IBUS (International Business) ---
  { code: 'IBUS 201', name: 'Introduction to International Business' },
  { code: 'IBUS 315', name: 'International Management' },

  // --- SPRT (Sport Management) ---
  { code: 'SPRT 130', name: 'The Business of Sports' },
  { code: 'SPRT 320', name: 'Social Aspects of Sport Management' },
  { code: 'SPRT 335', name: 'Fundamentals of Sport Finance' },
  { code: 'SPRT 339', name: 'Sports Facility Management and Operations' },
  { code: 'SPRT 345', name: 'Globalization of Sport Industry' },
  { code: 'SPRT 365', name: 'Fundamentals Sport Marketing' },
  { code: 'SPRT 375', name: 'Sport Media' },
  { code: 'SPRT 380', name: 'Legal Aspects in Sport Management' },
  { code: 'SPRT 385', name: 'Sport Analytics' },
  { code: 'SPRT 395', name: 'Independent Study' },
  { code: 'SPRT 399', name: 'Special Topics in Sport Management' },

  // --- SCMG (Supply Chain Management) ---
  // SCMG 232 already in DB
  { code: 'SCMG 337', name: 'Fundamentals of Lean Production' },
  { code: 'SCMG 338', name: 'Global Supply Chain Management I' },
  { code: 'SCMG 340', name: 'Global Supply Chain Management II' },
  { code: 'SCMG 341', name: 'Quality Management & Continuing Improvement' },
  { code: 'SCMG 342', name: 'Supply Chain Modeling' },
  { code: 'SCMG 346', name: 'Sustainable Supply Chain' },
  { code: 'SCMG 383', name: 'Management of Service Operations' },
  { code: 'SCMG 395', name: 'Independent Study in Operations Management' },
  { code: 'SCMG 396', name: 'Supply Chain Seminar' },
  { code: 'SCMG 399', name: 'Special Topics in Operations Management' },
  { code: 'SCMG 489', name: 'Supply Chain Analytics' },

  // --- ISSCM (Information Systems and Supply Chain Management) ---
  // ISSCM 241 already in DB
  { code: 'ISSCM 349', name: 'Project Management' },
  { code: 'ISSCM 393', name: 'Requirements Analysis and Communication' },

  // --- ECON (Economics) ---
  // ECON 201, 202, 303 already in DB
  { code: 'ECON 304', name: 'Intermediate Macroeconomics' },
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

  // --- ACCT (Accounting) - new ones not already in DB ---
  // ACCT 201, 202, 303, 304, 311, 317, 328 already in DB
  { code: 'ACCT 306', name: 'Advanced Financial Accounting' },
  { code: 'ACCT 307', name: 'Adv Accounting: Not-For-Profit Entities & Adv Financial Accounting Topics' },
  { code: 'ACCT 308', name: 'Accounting Information Systems and Sustainability Reporting' },
  { code: 'ACCT 323', name: 'Advanced CPA Topics' },
  { code: 'ACCT 326', name: 'Fraud Investigation' },
  { code: 'ACCT 341', name: 'Advanced Studies in Taxation' },
  { code: 'ACCT 399', name: 'Special Topics in Accounting' },

  // --- MARK (Marketing) ---
  // MARK 201, 310, 311, 390 already in DB
  { code: 'MARK 363', name: 'International Marketing' },

  // --- FINC (Finance) ---
  // FINC 301, 334, 335 already in DB
  { code: 'FINC 355', name: 'International Finance Management' },

  // --- MATH ---
  // MATH 110, 118, 130, 131, 132 already in DB
  { code: 'MATH 360', name: 'Introduction to Game Theory' },

  // --- PLSC (Political Science) - new ones for IBUS electives ---
  // PLSC 102 already in DB
  { code: 'PLSC 350', name: 'Politics of International Economic Relations' },
  { code: 'PLSC 362', name: 'Politics Developing Societies' },
  { code: 'PLSC 363', name: 'International Politics' },

  // --- ANTH (Anthropology) - used in IBUS electives ---
  { code: 'ANTH 100', name: 'Globalization and Local Cultures' },
  { code: 'ANTH 102', name: 'Culture, Society, and Diversity' },
];
