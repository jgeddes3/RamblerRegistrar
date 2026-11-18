import React, { useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, Image, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from './AppContext';
import { upgradeAnonymousAccount } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserProfile, addUserCourse, saveQuizResults } from './firestore-data';
import { saveSignupData, storePendingSignup } from './signup-save';
import { POLICY_VERSION } from './privacy-policy-content';
import { TERMS_VERSION, TERMS_TITLE, TERMS_SECTIONS } from './terms-content';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import TextField from './components/ui/TextField';
import BackgroundImage from './styleComponents/BackgroundImage';
import { validateSignup, MIN_PASSWORD } from './signup-validation';
import { DANGER, FONT, FONT_SEMI, MAROON } from './theme';
import StepCounter from './components/ui/StepCounter';
import useOnboardingDraft from './components/ui/useOnboardingDraft';
import { clearDraft } from './onboarding';

const CLASS_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const SIGNUP_SAVE_API = { saveUserProfile, saveQuizResults, addUserCourse };

// Space under a picker, holding its error when there is one.
const FieldFoot = ({ error }) => (
  <View style={s.fieldFoot}>
    {error ? <Text style={s.fieldError} accessibilityRole="alert">{error}</Text> : null}
  </View>
);

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
  const [submitted, setSubmitted] = useState(false); // Next pressed once: show field errors
  const passwordRef = useRef(null);
  const { selectedProgram, selectedProgram2, selectedMinors, selectedCourses, setGraduationYear, setClassYear, setIsHonors, setIsAthlete, quizResults, setUser, setIsLoggedIn, setPrivacyPolicyVersion, setTermsVersion } = useAppContext();

  const navigation = useNavigation();
  useOnboardingDraft('AccountSetup');
  const currentYear = new Date().getFullYear();

  // Next is always on screen. The first press shows what's missing under each
  // field; from then on the messages follow the fields as they're fixed.
  const fieldErrors = submitted
    ? validateSignup({ year, classYear: classYearLocal, email, password, termsAccepted, policyAccepted })
    : {};

  const handleNextButtonPress = async () => {
    if (loading) return;
    setSubmitted(true);
    const errors = validateSignup({ year, classYear: classYearLocal, email, password, termsAccepted, policyAccepted });
    const problems = Object.values(errors);
    if (problems.length) {
      AccessibilityInfo.announceForAccessibility?.(
        `${problems.length === 1 ? 'One thing' : `${problems.length} things`} to fix: ${problems.join(' ')}`
      );
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const firebaseUser = await upgradeAnonymousAccount(email.trim(), password);
      setGraduationYear(String(year));
      setClassYear(classYearLocal);
      setIsHonors(isHonors);
      setIsAthlete(isAthlete);

      // Save onboarding selections: profile, quiz and taken courses at once,
      // so a bad connection costs one write timeout here, not one per save.
      // Whatever didn't save is kept on the phone; PendingSaveBanner retries
      // it and tells the user if it still won't go through.
      const signupData = {
        profile: {
          selectedProgramId: selectedProgram?.id || null,
          selectedProgram2Id: selectedProgram2?.id || null,
          selectedMinors: (selectedMinors || []).map(m => m.id),
          graduationYear: String(year),
          classYear: classYearLocal,
          isHonors: isHonors,
          isAthlete: isAthlete,
          privacyPolicyVersion: POLICY_VERSION,
          termsVersion: TERMS_VERSION,
        },
        quiz: quizResults
          ? {
              scores: quizResults.scores,
              code: quizResults.code,
              profileName: quizResults.profileName,
              answers: quizResults.answers,
              schedulingPrefs: quizResults.schedulingPrefs || {},
            }
          : null,
        courseCodes: (selectedCourses || []).map((course) => course.code),
      };
      const saved = await saveSignupData(firebaseUser.uid, signupData, SIGNUP_SAVE_API);
      if (!saved.ok) {
        await storePendingSignup(AsyncStorage, firebaseUser.uid, saved.remaining).catch(() => {});
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
      clearDraft(AsyncStorage);
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
          <View style={s.headerSide}>
            <StepCounter route="AccountSetup" />
          </View>
        </View>
        <View style={s.pageTitleBadge}>
          <Text accessibilityRole="header" style={s.pageTitle}>Create Account</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.label}>Expected Graduation Date</Text>
          <View style={[s.pickerWrapper, fieldErrors.year && s.pickerError]}>
            <Picker
              selectedValue={year}
              style={s.picker}
              accessibilityLabel="Expected graduation year"
              onValueChange={(itemValue) => setYear(itemValue)}
            >
              <Picker.Item label="Select year..." value="" />
              {Array.from({ length: 10 }, (_, i) => currentYear + i).map((y) => (
                <Picker.Item key={y} label={`${y}`} value={y} />
              ))}
              <Picker.Item label={`${currentYear + 10}+`} value={`${currentYear + 10}+`} />
            </Picker>
          </View>
          <FieldFoot error={fieldErrors.year} />
          <Text style={s.label}>Current Class Year</Text>
          <View style={[s.pickerWrapper, fieldErrors.classYear && s.pickerError]}>
            <Picker
              selectedValue={classYearLocal}
              style={s.picker}
              accessibilityLabel="Class year"
              onValueChange={(itemValue) => setClassYearLocal(itemValue)}
            >
              <Picker.Item label="Select class year..." value="" />
              {CLASS_YEARS.map((cy) => (
                <Picker.Item key={cy} label={cy} value={cy} />
              ))}
            </Picker>
          </View>
          <FieldFoot error={fieldErrors.classYear} />
          <View style={s.toggleCard}>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Honors student?</Text>
              <Switch
                accessibilityLabel="Honors student"
                value={isHonors}
                onValueChange={setIsHonorsLocal}
                trackColor={{ false: '#B0B0B0', true: MAROON }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Student-athlete?</Text>
              <Switch
                accessibilityLabel="Student-athlete"
                value={isAthlete}
                onValueChange={setIsAthleteLocal}
                trackColor={{ false: '#B0B0B0', true: MAROON }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={s.toggleHint}>Honors and athletes get registration priority. This tunes course warnings</Text>
          </View>
          <View style={s.labelBadge}>
            <Text style={s.label}>Pick an email and password</Text>
          </View>
          <TextField
            label="Email"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            style={s.fieldOnCard}
          />
          <View style={{ height: 15 }} />
          <TextField
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
            error={fieldErrors.password}
            hint={`At least ${MIN_PASSWORD} characters`}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules={`minlength: ${MIN_PASSWORD};`}
            returnKeyType="done"
            style={s.fieldOnCard}
          />
          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{ color: MAROON, marginTop: 10, fontFamily: FONT, fontSize: 16, textAlign: 'center' }}
            >
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>
        </KeyboardAvoidingView>
        <View style={s.stickyBottom}>
            <TouchableOpacity
              style={s.consentRow}
              onPress={() => setTermsVisible(true)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              accessibilityLabel="Read and agree to the Terms of Service"
            >
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color={MAROON}
              />
              <Text style={s.consentText}>
                I have read and agree to the{' '}
                <Text style={s.consentLink}>Terms of Service</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.consentRow}
              onPress={() => setPolicyVisible(true)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: policyAccepted }}
              accessibilityLabel="Read and agree to the Privacy Policy"
            >
              <Ionicons
                name={policyAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color={MAROON}
              />
              <Text style={s.consentText}>
                I have read and agree to the{' '}
                <Text style={s.consentLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
            {fieldErrors.consent ? (
              <Text style={s.fieldError} accessibilityRole="alert">{fieldErrors.consent}</Text>
            ) : null}
            <TouchableOpacity
              style={[s.nextButton, loading && s.nextButtonDisabled]}
              onPress={handleNextButtonPress}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Next"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              <Text style={s.nextButtonText}>{loading ? '...' : 'Next'}</Text>
            </TouchableOpacity>
        </View>
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
    backgroundColor: MAROON,
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
    fontFamily: FONT_SEMI,
    fontSize: 15,
    color: MAROON,
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
    fontFamily: FONT,
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
    fontFamily: FONT,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerError: { borderColor: DANGER.fg },
  // The 50 pt that used to sit under each picker, now holding its error.
  fieldFoot: { width: 275, minHeight: 50, paddingTop: 6 },
  // Errors sit on white: the page background is a photo.
  fieldError: {
    alignSelf: 'flex-start', fontSize: 14, color: DANGER.fg, backgroundColor: '#FFFFFF',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', marginBottom: 6,
  },
  // Email/password fields on a white card for the same reason.
  fieldOnCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, width: 295 },
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
    fontFamily: FONT,
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
    fontFamily: FONT,
    fontSize: 16,
    color: 'black',
    marginLeft: 8,
  },
  consentLink: {
    textDecorationLine: 'underline',
    color: MAROON,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButton: {
    backgroundColor: MAROON,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    width: 128,
    height: 53,
  },
  nextButtonText: {
    fontFamily: FONT,
    fontSize: 19,
    color: 'white',
  },
});

export default AccountSetup;
