import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from './AppContext';
import BackgroundImage from './styleComponents/BackgroundImage';

const questions = [
  {
    question: 'What kind of sleeper are you?',
    options: [
      { label: 'A: Early Riser', tag: 'no-night-classes' },
      { label: 'B: Night Owl', tag: 'no-morning-classes' },
      { label: 'C: Right in the middle', tag: 'in-the-middle' },
    ],
  },
  {
    question: 'What type of work environment do you prefer',
    options: [
      { label: 'A. Individual work', tag: 'individual-focused' },
      { label: 'B. Group projects', tag: 'group-focused' },
      { label: 'C. A mix of both', tag: 'mixed-environment' },
    ],
  },
  {
    question: 'How do you prefer to learn',
    options: [
      { label: 'A. Lectures and presentations', tag: 'lecture-based' },
      { label: 'B. Hands-on activities and experiments', tag: 'hands-on' },
      { label: 'C. A combination of both', tag: 'balanced-learning' },
    ],
  },
  {
    question: 'Which of these subjects interests you the most',
    options: [
      { label: 'A. Science and technology', tag: 'STEM' },
      { label: 'B. Arts and humanities', tag: 'arts-humanities' },
      { label: 'C. Social sciences', tag: 'social-sciences' },
    ],
  },
  {
    question: 'What type of assignments do you prefer',
    options: [
      { label: 'A. Writing essays and papers', tag: 'writing-intensive' },
      { label: 'B. Solving problems and equations', tag: 'problem-solving' },
      { label: 'C. Creative projects', tag: 'creative-projects' },
    ],
  },
  {
    question: 'How do you feel about class discussions and debates',
    options: [
      { label: 'A. I enjoy engaging in discussions and debates', tag: 'discussion-based' },
      { label: 'B. I prefer to listen and take notes', tag: 'passive-listening' },
      { label: 'C. A balance of both works for me', tag: 'mixed-discussion' },
    ],
  },
  {
    question: 'How important is real-world application for you',
    options: [
      { label: 'A. Very important - I want to apply what I learn', tag: 'practical-application' },
      { label: 'B. Not very important - I enjoy learning for its own sake', tag: 'theoretical' },
      { label: 'C. Somewhat important - a mix of both is ideal', tag: 'balanced-application' },
    ],
  },
  {
    question: 'Which of these teaching styles do you prefer',
    options: [
      { label: 'A. Structured and organized', tag: 'structured-teaching' },
      { label: 'B. Flexible and adaptive', tag: 'flexible-teaching' },
      { label: 'C. A combination of both', tag: 'mixed-teaching' },
    ],
  },
  {
    question: 'How do you prefer to be assessed',
    options: [
      { label: 'A. Multiple choice exams', tag: 'multiple-choice' },
      { label: 'B. Essays and written assignments', tag: 'written-assessments' },
      { label: 'C. Project-based assessments', tag: 'project-based' },
    ],
  },
  {
    question: 'What size of class do you prefer',
    options: [
      { label: 'A. Small, intimate classes', tag: 'small-class-size' },
      { label: 'B. Large lectures with many students', tag: 'large-class-size' },
      { label: 'C. No preference', tag: 'any-class-size' },
    ],
  },
  {
    question: 'What type of course material do you prefer',
    options: [
      { label: 'A. Reading from textbooks and articles', tag: 'text-based-materials' },
      { label: 'B. Interactive online resources', tag: 'interactive-materials' },
      { label: 'C. A mix of both', tag: 'mixed-materials' },
    ],
  },
];

const PreferenceQuiz =() => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const { setQuizTags } = useAppContext();
  const navigation = useNavigation();

  const handleOptionPress = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const allQuestionsAnswered = questions.every(
    (q, index) => selectedAnswers[index] !== undefined
  );

  const handleNextButtonPress = () => {
    const tags = questions.map((q, index) => q.options[selectedAnswers[index]].tag);
    setQuizTags(tags);
    navigation.navigate('AccountSetup');
  };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        <View style={s.headerBar}>
          <View style={s.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('./assets/Icons/Logo2-02.png')} style={s.headerLogo} />
          <View style={s.headerSide} />
        </View>
        <View style={s.pageTitleBadge}>
          <Text style={s.pageTitle}>Personality for Classes</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 10 }}>
          {questions.map((question, questionIndex) => (
            <View key={questionIndex}>
              <View style={s.questionContainer}>
                <Text style={s.question}>{question.question}</Text>
              </View>
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[questionIndex] === optionIndex;
                return (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      s.option,
                      isSelected ? s.optionSelected : s.optionUnselected,
                    ]}
                    onPress={() => handleOptionPress(questionIndex, optionIndex)}
                  >
                    <Text style={isSelected ? s.optionTextSelected : s.optionTextUnselected}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
        <View style={s.stickyBottom}>
          <Text style={s.progressText}>
            {Object.keys(selectedAnswers).length} of {questions.length} answered
          </Text>
          {allQuestionsAnswered ? (
            <TouchableOpacity style={s.nextButton} onPress={handleNextButtonPress}>
              <Text style={s.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.hintText}>Answer all questions to continue</Text>
          )}
        </View>
      </View>
    </BackgroundImage>
  );
};

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
  pageTitleBadge: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 15,
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    textAlign: 'center',
    color: 'black',
  },
  questionContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  question: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 25,
  },
  option: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  optionUnselected: {
    backgroundColor: '#d9d9d9',
  },
  optionSelected: {
    backgroundColor: '#A30046',
  },
  optionTextUnselected: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: 'black',
  },
  optionTextSelected: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: 'white',
  },
  stickyBottom: {
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    width: 128,
    height: 53,
  },
  nextButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: 'white',
  },
  progressText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 6,
  },
  hintText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#A30046',
    marginBottom: 4,
  },
});

export default PreferenceQuiz;
