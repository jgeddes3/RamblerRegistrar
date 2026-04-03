// =============================================================================
// School of Education, Parkinson School of Health Sciences & Public Health,
// and School of Social Work Programs
// Loyola University Chicago (catalog.luc.edu)
//
// Researched 2026-04-01
//
// Courses marked  isNew: true  are NOT already in Database.js.
// Courses without isNew already exist in Database.js.
//
// NOTE: All Education BSEd programs share the TLLSC field-based curriculum.
// =============================================================================

export const EDUCATION_HEALTH_SW_PROGRAMS = {

  // ===========================================================================
  // SCHOOL OF EDUCATION
  // ===========================================================================
  //
  // All BSEd programs share the TLLSC (Teaching, Learning, and Leading with
  // Schools and Communities) curriculum in three phases:
  //   Phase 1 - Exploration (fieldwork in schools/communities)
  //   Phase 2 - Concentration (content-specific methods and pedagogy)
  //   Phase 3 - Specialization (one full year student teaching internship)
  //
  // All programs lead to Illinois Professional Educator License (PEL) plus
  // an ESL endorsement and International Baccalaureate (IB) certificate.
  //
  // Common TLLSC module courses shared across ALL Education BSEd programs:
  //   TLSC 110, 120, 130, 140, 150, 160 (Phase 1)
  //   TLSC 210, 221, 222, 300A, 300B   (Phase 1 continued)
  //   TLSC 310, 320, 330, 340, 350      (Phase 2/3)
  //   TLSC 360, 370, 380                (Phase 3 - Internship)
  // ===========================================================================

  // ===========================================================================
  // 1. Bilingual/Bicultural Education BSEd
  //    Total credit hours: 120
  //    Licensure: PEL Elementary Education (grades 1-6), Bilingual Education
  //               and ESL endorsements, IB certificate
  //    Source: catalog.luc.edu/undergraduate/education/bilingualbicultural-education-bsed/
  // ===========================================================================
  'Bilingual/Bicultural Education BSEd': {
    totalCredits: 120,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Must demonstrate proficiency in selected language by passing Language Proficiency test (waived for students with Seal of Biliteracy)',
      'Illinois PEL Elementary Education (grades 1-6) plus Bilingual Education and ESL endorsements',
      'International Baccalaureate (IB) certificate upon completion',
      'Grade of C or better required in all degree requirements',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 104', name: 'Mathematics for Teachers I', isNew: true },
        { code: 'CIEP 105', name: 'Mathematics for Teachers II', isNew: true },
        { code: 'CIEP 206', name: "Children's Literature", isNew: true },
        { code: 'CIEP 359', name: 'Teaching Reading', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhaseTwo: [
        { code: 'TLSC 231', name: 'Teaching Science/Writing in Elementary and Middle Grades', isNew: true },
        { code: 'TLSC 232', name: 'Integrated Teaching/Learning Social Studies & Writing in Elementary Grades', isNew: true },
        { code: 'TLSC 240', name: 'Language, Culture, and Pedagogy in Bilingual Classrooms', isNew: true },
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
      ],
      tllscPhaseThree: [
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      bilingualContentArea: [
        { code: 'SPAN 250', name: 'Composition & Conversation I' },
        { code: 'SPAN 251', name: 'Composition & Conversation II' },
        { code: 'SPAN 270', name: 'Introduction to Critical Analysis in Spanish' },
        { code: 'SPAN 271', name: 'Introduction to Iberian Literature and Culture' },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
        { code: 'PHIL 130', name: 'Philosophy & Persons' },
        { code: 'PHYS 101', name: 'Liberal Arts Physics', isNew: true },
        { code: 'PLSC 101', name: 'American Politics' },
      ],
    },
  },

  // ===========================================================================
  // 2. Early Childhood Special Education BSEd
  //    Total credit hours: 120
  //    Licensure: PEL Early Childhood Special Education
  //    Source: catalog.luc.edu/undergraduate/education/early-childhood-special-education-bsed/
  // ===========================================================================
  'Early Childhood Special Education BSEd': {
    totalCredits: 120,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Prepares students for licensure in Early Childhood Special Education',
      'Illinois PEL plus ESL endorsement and IB certificate',
      'Includes methods courses for infant/toddler/preschool and K-2 populations',
      'Grade of C or better required in all degree requirements',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 104', name: 'Mathematics for Teachers I', isNew: true },
        { code: 'CIEP 206', name: "Children's Literature", isNew: true },
        { code: 'CIEP 315', name: 'Language Development and Literacy', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      ecseMethodsCourses: [
        { code: 'CIEP M16', name: 'K-2 Literacy Methods for EC', isNew: true },
        { code: 'CIEP M17', name: 'Early Childhood Math Methods', isNew: true },
        { code: 'CIEP M42', name: 'K-2 Special Education Methods for ECSE', isNew: true },
        { code: 'CIEP M43', name: 'Special Education Methods: Infants, Toddlers and Preschoolers', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhaseTwoECSE: [
        { code: 'TLSC 250', name: 'Developmentally Appropriate Practice with Infants/Toddlers & Their Families', isNew: true },
        { code: 'TLSC 251', name: 'Family-Centered Assessment and Intervention in Early Intervention', isNew: true },
        { code: 'TLSC 252', name: 'Foundations, Settings, and Studies of Effective Early Childhood Education', isNew: true },
        { code: 'TLSC 253', name: 'Developmentally Appropriate Practice Assessment & Intervention Young Children Special Needs', isNew: true },
      ],
      tllscPhaseThree: [
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
        { code: 'PHYS 101', name: 'Liberal Arts Physics', isNew: true },
        { code: 'PLSC 101', name: 'American Politics' },
      ],
    },
  },

  // ===========================================================================
  // 3. Elementary Education BSEd
  //    Total credit hours: 120
  //    Licensure: PEL Elementary Education (grades 1-6), ESL endorsement, IB cert
  //    Source: catalog.luc.edu/undergraduate/education/elementary-education-bsed/
  // ===========================================================================
  'Elementary Education BSEd': {
    totalCredits: 120,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Illinois PEL Elementary Education (grades 1-6) plus ESL endorsement and IB certificate',
      'Must pass Illinois Elementary Education licensure exam prior to final internship semester',
      'Grade of C or better required in all degree requirements',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 104', name: 'Mathematics for Teachers I', isNew: true },
        { code: 'CIEP 105', name: 'Mathematics for Teachers II', isNew: true },
        { code: 'CIEP 206', name: "Children's Literature", isNew: true },
        { code: 'CIEP 359', name: 'Teaching Reading', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhaseTwo: [
        { code: 'TLSC 231', name: 'Teaching Science/Writing in Elementary and Middle Grades', isNew: true },
        { code: 'TLSC 232', name: 'Integrated Teaching/Learning Social Studies & Writing in Elementary Grades', isNew: true },
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
      ],
      tllscPhaseThree: [
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
        { code: 'MATH 108', name: 'Real World Modeling with Mathematics', isNew: true },
        { code: 'PHYS 101', name: 'Liberal Arts Physics', isNew: true },
        { code: 'PLSC 101', name: 'American Politics' },
      ],
    },
  },

  // ===========================================================================
  // 4. Middle Grades BSEd
  //    Total credit hours: 120-126 (varies by concentration)
  //    Concentrations: English Language Arts, Social Sciences, Science
  //    Note: Mathematics is NOT available as a middle grades content area
  //    Licensure: PEL with content area endorsement, ESL endorsement, IB cert
  //    Source: catalog.luc.edu/undergraduate/education/middle-grades-bsed/
  // ===========================================================================
  'Middle Grades BSEd': {
    totalCredits: 126,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Three concentrations available: English Language Arts, Social Sciences, Science',
      'Mathematics is NOT available as a middle grades content area',
      'Total hours vary by concentration: ELA = 126, Science = 123, Social Sciences = 120',
      'Illinois PEL with content area endorsement, ESL endorsement, IB certificate',
      'Must pass Illinois licensure test(s) for content area prior to final internship',
      'Grade of C or better required in all degree requirements',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 305', name: 'Reading Teacher Practicum', isNew: true },
        { code: 'CIEP 327', name: 'Teaching English Language Arts in the Middle Grades', isNew: true },
        { code: 'CIEP 328', name: 'Assessment and Diagnosis of Reading Problems', isNew: true },
        { code: 'CIEP 329', name: 'Materials, Resources, & Strategies for Reading Teacher', isNew: true },
        { code: 'CIEP 350', name: 'Adolescent Literature', isNew: true },
        { code: 'CIEP 351', name: 'Curriculum and Teaching in the Middle School', isNew: true },
        { code: 'CIEP 359', name: 'Teaching Reading', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhasesTwoThree: [
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      elaConcentration: [
        { code: 'ENGL 271', name: 'Exploring Poetry', isNew: true },
        { code: 'ENGL 272', name: 'Exploring Drama', isNew: true },
        { code: 'ENGL 293', name: 'Advanced Writing', isNew: true },
        { code: 'ENGL 303', name: 'Grammar: Principles & Pedagogy', isNew: true },
        { code: 'ENGL 317', name: 'The Writing of Poetry' },
        { code: 'ENGL 318', name: 'The Writing of Fiction' },
        { code: 'ENGL 326', name: 'Shakespeare: Selected Major Plays' },
      ],
      socialSciencesConcentration: [
        { code: 'HIST 101', name: 'Culture, Power and Identity: Western Ideas & Institutions to 17th Century' },
        { code: 'HIST 102', name: 'Culture, Power and Identity: Western Ideas & Institutions from 17th Century' },
        { code: 'HIST 103', name: 'American Pluralism' },
        { code: 'HIST 104', name: 'Global History Since 1500' },
        { code: 'HIST 211', name: 'US History to 1865: Themes & Issues' },
        { code: 'HIST 212', name: 'US History since 1865: Themes & Issues' },
        { code: 'SOCL 101', name: 'Society in a Global Age' },
        { code: 'PLSC 101', name: 'American Politics' },
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
      ],
      scienceConcentration: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 110', name: 'Liberal Arts Biology', isNew: true },
        { code: 'ENVS 207', name: 'Plants and People', isNew: true },
        { code: 'ENVS 218', name: 'Biodiversity & Biogeography', isNew: true },
        { code: 'ENVS 223', name: 'Soil Ecology', isNew: true },
        { code: 'ENVS 224', name: 'Climate & Climate Change', isNew: true },
        { code: 'ENVS 350', name: 'Solutions to Environmental Problems', isNew: true },
        { code: 'PHYS 101', name: 'Liberal Arts Physics', isNew: true },
        { code: 'CHEM 160', name: 'General Chemistry I (or equivalent)' },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
        { code: 'SOCL 101', name: 'Society in a Global Age' },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ANTH 104', name: 'The Human Ecological Footprint' },
      ],
    },
  },

  // ===========================================================================
  // 5. Secondary Education BSEd
  //    Total credit hours: 132-138 (varies by content area)
  //    Content Areas: English, History, Mathematics, Political Science, Psychology
  //    Licensure: PEL Secondary Education with content area endorsement,
  //               ESL endorsement, IB certificate
  //    Source: catalog.luc.edu/undergraduate/education/secondary-education-bsed/
  // ===========================================================================
  'Secondary Education BSEd': {
    totalCredits: 138,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Five content area concentrations: English (132 hrs), History (135 hrs), Mathematics (138 hrs), Political Science, Psychology',
      'Students complete a full content area major within the College of Arts & Sciences',
      'Illinois PEL Secondary Education with content area endorsement, ESL endorsement, IB certificate',
      'Must pass Illinois licensure tests in content area prior to final internship',
      'Grade of C or better required in all degree requirements',
      'Foreign language requirement: 101 and 102 level courses',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 350', name: 'Adolescent Literature', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhasesTwoThree: [
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      englishContentArea: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'ENGL 293', name: 'Advanced Writing', isNew: true },
        { code: 'ENGL 294', name: 'Writing in/with New Media', isNew: true },
        { code: 'ENGL 303', name: 'Grammar: Principles & Pedagogy', isNew: true },
        { code: 'ENGL 317', name: 'The Writing of Poetry' },
        { code: 'ENGL 318', name: 'The Writing of Fiction' },
        { code: 'ENGL 319', name: 'Writing Creative Nonfiction' },
      ],
      historyContentArea: [
        { code: 'HIST 299', name: 'Historical Methods' },
        { code: 'HIST 398', name: 'History Internship', isNew: true },
        { code: 'SOCL 101', name: 'Society in a Global Age' },
        { code: 'PLSC 101', name: 'American Politics' },
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ENVS 218', name: 'Biodiversity & Biogeography', isNew: true },
      ],
      mathematicsContentArea: [
        { code: 'MATH 161', name: 'Calculus I' },
        { code: 'MATH 162', name: 'Calculus II' },
        { code: 'MATH 212', name: 'Linear Algebra' },
        { code: 'MATH 201', name: 'Introduction to Discrete Mathematics & Number Theory' },
        { code: 'MATH 263', name: 'Multivariable Calculus' },
        { code: 'MATH 301', name: 'History of Mathematics', isNew: true },
        { code: 'MATH 344', name: 'Geometry 2', isNew: true },
        { code: 'MATH 313', name: 'Abstract Algebra' },
        { code: 'MATH 318', name: 'Applied Mathematics Elective' },
        { code: 'MATH 360', name: 'Introduction to Game Theory' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 6. Special Education BSEd
  //    Total credit hours: 120
  //    Licensure: PEL Special Education (ages 3-21), ESL endorsement,
  //               Optional Elementary Education endorsement with 2 added courses
  //    Source: catalog.luc.edu/undergraduate/education/special-education-bsed/
  // ===========================================================================
  'Special Education BSEd': {
    totalCredits: 120,
    school: 'Education',
    degree: 'BSEd',
    specialRequirements: [
      'Illinois PEL Special Education (ages 3-21) plus ESL endorsement',
      'Optional: add 2 courses for Elementary Education endorsement (grades 1-6)',
      'The 2 optional courses for elem endorsement: TLSC 231 and TLSC 232',
      'Grade of C or better required in all degree requirements',
    ],
    requirements: {
      educationCore: [
        { code: 'CIEP 104', name: 'Mathematics for Teachers I', isNew: true },
        { code: 'CIEP 206', name: "Children's Literature", isNew: true },
        { code: 'CIEP 332', name: 'School Wide Applications', isNew: true },
        { code: 'CIEP 359', name: 'Teaching Reading', isNew: true },
        { code: 'ELPS 219', name: 'History of American Education', isNew: true },
        { code: 'ELPS 302', name: 'Philosophy of Education', isNew: true },
      ],
      tllscPhaseOne: [
        { code: 'TLSC 110', name: 'The Profession and Our Program', isNew: true },
        { code: 'TLSC 120', name: 'Bringing Language, Learning & Development Theory into Practice', isNew: true },
        { code: 'TLSC 130', name: 'Community Immersion', isNew: true },
        { code: 'TLSC 140', name: 'Teaching, Learning and Leading for Social Justice', isNew: true },
        { code: 'TLSC 150', name: 'Constructive Learning Environments For Diverse Students', isNew: true },
        { code: 'TLSC 160', name: 'Analyzing Culturally-Responsive Classroom Instruction', isNew: true },
        { code: 'TLSC 210', name: 'Educational Policy For Diverse Students', isNew: true },
        { code: 'TLSC 221', name: 'Individualized Instruction and Assessment for Diverse Learners', isNew: true },
        { code: 'TLSC 222', name: 'Authentic Assessment and Instruction for Bilingual Learners', isNew: true },
        { code: 'TLSC 300A', name: 'Professional Learning Communities (Fall)', isNew: true },
        { code: 'TLSC 300B', name: 'Professional Learning Communities (Spring)', isNew: true },
      ],
      tllscPhaseTwoSPED: [
        { code: 'TLSC 260', name: 'Typical and A-Typical Development', isNew: true },
        { code: 'TLSC 261', name: 'Significant Disabilities and Life Planning', isNew: true },
        { code: 'TLSC 262', name: 'Assistive and Adaptive Technology', isNew: true },
        { code: 'TLSC 263', name: 'Transition Planning', isNew: true },
      ],
      tllscPhaseThree: [
        { code: 'TLSC 310', name: 'Language and Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 320', name: 'Using Classroom Data in Collaborative Environment to Advance Student Achievement', isNew: true },
        { code: 'TLSC 330', name: 'Discipline-Specific Literacy for Diverse Students', isNew: true },
        { code: 'TLSC 340', name: 'Teaching and Learning in an Area of Specialization', isNew: true },
        { code: 'TLSC 350', name: 'Teaching and Learning with a Global Framework', isNew: true },
        { code: 'TLSC 360', name: 'Developing Rigorous and Relevant Instruction & Assessment', isNew: true },
        { code: 'TLSC 370', name: 'Design & Implement Rigorous & Relevant Instruction & Assessment: Teaching Performance Assessment Prep', isNew: true },
        { code: 'TLSC 380', name: 'Teaching, Learning & Leading with Schools & Communities Internship: Student Teaching', isNew: true },
      ],
      optionalElementaryEndorsement: [
        { code: 'TLSC 231', name: 'Teaching Science/Writing in Elementary and Middle Grades', isNew: true },
        { code: 'TLSC 232', name: 'Integrated Teaching/Learning Social Studies & Writing in Elementary Grades', isNew: true },
      ],
      universityCore: [
        { code: 'UCWR 110', name: 'Writing Responsibly', isNew: true },
        { code: 'UNIV 101', name: 'First Year Seminar', isNew: true },
        { code: 'PHYS 101', name: 'Liberal Arts Physics', isNew: true },
        { code: 'PLSC 101', name: 'American Politics' },
      ],
    },
  },

  // ===========================================================================
  // PARKINSON SCHOOL OF HEALTH SCIENCES AND PUBLIC HEALTH
  // ===========================================================================

  // ===========================================================================
  // 7. Healthcare Administration BS
  //    Total credit hours: 121 (78 for major)
  //    Accreditation: AUPHA (Association of University Programs in Health Admin)
  //    Source: catalog.luc.edu/undergraduate/health-sciences-public-health/healthcare-administration-bs/
  // ===========================================================================
  'Healthcare Administration BS': {
    totalCredits: 121,
    majorCredits: 78,
    school: 'Parkinson School of Health Sciences and Public Health',
    degree: 'BS',
    specialRequirements: [
      'Certified by the Association of University Programs in Health Administration (AUPHA)',
      'Senior year field-based internship (HSM 360, 6 credit hours) under preceptor supervision',
      'Capstone course (HSM 350) in senior year',
    ],
    requirements: {
      healthcareAdminCore: [
        { code: 'HSM 110', name: 'Healthcare in America', isNew: true },
        { code: 'HSM 120', name: 'Essentials of Medical Terminology for Health Professionals', isNew: true },
        { code: 'HSM 200', name: 'Careers in Healthcare Administration', isNew: true },
        { code: 'HSM 220', name: 'Post-Acute & Long-Term Care Management', isNew: true },
        { code: 'HSM 230', name: 'Fundamentals of Health Equity', isNew: true },
        { code: 'HSM 240', name: 'Healthcare Workforce Management and Professionalism', isNew: true },
        { code: 'HSM 280', name: 'Healthcare Ethics in Practice', isNew: true },
        { code: 'HSM 310', name: 'Healthcare Project Management', isNew: true },
        { code: 'HSM 315', name: 'Healthcare Quality & Performance Improvement', isNew: true },
        { code: 'HSM 325', name: 'Healthcare Fiscal Management', isNew: true },
        { code: 'HSM 330', name: 'Healthcare Legal & Regulatory Environment', isNew: true },
        { code: 'HSM 338', name: 'Healthcare Strategy and Marketing', isNew: true },
        { code: 'HSM 340', name: 'Health Care Policy', isNew: true },
        { code: 'HSM 345', name: 'Healthcare Data Analytics', isNew: true },
        { code: 'HSM 350', name: 'Healthcare Administration Capstone', isNew: true },
        { code: 'HSM 358', name: 'Research Literacy for Health Decision-Makers', isNew: true },
        { code: 'HSM 360', name: 'Healthcare Administration Field Internship', isNew: true },
        { code: 'HSM 368', name: 'Management of Healthcare Organizations', isNew: true },
        { code: 'HSM 386', name: 'Health Information Systems Management', isNew: true },
      ],
      supportCourses: [
        { code: 'PSYC 101', name: 'General Psychology' },
        { code: 'ACCT 201', name: 'Introductory Accounting I' },
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
        { code: 'FINC 301', name: 'Introductory Business Finance' },
        { code: 'INFS 247', name: 'Business Information Systems' },
        { code: 'ISSCM 241', name: 'Business Statistics' },
      ],
      businessElective_chooseOne: [
        { code: 'HRER 301', name: 'Principles of HR Management' },
        { code: 'ENTR 201', name: 'Introduction to Entrepreneurship' },
        { code: 'SCMG 232', name: 'Introduction to Supply Chain Management' },
        { code: 'ECON 329', name: 'Health Economics' },
      ],
    },
  },

  // ===========================================================================
  // 8. Public Health BA
  //    Total credit hours: 120 (72 for major including 12 core overlap)
  //    Accreditation: CEPH (Council on Education for Public Health)
  //    Source: catalog.luc.edu/undergraduate/health-sciences-public-health/public-health-ba/
  // ===========================================================================
  'Public Health BA': {
    totalCredits: 120,
    majorCredits: 72,
    school: 'Parkinson School of Health Sciences and Public Health',
    degree: 'BA',
    specialRequirements: [
      'Accredited by Council on Education for Public Health (CEPH)',
      'BA option emphasizes social/behavioral sciences over biological sciences',
      'Five concentration areas: Policy & Advocacy, Program Management, Gender/Sexuality & Health, Health Equity & Social Justice, Global Health',
      '9 credits of concentration electives required (choose one concentration)',
      'Capstone experience (PUBH 399) or internship (PUBH 310) required',
    ],
    requirements: {
      publicHealthCore: [
        { code: 'PUBH 300', name: 'Introduction to Public Health', isNew: true },
        { code: 'PUBH 301', name: 'Health and the Environment', isNew: true },
        { code: 'PUBH 303', name: 'Fundamentals of Epidemiology', isNew: true },
        { code: 'PUBH 304', name: 'Health Behavior and Health Promotion', isNew: true },
        { code: 'PUBH 305', name: 'Public Health Communication', isNew: true },
        { code: 'PUBH 306', name: 'Critical Thinking in Public Health', isNew: true },
        { code: 'PUBH 307', name: 'Foundations of Public Health Policy', isNew: true },
        { code: 'PUBH 309', name: 'Introduction to Biostatistical Methods for Public Health', isNew: true },
        { code: 'PUBH 313', name: 'Community Assessment and Program Planning', isNew: true },
        { code: 'PUBH 314', name: 'Global Public Health', isNew: true },
        { code: 'PUBH 315', name: 'Public Health Advocacy', isNew: true },
        { code: 'PUBH 391', name: 'Leadership and Public Health Entrepreneurship', isNew: true },
        { code: 'PUBH 399', name: 'Public Health Capstone Experience', isNew: true },
      ],
      healthcareFoundation: [
        { code: 'HSM 110', name: 'Healthcare in America', isNew: true },
        { code: 'HSM 230', name: 'Fundamentals of Health Equity', isNew: true },
      ],
      socialScienceFoundation: [
        { code: 'PSYC 101', name: 'General Psychology' },
        { code: 'SOCL 122', name: 'Race and Ethnic Relations', isNew: true },
      ],
      ethicsRequirement_chooseOne: [
        { code: 'PHIL 284', name: 'Health Care Ethics' },
        { code: 'PHIL 286', name: 'Ethics and Education' },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'HSM 280', name: 'Healthcare Ethics in Practice', isNew: true },
      ],
      scienceRequirement_chooseOne: [
        { code: 'BIOL 110', name: 'Liberal Arts Biology', isNew: true },
        { code: 'ANTH 103', name: 'Biological Background Human Social Behavior' },
        { code: 'ANTH 105', name: 'Human Biocultural Diversity' },
      ],
      anthropologyRequirement_chooseOne: [
        { code: 'ANTH 280', name: 'Evolution of Human Disease', isNew: true },
        { code: 'ANTH 258', name: 'Medical Anthropology & Global Health', isNew: true },
        { code: 'ANTH 353', name: 'Epidemics and Pandemics', isNew: true },
        { code: 'ANTH 359', name: 'Paleopathology', isNew: true },
      ],
      statisticsRequirement_chooseOne: [
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'PLSC 216', name: 'Political Numbers (quantitative reasoning)' },
        { code: 'PSYC 304', name: 'Statistics' },
        { code: 'SOCL 301', name: 'Statistics for Social Research' },
      ],
      concentrationElectives: {
        note: '9 credit hours from one concentration area',
        concentrations: [
          'Policy and Advocacy',
          'Program Management',
          'Gender, Sexuality and Health',
          'Health Equity and Social Justice',
          'Global Health',
        ],
        sampleElectives: [
          { code: 'PUBH 310', name: 'Public Health Internship', isNew: true },
          { code: 'PUBH 390', name: 'Special Topics: Public Health Intelligence', isNew: true },
        ],
      },
    },
  },

  // ===========================================================================
  // 9. Public Health BS
  //    Total credit hours: 120 (71 for major)
  //    Accreditation: CEPH (Council on Education for Public Health)
  //    Source: catalog.luc.edu/undergraduate/health-sciences-public-health/public-health-bs/
  // ===========================================================================
  'Public Health BS': {
    totalCredits: 120,
    majorCredits: 71,
    school: 'Parkinson School of Health Sciences and Public Health',
    degree: 'BS',
    specialRequirements: [
      'Accredited by Council on Education for Public Health (CEPH)',
      'BS option grounded in basic biological sciences with population health emphasis',
      'Prepares for health education, epidemiology, and environmental health careers',
      'Capstone experience (PUBH 399) or internship (PUBH 310) required',
      '6 credits of public health electives required',
    ],
    requirements: {
      biologyScienceCore: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 102', name: 'General Biology II' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'BIOL 112', name: 'General Biology II Lab' },
        { code: 'MATH 131', name: 'Applied Calculus I' },
        { code: 'MATH 132', name: 'Applied Calculus II' },
      ],
      statisticsData: [
        { code: 'STAT 335', name: 'Introduction to Biostatistics' },
        { code: 'STAT 303', name: 'SAS Programming & Applied Statistics' },
      ],
      socialScienceEthics: [
        { code: 'PSYC 101', name: 'General Psychology' },
        { code: 'PHIL 284', name: 'Health Care Ethics' },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
      ],
      anthropologyRequirement_chooseOne: [
        { code: 'ANTH 280', name: 'Evolution of Human Disease', isNew: true },
        { code: 'ANTH 258', name: 'Medical Anthropology & Global Health', isNew: true },
        { code: 'ANTH 353', name: 'Epidemics and Pandemics', isNew: true },
        { code: 'ANTH 359', name: 'Paleopathology', isNew: true },
      ],
      publicHealthCore: [
        { code: 'PUBH 300', name: 'Introduction to Public Health', isNew: true },
        { code: 'PUBH 301', name: 'Health and the Environment', isNew: true },
        { code: 'PUBH 303', name: 'Fundamentals of Epidemiology', isNew: true },
        { code: 'PUBH 304', name: 'Health Behavior and Health Promotion', isNew: true },
        { code: 'PUBH 306', name: 'Critical Thinking in Public Health', isNew: true },
        { code: 'PUBH 307', name: 'Foundations of Public Health Policy', isNew: true },
        { code: 'PUBH 314', name: 'Global Public Health', isNew: true },
        { code: 'PUBH 399', name: 'Public Health Capstone Experience', isNew: true },
      ],
      healthcareFoundation: [
        { code: 'HSM 110', name: 'Healthcare in America', isNew: true },
        { code: 'HSM 230', name: 'Fundamentals of Health Equity', isNew: true },
        { code: 'HSM 310', name: 'Healthcare Project Management', isNew: true },
      ],
      environmentalTools: [
        { code: 'ENVS 380', name: 'Introduction to Geographic Information Systems', isNew: true },
      ],
      publicHealthElectives: {
        note: '6 credit hours of public health electives',
        options: [
          { code: 'PUBH 310', name: 'Public Health Internship', isNew: true },
          { code: 'PUBH 390', name: 'Special Topics: Public Health Intelligence', isNew: true },
        ],
      },
    },
  },

  // ===========================================================================
  // SCHOOL OF SOCIAL WORK
  // ===========================================================================

  // ===========================================================================
  // 10. Social Work BSW
  //     Total credit hours: ~120 (53 for major)
  //     Accreditation: CSWE (Council on Social Work Education)
  //     Source: catalog.luc.edu/undergraduate/social-work/bsw-degree-program/
  // ===========================================================================
  'Social Work BSW': {
    totalCredits: 120,
    majorCredits: 53,
    school: 'School of Social Work',
    degree: 'BSW',
    specialRequirements: [
      'Field internship required (SOWK 330 and SOWK 340 - two semesters, 7 total credits)',
      'Accelerated BSW/MSW five-year option available',
      'SOWK 308 replaces SOWK 302 for students starting Fall 2025 or later',
      'Students must complete University Core, Engaged Learning course, and UNIV 101',
      '9 credits of approved social science electives required',
    ],
    requirements: {
      socialWorkCore: [
        { code: 'SOWK 200', name: 'Introduction to Social Work', isNew: true },
        { code: 'SOWK 301', name: 'Practice Skills with Individuals and Families', isNew: true },
        { code: 'SOWK 303', name: 'Group Work Practice in Social Work: Micro/Mezzo/Macro', isNew: true },
        { code: 'SOWK 305', name: 'Life Span Development, Human Behavior, Trauma, & Theory', isNew: true },
        { code: 'SOWK 307', name: 'Social Work Policy and Community Intervention', isNew: true },
        { code: 'SOWK 308', name: 'Integrated Micro, Mezzo, and Macro Practice 1', isNew: true },
        { code: 'SOWK 350', name: 'Preparation for Practice', isNew: true },
        { code: 'SOWK 362', name: 'Integrative Seminar', isNew: true },
        { code: 'SOWK 370', name: 'Power, Oppression, Privilege, and Social Justice', isNew: true },
        { code: 'SOWK 380', name: 'Assessment of Client Concerns in Context', isNew: true },
        { code: 'SOWK 390', name: 'Research and Evaluation in Social Work Practice', isNew: true },
      ],
      fieldInternship: [
        { code: 'SOWK 330', name: 'Internship I and Simulated Experience', isNew: true },
        { code: 'SOWK 340', name: 'Internship II and Simulated Experience', isNew: true },
      ],
      supportingCourses: [
        { code: 'PSYC 101', name: 'General Psychology' },
        { code: 'SOCL 101', name: 'Society in a Global Age' },
      ],
      socialScienceElectives: {
        note: '9 credits of approved social science electives from multiple LUC departments',
        credits: 9,
      },
    },
  },

};

// =============================================================================
// CREDIT HOUR OVERRIDES for new courses
// (courses that are NOT the default 3 credits)
// =============================================================================
export const EDUCATION_HEALTH_SW_CREDIT_OVERRIDES = {
  // Education TLSC courses
  'TLSC 110': 1,
  'TLSC 120': 2,
  'TLSC 130': 1,
  'TLSC 140': 1,
  'TLSC 150': 1,
  'TLSC 160': 1,
  'TLSC 210': 2,
  'TLSC 221': 2,
  'TLSC 222': 2,
  'TLSC 231': 3,
  'TLSC 232': 3,
  'TLSC 240': 3,
  'TLSC 250': 3,
  'TLSC 251': 3,
  'TLSC 252': 1,
  'TLSC 253': 2,
  'TLSC 260': 2,
  'TLSC 261': 2,
  'TLSC 262': 2,
  'TLSC 263': 2,
  'TLSC 300A': 0,
  'TLSC 300B': 1,
  'TLSC 310': 2,
  'TLSC 320': 2,
  'TLSC 330': 2,
  'TLSC 340': 2,
  'TLSC 350': 4,
  'TLSC 360': 3,
  'TLSC 370': 3,
  'TLSC 380': 12,

  // Education CIEP courses
  'CIEP 104': 3,
  'CIEP 105': 3,
  'CIEP 206': 3,
  'CIEP 305': 3,
  'CIEP 315': 3,
  'CIEP 327': 3,
  'CIEP 328': 3,
  'CIEP 329': 3,
  'CIEP 332': 3,
  'CIEP 350': 3,
  'CIEP 351': 3,
  'CIEP 359': 3,
  'CIEP M16': 2,
  'CIEP M17': 2,
  'CIEP M42': 2,
  'CIEP M43': 3,

  // Education ELPS courses
  'ELPS 219': 3,
  'ELPS 302': 3,

  // University Core
  'UCWR 110': 3,
  'UNIV 101': 1,
  'PHYS 101': 3,
  'MATH 108': 3,

  // Healthcare Administration (HSM)
  'HSM 110': 3,
  'HSM 120': 1,
  'HSM 200': 2,
  'HSM 220': 3,
  'HSM 230': 3,
  'HSM 240': 3,
  'HSM 280': 3,
  'HSM 310': 3,
  'HSM 315': 3,
  'HSM 325': 3,
  'HSM 330': 3,
  'HSM 338': 3,
  'HSM 340': 3,
  'HSM 345': 3,
  'HSM 350': 3,
  'HSM 358': 3,
  'HSM 360': 6,
  'HSM 368': 3,
  'HSM 386': 3,

  // Public Health (PUBH)
  'PUBH 300': 3,
  'PUBH 301': 3,
  'PUBH 303': 3,
  'PUBH 304': 3,
  'PUBH 305': 3,
  'PUBH 306': 3,
  'PUBH 307': 3,
  'PUBH 309': 3,
  'PUBH 310': 3,
  'PUBH 313': 3,
  'PUBH 314': 3,
  'PUBH 315': 3,
  'PUBH 390': 3,
  'PUBH 391': 3,
  'PUBH 399': 3,

  // Social Work (SOWK)
  'SOWK 200': 3,
  'SOWK 301': 3,
  'SOWK 303': 3,
  'SOWK 305': 3,
  'SOWK 307': 3,
  'SOWK 308': 3,
  'SOWK 330': 3.5,
  'SOWK 340': 3.5,
  'SOWK 350': 3,
  'SOWK 362': 1,
  'SOWK 370': 3,
  'SOWK 380': 3,
  'SOWK 390': 3,

  // Other new courses
  'BIOL 110': 3,
  'ENGL 271': 3,
  'ENGL 272': 3,
  'ENGL 293': 3,
  'ENGL 294': 3,
  'ENGL 303': 3,
  'ENVS 207': 3,
  'ENVS 218': 3,
  'ENVS 223': 3,
  'ENVS 224': 3,
  'ENVS 283': 3,
  'ENVS 350': 3,
  'ENVS 380': 3,
  'HIST 398': 3,
  'MATH 108': 3,
  'MATH 301': 3,
  'MATH 344': 3,
  'SOCL 122': 3,
  'ANTH 258': 3,
  'ANTH 280': 3,
  'ANTH 353': 3,
  'ANTH 359': 3,
};

// =============================================================================
// SUMMARY OF ALL NEW COURSES (not in Database.js)
// =============================================================================
//
// Prefix   Count   Notes
// ------   -----   -----
// TLSC      28     Teaching, Learning & Leading with Schools & Communities modules
// CIEP      16     Curriculum, Instruction & Educational Psychology
// ELPS       2     Educational Leadership, Policy & Social Foundations
// HSM       19     Health Systems Management (Healthcare Administration)
// PUBH      15     Public Health
// SOWK      13     Social Work
// UCWR       1     University Core Writing
// UNIV       1     University Core First Year
// PHYS       1     PHYS 101 Liberal Arts Physics (new - differs from PHYS 111/112)
// MATH       3     MATH 108, 301, 344
// ENGL       5     ENGL 271, 272, 293, 294, 303
// ENVS       7     Environmental Science courses
// HIST       1     HIST 398 (Internship)
// SOCL       1     SOCL 122 Race and Ethnic Relations
// ANTH       4     Medical/biological anthropology electives
// BIOL       1     BIOL 110 Liberal Arts Biology
//
// TOTAL: ~118 new course entries
//
// Existing courses reused across these programs:
//   PSYC 101, SOCL 101, PLSC 101, ECON 201, ACCT 201, FINC 301, INFS 247,
//   ISSCM 241, HRER 301, ENTR 201, SCMG 232, ECON 329, STAT 103, STAT 303,
//   STAT 335, STAT 203, BIOL 101, BIOL 102, BIOL 111, BIOL 112,
//   MATH 131, MATH 132, MATH 161, MATH 162, MATH 201, MATH 212, MATH 263,
//   MATH 313, MATH 318, MATH 360, COMP 170, PHIL 130, PHIL 284, PHIL 286,
//   PHIL 287, PLSC 216, PSYC 304, SOCL 301, SPAN 250, SPAN 251, SPAN 270,
//   SPAN 271, HIST 101-104, HIST 211, HIST 212, HIST 299, ENGL 317, ENGL 318,
//   ENGL 319, ENGL 326, CHEM 160, ANTH 103, ANTH 104, ANTH 105, MGMT 201
// =============================================================================
