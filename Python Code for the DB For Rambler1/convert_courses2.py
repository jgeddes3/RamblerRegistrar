import re

data = '''1 ‘Computer Science’
1 ‘Computer Science’
Introduction to Programming
Data Structures and Algorithms
Computer Networks
Artificial Intelligence
Operating Systems
2 ‘Psychology’
General Psychology
Social Psychology
Cognitive Psychology
Abnormal Psychology
Developmental Psychology
3 ‘Business Administration’
Principles of Management
Financial Accounting
Marketing Principles
Business Law
Operations Management
4 ‘Biology’
General Biology
Genetics
Microbiology
Ecology
Evolution
5 ‘Nursing’
Foundations of Nursing
Medical-Surgical Nursing
Maternal-Newborn Nursing
Pediatric Nursing
Mental Health Nursing
6 ‘Mechanical Engineering’
Engineering Mechanics
Thermodynamics
Fluid Mechanics
Dynamics and Control
Machine Design
7 ‘English’
Introduction to Literature
British Literature
American Literature
Creative Writing
Literary Theory
8 ‘Political Science’
Introduction to Political Science
Comparative Politics
International Relations
American Government
Political Philosophy
9 ‘Marketing’
Marketing Principles
Consumer Behavior
Market Research
Advertising and Promotion
Digital Marketing
10 ‘Accounting’
Financial Accounting
Managerial Accounting
Taxation
Auditing
Accounting Information Systems
11 ‘History’
World History
American History
European History
Asian History
Latin American History
12 ‘Chemistry’
General Chemistry
Organic Chemistry
Inorganic Chemistry
Physical Chemistry
Analytical Chemistry
13 ‘Communications’
Introduction to Communication
Interpersonal Communication
Public Speaking
Mass Communication
Intercultural Communication
14 ‘Economics’
Principles of Microeconomics
Principles of Macroeconomics
International Economics
Econometrics
Public Finance
15 ‘Sociology’
Introduction to Sociology
Social Problems
Social Inequality
Urban Sociology
Race and Ethnicity
16 ‘Mathematics’
Calculus
Linear Algebra
Differential Equations
Abstract Algebra
Real Analysis
17 ‘Education’
Introduction to Education
Educational Psychology
Curriculum Development
Classroom Management
Assessment and Evaluation
18 ‘Physics’
General Physics
Classical Mechanics
Electromagnetism
Thermodynamics
Quantum Mechanics
19 ‘Graphic Design’
Foundations of Graphic Design
Typography
Digital Imaging
Web Design
Branding and Identity
20 ‘Environmental Science’
Introduction to Environmental Science
Environmental Chemistry
Ecology
Environmental Policy
Sustainable Resource Management
21 ‘Philosophy’
Introduction to Philosophy
Ethics
Epistemology
Metaphysics
Philosophy of Mind
22 ‘Music’
Music Theory
Ear Training
Music History
Ensemble Performance
Composition
23 ‘Anthropology’
Introduction to Anthropology
Cultural Anthropology
Biological Anthropology
Archaeology
Linguistic Anthropology
24 ‘Journalism’
Introduction to Journalism
News Reporting and Writing
Investigative Reporting
Media Law and Ethics
Broadcast Journalism
25 ‘International Relations’
Introduction to International Relations
Comparative Politics
International Political Economy
Diplomacy and Statecraft
Global Security
Introduction to Programming
Data Structures and Algorithms
'''

majmin_type = "major"

lines = data.split("\n")
current_classes = []

with open("insert_majmin.sql", "w") as f:
    for line in lines:
        if line.startswith("1"):
            line = line.replace("1", "")
        if "’" in line:
            if current_classes:
                sql_line = f"INSERT INTO majmin (id, name, type, classesNeeded) VALUES ({id}, '{name}', '{majmin_type}', '"
                sql_line += ", ".join(current_classes) + "');\n"
                f.write(sql_line)
                current_classes = []
            id_name = re.split(r"‘|’", line)
            id = id_name[0].strip()
            name = id_name[1].strip()
        elif line:
            current_classes.append(line.strip())
    # Write the last entry
    if current_classes:
        sql_line = f"INSERT INTO majmin (id, name, type, classesNeeded) VALUES ({id}, '{name}', '{majmin_type}', '"
        sql_line += ", ".join(current_classes) + "');\n"
        f.write(sql_line)