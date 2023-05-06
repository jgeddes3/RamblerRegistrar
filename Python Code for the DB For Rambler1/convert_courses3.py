import re

data = '''
26 ‘Creative Writing’
Creative Writing Fiction
Creative Writing Poetry
27 ‘Film Studies’
Introduction to Film Studies
Film History
28 ‘Spanish’
Intermediate Spanish
Spanish Conversation and Composition
29 ‘Human Resource Management’
Human Resource Management
Organizational Behavior
30 ‘Public Health’
Introduction to Public Health
Health Policy and Administration
31 ‘Entrepreneurship’
Entrepreneurship and Innovation
Business Planning
32 ‘Statistics’
Probability and Statistics
Statistical Methods
33 ‘Art History’
Survey of Western Art
Modern Art
34 ‘French’
Intermediate French
French Conversation and Composition
35 ‘Environmental Studies’
Introduction to Environmental Studies
Environmental Policy
36 ‘Religious Studies’
World Religions
Religious Ethics
37 ‘Information Technology’
Introduction to Information Systems
Database Management
38 ‘Womens Studies’
Introduction to Womens Studies
Gender and Society
39 ‘Linguistics’
Introduction to Linguistics
Phonetics and Phonology
40 ‘Philosophy of Science’
Philosophy of Science
History of Science
41 ‘Theater Arts’
Acting
Theater Production
42 ‘Ethnic Studies’
Introduction to Ethnic Studies
Race, Ethnicity, and Identity
43 ‘Geology’
Physical Geology
Historical Geology
44 ‘Museum Studies’
Introduction to Museum Studies
Museum Collections Management
45 ‘Sports Management’
Introduction to Sports Management
Sports Marketing
46 ‘African American Studies’
Introduction to African American Studies
African American History
47 ‘Sustainability Studies’
Introduction to Sustainability
Sustainable Resource Management
48 ‘Cybersecurity’
Cybersecurity Fundamentals
Network Security
49 ‘Political Philosophy’ 
Political Philosophy
Ethics and Public Policy
50 ‘Computational Science’
Introduction to Computational Science
Scientific Computing
'''

majmin_type = "minor"

lines = data.split("\n")
current_classes = []

with open("insert_majmin2.sql", "w") as f:
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
