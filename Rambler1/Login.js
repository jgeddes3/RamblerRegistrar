import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { signIn } from './auth';
import { useAppContext } from './AppContext';
import BackgroundImage from './styleComponents/BackgroundImage';
import LogoImage from './styleComponents/LogoImage1';
import CustomButton from './styleComponents/customButton1';
import SearchBar from './styleComponents/SearchBar';
import TitleText1 from './styleComponents/TitleTextP1';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
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
        setErrorMessage('Invalid email address');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect password');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many attempts. Try again later');
      } else {
        setErrorMessage('Login failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('ProgramSelect');
  };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LogoImage source={require('./assets/Icons/Logo-02.png')} />
        <TitleText1>Rambler Registrar</TitleText1>
        <View style={{ marginBottom: 15 }}>
          <SearchBar
            placeholder="Email"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <SearchBar
          placeholder="Password"
          value={password}
          onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
          secureTextEntry={true}
        />
        {errorMessage ? (
          <Text style={{ color: '#A30046', marginTop: 10, fontFamily: 'CormorantGaramond-Regular', fontSize: 16 }}>
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
      </View>
    </BackgroundImage>
  );
};

export default Login;
