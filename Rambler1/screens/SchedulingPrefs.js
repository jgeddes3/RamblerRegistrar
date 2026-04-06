import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import BackgroundImage from '../styleComponents/BackgroundImage';

const QUESTIONS = [
  {
    key: 'timePreference',
    question: 'What times work for you?',
    options: [
      { label: "I'm an early bird — mornings are fine, nothing after 4 PM", value: 'early' },
      { label: "I'm a night owl — nothing before 10 AM please", value: 'night' },
      { label: 'Middle of the day is best — 10 AM to 3 PM', value: 'middle' },
      { label: "No preference — I'll take whenever", value: 'none' },
    ],
  },
  {
    key: 'weekShape',
    question: 'How do you want your week shaped?',
    options: [
      { label: 'MWF schedule — shorter classes, more days', value: 'mwf' },
      { label: 'TuTh schedule — longer blocks, more days off', value: 'tuth' },
      { label: 'Pack everything into the fewest days possible', value: 'fewest' },
      { label: 'Spread it out evenly', value: 'spread' },
      { label: 'No preference', value: 'none' },
    ],
  },
  {
    key: 'classSize',
    question: 'Class size?',
    options: [
      { label: 'Small and intimate — under 25 students', value: 'small' },
      { label: 'Medium — 25 to 50', value: 'medium' },
      { label: "Doesn't matter", value: 'none' },
    ],
  },
  {
    key: 'modality',
    question: 'Online vs in-person?',
    options: [
      { label: 'In-person only', value: 'in-person' },
      { label: 'Online only', value: 'online' },
      { label: 'A mix of both', value: 'mix' },
      { label: 'No preference', value: 'none' },
    ],
  },
  {
    key: 'campus',
    question: 'Campus preference?',
    options: [
      { label: 'Lake Shore Campus only', value: 'lsc' },
      { label: 'Water Tower Campus only', value: 'wtc' },
      { label: 'Either campus is fine', value: 'either' },
    ],
  },
];

const SchedulingPrefs = () => {
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const navigation = useNavigation();
  const { setQuizResults, quizResults } = useAppContext();

  const q = QUESTIONS[currentQ];
  const currentAnswer = answers[q.key];

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [q.key]: value }));
  };

  const handleNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Save scheduling prefs into quiz results
      if (quizResults) {
        setQuizResults({ ...quizResults, schedulingPrefs: answers });
      }
      navigation.navigate('AccountSetup');
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <BackgroundImage source={require('../assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.headerBar}>
          <View style={s.headerSide}>
            <TouchableOpacity onPress={handleBack} style={s.backButton}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('../assets/Icons/Logo2-02.png')} style={s.headerLogo} />
          <View style={s.headerSide} />
        </View>

        {/* Progress */}
        <View style={s.progressContainer}>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }]} />
          </View>
          <Text style={s.progressText}>{currentQ + 1} / {QUESTIONS.length}</Text>
        </View>

        <View style={s.sectionBadge}>
          <Text style={s.sectionText}>Scheduling Preferences</Text>
        </View>

        {/* Question */}
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.questionCard}>
            <Text style={s.question}>{q.question}</Text>

            {q.options.map((option) => {
              const selected = currentAnswer === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[s.option, selected ? s.optionSelected : s.optionUnselected]}
                  onPress={() => handleSelect(option.value)}
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

        {/* Bottom */}
        <View style={s.stickyBottom}>
          {currentAnswer ? (
            <TouchableOpacity style={s.nextButton} onPress={handleNext}>
              <Text style={s.nextButtonText}>
                {currentQ === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.hintText}>Select an option to continue</Text>
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
  headerSide: { width: 90, alignItems: 'flex-start' },
  headerLogo: { width: 50, height: 42, resizeMode: 'contain' },
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 18,
  },
  question: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 26,
    color: '#000',
    marginBottom: 20,
    lineHeight: 34,
  },
  option: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
    fontSize: 18,
    color: '#333',
  },
  optionTextSelected: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  stickyBottom: {
    paddingTop: 6,
    paddingBottom: 34,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    color: '#999',
    marginBottom: 4,
  },
});

export default SchedulingPrefs;
