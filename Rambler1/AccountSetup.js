import React, { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from './AppContext';
import { signUp, getIdToken } from './auth';
import { saveUserProfile, addUserCourse, saveQuizResults } from './api';
import SearchBar from './styleComponents/SearchBar';
import BackgroundImage from './styleComponents/BackgroundImage';

const CLASS_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

const AccountSetup =() => {
  const [year, setYear] = useState('');
  const [classYearLocal, setClassYearLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedProgram, selectedProgram2, selectedMinors, selectedCourses, setGraduationYear, setClassYear, quizResults } = useAppContext();

  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

  const handleNextButtonPress = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const firebaseUser = await signUp(email, password);
      setGraduationYear(String(year));
      setClassYear(classYearLocal);

      // Save onboarding selections to backend
      // Use the token directly from the new user (getIdToken might not work yet)
      try {
        const token = await firebaseUser.getIdToken();
        if (token) {
          await saveUserProfile(firebaseUser.uid, {
            selectedProgramId: selectedProgram?.id || null,
            selectedProgram2Id: selectedProgram2?.id || null,
            selectedMinors: (selectedMinors || []).map(m => m.id),
            graduationYear: String(year),
            classYear: classYearLocal,
          }, token);

          // Save quiz results to backend
          if (quizResults) {
            try {
              await saveQuizResults(firebaseUser.uid, {
                scores: quizResults.scores,
                code: quizResults.code,
                profileName: quizResults.profileName,
                answers: quizResults.answers,
                schedulingPrefs: quizResults.schedulingPrefs || {},
              }, token);
            } catch (e) {}
          }

          // Also sync selected courses to backend
          if (selectedCourses && selectedCourses.length > 0) {
            for (const course of selectedCourses) {
              try {
                await addUserCourse(firebaseUser.uid, course.code, null, null, token);
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        // Non-critical — profile can be saved later
      }
      // Firebase auth state change auto-switches to MainTabs
    } catch (error) {
      const code = error.code;
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters');
      } else {
        setErrorMessage('Signup failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
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
          <Text style={s.pageTitle}>Create Account</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.label}>Expected Graduation Date</Text>
          <View style={s.pickerWrapper}>
            <Picker
              selectedValue={year}
              style={s.picker}
              onValueChange={(itemValue) => setYear(itemValue)}
            >
              <Picker.Item label="Select year..." value="" />
              {Array.from({ length: 10 }, (_, i) => currentYear + i).map((y) => (
                <Picker.Item key={y} label={`${y}`} value={y} />
              ))}
              <Picker.Item label={`${currentYear + 10}+`} value={`${currentYear + 10}+`} />
            </Picker>
          </View>
          <Text style={s.label}>Current Class Year</Text>
          <View style={s.pickerWrapper}>
            <Picker
              selectedValue={classYearLocal}
              style={s.picker}
              onValueChange={(itemValue) => setClassYearLocal(itemValue)}
            >
              <Picker.Item label="Select class year..." value="" />
              {CLASS_YEARS.map((cy) => (
                <Picker.Item key={cy} label={cy} value={cy} />
              ))}
            </Picker>
          </View>
          <View style={s.labelBadge}>
            <Text style={s.label}>Pick an email and password</Text>
          </View>
          <SearchBar value={email} onChangeText={(text) => { setEmail(text); setErrorMessage(''); }} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
          <View style={{ height: 15 }} />
          <SearchBar value={password} onChangeText={(text) => { setPassword(text); setErrorMessage(''); }} placeholder="Password" secureTextEntry />
          {errorMessage ? (
            <Text style={{ color: '#A30046', marginTop: 10, fontFamily: 'CormorantGaramond-Regular', fontSize: 16, textAlign: 'center' }}>
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>
        </KeyboardAvoidingView>
        {year && classYearLocal && email && password ? (
          <View style={s.stickyBottom}>
            <TouchableOpacity style={s.nextButton} onPress={handleNextButtonPress} disabled={loading}>
              <Text style={s.nextButtonText}>{loading ? '...' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    textAlign: 'center',
    color: 'black',
  },
  labelBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 15,
  },
  pickerWrapper: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    width: 275,
    marginBottom: 50,
  },
  picker: {
    width: '100%',
    color: '#000000',
  },
  stickyBottom: {
    paddingTop: 6,
    paddingBottom: 34,
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
});

export default AccountSetup;
