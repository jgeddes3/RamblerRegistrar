import React, { useEffect, useState } from 'react';
import { View, Text,FlatList, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import { ScrollView } from 'react-native';
import CustomButton2 from './styleComponents/customButton2';
import BackgroundImage from './styleComponents/BackgroundImage';
import TitleText2 from './styleComponents/TitleTextP2';



const db = SQLite.openDatabase('classId.db');

const insertSampleData = () => {
  const sampleData = [
    "INSERT INTO items (id, name, tags) VALUES (1, 'Introduction to Programming', 'STEM,problem-solving,lecture-based,individual-focused');",
    "INSERT INTO items (id, name, tags) VALUES (2, 'Data Structures and Algorithms', 'STEM,problem-solving,lecture-based,group-focused');",
    "INSERT INTO items (id, name, tags) VALUES (3, 'Computer Networks', 'STEM,problem-solving,hands-on,group-focused');",
    "INSERT INTO items (id, name, tags) VALUES (4, 'Artificial Intelligence', 'STEM,problem-solving,hands-on,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (5, 'Operating Systems', 'STEM,problem-solving,lecture-based,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (6, 'General Psychology', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (7, 'Social Psychology', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (8, 'Cognitive Psychology', 'social-sciences,writing-intensive,lecture-based,mixed-discussion,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (9, 'Abnormal Psychology', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (10, 'Developmental Psychology', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (11, 'Principles of Management', 'social-sciences,writing-intensive,lecture-based,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (12, 'Financial Accounting', 'social-sciences,problem-solving,lecture-based,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (13, 'Marketing Principles', 'social-sciences,writing-intensive,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (14, 'Business Law', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (15, 'Operations Management', 'social-sciences,problem-solving,lecture-based,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (16, 'General Biology', 'STEM,problem-solving,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (17, 'Genetics', 'STEM,problem-solving,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (18, 'Microbiology', 'STEM,problem-solving,lecture-based,hands-on,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (19, 'Ecology', 'STEM,problem-solving,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (20, 'Evolution', 'STEM,problem-solving,lecture-based,hands-on,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (21, 'Foundations of Nursing', 'STEM,problem-solving,lecture-based,hands-on,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (22, 'Medical-Surgical Nursing', 'STEM,problem-solving,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (23, 'Maternal-Newborn Nursing', 'STEM,problem-solving,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (24, 'Pediatric Nursing', 'STEM,problem-solving,lecture-based,hands-on,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (25, 'Mental Health Nursing', 'STEM,problem-solving,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (26, 'Engineering Mechanics', 'STEM,problem-solving,lecture-based,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (27, 'Thermodynamics', 'STEM,problem-solving,lecture-based,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (28, 'Fluid Mechanics', 'STEM,problem-solving,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (29, 'Dynamics and Control', 'STEM,problem-solving,lecture-based,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (30, 'Machine Design', 'STEM,problem-solving,lecture-based,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (31, 'Introduction to Literature', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (32, 'British Literature', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (33, 'American Literature', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (34, 'Creative Writing', 'arts-humanities,writing-intensive,hands-on,individual-focused,creative-projects');",
    "INSERT INTO items (id, name, tags) VALUES (35, 'Literary Theory', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (36, 'Introduction to Political Science', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (37, 'Comparative Politics', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (38, 'International Relations', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (39, 'American Government', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (40, 'Political Philosophy', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (41, 'Marketing Principles', 'social-sciences,writing-intensive,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (42, 'Consumer Behavior', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (43, 'Market Research', 'social-sciences,writing-intensive,hands-on,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (44, 'Advertising and Promotion', 'social-sciences,writing-intensive,lecture-based,group-focused,creative-projects');",
    "INSERT INTO items (id, name, tags) VALUES (45, 'Digital Marketing', 'social-sciences,writing-intensive,hands-on,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (46, 'Managerial Accounting', 'social-sciences,problem-solving,lecture-based,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (47, 'Taxation', 'social-sciences,problem-solving,lecture-based,individual-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (48, 'Auditing', 'social-sciences,problem-solving,lecture-based,group-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (49, 'Accounting Information Systems', 'social-sciences,problem-solving,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (50, 'World History', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (51, 'European History', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (52, 'Asian History', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (53, 'Latin American History', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (54, 'General Chemistry', 'STEM,problem-solving,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (55, 'Organic Chemistry', 'STEM,problem-solving,lecture-based,hands-on,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (56, 'Inorganic Chemistry', 'STEM,problem-solving,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (57, 'Physical Chemistry', 'STEM,problem-solving,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (58, 'Analytical Chemistry', 'STEM,problem-solving,lecture-based,hands-on,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (59, 'Introduction to Communication', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (60, 'Interpersonal Communication', 'arts-humanities,writing-intensive,hands-on,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (61, 'Public Speaking', 'arts-humanities,writing-intensive,hands-on,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (62, 'Mass Communication', 'arts-humanities,writing-intensive,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (63, 'Intercultural Communication', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (64, 'Principles of Microeconomics', 'social-sciences,problem-solving,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (65, 'Principles of Macroeconomics', 'social-sciences,problem-solving,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (66, 'International Economics', 'social-sciences,problem-solving,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (67, 'Econometrics', 'social-sciences,problem-solving,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (68, 'Public Finance', 'social-sciences,problem-solving,lecture-based,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (69, 'Introduction to Sociology', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (70, 'Social Problems', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (71, 'Social Inequality', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (72, 'Urban Sociology', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (73, 'Race and Ethnicity', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (74, 'Calculus', 'STEM,problem-solving,lecture-based,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (75, 'Linear Algebra', 'STEM,problem-solving,lecture-based,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (76, 'Differential Equations', 'STEM,problem-solving,lecture-based,group-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (77, 'Abstract Algebra', 'STEM,problem-solving,lecture-based,individual-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (78, 'Real Analysis', 'STEM,problem-solving,lecture-based,individual-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (79, 'Introduction to Education', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (80, 'Educational Psychology', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-material');",
    "INSERT INTO items (id, name, tags) VALUES (81, 'Curriculum Development', 'arts-humanities,writing-intensive,lecture-based,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (82, 'Classroom Management', 'arts-humanities,writing-intensive,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (83, 'Assessment and Evaluation', 'arts-humanities,writing-intensive,lecture-based,group-focused,passive-listening');",
    "INSERT INTO items (id, name, tags) VALUES (84, 'General Physics', 'STEM,problem-solving,lecture-based,hands-on,mixed-discussion');",
    "INSERT INTO items (id, name, tags) VALUES (85, 'Classical Mechanics', 'STEM,problem-solving,lecture-based,individual-focused,practical-application');",
    "INSERT INTO items (id, name, tags) VALUES (86, 'Electromagnetism', 'STEM,problem-solving,lecture-based,individual-focused,theoretical');",
    "INSERT INTO items (id, name, tags) VALUES (87, 'Thermodynamics', 'STEM,problem-solving,lecture-based,group-focused,balanced-application');",
    "INSERT INTO items (id, name, tags) VALUES (88, 'Quantum Mechanics', 'STEM,problem-solving,lecture-based,individual-focused,mixed-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (89, 'Foundations of Graphic Design', 'arts-humanities,writing-intensive,hands-on,group-focused,multiple-choice');",
    "INSERT INTO items (id, name, tags) VALUES (90, 'Typography', 'arts-humanities,writing-intensive,hands-on,individual-focused,written-assessments');",
    "INSERT INTO items (id, name, tags) VALUES (91, 'Digital Imaging', 'arts-humanities,writing-intensive,hands-on,group-focused,project-based');",
    "INSERT INTO items (id, name, tags) VALUES (92, 'Web Design', 'arts-humanities,writing-intensive,hands-on,individual-focused,small-class-size');",
    "INSERT INTO items (id, name, tags) VALUES (93, 'Branding and Identity', 'arts-humanities,writing-intensive,hands-on,group-focused,large-class-size');",
    "INSERT INTO items (id, name, tags) VALUES (94, 'Introduction to Environmental Science', 'STEM,problem-solving,lecture-based,group-focused,any-class-size');",
    "INSERT INTO items (id, name, tags) VALUES (95, 'Environmental Chemistry', 'STEM,problem-solving,lecture-based,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (96, 'Environmental Policy', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (97, 'Sustainable Resource Management', 'arts-humanities,writing-intensive,lecture-based,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (98, 'Introduction to Philosophy', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (99, 'Ethics', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (100, 'Epistemology', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (101, 'Metaphysics', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (102, 'Philosophy of Mind', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (103, 'Music Theory', 'arts-humanities,writing-intensive,hands-on,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (104, 'Ear Training', 'arts-humanities,writing-intensive,hands-on,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (105, 'Music History', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (106, 'Ensemble Performance', 'arts-humanities,writing-intensive,hands-on,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (107, 'Composition', 'arts-humanities,writing-intensive,hands-on,individual-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (108, 'Introduction to Anthropology', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (109, 'Cultural Anthropology', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (110, 'Biological Anthropology', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (111, 'Archaeology', 'social-sciences,writing-intensive,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (112, 'Linguistic Anthropology', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (113, 'Introduction to Journalism', 'arts-humanities,writing-intensive,hands-on,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (114, 'News Reporting and Writing', 'arts-humanities,writing-intensive,hands-on,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (115, 'Investigative Reporting', 'arts-humanities,writing-intensive,hands-on,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (116, 'Media Law and Ethics', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (117, 'Broadcast Journalism', 'arts-humanities,writing-intensive,hands-on,group-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (118, 'Introduction to International Relations', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (119, 'International Political Economy', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (120, 'Diplomacy and Statecraft', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (121, 'Global Security', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (122, 'Creative Writing Fiction', 'arts-humanities,writing-intensive,hands-on,individual-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (123, 'Creative Writing Poetry', 'arts-humanities,writing-intensive,hands-on,group-focused,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (124, 'Introduction to Film Studies', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (125, 'Film History', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (126, 'Intermediate Spanish', 'arts-humanities,writing-intensive,hands-on,individual-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (127, 'Spanish Conversation and Composition', 'arts-humanities,writing-intensive,hands-on,group-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (128, 'Human Resource Management', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (129, 'Organizational Behavior', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (130, 'Introduction to Public Health', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (131, 'Health Policy and Administration', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (132, 'Entrepreneurship and Innovation', 'social-sciences,writing-intensive,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (133, 'Business Planning', 'social-sciences,writing-intensive,lecture-based,hands-on,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (134, 'Probability and Statistics', 'STEM,problem-solving,lecture-based,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (135, 'Statistical Methods', 'STEM,problem-solving,lecture-based,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (136, 'Survey of Western Art', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (137, 'Modern Art', 'arts-humanities,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (138, 'Intermediate French', 'arts-humanities,writing-intensive,hands-on,individual-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (139, 'French Conversation and Composition', 'arts-humanities,writing-intensive,hands-on,group-focused,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (140, 'Introduction to Environmental Studies', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (141, 'Environmental Policy', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (142, 'World Religions', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (143, 'Religious Ethics', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (144, 'Introduction to Information Systems', 'STEM,problem-solving,lecture-based,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (145, 'Database Management', 'STEM,problem-solving,hands-on,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (146, 'Introduction to Womens Studies', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (147, 'Gender and Society', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (148, 'Introduction to Linguistics', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (149, 'Phonetics and Phonology', 'arts-humanities,writing-intensive,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (150, 'Philosophy of Science', 'arts-humanities,writing-intensive,lecture-based,discussion-based,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (151, 'History of Science', 'arts-humanities,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (152, 'Acting', 'arts-humanities,writing-intensive,hands-on,individual-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (153, 'Theater Production', 'arts-humanities,writing-intensive,hands-on,group-focused,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (154, 'Introduction to Ethnic Studies', 'social-sciences,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (155, 'Race, Ethnicity, and Identity', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (156, 'Physical Geology', 'STEM,problem-solving,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (157, 'Historical Geology', 'STEM,problem-solving,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (158, 'Introduction to Museum Studies', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (159, 'Museum Collections Management', 'arts-humanities,writing-intensive,lecture-based,hands-on,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (160, 'Introduction to Sports Management', 'social-sciences,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (161, 'Sports Marketing', 'social-sciences,writing-intensive,lecture-based,hands-on,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (162, 'Introduction to African American Studies', 'social-sciences,writing-intensive,lecture-based,discussion-based,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (163, 'African American History', 'social-sciences,writing-intensive,lecture-based,discussion-based,flexible-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (164, 'Introduction to Sustainability', 'social-sciences,writing-intensive,lecture-based,discussion-based,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (165, 'Sustainable Resource Management', 'social-sciences,writing-intensive,lecture-based,hands-on,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (166, 'Cybersecurity Fundamentals', 'STEM,problem-solving,lecture-based,individual-focused,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (167, 'Network Security', 'STEM,problem-solving,hands-on,group-focused,text-based-materials');",
    "INSERT INTO items (id, name, tags) VALUES (168, 'Political Philosophy', 'arts-humanities,writing-intensive,lecture-based,discussion-based,interactive-materials');",
    "INSERT INTO items (id, name, tags) VALUES (169, 'Ethics and Public Policy', 'arts-humanities,writing-intensive,lecture-based,discussion-based,mixed-materials');",
    "INSERT INTO items (id, name, tags) VALUES (170, 'Introduction to Computational Science', 'STEM,problem-solving,lecture-based,hands-on,structured-teaching');",
    "INSERT INTO items (id, name, tags) VALUES (171, 'Scientific Computing', 'STEM,problem-solving,hands-on,group-focused,flexible-teaching');",
    ];
    db.transaction((tx) => {
      sampleData.forEach((insertStatement) => {
        tx.executeSql(
          insertStatement,
          [],
          () => console.log('Sample data inserted successfully.'),
          (_, error) => console.error('Error inserting sample data:', error)
        );
      });
    });
  };
  
  const PageThree = () => {
    const [classes, setClasses] = useState([]);
    const navigation = useNavigation();
  
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT, tags TEXT);',
          [],
          () => {
            console.log('Table created successfully');
          },
          (_, error) => console.error('Error creating table:', error)
        );
      });
    }, []);
  
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql('SELECT * FROM items', [], (_, { rows }) => {
          if (rows.length === 0) {
            insertSampleData();
          } else {
            setClasses(rows._array);
          }
        });
      });
    }, []);
  
    const handleNextButtonPress = () => {
      navigation.navigate('PageFour');
    };
  
    return (
      <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
        <View style={{ flex: 1 }}>
          <TitleText2>Choose the Classes You've taken</TitleText2>
          <ScrollView contentContainerStyle={{ alignItems: 'center', marginTop: 160 }}>
            <CustomButton2 onPress={handleNextButtonPress} style={{ width: 100, height: 50 }}>
              Next
            </CustomButton2>
            {classes.map((item) => (
              <TouchableOpacity key={item.id}>
                <View>
                  <CustomLongButton1>
                    {item.id}. {item.name}
                  </CustomLongButton1>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BackgroundImage>
    );
  };
  
  export default PageThree;