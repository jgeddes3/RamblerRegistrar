import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from './AppContext';
import BackgroundImage from './styleComponents/BackgroundImage';

// =============================================================================
// RIASEC SCORING MODEL — 25 questions, 6 dimensions
// =============================================================================

const SECTIONS = [
  { title: 'How Your Mind Works', range: [0, 5] },
  { title: 'What Drives You', range: [6, 11] },
  { title: 'How You Work', range: [12, 17] },
  { title: 'Real-World Scenarios', range: [18, 24] },
];

const PROFILES = {
  RI: 'The Technical Researcher', IR: 'The Applied Scientist',
  IA: 'The Curious Creator', AI: 'The Expressive Thinker',
  IS: 'The Analytical Helper', SI: 'The Caring Analyst',
  AS: 'The Creative Helper', SA: 'The Helping Creative',
  AE: 'The Creative Strategist', EA: 'The Ambitious Creator',
  SE: 'The Leading Helper', ES: 'The Persuasive Helper',
  EC: 'The Business Leader', CE: 'The Organized Leader',
  EI: 'The Strategic Thinker', IE: 'The Intellectual Leader',
  CI: 'The Precise Analyst', IC: 'The Systematic Researcher',
  RC: 'The Practical Builder', CR: 'The Reliable Doer',
  RS: 'The Hands-On Helper', SR: 'The Active Caregiver',
  RA: 'The Maker', AR: 'The Crafting Artist',
};

const QUESTIONS = [
  // ===== Section 1: How Your Mind Works (Q1-6) =====
  {
    question: "You're watching a documentary about a social issue. Halfway through, your brain is mostly:",
    options: [
      { label: 'Evaluating the data — are their statistics legit?', scoring: { I: 3, C: 1 } },
      { label: 'Feeling the emotions of the people — this hits you in the gut', scoring: { S: 3 } },
      { label: 'Imagining what you would build or create to solve this', scoring: { R: 1, A: 1, E: 2 } },
      { label: 'Noticing the filmmaking — music, editing, storytelling craft', scoring: { A: 3 } },
    ],
  },
  {
    question: 'When do you feel like you ACTUALLY understand something?',
    options: [
      { label: 'When you can explain it to someone else simply', scoring: { S: 2, E: 1 } },
      { label: "When you can apply it to a problem you haven't seen before", scoring: { R: 1, I: 3 } },
      { label: "When you can connect it to three other things you've learned", scoring: { I: 2, A: 1 } },
      { label: "When you've memorized the frameworks and can reproduce them", scoring: { C: 3 } },
    ],
  },
  {
    question: 'Two approaches: creative but risky, or proven but boring. You:',
    options: [
      { label: "Go creative — even if it fails you'll learn more", scoring: { A: 3, E: 1 } },
      { label: 'Go proven — why take unnecessary risk?', scoring: { C: 3 } },
      { label: 'Try to find a third option combining both', scoring: { I: 2, E: 1 } },
      { label: 'Calculate the risk-reward first', scoring: { I: 1, E: 1, C: 1 } },
    ],
  },
  {
    question: "When you read the news, you're drawn to stories about:",
    options: [
      { label: 'Scientific breakthroughs and discoveries', scoring: { I: 3 } },
      { label: 'People overcoming adversity', scoring: { S: 3 } },
      { label: 'Political strategy and power dynamics', scoring: { E: 3 } },
      { label: "Cultural trends, art, and what's next", scoring: { A: 3 } },
      { label: 'Economic data, markets, and business moves', scoring: { E: 1, C: 2 } },
      { label: 'Environmental challenges and solutions', scoring: { R: 2, I: 1 } },
    ],
  },
  {
    question: 'A professor says something you disagree with. You:',
    options: [
      { label: 'Raise your hand and challenge it respectfully', scoring: { I: 1, E: 2 } },
      { label: 'Research it later before forming a strong opinion', scoring: { I: 3 } },
      { label: 'Talk to classmates after class to see if they noticed', scoring: { S: 2 } },
      { label: "Let it go — you're here to learn their perspective", scoring: { S: 1, C: 1 } },
    ],
  },
  {
    question: 'Which sentence sounds most like you?',
    options: [
      { label: '"Wait, that doesn\'t logically follow."', scoring: { I: 3 } },
      { label: '"How does that make you feel, though?"', scoring: { S: 3 } },
      { label: '"What if we tried it this way instead?"', scoring: { A: 2, E: 1 } },
      { label: '"Let me look up the actual research on this."', scoring: { I: 2, C: 1 } },
    ],
  },
  // ===== Section 2: What Drives You (Q7-12) =====
  {
    question: 'What would make you feel most successful at 30?',
    options: [
      { label: 'Financial security — property, no debt, investments', scoring: { E: 1, C: 2 } },
      { label: 'Expertise — being the go-to person in your field', scoring: { I: 3 } },
      { label: "Impact — your work directly improved people's lives", scoring: { S: 3 } },
      { label: 'Freedom — working on your own terms, no boss', scoring: { R: 1, A: 2 } },
      { label: 'Influence — people listen when you talk', scoring: { E: 3 } },
      { label: "Creation — a body of work you made that you're proud of", scoring: { A: 3 } },
    ],
  },
  {
    question: 'Which failure would sting the MOST?',
    options: [
      { label: 'Working hard and still not being the best', scoring: { E: 2, C: 1 } },
      { label: 'Selling out — doing something against your values for money', scoring: { A: 1, S: 2 } },
      { label: 'Being irrelevant — nobody cares about your work', scoring: { A: 2, E: 1 } },
      { label: 'Letting someone down who was counting on you', scoring: { S: 3 } },
      { label: 'Looking back and realizing you played it too safe', scoring: { A: 1, E: 2 } },
    ],
  },
  {
    question: 'Same salary. Job A: clear promotion path, great benefits. Job B: exciting but uncertain.',
    options: [
      { label: 'Job A, without much hesitation', scoring: { C: 3 } },
      { label: 'Job B, without much hesitation', scoring: { A: 2, E: 1 } },
      { label: 'Depends on the mission of each organization', scoring: { S: 2 } },
      { label: 'Whichever lets you learn more and grow faster', scoring: { I: 3 } },
    ],
  },
  {
    question: "What does 'extraordinary life' mean to you?",
    options: [
      { label: 'Making more money than you imagined', scoring: { E: 2, C: 1 } },
      { label: "Solving a problem that changes people's lives", scoring: { I: 1, S: 2 } },
      { label: 'Becoming a recognized leader in your field', scoring: { E: 3 } },
      { label: "Living authentically — a life that's truly yours", scoring: { A: 3 } },
      { label: 'Deep relationships and strong community', scoring: { S: 3 } },
      { label: 'Understanding the world more deeply than most', scoring: { I: 3 } },
    ],
  },
  {
    question: 'Which Loyola experience sounds most valuable?',
    options: [
      { label: 'Research fellowship alongside a professor', scoring: { I: 3 } },
      { label: 'Immersion trip focused on social justice', scoring: { S: 3 } },
      { label: 'Startup incubator where you pitch your idea', scoring: { E: 3 } },
      { label: 'Creative residency for a senior thesis in art/film/writing', scoring: { A: 3 } },
      { label: 'Clinical placement with real patients', scoring: { R: 2, S: 1 } },
      { label: 'Leadership position in student government', scoring: { E: 2, C: 1 } },
    ],
  },
  {
    question: 'The Jesuit value that resonates with you most:',
    options: [
      { label: 'Cura Personalis — care for the whole person', scoring: { S: 3 } },
      { label: 'Magis — always striving for more', scoring: { E: 2, C: 1 } },
      { label: 'Men and women for others', scoring: { S: 3 } },
      { label: 'Finding God in all things — curiosity, wonder', scoring: { I: 2, A: 1 } },
      { label: 'Contemplatives in action — reflect, then do', scoring: { I: 1, E: 1 } },
    ],
  },
  // ===== Section 3: How You Work (Q13-18) =====
  {
    question: 'Your ideal study environment:',
    options: [
      { label: 'Coffee shop — ambient noise helps you focus', scoring: { A: 1, S: 1, E: 1 } },
      { label: 'Silent library with noise-canceling headphones', scoring: { I: 2, C: 1 } },
      { label: 'Your room with music, moving between desk and bed', scoring: { A: 2 } },
      { label: 'Group study room — you talk things through', scoring: { S: 2, E: 1 } },
    ],
  },
  {
    question: 'When you hit a wall, your first instinct:',
    options: [
      { label: "Push through alone — you'll figure it out", scoring: { R: 2, I: 1 } },
      { label: 'Ask someone for a different perspective', scoring: { S: 2 } },
      { label: 'Take a break and come back fresh', scoring: { A: 2 } },
      { label: 'Switch to a different part and circle back', scoring: { E: 1, C: 1 } },
    ],
  },
  {
    question: 'How much of your ideal job involves other people?',
    options: [
      { label: '80%+ — you feed off collaboration', scoring: { S: 2, E: 2 } },
      { label: '50/50 — some collaboration, some solo', scoring: { I: 1, S: 1 } },
      { label: '20% — you need long uninterrupted focus', scoring: { R: 1, I: 2 } },
      { label: 'You want to choose when, not have it forced', scoring: { A: 2 } },
    ],
  },
  {
    question: "How do you handle a deadline that's too tight?",
    options: [
      { label: 'You thrive under pressure — deadlines are fuel', scoring: { E: 2 } },
      { label: 'Anxious but always deliver', scoring: { C: 2 } },
      { label: 'Negotiate the deadline — why accept unreasonable constraints', scoring: { E: 2 } },
      { label: "Triage — figure out what's essential, cut the rest", scoring: { I: 1, C: 1 } },
    ],
  },
  {
    question: 'Which scenario is your personal nightmare?',
    options: [
      { label: 'Every day is the same — no variety', scoring: { A: 2, E: 1 } },
      { label: 'Rules change every week — no consistency', scoring: { C: 3 } },
      { label: 'You work alone and never collaborate', scoring: { S: 2, E: 1 } },
      { label: "You're in meetings all day, never deep work", scoring: { R: 1, I: 2 } },
      { label: 'Tons of responsibility but no authority', scoring: { E: 3 } },
    ],
  },
  {
    question: 'Professor gives a final project with NO guidelines. You feel:',
    options: [
      { label: 'Excited — finally, freedom', scoring: { A: 3 } },
      { label: 'Anxious — you need more structure', scoring: { C: 3 } },
      { label: 'Strategic — what will get the best grade', scoring: { E: 2, C: 1 } },
      { label: 'Overwhelmed at first, then go deep', scoring: { I: 3 } },
    ],
  },
  // ===== Section 4: Real-World Scenarios (Q19-25) =====
  {
    question: 'Which phone notification gets you to sit up in bed?',
    options: [
      { label: 'Breaking news about a political crisis', scoring: { E: 2 } },
      { label: 'A friend texting they need to talk', scoring: { S: 3 } },
      { label: 'Your job application moved forward', scoring: { E: 2, C: 1 } },
      { label: 'Your Discord project got a new feature working', scoring: { R: 2, I: 1 } },
      { label: 'Your favorite writer posted something new', scoring: { A: 3 } },
      { label: 'Your lab results just came in', scoring: { I: 3 } },
    ],
  },
  {
    question: 'Topic you could discuss for an hour at a dinner party? (pick 2-3)',
    multiSelect: true,
    maxSelections: 3,
    options: [
      { label: 'How the brain works', scoring: { I: 3 } },
      { label: 'Startups and entrepreneurship', scoring: { E: 3 } },
      { label: "Social media's effect on society", scoring: { A: 1, S: 1 } },
      { label: 'Climate change and sustainability', scoring: { R: 1, I: 1, S: 1 } },
      { label: 'True crime and justice system', scoring: { I: 1, S: 1 } },
      { label: 'Art, film, or music', scoring: { A: 3 } },
      { label: 'Sports analytics', scoring: { R: 1, I: 1, C: 1 } },
      { label: 'Health, fitness, the body', scoring: { R: 2, I: 1 } },
      { label: 'Politics and current events', scoring: { E: 3 } },
      { label: 'Faith, spirituality, meaning', scoring: { A: 1, S: 2 } },
      { label: 'Technology and the future', scoring: { R: 1, I: 2 } },
      { label: 'Education and how people learn', scoring: { I: 1, S: 2 } },
      { label: 'Financial markets and investing', scoring: { E: 1, C: 2 } },
      { label: 'Mental health and therapy', scoring: { I: 1, S: 2 } },
      { label: 'Food, culture, and travel', scoring: { A: 2, S: 1 } },
    ],
  },
  {
    question: 'You get to shadow someone for a week. Who?',
    options: [
      { label: 'Surgeon in the OR', scoring: { R: 2, I: 1 } },
      { label: 'Data scientist at a tech company', scoring: { I: 2, C: 1 } },
      { label: 'Public defender in a courtroom', scoring: { S: 1, E: 2 } },
      { label: 'Documentary filmmaker in the field', scoring: { A: 3 } },
      { label: 'Social worker at a community org', scoring: { S: 3 } },
      { label: 'CEO making strategy decisions', scoring: { E: 3 } },
      { label: 'Research scientist in a lab', scoring: { I: 3 } },
      { label: 'Teacher in an urban high school', scoring: { S: 2 } },
    ],
  },
  {
    question: "It's 2 AM. You can't sleep. You go down a rabbit hole about:",
    options: [
      { label: 'A weird medical case or disease', scoring: { R: 1, I: 2 } },
      { label: 'An unsolved mystery — you need to figure it out', scoring: { I: 3 } },
      { label: 'Redesigning your room layout', scoring: { R: 1, A: 2 } },
      { label: "Your future — where you'll live, what life looks like", scoring: { E: 2, C: 1 } },
      { label: "Someone's incredible creative portfolio", scoring: { A: 3 } },
      { label: "A social issue — you're genuinely upset", scoring: { S: 2, E: 1 } },
    ],
  },
  {
    question: 'Which 8 AM elective would you still take?',
    options: [
      { label: 'The Neuroscience of Decision-Making', scoring: { I: 3 } },
      { label: 'Social Entrepreneurship: Businesses That Change the World', scoring: { S: 1, E: 2 } },
      { label: 'Race, Power, and Justice in America', scoring: { S: 2, E: 1 } },
      { label: 'Bioethics: Life, Death, and Everything In Between', scoring: { I: 2, S: 1 } },
      { label: 'Visual Storytelling in the Digital Age', scoring: { A: 3 } },
      { label: 'Global Health: Epidemics, Equity, and Solutions', scoring: { R: 1, I: 1, S: 1 } },
      { label: 'Forensic Psychology: Inside the Criminal Mind', scoring: { I: 2, S: 1 } },
      { label: 'The Art of Persuasion: Aristotle to TikTok', scoring: { A: 1, E: 2 } },
    ],
  },
  {
    question: 'A new student org starts at Loyola. Which one do you rush to join?',
    options: [
      { label: 'Student consulting group for Chicago nonprofits', scoring: { S: 1, E: 2 } },
      { label: 'Pre-health mentoring program', scoring: { I: 1, S: 2 } },
      { label: 'Creative magazine — writing, art, photography', scoring: { A: 3 } },
      { label: 'Political advocacy / voter registration', scoring: { S: 1, E: 2 } },
      { label: "Research team on a professor's grant", scoring: { I: 3 } },
      { label: 'Tech club building apps for community orgs', scoring: { R: 2, I: 1 } },
      { label: 'Environmental sustainability initiative', scoring: { R: 2, S: 1 } },
    ],
  },
  {
    question: 'Forget money and parents. Five years from now, doing work that makes you feel ALIVE, you see yourself:',
    options: [
      { label: 'In a lab or hospital, front lines of health and science', scoring: { R: 2, I: 1 } },
      { label: 'In a room full of people, teaching or inspiring them', scoring: { S: 2, E: 1 } },
      { label: 'At a desk creating — writing, designing, coding, composing', scoring: { A: 2 } },
      { label: 'In a boardroom, making big decisions and leading a team', scoring: { E: 3 } },
      { label: 'In the field — different city/country, making direct impact', scoring: { S: 2 } },
      { label: 'Behind the scenes, analyzing data and solving problems', scoring: { I: 2, C: 1 } },
      { label: "Honestly? Still exploring, and that's okay", scoring: { I: 1, A: 1 } },
    ],
  },
];

// =============================================================================
// SCORING
// =============================================================================

function calculateRIASEC(answers) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (let qIndex = 0; qIndex < QUESTIONS.length; qIndex++) {
    const answer = answers[qIndex];
    if (answer === undefined || answer === null) continue;

    const question = QUESTIONS[qIndex];

    if (question.multiSelect && Array.isArray(answer)) {
      // Multi-select: accumulate scoring from each selected option
      for (const optIndex of answer) {
        const scoring = question.options[optIndex]?.scoring || {};
        for (const [dim, pts] of Object.entries(scoring)) {
          scores[dim] += pts;
        }
      }
    } else {
      const scoring = question.options[answer]?.scoring || {};
      for (const [dim, pts] of Object.entries(scoring)) {
        scores[dim] += pts;
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCode = sorted.slice(0, 2).map(([letter]) => letter).join('');
  // Use 3-letter code if top 3 are within 5 points
  const useThree = sorted[1][1] - sorted[2][1] <= 5;
  const code = useThree ? sorted.slice(0, 3).map(([l]) => l).join('') : topCode;
  const profileName = PROFILES[code] || PROFILES[topCode] || 'Explorer';

  return { scores, code, profileName };
}

// =============================================================================
// COMPONENT
// =============================================================================

const PreferenceQuiz = () => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { setQuizResults } = useAppContext();
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const q = QUESTIONS[currentQuestion];
  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Current section
  const currentSection = SECTIONS.find(
    (sec) => currentQuestion >= sec.range[0] && currentQuestion <= sec.range[1]
  );

  const handleOptionPress = (optionIndex) => {
    if (q.multiSelect) {
      setSelectedAnswers((prev) => {
        const current = Array.isArray(prev[currentQuestion]) ? [...prev[currentQuestion]] : [];
        const idx = current.indexOf(optionIndex);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else if (current.length < (q.maxSelections || 3)) {
          current.push(optionIndex);
        }
        return { ...prev, [currentQuestion]: current.length > 0 ? current : undefined };
      });
    } else {
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: optionIndex }));
    }
  };

  const isAnswered = (qIdx) => {
    const answer = selectedAnswers[qIdx];
    if (QUESTIONS[qIdx].multiSelect) {
      return Array.isArray(answer) && answer.length >= 2;
    }
    return answer !== undefined;
  };

  const currentAnswered = isAnswered(currentQuestion);

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      animateTransition(() => setCurrentQuestion(currentQuestion + 1));
    } else {
      // All done — calculate and navigate
      const results = calculateRIASEC(selectedAnswers);
      setQuizResults({ ...results, answers: selectedAnswers });
      navigation.navigate('QuizResults');
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      animateTransition(() => setCurrentQuestion(currentQuestion - 1));
    } else {
      navigation.goBack();
    }
  };

  const isOptionSelected = (optIndex) => {
    if (q.multiSelect) {
      return Array.isArray(selectedAnswers[currentQuestion]) && selectedAnswers[currentQuestion].includes(optIndex);
    }
    return selectedAnswers[currentQuestion] === optIndex;
  };

  const allAnswered = QUESTIONS.every((_, i) => isAnswered(i));

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.headerBar}>
          <View style={s.headerSide}>
            <TouchableOpacity onPress={handleBack} style={s.backButton}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('./assets/Icons/Logo2-02.png')} style={s.headerLogo} />
          <View style={s.headerSide} />
        </View>

        {/* Progress bar */}
        <View style={s.progressContainer}>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }]} />
          </View>
          <Text style={s.progressText}>
            {currentQuestion + 1} / {totalQuestions}
          </Text>
        </View>

        {/* Section label */}
        {currentSection && (
          <View style={s.sectionBadge}>
            <Text style={s.sectionText}>{currentSection.title}</Text>
          </View>
        )}

        {/* Question */}
        <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={s.questionCard}>
              <Text style={s.question}>{q.question}</Text>

              {q.multiSelect && (
                <Text style={s.multiHint}>Select {q.maxSelections || 3} topics</Text>
              )}

              {q.options.map((option, optIndex) => {
                const selected = isOptionSelected(optIndex);
                return (
                  <TouchableOpacity
                    key={optIndex}
                    style={[s.option, selected ? s.optionSelected : s.optionUnselected]}
                    onPress={() => handleOptionPress(optIndex)}
                    activeOpacity={0.7}
                  >
                    <Text style={selected ? s.optionTextSelected : s.optionTextUnselected}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Bottom navigation */}
        <View style={s.stickyBottom}>
          {/* Dot navigation */}
          <View style={s.dotRow}>
            {QUESTIONS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => animateTransition(() => setCurrentQuestion(i))}
              >
                <View
                  style={[
                    s.dot,
                    i === currentQuestion && s.dotCurrent,
                    isAnswered(i) && i !== currentQuestion && s.dotAnswered,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {currentAnswered ? (
            <TouchableOpacity style={s.nextButton} onPress={handleNext}>
              <Text style={s.nextButtonText}>
                {currentQuestion === totalQuestions - 1
                  ? (allAnswered ? 'See Results' : 'Review')
                  : 'Next'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.hintText}>
              {q.multiSelect ? 'Select at least 2 topics' : 'Select an answer to continue'}
            </Text>
          )}
        </View>
      </View>
    </BackgroundImage>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  headerBar: {
    height: 120,
    backgroundColor: '#A30046',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 90,
    alignItems: 'flex-start',
  },
  headerLogo: {
    width: 50,
    height: 42,
    resizeMode: 'contain',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  backButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#A30046',
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A30046',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    width: 50,
    textAlign: 'right',
  },
  sectionBadge: {
    alignSelf: 'center',
    backgroundColor: '#A30046',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  sectionText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 18,
  },
  question: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#000',
    marginBottom: 16,
    lineHeight: 32,
  },
  multiHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#A30046',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  option: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  optionSelected: {
    backgroundColor: '#A30046',
    borderWidth: 1,
    borderColor: '#A30046',
  },
  optionTextUnselected: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    color: '#333',
    lineHeight: 22,
  },
  optionTextSelected: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  stickyBottom: {
    paddingTop: 6,
    paddingBottom: 34,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
  },
  dotCurrent: {
    backgroundColor: '#A30046',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotAnswered: {
    backgroundColor: '#D4809E',
  },
  nextButton: {
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    width: 160,
    height: 50,
  },
  nextButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  hintText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    textAlign: 'center',
    color: '#999',
    marginBottom: 4,
  },
});

export default PreferenceQuiz;
