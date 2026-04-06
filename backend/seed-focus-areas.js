/**
 * Seed focus areas for ALL majors into locus.db
 * Run: node seed-focus-areas.js
 *
 * This extends seed-riasec.js by adding focus areas for all 121 majors.
 * Each major gets 3-5 focus areas with RIASEC dimension weights and linked courses.
 */

const db = require('./db');

const allFocusAreas = [
  // =========================================================================
  // BATCH 1: BUSINESS SCHOOL
  // =========================================================================
  { major: 'Accounting and Analytics', areas: [
    { name: 'Tax & Compliance', desc: 'Tax code expertise, regulatory compliance, and return preparation', riasec: { C: 3 }, courses: ['ACCT 304', 'ACCT 306'] },
    { name: 'Audit & Assurance', desc: 'Evaluating financial statements, testing internal controls', riasec: { C: 2, E: 1 }, courses: ['ACCT 303', 'ACCT 307'] },
    { name: 'Data-Driven Accounting', desc: 'Leveraging analytics tools to extract insights from financial data', riasec: { I: 2, C: 1 }, courses: ['ACCT 328', 'ISSCM 241'] },
    { name: 'Forensic & Investigative', desc: 'Detecting fraud, analyzing irregularities, and supporting litigation', riasec: { I: 2, C: 2 }, courses: ['ACCT 323', 'ACCT 311'] },
    { name: 'Corporate Advisory', desc: 'Strategic financial planning, M&A support, and CFO-track consulting', riasec: { E: 2, C: 1 }, courses: ['ACCT 341', 'FIN 300'] },
  ]},
  { major: 'Entrepreneurship', areas: [
    { name: 'Venture Launch', desc: 'Ideation, business model development, and startup execution', riasec: { E: 3 }, courses: ['ENTR 310', 'ENTR 320'] },
    { name: 'Social Enterprise', desc: 'Building mission-driven ventures that address community needs', riasec: { E: 2, S: 1 }, courses: ['ENTR 340', 'MGMT 330'] },
    { name: 'Innovation & Product', desc: 'Creative problem-solving, product design, and prototyping', riasec: { A: 2, E: 1 }, courses: ['ENTR 370', 'MKTG 340'] },
    { name: 'Growth & Scaling', desc: 'Financing, operations, and strategy for scaling new businesses', riasec: { E: 2, C: 1 }, courses: ['ENTR 320', 'FIN 300'] },
  ]},
  { major: 'Finance', areas: [
    { name: 'Corporate Finance', desc: 'Capital budgeting, valuation, and strategic financial management', riasec: { E: 2, C: 1 }, courses: ['FIN 300', 'FIN 340'] },
    { name: 'Investments & Portfolio', desc: 'Securities analysis, portfolio theory, and asset management', riasec: { I: 2, E: 1 }, courses: ['FIN 310', 'FIN 320'] },
    { name: 'Financial Analytics', desc: 'Quantitative modeling, risk measurement, and data-driven finance', riasec: { I: 2, C: 1 }, courses: ['FIN 370', 'FIN 380'] },
    { name: 'Banking & Real Estate', desc: 'Commercial lending, real estate valuation, and institutional finance', riasec: { E: 2, C: 1 }, courses: ['FIN 330', 'FIN 350'] },
    { name: 'Financial Planning', desc: 'Wealth management, retirement planning, and client advisory', riasec: { S: 1, E: 1, C: 1 }, courses: ['FIN 345', 'FIN 390'] },
  ]},
  { major: 'Human Resource Management', areas: [
    { name: 'Talent Acquisition & Development', desc: 'Recruiting, training, and employee development programs', riasec: { S: 2, E: 1 }, courses: ['MGMT 335', 'MGMT 340'] },
    { name: 'Compensation & Analytics', desc: 'Pay structures, benefits administration, and HR data analysis', riasec: { C: 2, I: 1 }, courses: ['MGMT 338', 'ISSCM 241'] },
    { name: 'Labor Relations & Law', desc: 'Employment law, union relations, and workplace compliance', riasec: { E: 2, C: 1 }, courses: ['MGMT 370', 'MGMT 325'] },
    { name: 'Organizational Development', desc: 'Culture building, change management, and leadership coaching', riasec: { S: 2, E: 1 }, courses: ['MGMT 305', 'MGMT 315'] },
  ]},
  { major: 'Information Systems and Analytics', areas: [
    { name: 'Business Intelligence', desc: 'Data warehousing, dashboards, and analytics for decision-making', riasec: { I: 2, C: 1 }, courses: ['INFS 345', 'INFS 350'] },
    { name: 'Systems Development', desc: 'Designing and building enterprise software applications', riasec: { R: 2, I: 1 }, courses: ['INFS 247', 'INFS 330'] },
    { name: 'Cybersecurity & Risk', desc: 'Protecting information assets, risk assessment, and compliance', riasec: { C: 2, R: 1 }, courses: ['INFS 340', 'INFS 285'] },
    { name: 'Data Science & Analytics', desc: 'Statistical modeling, machine learning, and predictive analytics', riasec: { I: 3 }, courses: ['INFS 350', 'ISSCM 241'] },
    { name: 'IT Consulting', desc: 'Advising organizations on technology strategy and digital transformation', riasec: { E: 2, I: 1 }, courses: ['INFS 399', 'MGMT 301'] },
  ]},
  { major: 'International Business', areas: [
    { name: 'Global Strategy', desc: 'Cross-border expansion, competitive positioning, and multinational management', riasec: { E: 2, I: 1 }, courses: ['MGMT 360', 'MGMT 301'] },
    { name: 'International Finance', desc: 'Foreign exchange, global capital markets, and cross-border investment', riasec: { I: 2, E: 1 }, courses: ['FIN 370', 'ECON 306'] },
    { name: 'Global Marketing', desc: 'Adapting brands and campaigns for international markets', riasec: { A: 1, E: 2 }, courses: ['MKTG 380', 'MKTG 340'] },
    { name: 'Trade & Economic Development', desc: 'International trade policy, emerging markets, and economic diplomacy', riasec: { I: 2, S: 1 }, courses: ['ECON 360', 'ECON 370'] },
  ]},
  { major: 'Management', areas: [
    { name: 'Strategic Leadership', desc: 'Organizational strategy, executive decision-making, and competitive analysis', riasec: { E: 3 }, courses: ['MGMT 301', 'MGMT 395'] },
    { name: 'Operations & Process', desc: 'Streamlining workflows, quality management, and operational efficiency', riasec: { C: 2, R: 1 }, courses: ['MGMT 350', 'ISSCM 340'] },
    { name: 'Team & People Leadership', desc: 'Group dynamics, motivation, conflict resolution, and coaching', riasec: { S: 2, E: 1 }, courses: ['MGMT 305', 'MGMT 315'] },
    { name: 'Consulting & Innovation', desc: 'Problem diagnosis, change management, and creative business solutions', riasec: { E: 2, I: 1 }, courses: ['MGMT 320', 'MGMT 380'] },
    { name: 'Business Ethics & Sustainability', desc: 'Corporate social responsibility, governance, and ethical leadership', riasec: { S: 1, I: 1, E: 1 }, courses: ['MGMT 330', 'MGMT 370'] },
  ]},
  { major: 'Sport Management', areas: [
    { name: 'Athletic Administration', desc: 'Managing sport organizations, facilities, and collegiate programs', riasec: { E: 2, C: 1 }, courses: ['SPMG 300', 'SPMG 340'] },
    { name: 'Sport Marketing & Sales', desc: 'Sponsorships, ticket revenue, fan engagement, and brand promotion', riasec: { E: 2, A: 1 }, courses: ['SPMG 325', 'MKTG 300'] },
    { name: 'Sport Analytics', desc: 'Performance metrics, data-driven scouting, and business intelligence', riasec: { I: 2, C: 1 }, courses: ['SPMG 350', 'ISSCM 241'] },
    { name: 'Event & Venue Management', desc: 'Planning and executing sporting events, logistics, and operations', riasec: { R: 1, E: 1, C: 1 }, courses: ['SPMG 320', 'SPMG 375'] },
    { name: 'Sport Law & Ethics', desc: 'Legal issues in sport, compliance, athlete representation', riasec: { I: 1, E: 2 }, courses: ['SPMG 395', 'SPMG 200'] },
  ]},
  { major: 'Supply Chain Management', areas: [
    { name: 'Logistics & Transportation', desc: 'Freight management, distribution networks, and delivery optimization', riasec: { R: 2, C: 1 }, courses: ['ISSCM 370', 'ISSCM 340'] },
    { name: 'Procurement & Sourcing', desc: 'Supplier selection, contract negotiation, and vendor management', riasec: { E: 2, C: 1 }, courses: ['ISSCM 350', 'ISSCM 331'] },
    { name: 'Supply Chain Analytics', desc: 'Demand forecasting, inventory optimization, and data modeling', riasec: { I: 2, C: 1 }, courses: ['ISSCM 380', 'ISSCM 241'] },
    { name: 'Global Operations', desc: 'International sourcing, trade compliance, and cross-border logistics', riasec: { E: 1, C: 1, I: 1 }, courses: ['ISSCM 370', 'MGMT 360'] },
  ]},
  { major: 'Economics', areas: [
    { name: 'Quantitative & Econometrics', desc: 'Statistical methods, regression analysis, and economic modeling', riasec: { I: 3 }, courses: ['ECON 304', 'ECON 305'] },
    { name: 'Financial Economics', desc: 'Monetary theory, banking systems, and capital market analysis', riasec: { I: 2, E: 1 }, courses: ['ECON 310', 'ECON 316'] },
    { name: 'Public Policy & Labor', desc: 'Government policy, labor markets, and welfare economics', riasec: { I: 2, S: 1 }, courses: ['ECON 320', 'ECON 340'] },
    { name: 'International & Development', desc: 'Trade theory, developing economies, and globalization', riasec: { I: 2, S: 1 }, courses: ['ECON 360', 'ECON 370'] },
    { name: 'Business Analytics & Strategy', desc: 'Applied economics for corporate decision-making and competitive strategy', riasec: { E: 2, I: 1 }, courses: ['ECON 306', 'ECON 380'] },
  ]},
  { major: 'Business Administration', areas: [
    { name: 'General Management', desc: 'Broad business foundations for versatile leadership roles', riasec: { E: 2, S: 1 }, courses: ['MGMT 301', 'MGMT 305'] },
    { name: 'Marketing & Sales', desc: 'Consumer insight, promotional strategy, and revenue generation', riasec: { E: 2, A: 1 }, courses: ['MKTG 300', 'MKTG 310'] },
    { name: 'Financial Management', desc: 'Corporate finance fundamentals, budgeting, and investment decisions', riasec: { C: 2, E: 1 }, courses: ['FIN 300', 'ACCT 201'] },
    { name: 'Business Analytics', desc: 'Data tools, dashboards, and evidence-based decision-making', riasec: { I: 2, C: 1 }, courses: ['ISSCM 241', 'INFS 201'] },
    { name: 'Entrepreneurial Management', desc: 'New venture planning, small business strategy, and innovation', riasec: { E: 3 }, courses: ['ENTR 310', 'MGMT 320'] },
  ]},

  // =========================================================================
  // BATCH 3: HEALTH & SOCIAL SCIENCES
  // =========================================================================
  { major: 'Criminal Justice and Criminology', areas: [
    { name: 'Law Enforcement & Policing', desc: 'Police systems, patrol strategies, and law enforcement policy', riasec: { R: 2, S: 1 }, courses: ['CRIM 230', 'CRIM 301'] },
    { name: 'Courts & Legal Process', desc: 'Judicial systems, sentencing, and constitutional law', riasec: { I: 2, E: 2 }, courses: ['CRIM 211', 'CRIM 304'] },
    { name: 'Corrections & Rehabilitation', desc: 'Incarceration, reentry programs, and correctional reform', riasec: { S: 3 }, courses: ['CRIM 240', 'CRIM 340'] },
    { name: 'Criminological Research', desc: 'Data-driven analysis of crime causes and patterns', riasec: { I: 3 }, courses: ['CRIM 260', 'CRIM 390'] },
    { name: 'Juvenile Justice & Youth Advocacy', desc: 'Youth offending, delinquency prevention, and restorative justice', riasec: { S: 3, E: 1 }, courses: ['CRIM 250', 'CRIM 350'] },
  ]},
  { major: 'Exercise Science', areas: [
    { name: 'Strength & Conditioning', desc: 'Evidence-based training programs for athletic performance', riasec: { R: 3 }, courses: ['EXSC 301', 'EXSC 340'] },
    { name: 'Clinical Exercise Physiology', desc: 'Exercise interventions for chronic disease and cardiac rehab', riasec: { I: 3, S: 1 }, courses: ['EXSC 320', 'EXSC 370'] },
    { name: 'Sports Medicine & Rehab', desc: 'Injury prevention, biomechanics, and movement recovery', riasec: { R: 2, I: 2 }, courses: ['EXSC 230', 'EXSC 350'] },
    { name: 'Health & Wellness Promotion', desc: 'Physical activity and healthy lifestyles across populations', riasec: { S: 3, E: 1 }, courses: ['EXSC 200', 'EXSC 390'] },
  ]},
  { major: 'Healthcare Administration', areas: [
    { name: 'Hospital & Systems Management', desc: 'Operations and strategy in hospitals and health networks', riasec: { E: 3, C: 2 }, courses: ['PUBH 301', 'PUBH 330'] },
    { name: 'Health Policy & Regulation', desc: 'Healthcare legislation, compliance, and regulatory policy', riasec: { I: 2, E: 2 }, courses: ['PUBH 302', 'PUBH 370'] },
    { name: 'Health Informatics & Quality', desc: 'Data systems and analytics to improve patient outcomes', riasec: { C: 3, I: 2 }, courses: ['PUBH 340', 'PUBH 360'] },
    { name: 'Community Health Administration', desc: 'Managing public health orgs and community-based care', riasec: { S: 2, E: 2 }, courses: ['PUBH 200', 'PUBH 305'] },
  ]},
  { major: 'Human Services', areas: [
    { name: 'Clinical Social Work', desc: 'Counseling and intervention skills for individuals and families', riasec: { S: 3 }, courses: ['SOCW 300', 'SOCW 340'] },
    { name: 'Community Organizing', desc: 'Mobilize communities and advocate for systemic social change', riasec: { S: 2, E: 3 }, courses: ['SOCW 320', 'SOCW 370'] },
    { name: 'Child & Family Services', desc: 'Support children and families through welfare systems', riasec: { S: 3, C: 1 }, courses: ['SOCW 210', 'SOCW 330'] },
    { name: 'Policy & Program Evaluation', desc: 'Assess social programs and shape human service policy', riasec: { I: 2, C: 2 }, courses: ['SOCW 380', 'SOCW 390'] },
  ]},
  { major: 'Nursing (Four-Year)', areas: [
    { name: 'Acute & Critical Care', desc: 'Advanced nursing care in hospital and intensive care settings', riasec: { R: 2, I: 2 }, courses: ['GNUR 310', 'GNUR 370'] },
    { name: 'Community & Public Health', desc: 'Population-focused care and health education in community settings', riasec: { S: 3, E: 1 }, courses: ['GNUR 350', 'GNUR 361'] },
    { name: 'Pediatric & Family', desc: 'Care for children and families across developmental stages', riasec: { S: 3, R: 1 }, courses: ['GNUR 320', 'GNUR 293'] },
    { name: 'Mental Health Nursing', desc: 'Patients with psychiatric and behavioral health conditions', riasec: { S: 3, I: 2 }, courses: ['GNUR 383', 'GNUR 385'] },
    { name: 'Nursing Leadership', desc: 'Lead healthcare teams and integrate research into clinical decisions', riasec: { E: 2, I: 2 }, courses: ['GNUR 371', 'GNUR 399'] },
  ]},
  { major: 'Public Health', areas: [
    { name: 'Epidemiology & Prevention', desc: 'Disease patterns and population-level prevention strategies', riasec: { I: 3, C: 1 }, courses: ['PUBH 210', 'PUBH 301'] },
    { name: 'Health Equity & Social Justice', desc: 'Health disparities rooted in race, poverty, and inequality', riasec: { S: 3, E: 1 }, courses: ['PUBH 200', 'PUBH 305'] },
    { name: 'Global Health', desc: 'Infectious disease, maternal health, and health systems globally', riasec: { I: 2, S: 2 }, courses: ['PUBH 220', 'PUBH 330'] },
    { name: 'Environmental Health', desc: 'Environmental hazards, toxicology, and workplace protections', riasec: { R: 2, I: 2 }, courses: ['PUBH 310', 'PUBH 320'] },
    { name: 'Health Education & Promotion', desc: 'Behavior-change campaigns and wellness programs', riasec: { S: 2, A: 2 }, courses: ['PUBH 100', 'PUBH 390'] },
  ]},
  { major: 'Cognitive and Behavioral Neuroscience', areas: [
    { name: 'Cognitive Neuroscience', desc: 'Brain systems supporting perception, memory, and decision-making', riasec: { I: 3, R: 1 }, courses: ['NEUR 301', 'NEUR 330'] },
    { name: 'Behavioral & Clinical', desc: 'Neural bases of mental illness, addiction, and neurological disorders', riasec: { I: 3, S: 1 }, courses: ['NEUR 302', 'NEUR 340'] },
    { name: 'Research Methods', desc: 'Imaging, electrophysiology, and computational tools for brain study', riasec: { I: 3, R: 2 }, courses: ['NEUR 200', 'NEUR 380'] },
    { name: 'Developmental & Social', desc: 'Brain development and social/emotional information processing', riasec: { I: 2, S: 2 }, courses: ['NEUR 320', 'NEUR 350'] },
  ]},
  { major: 'Molecular and Cellular Neuroscience', areas: [
    { name: 'Molecular Neurobiology', desc: 'Gene expression, signaling pathways, and molecular mechanisms in neurons', riasec: { I: 3, R: 2 }, courses: ['NEUR 301', 'NEUR 340'] },
    { name: 'Cellular & Systems', desc: 'Neural circuits, synaptic physiology, and cellular brain architecture', riasec: { I: 3, R: 1 }, courses: ['NEUR 302', 'NEUR 330'] },
    { name: 'Neuropharmacology', desc: 'Drug mechanisms, receptor biology, and therapeutic development', riasec: { I: 3, R: 2 }, courses: ['NEUR 370', 'NEUR 350'] },
    { name: 'Lab Techniques', desc: 'Wet-lab methods, microscopy, and quantitative analysis', riasec: { R: 3, I: 2 }, courses: ['NEUR 200', 'NEUR 390'] },
  ]},
  { major: 'Applied Psychology', areas: [
    { name: 'Clinical & Counseling', desc: 'Psychotherapy approaches, assessment, and mental health treatment', riasec: { S: 3, I: 2 }, courses: ['PSYC 280', 'PSYC 314'] },
    { name: 'Industrial-Organizational', desc: 'Workplace behavior, leadership, and organizational design', riasec: { E: 2, I: 2 }, courses: ['PSYC 301', 'PSYC 350'] },
    { name: 'Developmental & Educational', desc: 'Human development across the lifespan and learning processes', riasec: { S: 2, I: 2 }, courses: ['PSYC 230', 'PSYC 240'] },
    { name: 'Health & Behavioral', desc: 'How behavior affects physical health and wellness interventions', riasec: { I: 2, S: 2 }, courses: ['PSYC 274', 'PSYC 310'] },
    { name: 'Research & Data', desc: 'Quantitative and experimental skills for psychological research', riasec: { I: 3, C: 2 }, courses: ['PSYC 204', 'PSYC 205'] },
  ]},

  // =========================================================================
  // BATCH 4: ARTS & HUMANITIES
  // =========================================================================
  { major: 'Art History', areas: [
    { name: 'Modern & Contemporary Art', desc: 'Critical analysis of 19th-21st century art movements', riasec: { I: 2, A: 1 }, courses: ['ARTH 260', 'ARTH 350'] },
    { name: 'Ancient & Medieval Art', desc: 'Classical, Byzantine, and medieval visual culture', riasec: { I: 3 }, courses: ['ARTH 210', 'ARTH 211'] },
    { name: 'Museum & Curatorial Studies', desc: 'Gallery practice, exhibition design, and arts administration', riasec: { A: 1, E: 2 }, courses: ['ARTH 399', 'ARTH 301'] },
    { name: 'Global & Cross-Cultural Art', desc: 'Non-Western art traditions and intercultural exchange', riasec: { I: 2, S: 1 }, courses: ['ARTH 240', 'ARTH 250'] },
  ]},
  { major: 'Dance', areas: [
    { name: 'Performance & Technique', desc: 'Advanced training in ballet, modern, and contemporary forms', riasec: { A: 2, R: 1 }, courses: ['DANC 210', 'DANC 310'] },
    { name: 'Choreography', desc: 'Original movement creation, improvisation, and composition', riasec: { A: 3 }, courses: ['DANC 240', 'DANC 340'] },
    { name: 'Dance Education', desc: 'Teaching pedagogy and dance in community settings', riasec: { S: 2, A: 1 }, courses: ['DANC 250', 'DANC 300'] },
    { name: 'Dance Studies & History', desc: 'Critical analysis of dance history, culture, and theory', riasec: { I: 2, A: 1 }, courses: ['DANC 230', 'DANC 330'] },
  ]},
  { major: 'Drawing, Painting and Printmaking', areas: [
    { name: 'Painting & Color', desc: 'Oil, acrylic, and mixed-media painting with color theory', riasec: { A: 3 }, courses: ['FNAR 210', 'FNAR 310'] },
    { name: 'Drawing & Illustration', desc: 'Observational drawing, figure study, and narrative illustration', riasec: { A: 2, R: 1 }, courses: ['FNAR 101', 'FNAR 200'] },
    { name: 'Printmaking & Book Arts', desc: 'Relief, intaglio, screen printing, and artist book production', riasec: { A: 2, R: 2 }, courses: ['FNAR 230', 'FNAR 330'] },
    { name: 'Conceptual & Interdisciplinary', desc: 'Concept-driven practice bridging media and critique', riasec: { A: 2, I: 1 }, courses: ['FNAR 350', 'FNAR 360'] },
  ]},
  { major: 'Film and Digital Media: Film and Media Production Track', areas: [
    { name: 'Directing & Narrative Film', desc: 'Storytelling through scripted short and feature filmmaking', riasec: { A: 2, E: 1 }, courses: ['FILM 300', 'FILM 310'] },
    { name: 'Cinematography & Editing', desc: 'Camera work, lighting, and post-production editing', riasec: { A: 1, R: 2 }, courses: ['FILM 210', 'FILM 260'] },
    { name: 'Documentary & Social Impact', desc: 'Non-fiction filmmaking focused on real stories', riasec: { A: 1, S: 2 }, courses: ['FILM 250', 'FILM 330'] },
    { name: 'Screenwriting', desc: 'Script development for film, television, and digital media', riasec: { A: 3 }, courses: ['FILM 230', 'FILM 350'] },
  ]},
  { major: 'Film and Digital Media: International Programming Track', areas: [
    { name: 'World Cinema Studies', desc: 'Analysis of global film movements and international auteurs', riasec: { I: 2, A: 1 }, courses: ['FILM 270', 'FILM 280'] },
    { name: 'Film Curation & Programming', desc: 'Festival programming, distribution, and audience development', riasec: { E: 2, A: 1 }, courses: ['FILM 340', 'FILM 370'] },
    { name: 'Film Theory & Criticism', desc: 'Critical frameworks for interpreting cinema and media', riasec: { I: 3 }, courses: ['FILM 201', 'FILM 310'] },
  ]},
  { major: 'Music', areas: [
    { name: 'Theory & Composition', desc: 'Harmony, counterpoint, arranging, and original composition', riasec: { A: 2, I: 1 }, courses: ['MUSC 201', 'MUSC 300'] },
    { name: 'Music History & Scholarship', desc: 'Research in Western and world music traditions', riasec: { I: 2, A: 1 }, courses: ['MUSC 210', 'MUSC 320'] },
    { name: 'Applied Performance', desc: 'Private lessons, recital preparation, and ensemble', riasec: { A: 2, R: 1 }, courses: ['MUSC 150', 'MUSC 250'] },
    { name: 'Music Technology', desc: 'Digital audio, recording, and music production', riasec: { R: 2, A: 1 }, courses: ['MUSC 170', 'MUSC 260'] },
  ]},
  { major: 'Music with Jazz Studies Concentration', areas: [
    { name: 'Jazz Performance & Improvisation', desc: 'Solo and combo performance with emphasis on improvisation', riasec: { A: 3 }, courses: ['MUSC 150', 'MUSC 250'] },
    { name: 'Jazz Composition & Arranging', desc: 'Writing and arranging for jazz ensembles', riasec: { A: 2, I: 1 }, courses: ['MUSC 300', 'MUSC 310'] },
    { name: 'Jazz History & Culture', desc: 'Evolution of jazz from roots through contemporary styles', riasec: { I: 2, A: 1 }, courses: ['MUSC 210', 'MUSC 215'] },
  ]},
  { major: 'Music with Liturgical Music Concentration', areas: [
    { name: 'Sacred Music Performance', desc: 'Organ, choral, and vocal performance for worship', riasec: { A: 2, S: 1 }, courses: ['MUSC 150', 'MUSC 250'] },
    { name: 'Liturgical Planning & Leadership', desc: 'Designing and directing music for services', riasec: { S: 2, E: 1 }, courses: ['MUSC 315', 'MUSC 399'] },
    { name: 'Hymnody & Sacred History', desc: 'Hymn traditions, chant, and sacred repertoire', riasec: { I: 2, A: 1 }, courses: ['MUSC 210', 'MUSC 320'] },
  ]},
  { major: 'Music with Vocal Performance Concentration', areas: [
    { name: 'Classical Voice & Recital', desc: 'Art song, aria preparation, and solo performance', riasec: { A: 3 }, courses: ['MUSC 150', 'MUSC 350'] },
    { name: 'Opera & Dramatic Performance', desc: 'Staged opera scenes and theatrical production', riasec: { A: 2, E: 1 }, courses: ['MUSC 240', 'MUSC 340'] },
    { name: 'Choral & Ensemble Singing', desc: 'Choral performance, vocal blend, and ensemble leadership', riasec: { A: 1, S: 2 }, courses: ['MUSC 130', 'MUSC 330'] },
  ]},
  { major: 'Photography and Video Art', areas: [
    { name: 'Documentary & Photojournalism', desc: 'Visual storytelling through documentary photography', riasec: { A: 1, S: 2 }, courses: ['PHOT 210', 'PHOT 310'] },
    { name: 'Fine Art Photography', desc: 'Conceptual and gallery-oriented photographic practice', riasec: { A: 3 }, courses: ['PHOT 230', 'PHOT 330'] },
    { name: 'Video & Time-Based Media', desc: 'Video art, experimental film, and multimedia installation', riasec: { A: 2, R: 1 }, courses: ['PHOT 240', 'PHOT 340'] },
    { name: 'Digital Imaging & Post-Production', desc: 'Advanced editing, color grading, and digital darkroom', riasec: { R: 2, A: 1 }, courses: ['PHOT 200', 'PHOT 260'] },
  ]},
  { major: 'Sculpture and Ceramics', areas: [
    { name: 'Sculptural Practice', desc: 'Fabrication, carving, casting, and large-scale installation', riasec: { A: 2, R: 2 }, courses: ['FNAR 120', 'FNAR 250'] },
    { name: 'Ceramics & Functional Art', desc: 'Wheel-throwing, hand-building, glazing, and kiln work', riasec: { R: 2, A: 1 }, courses: ['FNAR 130', 'FNAR 260'] },
    { name: 'Conceptual & Installation Art', desc: 'Site-specific work, mixed media, and idea-driven sculpture', riasec: { A: 3 }, courses: ['FNAR 280', 'FNAR 340'] },
  ]},
  { major: 'Theatre', areas: [
    { name: 'Acting & Performance', desc: 'Scene study, voice, movement, and audition technique', riasec: { A: 2, S: 1 }, courses: ['THEA 200', 'THEA 300'] },
    { name: 'Directing & Dramaturgy', desc: 'Production leadership, script analysis, and dramaturgy', riasec: { A: 1, E: 2 }, courses: ['THEA 260', 'THEA 360'] },
    { name: 'Design & Technical Theatre', desc: 'Set, lighting, costume, and sound design', riasec: { R: 2, A: 1 }, courses: ['THEA 220', 'THEA 230'] },
    { name: 'Playwriting & Devised Work', desc: 'Original script creation and collaborative devised theatre', riasec: { A: 3 }, courses: ['THEA 270', 'THEA 350'] },
  ]},
  { major: 'Visual Communication', areas: [
    { name: 'Graphic Design & Branding', desc: 'Typography, logo design, and visual identity systems', riasec: { A: 2, E: 1 }, courses: ['VCOM 210', 'VCOM 310'] },
    { name: 'UX & Interactive Design', desc: 'User experience, web design, and interface prototyping', riasec: { A: 1, I: 1, R: 1 }, courses: ['VCOM 240', 'VCOM 340'] },
    { name: 'Motion Graphics & Video', desc: 'Animation, motion design, and video content', riasec: { A: 2, R: 1 }, courses: ['VCOM 260', 'VCOM 300'] },
    { name: 'Advertising & Campaign Design', desc: 'Strategic visual campaigns for brands', riasec: { A: 1, E: 2 }, courses: ['VCOM 250', 'VCOM 320'] },
  ]},

  // =========================================================================
  // BATCH 5: LANGUAGES, LITERATURE, SOCIAL SCIENCES
  // =========================================================================
  { major: 'Ancient Greek', areas: [
    { name: 'Classical Language Mastery', desc: 'Advanced reading of Greek prose and poetry', riasec: { I: 2, A: 1 }, courses: ['GREK 201', 'GREK 202'] },
    { name: 'Textual & Literary Analysis', desc: 'Critical interpretation of ancient Greek literary traditions', riasec: { I: 2, A: 2 }, courses: ['GREK 201', 'CLST 201'] },
  ]},
  { major: 'Anthropology', areas: [
    { name: 'Archaeology & Material Culture', desc: 'Excavation methods, artifact analysis, and prehistoric societies', riasec: { R: 2, I: 1 }, courses: ['ANTH 241', 'ANTH 243'] },
    { name: 'Cultural & Ethnographic Research', desc: 'Fieldwork, ethnography, and cross-cultural comparison', riasec: { I: 2, S: 1 }, courses: ['ANTH 102', 'ANTH 303'] },
    { name: 'Medical & Applied Anthropology', desc: 'Health, development, and social justice through anthropology', riasec: { S: 2, I: 1 }, courses: ['ANTH 258', 'ANTH 280'] },
    { name: 'Biological Anthropology', desc: 'Human evolution, primatology, and forensic applications', riasec: { I: 3 }, courses: ['ANTH 107', 'ANTH 103'] },
  ]},
  { major: 'Classical Civilization', areas: [
    { name: 'Ancient Literature & Mythology', desc: 'Greek and Roman literary traditions in translation', riasec: { A: 2, I: 1 }, courses: ['CLST 101', 'CLST 201'] },
    { name: 'Historical & Political Contexts', desc: 'Governance, warfare, and society in the ancient world', riasec: { I: 2, S: 1 }, courses: ['CLST 202', 'HIST 101'] },
    { name: 'Languages of Antiquity', desc: 'Engaging primary sources through Latin and Greek', riasec: { I: 2, A: 1 }, courses: ['LATN 101', 'GREK 101'] },
  ]},
  { major: 'French', areas: [
    { name: 'French Literature & Culture', desc: 'Francophone literary and artistic traditions', riasec: { A: 2, I: 1 }, courses: ['FREN 301', 'FREN 330'] },
    { name: 'Advanced Language & Translation', desc: 'Mastery of French for professional use', riasec: { C: 2, A: 1 }, courses: ['FREN 302', 'FREN 310'] },
    { name: 'Francophone Global Studies', desc: 'French-speaking cultures across Africa and the Caribbean', riasec: { S: 2, I: 1 }, courses: ['FREN 350', 'FREN 360'] },
    { name: 'Teaching & Applied Linguistics', desc: 'Language pedagogy and linguistic analysis', riasec: { S: 2, A: 1 }, courses: ['FREN 320', 'FREN 370'] },
  ]},
  { major: 'Global Studies', areas: [
    { name: 'International Development', desc: 'Poverty, sustainability, and human rights globally', riasec: { S: 2, E: 1 }, courses: ['GLST 200', 'GLST 230'] },
    { name: 'Global Politics & Diplomacy', desc: 'International relations, conflict resolution', riasec: { E: 2, I: 1 }, courses: ['GLST 220', 'GLST 300'] },
    { name: 'Cultural Globalization', desc: 'Migration, identity, and cultural exchange', riasec: { A: 1, S: 1, I: 1 }, courses: ['GLST 210', 'GLST 240'] },
  ]},
  { major: 'History', areas: [
    { name: 'American History', desc: 'Political, social, and cultural history of the US', riasec: { I: 2, S: 1 }, courses: ['HIST 210', 'HIST 310'] },
    { name: 'European & World History', desc: 'Empires, revolutions, and global connections', riasec: { I: 2, A: 1 }, courses: ['HIST 101', 'HIST 270'] },
    { name: 'Public History & Archival Work', desc: 'Museums, digital archives, and community history', riasec: { C: 2, S: 1 }, courses: ['HIST 300', 'HIST 390'] },
    { name: 'Social Justice & Activist History', desc: 'Race, gender, labor, and movements for change', riasec: { S: 2, I: 1 }, courses: ['HIST 260', 'HIST 280'] },
  ]},
  { major: 'Italian', areas: [
    { name: 'Italian Literature & Cinema', desc: 'Dante to contemporary film and narrative', riasec: { A: 2, I: 1 }, courses: ['ITAL 301', 'ITAL 330'] },
    { name: 'Advanced Language & Professional Italian', desc: 'Fluency for global careers', riasec: { C: 2, E: 1 }, courses: ['ITAL 302', 'ITAL 310'] },
    { name: 'Italian Culture & Society', desc: 'Art, history, and cultural identity', riasec: { S: 1, A: 2 }, courses: ['ITAL 320', 'ITAL 350'] },
  ]},
  { major: 'Latin', areas: [
    { name: 'Latin Prose & Rhetoric', desc: 'Cicero, Livy, and Roman argumentation', riasec: { I: 2, E: 1 }, courses: ['LATN 201', 'LATN 301'] },
    { name: 'Latin Poetry', desc: 'Virgil, Ovid, and the poetic legacy of Rome', riasec: { A: 2, I: 1 }, courses: ['LATN 202', 'LATN 301'] },
  ]},
  { major: 'Philosophy', areas: [
    { name: 'Ethics & Social Philosophy', desc: 'Moral reasoning, justice, and applied ethics', riasec: { S: 2, I: 1 }, courses: ['PHIL 130', 'PHIL 270'] },
    { name: 'Logic & Analytic Philosophy', desc: 'Formal logic, philosophy of language, epistemology', riasec: { I: 2, C: 1 }, courses: ['PHIL 210', 'PHIL 250'] },
    { name: 'History of Philosophy', desc: 'Ancient, medieval, and modern philosophical traditions', riasec: { I: 2, A: 1 }, courses: ['PHIL 220', 'PHIL 230'] },
    { name: 'Pre-Law & Applied Reasoning', desc: 'Argumentation, critical thinking, and law school prep', riasec: { E: 2, I: 1 }, courses: ['PHIL 150', 'PHIL 283'] },
  ]},
  { major: 'Religious Studies', areas: [
    { name: 'World Religions', desc: 'Cross-cultural analysis of global religious traditions', riasec: { I: 2, S: 1 }, courses: ['RELG 100', 'RELG 210'] },
    { name: 'Ethics & Spirituality', desc: 'Religion and moral life, social justice, contemplative practice', riasec: { S: 2, A: 1 }, courses: ['RELG 220', 'RELG 250'] },
    { name: 'Sacred Texts', desc: 'Hermeneutics and critical study of scriptures', riasec: { I: 2, A: 1 }, courses: ['RELG 200', 'RELG 230'] },
  ]},
  { major: 'Sociology', areas: [
    { name: 'Race, Class & Inequality', desc: 'Structural inequality, stratification, and social justice', riasec: { S: 2, I: 1 }, courses: ['SOCL 101', 'SOCL 230'] },
    { name: 'Criminology & Law', desc: 'Crime, deviance, policing, and the justice system', riasec: { I: 2, E: 1 }, courses: ['SOCL 250', 'SOCL 270'] },
    { name: 'Research Methods', desc: 'Survey design, statistics, and quantitative social science', riasec: { I: 2, C: 1 }, courses: ['SOCL 202', 'SOCL 203'] },
    { name: 'Community & Urban Sociology', desc: 'Cities, neighborhoods, and social change', riasec: { S: 2, E: 1 }, courses: ['SOCL 260', 'SOCL 310'] },
  ]},
  { major: 'Sociology-Anthropology', areas: [
    { name: 'Ethnography & Qualitative Research', desc: 'Fieldwork blending sociological and anthropological inquiry', riasec: { I: 2, S: 1 }, courses: ['SOCL 202', 'ANTH 303'] },
    { name: 'Culture, Identity & Globalization', desc: 'How culture shapes identity across societies', riasec: { A: 1, S: 1, I: 1 }, courses: ['ANTH 102', 'SOCL 240'] },
    { name: 'Health & Social Systems', desc: 'Medical anthropology and sociology of health disparities', riasec: { S: 2, I: 1 }, courses: ['ANTH 258', 'SOCL 230'] },
  ]},
  { major: 'Spanish', areas: [
    { name: 'Hispanic Literature & Culture', desc: 'Literary traditions from Spain, Latin America, and the US', riasec: { A: 2, I: 1 }, courses: ['SPAN 301', 'SPAN 330'] },
    { name: 'Advanced Language & Translation', desc: 'Professional-level fluency and translation practice', riasec: { C: 2, A: 1 }, courses: ['SPAN 302', 'SPAN 310'] },
    { name: 'Latinx & Community Engagement', desc: 'Spanish in US communities and social justice', riasec: { S: 2, E: 1 }, courses: ['SPAN 350', 'SPAN 360'] },
    { name: 'Spanish for the Professions', desc: 'Business, healthcare, and legal Spanish', riasec: { E: 2, C: 1 }, courses: ['SPAN 320', 'SPAN 370'] },
  ]},
  { major: 'Theology', areas: [
    { name: 'Biblical Studies', desc: 'Exegesis and interpretation of Old and New Testament', riasec: { I: 2, A: 1 }, courses: ['THEO 200', 'THEO 210'] },
    { name: 'Systematic & Moral Theology', desc: 'Doctrine, ethics, and the intellectual tradition', riasec: { I: 2, S: 1 }, courses: ['THEO 230', 'THEO 250'] },
    { name: 'Theology & Social Justice', desc: 'Liberation theology, Catholic social teaching, activism', riasec: { S: 2, E: 1 }, courses: ['THEO 260', 'THEO 280'] },
    { name: 'Liturgy & Ministry', desc: 'Worship, pastoral care, and vocational formation', riasec: { S: 2, A: 1 }, courses: ['THEO 240', 'THEO 270'] },
  ]},
  { major: "Women's Studies and Gender Studies", areas: [
    { name: 'Feminist Theory', desc: 'Critical frameworks for understanding gender and power', riasec: { I: 2, A: 1 }, courses: ['WSGS 100', 'WSGS 200'] },
    { name: 'Gender, Race & Social Justice', desc: 'Intersectional activism and community organizing', riasec: { S: 2, E: 1 }, courses: ['WSGS 210', 'WSGS 240'] },
    { name: 'Sexuality, Health & the Body', desc: 'Queer studies, reproductive justice, and health', riasec: { I: 1, S: 2 }, courses: ['WSGS 220', 'WSGS 230'] },
  ]},

  // =========================================================================
  // BATCH 6+7: COMMUNICATION, EDUCATION, NICHE/COMBINED
  // =========================================================================
  { major: 'Advertising & Public Relations', areas: [
    { name: 'Campaign Strategy', desc: 'Integrated advertising and PR campaign planning', riasec: { E: 2, A: 1 }, courses: ['COMM 320', 'COMM 370'] },
    { name: 'Media Relations & Crisis Comm', desc: 'Press strategy, reputation management, crisis response', riasec: { E: 2, S: 1 }, courses: ['COMM 380', 'COMM 301'] },
    { name: 'Creative Content & Branding', desc: 'Visual storytelling and brand identity', riasec: { A: 2, E: 1 }, courses: ['COMM 310', 'COMM 340'] },
  ]},
  { major: 'Advertising Creative', areas: [
    { name: 'Art Direction', desc: 'Visual concept development and creative direction', riasec: { A: 3 }, courses: ['COMM 310', 'COMM 340'] },
    { name: 'Copywriting & Storytelling', desc: 'Persuasive writing for ads and digital platforms', riasec: { A: 2, E: 1 }, courses: ['COMM 320', 'COMM 260'] },
    { name: 'Digital & Interactive Design', desc: 'Web, social media, and interactive ad experiences', riasec: { A: 2, R: 1 }, courses: ['COMM 240', 'COMM 370'] },
  ]},
  { major: 'Advocacy and Social Change', areas: [
    { name: 'Community Organizing', desc: 'Grassroots mobilization and coalition-building', riasec: { S: 2, E: 1 }, courses: ['COMM 301', 'COMM 380'] },
    { name: 'Political Communication', desc: 'Rhetoric, persuasion, and messaging for policy change', riasec: { E: 2, S: 1 }, courses: ['COMM 320', 'COMM 370'] },
    { name: 'Digital Activism', desc: 'Social media campaigns and digital tools for movements', riasec: { A: 1, E: 2 }, courses: ['COMM 240', 'COMM 340'] },
  ]},
  { major: 'Multimedia Journalism', areas: [
    { name: 'Investigative Reporting', desc: 'In-depth research, source development, and long-form journalism', riasec: { I: 2, E: 1 }, courses: ['JOUR 300', 'JOUR 310'] },
    { name: 'Broadcast & Video Journalism', desc: 'On-camera reporting and video production', riasec: { A: 2, R: 1 }, courses: ['JOUR 260', 'JOUR 320'] },
    { name: 'Digital-First Storytelling', desc: 'Web publishing, podcasting, and social media journalism', riasec: { A: 2, E: 1 }, courses: ['JOUR 240', 'JOUR 250'] },
    { name: 'Data & Visual Journalism', desc: 'Data analysis, infographics, and interactive storytelling', riasec: { I: 2, C: 1 }, courses: ['JOUR 330', 'JOUR 210'] },
  ]},
  { major: 'Strategic Digital Communication', areas: [
    { name: 'Social Media Strategy', desc: 'Platform management, content calendars, audience growth', riasec: { E: 2, A: 1 }, courses: ['COMM 240', 'COMM 370'] },
    { name: 'Digital Analytics & SEO', desc: 'Metrics, search optimization, and performance tracking', riasec: { I: 1, C: 2 }, courses: ['COMM 290', 'COMM 350'] },
    { name: 'Content Marketing', desc: 'Branded content creation and storytelling across channels', riasec: { A: 2, E: 1 }, courses: ['COMM 310', 'COMM 320'] },
  ]},
  { major: 'Elementary Education', areas: [
    { name: 'Literacy & Language Arts', desc: 'Reading instruction and writing workshops', riasec: { S: 2, A: 1 }, courses: ['CIEP 301', 'CIEP 310'] },
    { name: 'STEM Integration', desc: 'Science and math teaching for elementary classrooms', riasec: { S: 2, I: 1 }, courses: ['CIEP 320', 'CIEP 330'] },
    { name: 'Inclusive Classroom Practice', desc: 'Differentiated instruction and diverse learner support', riasec: { S: 3 }, courses: ['CIEP 350', 'CIEP 290'] },
    { name: 'Curriculum Design & Leadership', desc: 'Designing units, assessment, and teacher leadership', riasec: { S: 1, E: 2 }, courses: ['CIEP 370', 'CIEP 380'] },
  ]},
  { major: 'Secondary Education', areas: [
    { name: 'Content-Area Expertise', desc: 'Deep subject-matter teaching in secondary disciplines', riasec: { I: 2, S: 1 }, courses: ['CIEP 344', 'CIEP 345'] },
    { name: 'Adolescent Development', desc: 'Understanding teenage learners and classroom management', riasec: { S: 2, I: 1 }, courses: ['CIEP 260', 'CIEP 270'] },
    { name: 'Equity & Urban Education', desc: 'Culturally responsive teaching in diverse settings', riasec: { S: 2, E: 1 }, courses: ['CIEP 370', 'ELPS 310'] },
  ]},
  { major: 'Special Education', areas: [
    { name: 'Learning Disabilities', desc: 'Assessment and intervention for learning differences', riasec: { S: 2, I: 1 }, courses: ['CIEP 350', 'CIEP 355'] },
    { name: 'Behavior & Emotional Support', desc: 'Behavioral intervention and social-emotional learning', riasec: { S: 3 }, courses: ['CIEP 360', 'CIEP 290'] },
    { name: 'Assistive Technology & Inclusion', desc: 'Adaptive tools and inclusive classroom design', riasec: { S: 2, R: 1 }, courses: ['CIEP 340', 'CIEP 370'] },
  ]},
  { major: 'Middle Grades', areas: [
    { name: 'Interdisciplinary Teaching', desc: 'Cross-subject project-based learning for ages 10-14', riasec: { S: 2, A: 1 }, courses: ['CIEP 301', 'CIEP 320'] },
    { name: 'Early Adolescent Development', desc: 'Developmental psychology and classroom management', riasec: { S: 2, I: 1 }, courses: ['CIEP 260', 'CIEP 270'] },
    { name: 'STEM & Inquiry Methods', desc: 'Hands-on science and math for middle grades', riasec: { I: 2, S: 1 }, courses: ['CIEP 344', 'CIEP 330'] },
  ]},
  { major: 'Early Childhood Special Education', areas: [
    { name: 'Developmental Interventions', desc: 'Early identification and support for children with delays', riasec: { S: 2, I: 1 }, courses: ['CIEP 350', 'CIEP 200'] },
    { name: 'Family & Community Partnerships', desc: 'Working with families to support young learners', riasec: { S: 3 }, courses: ['CIEP 280', 'CIEP 290'] },
    { name: 'Play-Based & Adaptive Learning', desc: 'Therapeutic play and sensory-rich instruction', riasec: { S: 2, A: 1 }, courses: ['CIEP 355', 'CIEP 240'] },
  ]},
  { major: 'Bilingual/Bicultural Education', areas: [
    { name: 'Dual Language Instruction', desc: 'Teaching methods for bilingual and immersion classrooms', riasec: { S: 2, A: 1 }, courses: ['CIEP 301', 'CIEP 310'] },
    { name: 'ESL & Linguistics', desc: 'English as a second language pedagogy', riasec: { S: 2, I: 1 }, courses: ['CIEP 320', 'CIEP 330'] },
    { name: 'Cultural Competency & Equity', desc: 'Culturally sustaining pedagogy and community engagement', riasec: { S: 2, E: 1 }, courses: ['CIEP 370', 'ELPS 320'] },
  ]},
  { major: 'Information Technology', areas: [
    { name: 'Systems Administration', desc: 'Server management, networking, and IT infrastructure', riasec: { R: 2, C: 1 }, courses: ['COMP 264', 'COMP 343'] },
    { name: 'Software Development', desc: 'Application programming and full-stack development', riasec: { R: 1, I: 2 }, courses: ['COMP 271', 'COMP 330'] },
    { name: 'Cybersecurity', desc: 'Network security, ethical hacking, and risk management', riasec: { I: 2, C: 1 }, courses: ['COMP 343', 'COMP 310'] },
    { name: 'IT Project Management', desc: 'Leading technology teams and managing deployments', riasec: { E: 2, C: 1 }, courses: ['COMP 317', 'COMP 390'] },
  ]},
  { major: 'Web Technologies', areas: [
    { name: 'Front-End Development', desc: 'User interfaces, responsive design, and JS frameworks', riasec: { A: 2, R: 1 }, courses: ['COMP 271', 'COMP 341'] },
    { name: 'Back-End & Databases', desc: 'Server-side logic, APIs, and database management', riasec: { R: 2, I: 1 }, courses: ['COMP 330', 'COMP 272'] },
    { name: 'UX/UI Design', desc: 'User experience research and interface design', riasec: { A: 2, S: 1 }, courses: ['COMP 341', 'COMP 317'] },
  ]},
  { major: 'Paralegal Studies', areas: [
    { name: 'Litigation Support', desc: 'Trial preparation, legal research, and case management', riasec: { C: 2, E: 1 }, courses: ['PLSC 300', 'PLSC 370'] },
    { name: 'Corporate & Contract Law', desc: 'Business law, contract drafting, and compliance', riasec: { C: 2, E: 1 }, courses: ['PLSC 340', 'PLSC 350'] },
    { name: 'Criminal Justice & Legal Aid', desc: 'Public defense support and criminal case research', riasec: { S: 2, C: 1 }, courses: ['CRIM 301', 'PLSC 370'] },
  ]},
  { major: 'African Studies and the African Diaspora', areas: [
    { name: 'Cultural & Literary Studies', desc: 'African and diasporic literature and cultural production', riasec: { A: 2, I: 1 }, courses: ['ANTH 213', 'HIST 260'] },
    { name: 'History & Politics', desc: 'Colonial history, postcolonial governance, and Pan-African movements', riasec: { I: 2, S: 1 }, courses: ['HIST 270', 'PLSC 320'] },
    { name: 'Social Justice & Activism', desc: 'Race, equity, and community-based advocacy', riasec: { S: 2, E: 1 }, courses: ['SOCL 230', 'PLSC 330'] },
  ]},
  { major: 'Environmental Economics and Sustainability: Governance', areas: [
    { name: 'Environmental Policy Analysis', desc: 'Evaluating regulations and governance frameworks', riasec: { I: 2, E: 1 }, courses: ['ENVS 300', 'PLSC 340'] },
    { name: 'Climate & Energy Governance', desc: 'Policy for climate mitigation and energy transitions', riasec: { E: 2, I: 1 }, courses: ['ENVS 310', 'ENVS 320'] },
    { name: 'Community & Stakeholder Engagement', desc: 'Public participation and environmental justice', riasec: { S: 2, E: 1 }, courses: ['ENVS 370', 'ENVS 380'] },
  ]},
  { major: 'Environmental Economics and Sustainability: Management', areas: [
    { name: 'Corporate Sustainability', desc: 'ESG reporting, green supply chains, sustainable strategy', riasec: { E: 2, C: 1 }, courses: ['ENVS 300', 'ENVS 340'] },
    { name: 'Resource & Waste Management', desc: 'Circular economy, resource efficiency, waste reduction', riasec: { R: 2, C: 1 }, courses: ['ENVS 320', 'ENVS 330'] },
    { name: 'Environmental Finance', desc: 'Cost-benefit analysis, ecosystem services, green investment', riasec: { I: 2, E: 1 }, courses: ['ENVS 310', 'ENVS 350'] },
  ]},
  { major: 'Environmental Policy', areas: [
    { name: 'Regulatory & Legislative Analysis', desc: 'Drafting and evaluating environmental regulations', riasec: { I: 2, E: 1 }, courses: ['ENVS 300', 'PLSC 340'] },
    { name: 'Environmental Justice', desc: 'Equity in environmental burdens and community advocacy', riasec: { S: 2, E: 1 }, courses: ['ENVS 370', 'ENVS 380'] },
    { name: 'Climate Policy & Adaptation', desc: 'Climate risk assessment and resilience planning', riasec: { I: 2, S: 1 }, courses: ['ENVS 310', 'ENVS 350'] },
  ]},
  { major: 'Environmental Science', areas: [
    { name: 'Field Ecology & Conservation', desc: 'Biodiversity surveys, habitat restoration, fieldwork', riasec: { R: 2, I: 1 }, courses: ['ENVS 201', 'BIOL 260'] },
    { name: 'Environmental Chemistry', desc: 'Pollution analysis, water quality, contaminant fate', riasec: { I: 2, R: 1 }, courses: ['CHEM 101', 'ENVS 280'] },
    { name: 'Climate & Atmospheric Science', desc: 'Climate modeling, weather systems, carbon cycles', riasec: { I: 3 }, courses: ['ENVS 310', 'ENVS 320'] },
    { name: 'GIS & Environmental Data', desc: 'Spatial analysis, remote sensing, monitoring', riasec: { I: 2, C: 1 }, courses: ['ENVS 330', 'ENVS 290'] },
  ]},
  { major: 'Environmental Studies', areas: [
    { name: 'Sustainability & Society', desc: 'Human dimensions of environmental challenges', riasec: { S: 2, I: 1 }, courses: ['ENVS 201', 'ENVS 370'] },
    { name: 'Environmental Communication', desc: 'Writing, media, and public engagement on environment', riasec: { A: 2, S: 1 }, courses: ['ENVS 280', 'COMM 301'] },
    { name: 'Policy & Advocacy', desc: 'Environmental lobbying and grassroots campaigns', riasec: { E: 2, S: 1 }, courses: ['ENVS 300', 'PLSC 340'] },
  ]},
  { major: 'Forensic Science', areas: [
    { name: 'Criminalistics & Lab Analysis', desc: 'Evidence processing, fingerprints, trace analysis', riasec: { R: 2, I: 1 }, courses: ['CHEM 111', 'CHEM 112'] },
    { name: 'Forensic Chemistry & Toxicology', desc: 'Drug analysis, poison detection, chemical evidence', riasec: { I: 2, R: 1 }, courses: ['CHEM 223', 'CHEM 224'] },
    { name: 'Forensic Biology & DNA', desc: 'DNA profiling, serology, and biological evidence', riasec: { I: 2, R: 1 }, courses: ['BIOL 251', 'BIOL 282'] },
    { name: 'Criminal Investigation & Law', desc: 'Crime scene procedures and expert testimony', riasec: { I: 1, E: 2 }, courses: ['CRIM 301', 'CRIM 304'] },
  ]},
];

async function seed() {
  const database = await db.initDb();

  // Helper to find program ID by exact name (majors only)
  function findProgram(name) {
    const exact = database.prepare('SELECT id FROM programs WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1');
    exact.bind([name, 'major']);
    let id = null;
    if (exact.step()) { id = exact.getAsObject().id; }
    exact.free();
    if (id) return id;

    const partial = database.prepare('SELECT id FROM programs WHERE LOWER(name) LIKE LOWER(?) AND type = ? LIMIT 1');
    partial.bind([`%${name}%`, 'major']);
    if (partial.step()) { id = partial.getAsObject().id; }
    partial.free();
    return id;
  }

  console.log('Seeding focus areas for all majors...');
  let areasInserted = 0;
  let skipped = [];

  for (const { major, areas } of allFocusAreas) {
    const progId = findProgram(major);
    if (!progId) {
      skipped.push(major);
      continue;
    }

    for (const area of areas) {
      database.run(
        'INSERT OR IGNORE INTO major_focus_areas (program_id, name, description) VALUES (?, ?, ?)',
        [progId, area.name, area.desc]
      );

      const areaStmt = database.prepare('SELECT id FROM major_focus_areas WHERE program_id = ? AND name = ?');
      areaStmt.bind([progId, area.name]);
      let areaId = null;
      if (areaStmt.step()) { areaId = areaStmt.getAsObject().id; }
      areaStmt.free();
      if (!areaId) continue;

      for (const [dim, weight] of Object.entries(area.riasec)) {
        database.run(
          'INSERT OR IGNORE INTO focus_area_riasec (focus_area_id, dimension, weight) VALUES (?, ?, ?)',
          [areaId, dim, weight]
        );
      }

      for (const code of (area.courses || [])) {
        database.run(
          'INSERT OR IGNORE INTO focus_area_courses (focus_area_id, course_code) VALUES (?, ?)',
          [areaId, code]
        );
      }

      areasInserted++;
    }
  }

  console.log(`  Inserted ${areasInserted} focus areas`);
  if (skipped.length > 0) {
    console.log(`  Skipped (no program match): ${skipped.join(', ')}`);
  }

  db.save();
  db.close();
  console.log('Done!');
}

seed().catch(console.error);
