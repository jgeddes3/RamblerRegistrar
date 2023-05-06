// PageFour.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
        {label: 'A. Individual work', tag: 'individual-focused'}, 
        {label: 'B. Group projects', tag: 'group-focused'},
        {label: 'C. A mix of both', tag: 'mixed-environment'},
    ], 
}, {
    question: 'How do you prefer to learn', 
    options: [
        {label: 'A. Lectures and presentations', tag: 'lecture-based'}, 
        {label: 'B. Hands-on activities and experiments', tag: 'hands-on'}, 
        {label: 'C. A combination of both', tag: 'balanced-learning'},
    ], 
}, {
    question: 'Which of these subjects interests you the most', 
    options: [
        {label: 'A. Science and technology', tag: "'STEM'"},
        {label: 'B. Arts and humanities', tag: 'arts-humanities'}, 
        {label: 'C. Social sciences', tag: 'social-sciences'},
    ], 
}, {
    question: 'What type of assignments do you prefer', 
    options: [
        {label: 'A. Writing essays and papers', tag: 'writing-intensive'}, 
        {label: 'B. Solving problems and equations', tag: 'problem-solving'}, 
        {label: 'C. Creative projects', tag: 'creative-projects'},
    ],
}, {
    question: 'How do you feel about class discussions and debates', 
    options: [
        {label: 'A. I enjoy engaging in discussions and debates', tag: 'discussion-based'}, 
        {label: 'B. I prefer to listen and take notes', tag: 'passive-listening'}, 
        {label: 'C. A balance of both works for me', tag: 'mixed-discussion'},
    ], 
}, {
    question: 'How important is real-world application for you', 
    options: [
        {label: 'A. Very important - I want to apply what I learn', tag: 'practical-application'}, 
        {label: 'B. Not very important - I enjoy learning for its own sake', tag: 'theoretical'}, 
        {label: 'C. Somewhat important - a mix of both is ideal', tag: 'balanced-application'},
    ], 
}, {
    question: 'Which of these teaching styles do you prefer', 
    options: [
        {label: 'A. Structured and organized', tag: 'structured-teaching'}, 
        {label: 'B. Flexible and adaptive', tag: 'flexible-teaching'}, 
        {label: 'C. A combination of both', tag: 'mixed-teaching'},
    ],
}, {
    question: 'How do you prefer to be assessed', 
    options: 
    [
        {label: 'A. Multiple choice exams', tag: 'multiple-choice'}, 
        {label: 'B. Essays and written assignments', tag: 'written-assessments'}, 
        {label: 'C. Project-based assessments', tag: 'project-based'}
    ], 
}, {
    question: 'What size of class do you prefer', 
    options: 
    [
        {label: 'A. Small, intimate classes', tag: 'small-class-size'}, 
        {label: 'B. Large lectures with many students', tag: 'large-class-size'}, 
        {label: 'C. No preference', tag: 'any-class-size'}
    ], 
}, {
    question: 'What type of course material do you prefer', 
    options: 
    [
        {label: 'A. Reading from textbooks and articles', tag: 'text-based-materials'}, 
        {label: 'B. Interactive online resources', tag: 'interactive-materials'}, 
        {label: 'C. A mix of both', tag: 'mixed-materials'}
    ],
  },
  // Add the rest of the questions in the same format
];

const PageFour = () => {
    const [selectedAnswers, setSelectedAnswers] = useState({});
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
      console.log('All answers:', selectedAnswers);
      navigation.navigate('PageFive');
    };
  
    return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={styles.container}>
        <Text style={styles.title}>Personality for classes</Text>
        <ScrollView>
          {questions.map((question, questionIndex) => (
            <View key={questionIndex}>
              <View style={styles.questionContainer}>
                <Text style={styles.question}>{question.question}</Text>
              </View>
              {question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[questionIndex] === optionIndex;
                return (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      styles.option,
                      isSelected ? styles.optionSelected : styles.optionUnselected,
                    ]}
                    onPress={() => handleOptionPress(questionIndex, optionIndex)}
                  >
                    <Text style={isSelected ? styles.optionTextSelected : styles.optionTextUnselected}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
        {allQuestionsAnswered && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextButtonPress}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        
        )}
      </View>
    </BackgroundImage>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 36,
      marginBottom: 20,
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
    nextButton: {
    alignSelf: 'center',
    backgroundColor: '#A30046',
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
    marginBottom: 30,
    },
    nextButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: 'white',
    },

  });
  
  export default PageFour;