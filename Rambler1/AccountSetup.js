import React, { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from './AppContext';
import { upgradeAnonymousAccount } from './auth';
import { saveUserProfile, addUserCourse, saveQuizResults } from './firestore-data';
import { POLICY_VERSION } from './privacy-policy-content';
import { TERMS_VERSION, TERMS_TITLE, TERMS_SECTIONS } from './terms-content';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import SearchBar from './styleComponents/SearchBar';
import BackgroundImage from './styleComponents/BackgroundImage';

const CLASS_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

const AccountSetup =() => {
  const [year, setYear] = useState('');
  const [classYearLocal, setClassYearLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHonors, setIsHonorsLocal] = useState(false);
  const [isAthlete, setIsAthleteLocal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const { selectedProgram, selectedProgram2, selectedMinors, selectedCourses, setGraduationYear, setClassYear, setIsHonors, setIsAthlete, quizResults, setUser, setIsLoggedIn, setPrivacyPolicyVersion, setTermsVersion } = useAppContext();

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
      const firebaseUser = await upgradeAnonymousAccount(email, password);
      setGraduationYear(String(year));
      setClassYear(classYearLocal);
      setIsHonors(isHonors);
      setIsAthlete(isAthlete);

      // Save onboarding selections to Firestore
      try {
        await saveUserProfile(firebaseUser.uid, {
          selectedProgramId: selectedProgram?.id || null,
          selectedProgram2Id: selectedProgram2?.id || null,
          selectedMinors: (selectedMinors || []).map(m => m.id),
          graduationYear: String(year),
          classYear: classYearLocal,
          isHonors: isHonors,
          isAthlete: isAthlete,
          privacyPolicyVersion: POLICY_VERSION,
          termsVersion: TERMS_VERSION,
        });

        // Save quiz results to Firestore
        if (quizResults) {
          try {
            await saveQuizResults(firebaseUser.uid, {
              scores: quizResults.scores,
              code: quizResults.code,
              profileName: quizResults.profileName,
              answers: quizResults.answers,
              schedulingPrefs: quizResults.schedulingPrefs || {},
            });
          } catch (e) {}
        }

        // Also sync selected courses to Firestore
        if (selectedCourses && selectedCourses.length > 0) {
          for (const course of selectedCourses) {
            try {
              await addUserCourse(firebaseUser.uid, course.code, null, null);
            } catch (e) {}
          }
        }
      } catch (e) {
        // Non-critical — profile can be saved later
      }
      // linkWithCredential preserves the uid, so onAuthStateChanged does NOT
      // fire after upgrading an anonymous account — update context explicitly
      // so App.js switches from AuthStack to MainTabs.
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        isAnonymous: false,
      });
      setIsLoggedIn(true);
      // The user accepted both documents in this flow — reflect it in context
      // so the App.js consent gate doesn't re-prompt right after signup. If
      // the profile write above failed, the gate re-prompts on next cold start.
      setPrivacyPolicyVersion(POLICY_VERSION);
      setTermsVersion(TERMS_VERSION);
    } catch (error) {
      const code = error.code;
      if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
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
          <View style={s.toggleCard}>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Honors student?</Text>
              <Switch
                accessibilityLabel="Honors student"
                value={isHonors}
                onValueChange={setIsHonorsLocal}
                trackColor={{ false: '#B0B0B0', true: '#A30046' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Student-athlete?</Text>
              <Switch
                accessibilityLabel="Student-athlete"
                value={isAthlete}
                onValueChange={setIsAthleteLocal}
                trackColor={{ false: '#B0B0B0', true: '#A30046' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={s.toggleHint}>Honors and athletes get registration priority. This tunes course warnings</Text>
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
            <TouchableOpacity
              style={s.consentRow}
              onPress={() => setTermsVisible(true)}
              accessibilityLabel="Read and agree to the Terms of Service"
            >
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color="#A30046"
              />
              <Text style={s.consentText}>
                I have read and agree to the{' '}
                <Text style={s.consentLink}>Terms of Service</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.consentRow}
              onPress={() => setPolicyVisible(true)}
              accessibilityLabel="Read and agree to the Privacy Policy"
            >
              <Ionicons
                name={policyAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color="#A30046"
              />
              <Text style={s.consentText}>
                I have read and agree to the{' '}
                <Text style={s.consentLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextButton, !(policyAccepted && termsAccepted) && s.nextButtonDisabled]}
              onPress={handleNextButtonPress}
              disabled={loading || !policyAccepted || !termsAccepted}
            >
              <Text style={s.nextButtonText}>{loading ? '...' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <PrivacyPolicyModal
          visible={policyVisible}
          mode="consent"
          onAccept={() => { setPolicyAccepted(true); setPolicyVisible(false); }}
          onDecline={() => setPolicyVisible(false)}
        />
        <PrivacyPolicyModal
          visible={termsVisible}
          mode="consent"
          title={TERMS_TITLE}
          sections={TERMS_SECTIONS}
          agreeLabel="I agree to the Terms of Service"
          onAccept={() => { setTermsAccepted(true); setTermsVisible(false); }}
          onDecline={() => setTermsVisible(false)}
        />
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
  toggleCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    width: 275,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 50,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: 'black',
  },
  toggleHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 2,
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  consentText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: 'black',
    marginLeft: 8,
  },
  consentLink: {
    textDecorationLine: 'underline',
    color: '#A30046',
  },
  nextButtonDisabled: {
    opacity: 0.4,
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
