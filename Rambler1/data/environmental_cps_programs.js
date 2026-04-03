// =============================================================================
// Environmental Sustainability, Nursing (Accelerated), and CPS Programs
// Loyola University Chicago (catalog.luc.edu)
//
// Researched 2026-04-01
//
// Courses marked isNew: true are NOT already in Database.js.
// Courses without isNew already exist in Database.js.
// =============================================================================

export const ENVIRONMENTAL_CPS_PROGRAMS = {

  // ===========================================================================
  // 1. Environmental Science BS
  //    Total major credit hours: 66-70 (varies by concentration)
  //    Source: catalog.luc.edu/undergraduate/environmental-sustainability/environmental-science/environmental-science-bs/
  // ===========================================================================
  'Environmental Science BS': {
    totalCredits: 66,
    school: 'Environmental Sustainability',
    degree: 'BS',
    notes: '66-70 credits depending on concentration. Four concentrations available: Conservation & Restoration Ecology, Environmental Health, Food Systems & Sustainable Agriculture, Climate & Energy. All share a common SES core.',
    requirements: {
      sesCore: [
        { code: 'BIOL 101', name: 'General Biology I' },
        { code: 'BIOL 111', name: 'General Biology I Lab' },
        { code: 'CHEM 160', name: 'Chemical Structure and Properties' },
        { code: 'CHEM 161', name: 'Chemical Structure and Properties Laboratory' },
        { code: 'ENVS 137', name: 'Foundations of Environmental Science I', isNew: true },
        { code: 'ENVS 200', name: 'Environmental Careers and Professional Skills', isNew: true },
        { code: 'ENVS 203', name: 'Environmental Statistics', isNew: true },
        { code: 'ENVS 274', name: 'Chemistry of the Natural Environment', isNew: true },
        { code: 'ENVS 275', name: 'Chemistry of the Environment Lab', isNew: true },
        { code: 'ENVS 276', name: 'Chemistry of Environmental Pollution', isNew: true },
        { code: 'ENVS 280', name: 'Principles of Ecology', isNew: true },
        { code: 'ENVS 286S', name: 'Principles of Ecology Lab', isNew: true },
        { code: 'PLSC 392', name: 'Environmental Politics' },
      ],
      scienceSequence_chooseOne: {
        note: 'Choose one sequence based on concentration (non-Climate vs Climate & Energy)',
        optionA: [
          { code: 'BIOL 102', name: 'General Biology II' },
          { code: 'BIOL 112', name: 'General Biology II Lab' },
        ],
        optionB: [
          { code: 'PHYS 111', name: 'College Physics I' },
          { code: 'PHYS 111L', name: 'College Physics I Lab' },
        ],
      },
      justiceAndEthics_chooseOne: [
        { code: 'ENVS 284', name: 'Environmental Justice', isNew: true },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
      ],
      economics_chooseOne: [
        { code: 'ENVS 335', name: 'Ecological Economics', isNew: true },
        { code: 'ECON 328', name: 'Environmental Economics' },
      ],
      capstone_chooseOne: [
        { code: 'ENVS 390', name: 'Integrative Seminar', isNew: true },
        { code: 'ENVS 391C', name: 'Independent Environmental Research (Capstone)', isNew: true },
        { code: 'ENVS 395C', name: 'Environmental Internship (Capstone)', isNew: true },
      ],
      engagedLearning_chooseOne: [
        { code: 'ENVS 226', name: 'Science & Conservation of Freshwater Ecosystems', isNew: true },
        { code: 'ENVS 267', name: 'Bird Conservation and Ecology', isNew: true },
        { code: 'ENVS 273', name: 'Energy and the Environment', isNew: true },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ENVS 340', name: 'Natural History of Belize', isNew: true },
        { code: 'ENVS 345', name: 'Conservation and Sustainability of Neotropical Ecosystems', isNew: true },
        { code: 'ENVS 350A', name: 'Solutions to Environmental Problems: Water', isNew: true },
        { code: 'ENVS 350C', name: 'Solutions to Environmental Problems: Climate Action', isNew: true },
        { code: 'ENVS 350F', name: 'Solutions to Environmental Problems: Food Systems', isNew: true },
        { code: 'ENVS 369', name: 'Field Ornithology', isNew: true },
        { code: 'ENVS 391', name: 'Environmental Research', isNew: true },
        { code: 'ENVS 395', name: 'Environmental Internship', isNew: true },
      ],
      // --- Concentration-specific courses ---
      concentration_conservationRestoration: [
        { code: 'ENVS 218', name: 'Biodiversity & Biogeography', isNew: true },
        { code: 'ENVS 320', name: 'Conservation Biology', isNew: true },
        { code: 'ENVS 321', name: 'Conservation Biology Lab', isNew: true },
        { code: 'ENVS 330', name: 'Restoration Ecology', isNew: true },
        { code: 'ENVS 331', name: 'Restoration Ecology Lab', isNew: true },
        { code: 'ENVS 383', name: 'Human Dimensions of Conservation', isNew: true },
      ],
      concentration_environmentalHealth: [
        { code: 'ENVS 300', name: 'Introduction to Public Health', isNew: true },
        { code: 'ENVS 301', name: 'Environmental Health', isNew: true },
        { code: 'ENVS 303', name: 'Introduction to Epidemiology', isNew: true },
      ],
      concentration_foodSystems: {
        required: [
          { code: 'ENVS 207', name: 'Plants and Civilization', isNew: true },
          { code: 'ENVS 223', name: 'Soil Ecology', isNew: true },
          { code: 'ENVS 325', name: 'Sustainable Agriculture', isNew: true },
        ],
        chooseOne: [
          { code: 'ENVS 230', name: 'Feeding the Planet', isNew: true },
          { code: 'ENVS 326', name: 'Agroecosystems', isNew: true },
          { code: 'ENVS 327', name: 'Food Systems Analysis', isNew: true },
          { code: 'ENVS 350F', name: 'Solutions to Environmental Problems: Food Systems' },
        ],
      },
      concentration_climateEnergy: [
        { code: 'PHYS 112', name: 'College Physics II' },
        { code: 'PHYS 112L', name: 'College Physics II Lab' },
        { code: 'ENVS 224', name: 'Climate & Climate Change', isNew: true },
        { code: 'ENVS 273', name: 'Energy and the Environment' },
        { code: 'ENVS 313', name: 'Energy Law & Policy', isNew: true },
        { code: 'ENVS 316', name: 'Energy and Power Systems', isNew: true },
        { code: 'ENVS 324', name: 'Climate Science', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 2. Environmental Studies BA
  //    Total major credit hours: 51
  //    Source: catalog.luc.edu/undergraduate/environmental-sustainability/environmental-studies/environmental-studies-ba/
  // ===========================================================================
  'Environmental Studies BA': {
    totalCredits: 51,
    school: 'Environmental Sustainability',
    degree: 'BA',
    notes: '51 credit hours for the major. Requires foreign language (102-level or proficiency exam) and two Writing Intensive courses. Broad interdisciplinary program with flexibility across elective categories.',
    requirements: {
      sesCore: [
        { code: 'ENVS 137', name: 'Foundations of Environmental Science I', isNew: true },
        { code: 'ENVS 237', name: 'Foundations of Environmental Chemistry', isNew: true },
        { code: 'ENVS 238', name: 'Foundations of Environmental Science Lab', isNew: true },
        { code: 'ENVS 200', name: 'Environmental Careers and Professional Skills', isNew: true },
        { code: 'ENVS 203', name: 'Environmental Statistics', isNew: true },
        { code: 'ENVS 280', name: 'Principles of Ecology', isNew: true },
        { code: 'ENVS 286', name: 'Principles of Ecology Lab', isNew: true },
        { code: 'PLSC 392', name: 'Environmental Politics' },
      ],
      justiceAndEthics_chooseOne: [
        { code: 'ENVS 284', name: 'Environmental Justice', isNew: true },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
      ],
      economics_chooseOne: [
        { code: 'ENVS 335', name: 'Ecological Economics', isNew: true },
        { code: 'ECON 328', name: 'Environmental Economics' },
      ],
      engagedLearning_chooseOne: [
        { code: 'ENVS 226', name: 'Science & Conservation of Freshwater Ecosystems', isNew: true },
        { code: 'ENVS 267', name: 'Bird Conservation and Ecology', isNew: true },
        { code: 'ENVS 273', name: 'Energy and the Environment', isNew: true },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ENVS 340', name: 'Natural History of Belize', isNew: true },
        { code: 'ENVS 345', name: 'Conservation and Sustainability of Neotropical Ecosystems', isNew: true },
        { code: 'ENVS 350A', name: 'Solutions to Environmental Problems: Water', isNew: true },
        { code: 'ENVS 350C', name: 'Solutions to Environmental Problems: Climate Action', isNew: true },
        { code: 'ENVS 350F', name: 'Solutions to Environmental Problems: Food Systems', isNew: true },
        { code: 'ENVS 369', name: 'Field Ornithology', isNew: true },
        { code: 'ENVS 391', name: 'Environmental Research', isNew: true },
        { code: 'ENVS 395', name: 'Environmental Internship', isNew: true },
      ],
      capstone_chooseOne: [
        { code: 'ENVS 390', name: 'Integrative Seminar', isNew: true },
        { code: 'ENVS 391C', name: 'Independent Environmental Research (Capstone)', isNew: true },
        { code: 'ENVS 395C', name: 'Environmental Internship (Capstone)', isNew: true },
      ],
      electiveSocietyEthicsJustice_chooseTwo: [
        { code: 'ENVS 204', name: 'Gender, Health & Environment', isNew: true },
        { code: 'ENVS 279', name: 'Climate and History', isNew: true },
        { code: 'ENVS 284', name: 'Environmental Justice' },
        { code: 'ENVS 297', name: 'North American Environmental History', isNew: true },
        { code: 'ENVS 310', name: 'Introduction to Environmental Law & Policy', isNew: true },
        { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy', isNew: true },
        { code: 'ENVS 312', name: 'Water Law & Policy', isNew: true },
        { code: 'ENVS 313', name: 'Energy Law & Policy', isNew: true },
        { code: 'ENVS 338', name: 'Climate Change and Human Health', isNew: true },
        { code: 'ENVS 383', name: 'Human Dimensions of Conservation', isNew: true },
        { code: 'COMM 260', name: 'Environmental Journalism' },
        { code: 'COMM 306', name: 'Environmental Advocacy' },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'SOCL 252', name: 'Global Inequalities' },
        { code: 'SOCL 272', name: 'Environmental Sociology' },
        { code: 'SOCL 278', name: 'Global Health' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
        { code: 'THEO 344', name: 'Theology and Ecology' },
      ],
      electivePolicyEconResource_chooseOne: [
        { code: 'ENVS 300', name: 'Introduction to Public Health', isNew: true },
        { code: 'ENVS 310', name: 'Introduction to Environmental Law & Policy' },
        { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy' },
        { code: 'ENVS 312', name: 'Water Law & Policy' },
        { code: 'ENVS 313', name: 'Energy Law & Policy' },
        { code: 'ENVS 333', name: 'Introduction to the Circular Economy', isNew: true },
        { code: 'ENVS 335', name: 'Ecological Economics' },
        { code: 'ENVS 336', name: 'Design for Circular & Sustainable Business', isNew: true },
        { code: 'ENVS 351', name: 'Introduction to Sustainability Concepts & Impacts', isNew: true },
        { code: 'ENVS 363', name: 'Sustainable Business Management', isNew: true },
        { code: 'ENVS 383', name: 'Human Dimensions of Conservation' },
        { code: 'ENVS 384', name: 'Conservation Economics', isNew: true },
        { code: 'ECON 328', name: 'Environmental Economics' },
        { code: 'GLST 305', name: 'Globalization and Environmental Sustainability' },
        { code: 'MGMT 201', name: 'Managing People and Organizations' },
        { code: 'PLSC 354', name: 'Global Environmental Politics' },
      ],
      electiveMethodsAnalysis_chooseOne: [
        { code: 'ENVS 327', name: 'Food Systems Analysis', isNew: true },
        { code: 'ENVS 352', name: 'Sustainability Assessment & Reporting I', isNew: true },
        { code: 'ENVS 353', name: 'Sustainability Assessment & Reporting II', isNew: true },
        { code: 'ENVS 354', name: 'Sustainability Plan Development & Reporting', isNew: true },
        { code: 'ENVS 380', name: 'Introduction to Geographic Information Systems', isNew: true },
        { code: 'ENVS 381', name: 'Advanced GIS Applications', isNew: true },
        { code: 'ENVS 382', name: 'Remote Sensing', isNew: true },
        { code: 'ENVS 384', name: 'Conservation Economics' },
        { code: 'ENVS 389', name: 'Ecological Risk Assessment', isNew: true },
        { code: 'COMM 260', name: 'Environmental Journalism' },
        { code: 'ANTH 317', name: 'Ethnographic Methods' },
        { code: 'BIOL 335', name: 'Intro to Biostatistics' },
        { code: 'COMM 231', name: 'Conflict Management and Communication' },
        { code: 'COMM 234', name: 'Interviewing for Communication' },
        { code: 'COMM 277', name: 'Organizational Communication' },
        { code: 'SOCL 206', name: 'Principles of Social Research' },
        { code: 'SOCL 301', name: 'Statistics for Social Research' },
        { code: 'SOCL 302', name: 'Qualitative Research' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
        { code: 'STAT 303', name: 'SAS Programming & Applied Statistics' },
      ],
      environmentalElectives_chooseThree: {
        note: 'Choose 3 electives: at least 1 from List A, at least 1 at 300-level',
        listA: [
          { code: 'ENVS 204', name: 'Gender, Health & Environment' },
          { code: 'ENVS 207', name: 'Plants and Civilization', isNew: true },
          { code: 'ENVS 218', name: 'Biodiversity & Biogeography', isNew: true },
          { code: 'ENVS 223', name: 'Soil Ecology', isNew: true },
          { code: 'ENVS 224', name: 'Climate & Climate Change', isNew: true },
          { code: 'ENVS 226', name: 'Science & Conservation of Freshwater Ecosystems' },
          { code: 'ENVS 267', name: 'Bird Conservation and Ecology' },
          { code: 'ENVS 273', name: 'Energy and the Environment' },
          { code: 'ENVS 274', name: 'Chemistry of the Natural Environment' },
          { code: 'ENVS 278', name: 'Hydrology', isNew: true },
          { code: 'ENVS 283', name: 'Environmental Sustainability' },
          { code: 'ENVS 300', name: 'Introduction to Public Health' },
          { code: 'ENVS 301', name: 'Environmental Health' },
          { code: 'ENVS 303', name: 'Introduction to Epidemiology' },
          { code: 'ENVS 320', name: 'Conservation Biology' },
          { code: 'ENVS 322', name: 'Invasive Species', isNew: true },
          { code: 'ENVS 325', name: 'Sustainable Agriculture' },
          { code: 'ENVS 326', name: 'Agroecosystems' },
          { code: 'ENVS 330', name: 'Restoration Ecology' },
          { code: 'ENVS 338', name: 'Climate Change and Human Health' },
          { code: 'ENVS 340', name: 'Natural History of Belize' },
          { code: 'ENVS 345', name: 'Conservation and Sustainability of Neotropical Ecosystems' },
          { code: 'ENVS 369', name: 'Field Ornithology' },
          { code: 'ENVS 380', name: 'Introduction to Geographic Information Systems' },
          { code: 'ENVS 381', name: 'Advanced GIS Applications' },
          { code: 'ENVS 382', name: 'Remote Sensing' },
          { code: 'ENVS 385', name: 'Introduction to Global Health', isNew: true },
          { code: 'ENVS 387', name: 'Principles of Ecotoxicology', isNew: true },
          { code: 'ENVS 389', name: 'Ecological Risk Assessment' },
          { code: 'ANTH 104', name: 'The Human Ecological Footprint' },
          { code: 'ANTH 303', name: 'People and Conservation' },
        ],
        listB: [
          { code: 'ENVS 279', name: 'Climate and History' },
          { code: 'ENVS 297', name: 'North American Environmental History' },
          { code: 'ENVS 310', name: 'Introduction to Environmental Law & Policy' },
          { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy' },
          { code: 'ENVS 312', name: 'Water Law & Policy' },
          { code: 'ENVS 313', name: 'Energy Law & Policy' },
          { code: 'ENVS 333', name: 'Introduction to the Circular Economy' },
          { code: 'ENVS 335', name: 'Ecological Economics' },
          { code: 'ENVS 336', name: 'Design for Circular & Sustainable Business' },
          { code: 'ENVS 354', name: 'Sustainability Plan Development & Reporting' },
          { code: 'ENVS 363', name: 'Sustainable Business Management' },
          { code: 'ENVS 383', name: 'Human Dimensions of Conservation' },
          { code: 'ENVS 384', name: 'Conservation Economics' },
          { code: 'COMM 260', name: 'Environmental Journalism' },
          { code: 'ANTH 317', name: 'Ethnographic Methods' },
          { code: 'COMM 231', name: 'Conflict Management and Communication' },
          { code: 'COMM 277', name: 'Organizational Communication' },
          { code: 'SOCL 206', name: 'Principles of Social Research' },
          { code: 'SOCL 302', name: 'Qualitative Research' },
        ],
      },
    },
  },

  // ===========================================================================
  // 3. Environmental Policy BA
  //    Total major credit hours: 57
  //    Source: catalog.luc.edu/undergraduate/environmental-sustainability/environmental-policy/environmental-policy-ba/
  // ===========================================================================
  'Environmental Policy BA': {
    totalCredits: 57,
    school: 'Environmental Sustainability',
    degree: 'BA',
    notes: '57 credit hours for the major. Requires foreign language (102-level or proficiency exam) and two Writing Intensive courses. Focuses on environmental governance, law, and political dimensions.',
    requirements: {
      sesCore: [
        { code: 'ENVS 137', name: 'Foundations of Environmental Science I', isNew: true },
        { code: 'ENVS 237', name: 'Foundations of Environmental Chemistry', isNew: true },
        { code: 'ENVS 238', name: 'Foundations of Environmental Science Lab', isNew: true },
        { code: 'ENVS 200', name: 'Environmental Careers and Professional Skills', isNew: true },
        { code: 'ENVS 203', name: 'Environmental Statistics', isNew: true },
        { code: 'ENVS 280', name: 'Principles of Ecology', isNew: true },
        { code: 'ENVS 286', name: 'Principles of Ecology Lab', isNew: true },
        { code: 'ENVS 310', name: 'Introduction to Environmental Law & Policy', isNew: true },
        { code: 'PLSC 101', name: 'American Politics' },
        { code: 'PLSC 392', name: 'Environmental Politics' },
      ],
      justiceAndEthics_chooseOne: [
        { code: 'ENVS 284', name: 'Environmental Justice', isNew: true },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
      ],
      economics_chooseOne: [
        { code: 'ENVS 335', name: 'Ecological Economics', isNew: true },
        { code: 'ECON 328', name: 'Environmental Economics' },
      ],
      engagedLearning_chooseOne: [
        { code: 'ENVS 226', name: 'Science & Conservation of Freshwater Ecosystems', isNew: true },
        { code: 'ENVS 267', name: 'Bird Conservation and Ecology', isNew: true },
        { code: 'ENVS 273', name: 'Energy and the Environment', isNew: true },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ENVS 340', name: 'Natural History of Belize', isNew: true },
        { code: 'ENVS 345', name: 'Conservation and Sustainability of Neotropical Ecosystems', isNew: true },
        { code: 'ENVS 350A', name: 'Solutions to Environmental Problems: Water', isNew: true },
        { code: 'ENVS 350B', name: 'Solutions to Environmental Problems: Biogas', isNew: true },
        { code: 'ENVS 350C', name: 'Solutions to Environmental Problems: Climate Action', isNew: true },
        { code: 'ENVS 350F', name: 'Solutions to Environmental Problems: Food Systems', isNew: true },
        { code: 'ENVS 369', name: 'Field Ornithology', isNew: true },
        { code: 'ENVS 391', name: 'Environmental Research', isNew: true },
        { code: 'ENVS 395', name: 'Environmental Internship', isNew: true },
      ],
      capstone_chooseOne: [
        { code: 'ENVS 390', name: 'Integrative Seminar', isNew: true },
        { code: 'ENVS 391C', name: 'Independent Environmental Research (Capstone)', isNew: true },
        { code: 'ENVS 395C', name: 'Environmental Internship (Capstone)', isNew: true },
      ],
      electiveSocietyEthicsJustice_chooseOne: [
        { code: 'ENVS 204', name: 'Gender, Health & Environment', isNew: true },
        { code: 'ENVS 279', name: 'Climate and History', isNew: true },
        { code: 'ENVS 284', name: 'Environmental Justice' },
        { code: 'ENVS 297', name: 'North American Environmental History', isNew: true },
        { code: 'ENVS 338', name: 'Climate Change and Human Health', isNew: true },
        { code: 'ENVS 383', name: 'Human Dimensions of Conservation', isNew: true },
        { code: 'COMM 260', name: 'Environmental Journalism' },
        { code: 'COMM 306', name: 'Environmental Advocacy' },
        { code: 'COMM 379', name: 'Digital Sustainability' },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'SOCL 252', name: 'Global Inequalities' },
        { code: 'SOCL 272', name: 'Environmental Sociology' },
        { code: 'SOCL 278', name: 'Global Health' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
        { code: 'THEO 344', name: 'Theology and Ecology' },
      ],
      electivePolicyEconResource_chooseTwo: [
        { code: 'ENVS 300', name: 'Introduction to Public Health', isNew: true },
        { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy', isNew: true },
        { code: 'ENVS 312', name: 'Water Law & Policy', isNew: true },
        { code: 'ENVS 313', name: 'Energy Law & Policy', isNew: true },
        { code: 'ENVS 327', name: 'Food Systems Analysis', isNew: true },
        { code: 'ENVS 333', name: 'Introduction to the Circular Economy', isNew: true },
        { code: 'ENVS 335', name: 'Ecological Economics' },
        { code: 'ENVS 336', name: 'Design for Circular & Sustainable Business', isNew: true },
        { code: 'ENVS 363', name: 'Sustainable Business Management', isNew: true },
        { code: 'ENVS 383', name: 'Human Dimensions of Conservation' },
        { code: 'ENVS 384', name: 'Conservation Economics', isNew: true },
        { code: 'ENVS 389', name: 'Ecological Risk Assessment', isNew: true },
        { code: 'ECON 328', name: 'Environmental Economics' },
        { code: 'GLST 305', name: 'Globalization and Environmental Sustainability' },
        { code: 'MGMT 201', name: 'Managing People and Organizations' },
        { code: 'PLSC 354', name: 'Global Environmental Politics' },
      ],
      electiveMethodsAnalysis_chooseOne: [
        { code: 'ENVS 327', name: 'Food Systems Analysis' },
        { code: 'ENVS 352', name: 'Sustainability Assessment & Reporting I', isNew: true },
        { code: 'ENVS 353', name: 'Sustainability Assessment & Reporting II', isNew: true },
        { code: 'ENVS 354', name: 'Sustainability Plan Development & Reporting', isNew: true },
        { code: 'ENVS 380', name: 'Introduction to Geographic Information Systems', isNew: true },
        { code: 'ENVS 381', name: 'Advanced GIS Applications', isNew: true },
        { code: 'ENVS 382', name: 'Remote Sensing', isNew: true },
        { code: 'ENVS 384', name: 'Conservation Economics' },
        { code: 'ENVS 389', name: 'Ecological Risk Assessment' },
        { code: 'COMM 260', name: 'Environmental Journalism' },
        { code: 'ANTH 317', name: 'Ethnographic Methods' },
        { code: 'BIOL 335', name: 'Intro to Biostatistics' },
        { code: 'COMM 231', name: 'Conflict Management and Communication' },
        { code: 'COMM 234', name: 'Interviewing for Communication' },
        { code: 'COMM 277', name: 'Organizational Communication' },
        { code: 'SOCL 206', name: 'Principles of Social Research' },
        { code: 'SOCL 301', name: 'Statistics for Social Research' },
        { code: 'SOCL 302', name: 'Qualitative Research' },
        { code: 'STAT 203', name: 'Introduction to Probability & Statistics' },
        { code: 'STAT 303', name: 'SAS Programming & Applied Statistics' },
      ],
      environmentalElectives_chooseTwo: [
        { code: 'ENVS 207', name: 'Plants and Civilization', isNew: true },
        { code: 'ENVS 218', name: 'Biodiversity & Biogeography', isNew: true },
        { code: 'ENVS 223', name: 'Soil Ecology', isNew: true },
        { code: 'ENVS 224', name: 'Climate & Climate Change', isNew: true },
        { code: 'ENVS 226', name: 'Science & Conservation of Freshwater Ecosystems' },
        { code: 'ENVS 267', name: 'Bird Conservation and Ecology' },
        { code: 'ENVS 273', name: 'Energy and the Environment' },
        { code: 'ENVS 274', name: 'Chemistry of the Natural Environment' },
        { code: 'ENVS 278', name: 'Hydrology', isNew: true },
        { code: 'ENVS 279', name: 'Climate and History' },
        { code: 'ENVS 283', name: 'Environmental Sustainability' },
        { code: 'ENVS 297', name: 'North American Environmental History' },
        { code: 'ENVS 300', name: 'Introduction to Public Health' },
        { code: 'ENVS 301', name: 'Environmental Health' },
        { code: 'ENVS 303', name: 'Introduction to Epidemiology' },
        { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy' },
        { code: 'ENVS 312', name: 'Water Law & Policy' },
        { code: 'ENVS 313', name: 'Energy Law & Policy' },
        { code: 'ENVS 320', name: 'Conservation Biology' },
        { code: 'ENVS 322', name: 'Invasive Species', isNew: true },
        { code: 'ENVS 323', name: 'Environmental Microbiology', isNew: true },
        { code: 'ENVS 325', name: 'Sustainable Agriculture' },
        { code: 'ENVS 326', name: 'Agroecosystems' },
        { code: 'ENVS 327', name: 'Food Systems Analysis' },
        { code: 'ENVS 330', name: 'Restoration Ecology' },
        { code: 'ENVS 338', name: 'Climate Change and Human Health' },
        { code: 'ENVS 340', name: 'Natural History of Belize' },
        { code: 'ENVS 345', name: 'Conservation and Sustainability of Neotropical Ecosystems' },
        { code: 'ENVS 351', name: 'Introduction to Sustainability Concepts & Impacts' },
        { code: 'ENVS 352', name: 'Sustainability Assessment & Reporting I' },
        { code: 'ENVS 353', name: 'Sustainability Assessment & Reporting II' },
        { code: 'ENVS 354', name: 'Sustainability Plan Development & Reporting' },
        { code: 'ENVS 369', name: 'Field Ornithology' },
        { code: 'ENVS 380', name: 'Introduction to Geographic Information Systems' },
        { code: 'ENVS 381', name: 'Advanced GIS Applications' },
        { code: 'ENVS 385', name: 'Introduction to Global Health' },
        { code: 'ENVS 387', name: 'Principles of Ecotoxicology' },
        { code: 'ENVS 389', name: 'Ecological Risk Assessment' },
        { code: 'ANTH 104', name: 'The Human Ecological Footprint' },
        { code: 'ANTH 303', name: 'People and Conservation' },
      ],
    },
  },

  // ===========================================================================
  // 4. Environmental Economics and Sustainability: Governance BA
  //    Total major credit hours: 60-61
  //    Source: catalog.luc.edu/undergraduate/environmental-sustainability/environmental-economics-sustainability/environmental-economics-sustainability-governance-ba/
  // ===========================================================================
  'Environmental Economics and Sustainability: Governance BA': {
    totalCredits: 61,
    school: 'Environmental Sustainability',
    degree: 'BA',
    notes: '60-61 credit hours depending on calculus option. Requires foreign language (102-level or proficiency exam) and two Writing Intensive courses. Combines economics with environmental governance and policy.',
    requirements: {
      eesCore: [
        { code: 'ENVS 137', name: 'Foundations of Environmental Science I', isNew: true },
        { code: 'ENVS 200', name: 'Environmental Careers and Professional Skills', isNew: true },
        { code: 'ENVS 237', name: 'Foundations of Environmental Chemistry', isNew: true },
        { code: 'ENVS 238', name: 'Foundations of Environmental Science Lab', isNew: true },
        { code: 'ENVS 280', name: 'Principles of Ecology', isNew: true },
        { code: 'ENVS 286', name: 'Principles of Ecology Lab', isNew: true },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
        { code: 'ECON 202', name: 'Principles of Macroeconomics' },
        { code: 'ECON 303', name: 'Intermediate Microeconomics' },
        { code: 'ENVS 335', name: 'Ecological Economics', isNew: true },
        { code: 'PLSC 392', name: 'Environmental Politics' },
      ],
      calculusRequirement_chooseOne: [
        { code: 'MATH 130', name: 'Business Calculus' },
        { code: 'MATH 131', name: 'Applied Calculus I' },
        { code: 'MATH 161', name: 'Calculus I' },
      ],
      statisticsRequirement_chooseOne: [
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'ISSCM 241', name: 'Business Statistics' },
        { code: 'ENVS 203', name: 'Environmental Statistics', isNew: true },
      ],
      justiceAndEthics_chooseOne: [
        { code: 'ENVS 284', name: 'Environmental Justice', isNew: true },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
      ],
      governanceConcentrationRequired: [
        { code: 'ECON 328', name: 'Environmental Economics' },
        { code: 'ENVS 310', name: 'Introduction to Environmental Law & Policy', isNew: true },
      ],
      capstone_chooseOne: [
        { code: 'ENVS 390', name: 'Integrative Seminar', isNew: true },
        { code: 'ENVS 391C', name: 'Independent Environmental Research (Capstone)', isNew: true },
        { code: 'ENVS 395C', name: 'Environmental Internship (Capstone)', isNew: true },
      ],
      governanceElectivesListA_chooseTwo: [
        { code: 'ECON 320', name: 'Urban Economics' },
        { code: 'ECON 325', name: 'Economics of Growth & Development' },
        { code: 'ECON 329', name: 'Health Economics' },
        { code: 'ECON 334', name: 'Economics of Government Expenditures & Taxation' },
        { code: 'ECON 346', name: 'Econometrics' },
      ],
      governanceElectivesListB_chooseTwo: [
        { code: 'ENVS 311', name: 'Natural Resources and Land Use Law & Policy', isNew: true },
        { code: 'ENVS 312', name: 'Water Law & Policy', isNew: true },
        { code: 'ENVS 313', name: 'Energy Law & Policy', isNew: true },
        { code: 'ENVS 327', name: 'Food Systems Analysis', isNew: true },
        { code: 'ENVS 384', name: 'Conservation Economics', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 5. Environmental Economics and Sustainability: Management BA
  //    Total major credit hours: 60-61
  //    Source: catalog.luc.edu/undergraduate/environmental-sustainability/environmental-economics-sustainability/environmental-economics-sustainability-management-ba/
  // ===========================================================================
  'Environmental Economics and Sustainability: Management BA': {
    totalCredits: 61,
    school: 'Environmental Sustainability',
    degree: 'BA',
    notes: '60-61 credit hours depending on calculus option. Requires foreign language (102-level or proficiency exam) and two Writing Intensive courses. Combines economics with sustainable business management.',
    requirements: {
      eesCore: [
        { code: 'ENVS 137', name: 'Foundations of Environmental Science I', isNew: true },
        { code: 'ENVS 200', name: 'Environmental Careers and Professional Skills', isNew: true },
        { code: 'ENVS 237', name: 'Foundations of Environmental Chemistry', isNew: true },
        { code: 'ENVS 238', name: 'Foundations of Environmental Science Lab', isNew: true },
        { code: 'ENVS 280', name: 'Principles of Ecology', isNew: true },
        { code: 'ENVS 286', name: 'Principles of Ecology Lab', isNew: true },
        { code: 'ENVS 283', name: 'Environmental Sustainability', isNew: true },
        { code: 'ECON 201', name: 'Principles of Microeconomics' },
        { code: 'ECON 202', name: 'Principles of Macroeconomics' },
        { code: 'ECON 303', name: 'Intermediate Microeconomics' },
        { code: 'ENVS 335', name: 'Ecological Economics', isNew: true },
        { code: 'PLSC 392', name: 'Environmental Politics' },
      ],
      calculusRequirement_chooseOne: [
        { code: 'MATH 130', name: 'Business Calculus' },
        { code: 'MATH 131', name: 'Applied Calculus I' },
        { code: 'MATH 161', name: 'Calculus I' },
      ],
      statisticsRequirement_chooseOne: [
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'ISSCM 241', name: 'Business Statistics' },
        { code: 'ENVS 203', name: 'Environmental Statistics', isNew: true },
      ],
      justiceAndEthics_chooseOne: [
        { code: 'ENVS 284', name: 'Environmental Justice', isNew: true },
        { code: 'PHIL 287', name: 'Environmental Ethics' },
        { code: 'THEO 204', name: 'Religious Ethics and the Ecological Crisis' },
      ],
      managementConcentrationRequired: [
        { code: 'MGMT 201', name: 'Managing People and Organizations' },
        { code: 'ENVS 363', name: 'Sustainable Business Management', isNew: true },
      ],
      capstone_chooseOne: [
        { code: 'ENVS 390', name: 'Integrative Seminar', isNew: true },
        { code: 'ENVS 391C', name: 'Independent Environmental Research (Capstone)', isNew: true },
        { code: 'ENVS 395C', name: 'Environmental Internship (Capstone)', isNew: true },
      ],
      managementElectivesListA_chooseTwo: [
        { code: 'ECON 328', name: 'Environmental Economics' },
        { code: 'ECON 346', name: 'Econometrics' },
        { code: 'ECON 360', name: 'Labor Economics' },
        { code: 'MARK 320', name: 'Marketing for Environmental Sustainability', isNew: true },
        { code: 'SCMG 346', name: 'Sustainable Supply Chain' },
      ],
      managementElectivesListB_chooseTwo: [
        { code: 'ENVS 333', name: 'Introduction to the Circular Economy', isNew: true },
        { code: 'ENVS 336', name: 'Design for Circular & Sustainable Business', isNew: true },
        { code: 'ENVS 384', name: 'Conservation Economics', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 6. Nursing (Accelerated) BSN
  //    Total credit hours: 66-67 (nursing courses only; prerequisites completed prior)
  //    Source: catalog.luc.edu/undergraduate/nursing/absn/
  // ===========================================================================
  'Nursing (Accelerated) BSN': {
    totalCredits: 67,
    school: 'Nursing',
    degree: 'BSN',
    notes: '16-month full-time program designed for college graduates with a prior bachelor\'s degree. Students complete prerequisite arts and sciences courses before admission. ABSN students are NOT required to take University Core or UNIV 101. Offered onsite and hybrid. Credit hours listed are nursing-only (66-67); prerequisites are separate.',
    requirements: {
      nursingCore: [
        { code: 'GNUR 207', name: 'Concepts of Professional Nursing Practice' },
        { code: 'GNUR 238', name: 'The Foundations of Clinical Practice in Nursing' },
        { code: 'GNUR 238L', name: 'Foundations of Clinical Practice in Nursing Lab' },
        { code: 'GNUR 290', name: 'Concepts in Older Adult Health' },
        { code: 'GNUR 293', name: 'Pathophysiology' },
        { code: 'GNUR 294', name: 'Foundations of Pharmacology' },
        { code: 'GNUR 297', name: 'Clinical Nutrition for Nursing Practice' },
        { code: 'GNUR 360', name: 'Nursing Research: For Evidence-Based Practice' },
        { code: 'GNUR 361', name: 'Nursing Ethics' },
        { code: 'GNUR 383', name: 'Leadership for Professional Nursing Practice' },
        { code: 'GNUR 384', name: 'Clinical Role Transition' },
        { code: 'GNUR 402', name: 'Ethics for Health Professionals', isNew: true },
      ],
      clinicalSpecialty: [
        { code: 'MSN 277', name: 'Medical/Surgical Nursing: Adult Health I' },
        { code: 'MSN 277L', name: 'Medical/Surgical Nursing: Adult Health Lab I' },
        { code: 'MSN 377', name: 'Adult Health II - Advanced Medical-Surgical' },
        { code: 'MSN 377L', name: 'Adult Health II - Advanced Medical-Surgical Clinical' },
        { code: 'MCN 273', name: 'Family Health Patterns I' },
        { code: 'MCN 273L', name: 'Family Health Patterns I: Lab' },
        { code: 'MCN 374', name: 'Family Health Patterns II: Care of the Child and Family' },
        { code: 'MCN 374L', name: 'Family Health Patterns II: Lab' },
        { code: 'CMAN 272', name: 'Mental Health Patterns' },
        { code: 'CMAN 272L', name: 'Mental Health Patterns: Lab' },
        { code: 'CMAN 380', name: 'Community Health' },
        { code: 'CMAN 380L', name: 'Community Health: Lab' },
      ],
    },
    uniqueFromFourYear: 'The Accelerated BSN shares most nursing courses with the Four-Year BSN. Key differences: (1) GNUR 402 Ethics for Health Professionals is unique to the Accelerated track; (2) GNUR 102 Introduction to Professional Nursing Practice and prerequisite science courses (GNUR 157/158/160/203) are NOT part of the Accelerated curriculum as students complete these before admission; (3) No University Core or UNIV 101 required; (4) Completed in 16 months vs. 4 years.',
  },

  // ===========================================================================
  // SCHOOL OF CONTINUING AND PROFESSIONAL STUDIES (CPS/SCPS)
  // All CPS programs use 120 total credit hours for graduation.
  // CPS courses use the CPST prefix (plus PLST for Paralegal Studies).
  // All CPS programs share a common SCPS Core: CPST 200, CPST 201, CPST 397.
  // ===========================================================================

  // ===========================================================================
  // 7. Applied Psychology BA (CPS)
  //    Total major credit hours: 36-45 (24 core + 12 track + 9 SCPS core)
  //    Source: catalog.luc.edu/undergraduate/continuing-professional-studies/applied-psychology-ba/
  // ===========================================================================
  'Applied Psychology BA (CPS)': {
    totalCredits: 45,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. 24 hours major courses + 12 hours track + 9 hours SCPS core. 8-week sessions; online, evening, Saturday options. Two tracks: Organizational or Counseling.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'PSYC 101', name: 'General Psychology' },
        { code: 'PSYC 304', name: 'Statistics' },
        { code: 'PSYC 306', name: 'Research Methods in Psychology' },
        { code: 'PSYC 275', name: 'Social Psychology' },
        { code: 'PSYC 362', name: 'Industrial/Organizational Psychology', isNew: true },
        { code: 'CPST 322', name: 'Strategic Communication Tools for Applied Psych', isNew: true },
        { code: 'CPST 320', name: 'Program Evaluation', isNew: true },
        { code: 'PSYC 373', name: 'Health Psychology', isNew: true },
      ],
      trackOrganizational: [
        { code: 'CPST 250', name: 'Foundations of Organizations', isNew: true },
        { code: 'CPST 350', name: 'Human Resources Principles & Practices', isNew: true },
        { code: 'CPST 380', name: 'Leadership, Culture and Ethics', isNew: true },
        { code: 'PSYC 338', name: 'Psychology of Personality', isNew: true },
      ],
      trackCounseling: [
        { code: 'PSYC 273', name: 'Developmental Psychology' },
        { code: 'CPSY 323', name: 'Theories of Counseling and Psychotherapy', isNew: true },
        { code: 'CPSY 324', name: 'Career Counseling and Development', isNew: true },
        { code: 'CPSY 332', name: 'Multicultural Counseling', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 8. Applied Studies BA (CPS)
  //    Total major credit hours: 48-51 (27 core + 3 comm + 3 theory + 18 concentration + 9 SCPS)
  //    Source: catalog.luc.edu/undergraduate/continuing-professional-studies/applied-studies-ba/
  // ===========================================================================
  'Applied Studies BA (CPS)': {
    totalCredits: 51,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. Interdisciplinary program combining organizational, communication, and analytical skills. Requires an 18-credit concentration or certificate. 8-week sessions.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'CPST 250', name: 'Foundations of Organizations', isNew: true },
        { code: 'CPST 243', name: 'Microeconomics', isNew: true },
        { code: 'CPST 245', name: 'Macroeconomics', isNew: true },
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'CPST 310', name: 'Accounting Principles and Application', isNew: true },
        { code: 'CPST 247', name: 'Computer Concepts and Applications', isNew: true },
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'CPST 315', name: 'Professional Technical Writing', isNew: true },
      ],
      communicationSkills_chooseOne: [
        { code: 'COMM 101', name: 'Public Speaking & Critical Thinking' },
        { code: 'CPST 322', name: 'Strategic Communication Tools for Applied Psych', isNew: true },
      ],
      theoreticalSkills_chooseOne: [
        { code: 'CPST 370', name: 'Leadership Theories and Applications', isNew: true },
        { code: 'CPST 360', name: 'Development and Change in Organizations', isNew: true },
        { code: 'CPST 340', name: 'Marketing Concepts and Strategies', isNew: true },
        { code: 'CPST 320', name: 'Program Evaluation', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 9. Information Technology BA (CPS)
  //    Total major credit hours: 48 (39 major + 9 SCPS core)
  //    Source: catalog.luc.edu/undergraduate/continuing-professional-studies/information-technology-ba/
  //    NOTE: Different from the A&S Information Technology BS
  // ===========================================================================
  'Information Technology BA (CPS)': {
    totalCredits: 48,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. 39 hours major courses + 9 hours SCPS core. Distinct from the College of Arts & Sciences Information Technology BS which uses more traditional CS courses. CPS version emphasizes applied/professional IT skills with CPST prefix courses.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'CPST 250', name: 'Foundations of Organizations', isNew: true },
        { code: 'CPST 310', name: 'Accounting Principles and Application', isNew: true },
        { code: 'CPST 349', name: 'Project Management', isNew: true },
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 251', name: 'Introduction to Database Systems' },
        { code: 'COMP 271', name: 'Data Structures I' },
        { code: 'CPST 291', name: 'Dynamic Programming Languages', isNew: true },
        { code: 'CPST 325', name: 'Data Processing, Analysis, and Visualization', isNew: true },
        { code: 'CPST 342', name: 'Introduction to Web Application Development', isNew: true },
        { code: 'CPST 343', name: 'Software Development for Mobile Devices', isNew: true },
        { code: 'COMP 317', name: 'Social, Legal, and Ethical Issues in Computing' },
        { code: 'CPST 345', name: 'Introduction to IT: Networking, Cloud & Security', isNew: true },
      ],
    },
  },

  // ===========================================================================
  // 10. Management BA (CPS)
  //     Total major credit hours: 48-51 (39 major + 3 comm elective + 9 SCPS core)
  //     Source: catalog.luc.edu/undergraduate/continuing-professional-studies/management-ba/
  //     NOTE: Different from the Quinlan Management BBA
  // ===========================================================================
  'Management BA (CPS)': {
    totalCredits: 51,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. 39 hours major + 3 hours communication elective + 9 hours SCPS core. Distinct from the Quinlan School of Business Management BBA. CPS version uses CPST prefix courses and is designed for working adults in 8-week sessions.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'CPST 250', name: 'Foundations of Organizations', isNew: true },
        { code: 'CPST 310', name: 'Accounting Principles and Application', isNew: true },
        { code: 'CPST 340', name: 'Marketing Concepts and Strategies', isNew: true },
        { code: 'CPST 350', name: 'Human Resources Principles & Practices', isNew: true },
        { code: 'CPST 349', name: 'Project Management', isNew: true },
        { code: 'CPST 243', name: 'Microeconomics', isNew: true },
        { code: 'CPST 245', name: 'Macroeconomics', isNew: true },
        { code: 'STAT 103', name: 'Fundamentals of Statistics' },
        { code: 'CPST 371', name: 'Organizational Finance', isNew: true },
        { code: 'CPST 335', name: 'Law and Regulations for Organizational Leaders', isNew: true },
        { code: 'CPST 247', name: 'Computer Concepts and Applications', isNew: true },
        { code: 'COMM 175', name: 'Introduction to Communication' },
      ],
      communicationElective_chooseOne: [
        { code: 'CPST 322', name: 'Strategic Communication Tools for Applied Psych', isNew: true },
        { code: 'COMM 231', name: 'Conflict Management and Communication' },
        { code: 'COMM 277', name: 'Organizational Communication' },
      ],
    },
  },

  // ===========================================================================
  // 11. Paralegal Studies BA (CPS)
  //     Total major credit hours: 39 (30 paralegal + 9 SCPS core)
  //     Source: catalog.luc.edu/undergraduate/continuing-professional-studies/paralegal-studies-ba/
  // ===========================================================================
  'Paralegal Studies BA (CPS)': {
    totalCredits: 39,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. Uses PLST prefix for paralegal courses. Includes both a core sequence and a litigation/business practice track. ABA-approved program.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      paralegalCore: [
        { code: 'PLST 331', name: 'Introduction to Paralegal Studies', isNew: true },
        { code: 'PLST 332', name: 'Legal Research and Writing I', isNew: true },
        { code: 'PLST 333', name: 'Legal Research and Writing II', isNew: true },
        { code: 'PLST 335', name: 'Legal Ethics', isNew: true },
        { code: 'PLST 345', name: 'Law Office Computer Applications', isNew: true },
        { code: 'PLST 369', name: 'Advanced Topics in American Law', isNew: true },
        { code: 'PLST 370', name: 'Advanced Legal Analysis & Writing I', isNew: true },
      ],
      practiceTrack: [
        { code: 'PLST 340', name: 'Civil Litigation I', isNew: true },
        { code: 'PLST 341', name: 'Civil Litigation II', isNew: true },
        { code: 'PLST 342', name: 'Litigation Technology & eDiscovery', isNew: true },
        { code: 'PLST 362', name: 'Business Organizations', isNew: true },
        { code: 'PLST 363', name: 'Contract Administration & Analysis', isNew: true },
        { code: 'PLST 339', name: 'Secured Transactions and Bankruptcy', isNew: true },
      ],
    },
    creditOverrides: {
      'PLST 331': 2, 'PLST 332': 2, 'PLST 333': 2, 'PLST 335': 2, 'PLST 345': 2,
      'PLST 340': 2, 'PLST 341': 2, 'PLST 342': 2, 'PLST 362': 2, 'PLST 363': 2,
      'PLST 339': 2,
    },
  },

  // ===========================================================================
  // 12. Strategic Digital Communication BA (CPS)
  //     Total major credit hours: 39 (30 major + 9 SCPS core)
  //     Source: catalog.luc.edu/undergraduate/continuing-professional-studies/strategic-digital-communication-ba/
  //     STATUS: No longer accepting new students (teach-out only)
  // ===========================================================================
  'Strategic Digital Communication BA (CPS)': {
    totalCredits: 39,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: 'NO LONGER ACCEPTING NEW STUDENTS (teach-out only). 120 total credits for graduation. 30 hours major courses + 9 hours SCPS core. Uses COMM prefix courses (no special CPS prefix).',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'COMM 175', name: 'Introduction to Communication' },
        { code: 'COMM 200', name: 'Digital Communication and Society' },
        { code: 'COMM 210', name: 'Principles of Public Relations' },
        { code: 'COMM 213', name: 'Digital Foundations' },
        { code: 'COMM 261', name: 'Social Media', note: 'Catalog lists as COMM 261; in Database.js this is Perspectives on International Media' },
        { code: 'COMM 275', name: 'Web Design and Usability' },
        { code: 'COMM 290', name: 'Branding and Positioning' },
        { code: 'COMM 318', name: 'Public Relations Writing' },
        { code: 'COMM 360', name: 'Digital Media Ethics' },
        { code: 'COMM 363', name: 'Research Methods in Advertising/Public Relations' },
      ],
    },
  },

  // ===========================================================================
  // 13. Web Technologies BA (CPS)
  //     Total major credit hours: 48 (39 major + 9 SCPS core)
  //     Source: catalog.luc.edu/undergraduate/continuing-professional-studies/web-technologies-ba/
  // ===========================================================================
  'Web Technologies BA (CPS)': {
    totalCredits: 48,
    school: 'Continuing and Professional Studies',
    degree: 'BA',
    notes: '120 total credits for graduation. 39 hours major courses + 9 hours SCPS core. Combines web development, UX design, and mobile development. Uses both COMP and CPST prefix courses.',
    requirements: {
      scpsCore: [
        { code: 'CPST 200', name: 'Introduction to Degree Completion', isNew: true },
        { code: 'CPST 201', name: 'Civic Identity and Development', isNew: true },
        { code: 'CPST 397', name: 'Capstone', isNew: true },
      ],
      majorRequired: [
        { code: 'COMP 317', name: 'Social, Legal, and Ethical Issues in Computing' },
        { code: 'COMM 275', name: 'Web Design and Usability' },
        { code: 'CPST 242', name: 'Design for the Web', isNew: true },
        { code: 'CPST 342', name: 'Introduction to Web Application Development', isNew: true },
        { code: 'COMP 170', name: 'Introduction to Object-Oriented Programming' },
        { code: 'COMP 251', name: 'Introduction to Database Systems' },
        { code: 'COMP 271', name: 'Data Structures I' },
        { code: 'CPST 291', name: 'Dynamic Programming Languages', isNew: true },
        { code: 'CPST 343', name: 'Software Development for Mobile Devices', isNew: true },
        { code: 'CPST 325', name: 'Data Processing, Analysis, and Visualization', isNew: true },
        { code: 'CPST 248', name: 'User Experience Design Fundamentals', isNew: true },
        { code: 'CPST 249', name: 'User Experience Design Tools and Techniques', isNew: true },
        { code: 'CPST 341', name: 'User Experience Design to Drive Business', isNew: true },
      ],
    },
  },
};

// =============================================================================
// SUMMARY OF ALL NEW COURSES (not in Database.js)
// =============================================================================
//
// ENVS prefix (School of Environmental Sustainability): 62 unique new courses
//   ENVS 137, 200, 203, 204, 207, 218, 223, 224, 226, 230, 237, 238, 267,
//   273, 274, 275, 276, 278, 279, 280, 283, 284, 286, 286S, 297, 298, 300,
//   301, 303, 310, 311, 312, 313, 316, 320, 321, 322, 323, 324, 325, 326,
//   327, 330, 331, 333, 335, 336, 338, 340, 345, 350A, 350B, 350C, 350F,
//   351, 352, 353, 354, 363, 369, 380, 381, 382, 383, 384, 385, 387, 389,
//   390, 391, 391C, 395, 395C, 398, 399
//
// GNUR prefix (Nursing - Accelerated only):
//   GNUR 402 (Ethics for Health Professionals)
//
// CPST prefix (CPS common courses): 20 unique new courses
//   CPST 200, 201, 242, 243, 245, 247, 248, 249, 250, 291, 310, 315, 320,
//   322, 325, 335, 340, 341, 342, 343, 345, 349, 350, 360, 370, 371, 380, 397
//
// CPSY prefix (CPS Applied Psychology - Counseling track): 3 new courses
//   CPSY 323, 324, 332
//
// PLST prefix (CPS Paralegal Studies): 13 new courses
//   PLST 331, 332, 333, 335, 339, 340, 341, 342, 345, 362, 363, 369, 370
//
// PSYC prefix (new for CPS programs): 3 new courses
//   PSYC 338, 362, 373
//
// MARK prefix (new for EES Management): 1 new course
//   MARK 320
//
// Total new courses: ~100+ unique course codes not in Database.js
// =============================================================================
