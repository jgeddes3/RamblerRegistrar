import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDraft, resumeRoutes, clearDraft } from './onboarding';
import { signIn } from './auth';
import { useAppContext } from './AppContext';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import { TERMS_TITLE, TERMS_SECTIONS } from './terms-content';
import BackgroundImage from './styleComponents/BackgroundImage';
import LogoImage from './styleComponents/LogoImage1';
import CustomButton from './styleComponents/customButton1';
import TextField from './components/ui/TextField';
import TitleText1 from './styleComponents/TitleTextP1';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const passwordRef = useRef(null);
  const { setSelectedProgram, setSelectedProgram2, setSelectedMinors, setSelectedCourses, setQuizResults } = useAppContext();

  // A sign-up left part-way (the app was closed): offer to pick it up.
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    let alive = true;
    loadDraft(AsyncStorage).then((d) => {
      if (alive && d && resumeRoutes(d.step)) setDraft(d);
    });
    return () => { alive = false; };
  }, []);

  const continueSignup = () => {
    if (!draft) return;
    const restore = [
      ['selectedProgram', setSelectedProgram], ['selectedProgram2', setSelectedProgram2],
      ['selectedMinors', setSelectedMinors], ['selectedCourses', setSelectedCourses],
      ['quizResults', setQuizResults],
    ];
    for (const [key, set] of restore) if (key in draft && set) set(draft[key]);
    const routes = resumeRoutes(draft.step);
    navigation.reset({ index: routes.length - 1, routes });
  };

  // Shown under the fields and read out at once (the field the user is in
  // may be far from where the message appears).
  const fail = (message) => {
    setErrorMessage(message);
    AccessibilityInfo.announceForAccessibility?.(message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      fail('Please enter email and password');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Firebase auth state change auto-switches to MainTabs
    } catch (error) {
      const code = error.code;
      if (code === 'auth/invalid-email') {
        fail('Invalid email address');
      } else if (code === 'auth/user-not-found') {
        fail('No account found with this email');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        fail('Incorrect password');
      } else if (code === 'auth/too-many-requests') {
        fail('Too many attempts. Try again later');
      } else {
        fail('Login failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    // A fresh sign-up: an older half-finished one would otherwise refill it.
    clearDraft(AsyncStorage);
    setDraft(null);
    navigation.navigate('ProgramSelect');
  };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LogoImage source={require('./assets/Icons/Logo-02.png')} />
        <TitleText1>Rambler Registrar</TitleText1>
        <TextField
          label="Email"
          style={{ marginBottom: 15 }}
          value={email}
          onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
          secureTextEntry={true}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />
        {errorMessage ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={{ color: '#A30046', marginTop: 10, fontFamily: 'CormorantGaramond-Regular', fontSize: 16 }}
          >
            {errorMessage}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
            width: 220,
          }}
        >
          <CustomButton onPress={handleLogin} style={{ width: 100, height: 50 }}>
            {loading ? '...' : 'Login'}
          </CustomButton>
          <CustomButton onPress={handleSignup} style={{ width: 100, height: 50 }}>
            Sign up
          </CustomButton>
        </View>
        {draft ? (
          <TouchableOpacity
            onPress={continueSignup}
            accessibilityRole="button"
            accessibilityLabel="Continue setting up your account"
            style={{
              marginTop: 16, minHeight: 44, justifyContent: 'center', paddingHorizontal: 18,
              backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#A30046',
            }}
          >
            <Text style={{ color: '#A30046', fontSize: 15, fontWeight: '600' }}>
              Continue setting up your account
            </Text>
          </TouchableOpacity>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 22, marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => setTermsVisible(true)}
            accessibilityLabel="Read the Terms of Service"
          >
            <Text
              style={{
                fontFamily: 'CormorantGaramond-Regular',
                fontSize: 15,
                color: 'black',
                textDecorationLine: 'underline',
              }}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPolicyVisible(true)}
            accessibilityLabel="Read the Privacy Policy"
          >
            <Text
              style={{
                fontFamily: 'CormorantGaramond-Regular',
                fontSize: 15,
                color: 'black',
                textDecorationLine: 'underline',
              }}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <PrivacyPolicyModal
        visible={policyVisible}
        mode="view"
        onClose={() => setPolicyVisible(false)}
      />
      <PrivacyPolicyModal
        visible={termsVisible}
        mode="view"
        title={TERMS_TITLE}
        sections={TERMS_SECTIONS}
        onClose={() => setTermsVisible(false)}
      />
    </BackgroundImage>
  );
};

export default Login;
