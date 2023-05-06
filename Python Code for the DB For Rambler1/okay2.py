questions = [ 
    "What kind of sleeper are you? A: Early Riser. (tag: no-night-classes) B: Night Owl. (tag: no-morning-classes) C. Right in the middle (tag: in-the-middle)",        
    "What type of work environment do you prefer? A. Individual work (tag: 'individual-focused') B. Group projects (tag: 'group-focused') C. A mix of both (tag: 'mixed-environment')",
    "How do you prefer to learn? A. Lectures and presentations (tag: 'lecture-based') B. Hands-on activities and experiments (tag: 'hands-on') C. A combination of both (tag: 'balanced-learning')",
    "Which of these subjects interests you the most? A. Science and technology (tag: 'STEM') B. Arts and humanities (tag: 'arts-humanities') C. Social sciences (tag: 'social-sciences')",
    "What type of assignments do you prefer? A. Writing essays and papers (tag: 'writing-intensive') B. Solving problems and equations (tag: 'problem-solving') C. Creative projects (tag: 'creative-projects')",
    "How do you feel about class discussions and debates? A. I enjoy engaging in discussions and debates (tag: 'discussion-based') B. I prefer to listen and take notes (tag: 'passive-listening') C. A balance of both works for me (tag: 'mixed-discussion')",
    "How important is real-world application for you? A. Very important - I want to apply what I learn (tag: 'practical-application') B. Not very important - I enjoy learning for its own sake (tag: 'theoretical') C. Somewhat important - a mix of both is ideal (tag: 'balanced-application')",
    "Which of these teaching styles do you prefer? A. Structured and organized (tag: 'structured-teaching') B. Flexible and adaptive (tag: 'flexible-teaching') C. A combination of both (tag: 'mixed-teaching')",
    "How do you prefer to be assessed? A. Multiple choice exams (tag: 'multiple-choice') B. Essays and written assignments (tag: 'written-assessments') C. Project-based assessments (tag: 'project-based')",
    "What size of class do you prefer? A. Small, intimate classes (tag: 'small-class-size') B. Large lectures with many students (tag: 'large-class-size') C. No preference (tag: 'any-class-size')",
    "What type of course material do you prefer? A. Reading from textbooks and articles (tag: 'text-based-materials') B. Interactive online resources (tag: 'interactive-materials') C. A mix of both (tag: 'mixed-materials')"]


formatted_questions = []
for question in questions:
    question_parts = question.split("?")
    question_text = question_parts[0].strip()

    options_str = question_parts[1].strip()
    options = options_str.split(")")
    options_list = []
    for option in options:
        option = option.strip()
        if option:
            label, tag = option.split("(")
            label = label.strip()
            tag = tag.replace("tag:", "").strip()
            options_list.append({"label": label, "tag": tag})

    formatted_question = {"question": question_text, "options": options_list}
    formatted_questions.append(formatted_question)

print(formatted_questions)