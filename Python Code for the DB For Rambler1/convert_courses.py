import re

data = '''
{ id: 122, name: 'Creative Writing Fiction', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'individual-focused', 'structured-teaching'] }, { id: 123, name: 'Creative Writing Poetry', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'group-focused', 'flexible-teaching'] }, { id: 124, name: 'Introduction to Film Studies', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 125, name: 'Film History', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 126, name: 'Intermediate Spanish', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'individual-focused', 'mixed-materials'] }, { id: 127, name: 'Spanish Conversation and Composition', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'group-focused', 'structured-teaching'] }, { id: 128, name: 'Human Resource Management', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'flexible-teaching'] }, { id: 129, name: 'Organizational Behavior', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 130, name: 'Introduction to Public Health', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 131, name: 'Health Policy and Administration', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 132, name: 'Entrepreneurship and Innovation', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'hands-on', 'structured-teaching'] }, { id: 133, name: 'Business Planning', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'hands-on', 'flexible-teaching'] }, { id: 134, name: 'Probability and Statistics', tags: ['STEM', 'problem-solving', 'lecture-based', 'individual-focused', 'text-based-materials'] }, { id: 135, name: 'Statistical Methods', tags: ['STEM', 'problem-solving', 'lecture-based', 'group-focused', 'interactive-materials'] }, { id: 136, name: 'Survey of Western Art', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 137, name: 'Modern Art', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 138, name: 'Intermediate French', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'individual-focused', 'interactive-materials'] }, { id: 139, name: 'French Conversation and Composition', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'group-focused', 'structured-teaching'] }, { id: 140, name: 'Introduction to Environmental Studies', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'flexible-teaching'] }, { id: 141, name: 'Environmental Policy', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 142, name: 'World Religions', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 143, name: 'Religious Ethics', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 144, name: 'Introduction to Information Systems', tags: ['STEM', 'problem-solving', 'lecture-based', 'individual-focused', 'text-based-materials'] }, { id: 145, name: 'Database Management', tags: ['STEM', 'problem-solving', 'hands-on', 'group-focused', 'interactive-materials'] }, { id: 146, name: 'Introduction to Womens Studies', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 147, name: 'Gender and Society', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 148, name: 'Introduction to Linguistics', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 149, name: 'Phonetics and Phonology', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'hands-on', 'mixed-materials'] }, { id: 150, name: 'Philosophy of Science', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'structured-teaching'] }, { id: 151, name: 'History of Science', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'flexible-teaching'] }, { id: 152, name: 'Acting', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'individual-focused', 'text-based-materials'] }, { id: 153, name: 'Theater Production', tags: ['arts-humanities', 'writing-intensive', 'hands-on', 'group-focused', 'interactive-materials'] }, { id: 154, name: 'Introduction to Ethnic Studies', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 155, name: 'Race, Ethnicity, and Identity', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 156, name: 'Physical Geology', tags: ['STEM', 'problem-solving', 'lecture-based', 'hands-on', 'interactive-materials'] }, { id: 157, name: 'Historical Geology', tags: ['STEM', 'problem-solving', 'lecture-based', 'hands-on', 'mixed-materials'] }, { id: 158, name: 'Introduction to Museum Studies', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 159, name: 'Museum Collections Management', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'hands-on', 'text-based-materials'] }, { id: 160, name: 'Introduction to Sports Management', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 161, name: 'Sports Marketing', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'hands-on', 'mixed-materials'] }, { id: 162, name: 'Introduction to African American Studies', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'structured-teaching'] }, { id: 163, name: 'African American History', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'flexible-teaching'] }, { id: 164, name: 'Introduction to Sustainability', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'discussion-based', 'text-based-materials'] }, { id: 165, name: 'Sustainable Resource Management', tags: ['social-sciences', 'writing-intensive', 'lecture-based', 'hands-on', 'interactive-materials'] }, { id: 166, name: 'Cybersecurity Fundamentals', tags: ['STEM', 'problem-solving', 'lecture-based', 'individual-focused', 'mixed-materials'] }, { id: 167, name: 'Network Security', tags: ['STEM', 'problem-solving', 'hands-on', 'group-focused', 'text-based-materials'] }, { id: 168, name: 'Political Philosophy', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'interactive-materials'] }, { id: 169, name: 'Ethics and Public Policy', tags: ['arts-humanities', 'writing-intensive', 'lecture-based', 'discussion-based', 'mixed-materials'] }, { id: 170, name: 'Introduction to Computational Science', tags: ['STEM', 'problem-solving', 'lecture-based', 'hands-on', 'structured-teaching'] }, { id: 171, name: 'Scientific Computing', tags: ['STEM', 'problem-solving', 'hands-on', 'group-focused', 'flexible-teaching'] }

'''

def custom_json_parser(js_obj_str):
    # Add quotes around the keys
    js_obj_str = re.sub(r'(\b\w+\b)(\s*:)', r'"\1"\2', js_obj_str)

    # Replace single quotes with double quotes
    js_obj_str = js_obj_str.replace("'", '"')

    return eval(js_obj_str)

# Parse the data and convert it to a list of dictionaries
courses = [custom_json_parser(obj_str) for obj_str in re.findall(r'\{[^}]*\}', data)]

def generate_sql_insert(course):
    id = course["id"]
    name = course["name"].replace("'", "''")  # Escape single quotes in the name
    tags = ",".join(course["tags"])
    return f"INSERT INTO classes (id, name, tags) VALUES ({id}, '{name}', '{tags}');"

with open("insert_courses2.sql", "w") as f:
    for course in courses:
        sql_insert = generate_sql_insert(course)
        f.write(sql_insert + "\n")