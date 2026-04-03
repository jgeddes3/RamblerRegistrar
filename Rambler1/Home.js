import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppContext } from './AppContext';

const Home = () => {
  const ctx = useAppContext();
  const selectedProgram = ctx.selectedProgram;
  const selectedProgram2 = ctx.selectedProgram2;
  const selectedMinors = ctx.selectedMinors || [];
  const selectedCourses = ctx.selectedCourses || [];
  const quizTags = ctx.quizTags || [];
  const user = ctx.user;
  const graduationYear = ctx.graduationYear;
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {user ? (
          <Text style={s.welcome}>Welcome, {user.displayName || user.email}</Text>
        ) : null}

        {selectedProgram ? (
          <>
            <Text style={s.sectionHeader}>{selectedProgram2 ? 'Your Majors' : 'Your Major'}</Text>
            <Text style={s.infoText}>
              {selectedProgram.name} ({selectedProgram.degree}) — {selectedProgram.school}
            </Text>
            {selectedProgram2 ? (
              <Text style={s.infoText}>
                {selectedProgram2.name} ({selectedProgram2.degree}) — {selectedProgram2.school}
              </Text>
            ) : null}
          </>
        ) : null}

        {selectedMinors && selectedMinors.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>{selectedMinors.length > 1 ? 'Your Minors' : 'Your Minor'}</Text>
            {selectedMinors.map((minor) => (
              <Text key={minor.id} style={s.infoText}>
                {minor.name} — {minor.school}
              </Text>
            ))}
          </>
        ) : null}

        {graduationYear ? (
          <Text style={s.infoText}>Expected Graduation: {graduationYear}</Text>
        ) : null}

        {selectedCourses.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>Courses Taken ({selectedCourses.length})</Text>
            {selectedCourses.map((c) => (
              <Text key={c.id} style={s.classItem}>{c.code} — {c.name}</Text>
            ))}
          </>
        ) : null}

        {quizTags.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>Your Preferences</Text>
            <View style={s.tagContainer}>
              {quizTags.map((tag, index) => (
                <View key={index} style={s.tag}>
                  <Text style={s.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={s.sectionHeader}>Weekly Schedule</Text>
        {weekdays.map((day, index) => (
          <View key={index} style={s.dayContainer}>
            <Text style={s.dayText}>{day}</Text>
            <View style={s.separator} />
          </View>
        ))}

        {!selectedProgram && selectedCourses.length === 0 ? (
          <Text style={s.emptyText}>
            Complete the signup flow to see your profile here
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcome: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#A30046',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    marginBottom: 4,
    color: '#333',
  },
  classItem: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    marginLeft: 8,
    marginBottom: 2,
    color: '#555',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
  },
  dayContainer: {
    marginBottom: 8,
  },
  dayText: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond-Regular',
    color: '#333',
  },
  separator: {
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default Home;
