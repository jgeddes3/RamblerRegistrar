import * as SQLite from 'expo-sqlite';

const setupDatabase = async () => {
  const db = SQLite.openDatabase('majmin.db');
  db.transaction((tx) => {
    // Create the majmin table if it doesn't exist
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS majmin (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        classesNeeded TEXT
      )`,
      [],
      () => console.log('Table created successfully'),
      (_, error) => {
        console.log('Error creating table:', error);
        return false;
      }
    );
    
const insertQueries = [`
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (1, 'Computer Science', 'major', 'Introduction to Programming, Data Structures and Algorithms, Computer Networks, Artificial Intelligence, Operating Systems');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (2, 'Psychology', 'major', 'General Psychology, Social Psychology, Cognitive Psychology, Abnormal Psychology, Developmental Psychology');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (3, 'Business Administration', 'major', 'Principles of Management, Financial Accounting, Marketing Principles, Business Law, Operations Management');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (4, 'Biology', 'major', 'General Biology, Genetics, Microbiology, Ecology, Evolution');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (5, 'Nursing', 'major', 'Foundations of Nursing, Medical-Surgical Nursing, Maternal-Newborn Nursing, Pediatric Nursing, Mental Health Nursing');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (6, 'Mechanical Engineering', 'major', 'Engineering Mechanics, Thermodynamics, Fluid Mechanics, Dynamics and Control, Machine Design');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (7, 'English', 'major', 'Introduction to Literature, British Literature, American Literature, Creative Writing, Literary Theory');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (8, 'Political Science', 'major', 'Introduction to Political Science, Comparative Politics, International Relations, American Government, Political Philosophy');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (9, 'Marketing', 'major', 'Marketing Principles, Consumer Behavior, Market Research, Advertising and Promotion, Digital Marketing');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (10, 'Accounting', 'major', 'Financial Accounting, Managerial Accounting, Taxation, Auditing, Accounting Information Systems');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (11, 'History', 'major', 'World History, American History, European History, Asian History, Latin American History');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (12, 'Chemistry', 'major', 'General Chemistry, Organic Chemistry, Inorganic Chemistry, Physical Chemistry, Analytical Chemistry');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (13, 'Communications', 'major', 'Introduction to Communication, Interpersonal Communication, Public Speaking, Mass Communication, Intercultural Communication');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (14, 'Economics', 'major', 'Principles of Microeconomics, Principles of Macroeconomics, International Economics, Econometrics, Public Finance');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (15, 'Sociology', 'major', 'Introduction to Sociology, Social Problems, Social Inequality, Urban Sociology, Race and Ethnicity');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (16, 'Mathematics', 'major', 'Calculus, Linear Algebra, Differential Equations, Abstract Algebra, Real Analysis');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (17, 'Education', 'major', 'Introduction to Education, Educational Psychology, Curriculum Development, Classroom Management, Assessment and Evaluation');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (18, 'Physics', 'major', 'General Physics, Classical Mechanics, Electromagnetism, Thermodynamics, Quantum Mechanics');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (19, 'Graphic Design', 'major', 'Foundations of Graphic Design, Typography, Digital Imaging, Web Design, Branding and Identity');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (20, 'Environmental Science', 'major', 'Introduction to Environmental Science, Environmental Chemistry, Ecology, Environmental Policy, Sustainable Resource Management');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (21, 'Philosophy', 'major', 'Introduction to Philosophy, Ethics, Epistemology, Metaphysics, Philosophy of Mind');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (22, 'Music', 'major', 'Music Theory, Ear Training, Music History, Ensemble Performance, Composition');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (23, 'Anthropology', 'major', 'Introduction to Anthropology, Cultural Anthropology, Biological Anthropology, Archaeology, Linguistic Anthropology');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (24, 'Journalism', 'major', 'Introduction to Journalism, News Reporting and Writing, Investigative Reporting, Media Law and Ethics, Broadcast Journalism');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (25, 'International Relations', 'major', 'Introduction to International Relations, Comparative Politics, International Political Economy, Diplomacy and Statecraft, Global Security, Introduction to Programming, Data Structures and Algorithms');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (26, 'Creative Writing', 'minor', 'Creative Writing Fiction, Creative Writing Poetry');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (27, 'Film Studies', 'minor', 'Introduction to Film Studies, Film History');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (28, 'Spanish', 'minor', 'Intermediate Spanish, Spanish Conversation and Composition');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (29, 'Human Resource Management', 'minor', 'Human Resource Management, Organizational Behavior');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (30, 'Public Health', 'minor', 'Introduction to Public Health, Health Policy and Administration');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (31, 'Entrepreneurship', 'minor', 'Entrepreneurship and Innovation, Business Planning');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (32, 'Statistics', 'minor', 'Probability and Statistics, Statistical Methods');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (33, 'Art History', 'minor', 'Survey of Western Art, Modern Art');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (34, 'French', 'minor', 'Intermediate French, French Conversation and Composition');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (35, 'Environmental Studies', 'minor', 'Introduction to Environmental Studies, Environmental Policy');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (36, 'Religious Studies', 'minor', 'World Religions, Religious Ethics');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (37, 'Information Technology', 'minor', 'Introduction to Information Systems, Database Management');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (38, 'Womens Studies', 'minor', 'Introduction to Womens Studies, Gender and Society');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (39, 'Linguistics', 'minor', 'Introduction to Linguistics, Phonetics and Phonology');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (40, 'Philosophy of Science', 'minor', 'Philosophy of Science, History of Science');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (41, 'Theater Arts', 'minor', 'Acting, Theater Production');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (42, 'Ethnic Studies', 'minor', 'Introduction to Ethnic Studies, Race, Ethnicity, and Identity');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (43, 'Geology', 'minor', 'Physical Geology, Historical Geology');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (44, 'Museum Studies', 'minor', 'Introduction to Museum Studies, Museum Collections Management');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (45, 'Sports Management', 'minor', 'Introduction to Sports Management, Sports Marketing');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (46, 'African American Studies', 'minor', 'Introduction to African American Studies, African American History');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (47, 'Sustainability Studies', 'minor', 'Introduction to Sustainability, Sustainable Resource Management');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (48, 'Cybersecurity', 'minor', 'Cybersecurity Fundamentals, Network Security');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (49, 'Political Philosophy', 'minor', 'Political Philosophy, Ethics and Public Policy');
INSERT INTO majmin (id, name, type, classesNeeded) VALUES (50, 'Computational Science', 'minor', 'Introduction to Computational Science, Scientific Computing');
`];
    insertQueries.forEach((query) => {
      tx.executeSql(
        query,
        [],
        () => console.log('Data inserted successfully'),
        (_, error) => {
          console.log('Error inserting data:', error);
          return false;
        }
      );
    });
  });
};

export default setupDatabase;