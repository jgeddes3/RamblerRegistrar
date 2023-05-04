// LoginPage.js
import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import BackgroundImage from './styleComponents/BackgroundImage';
import LogoImage from './styleComponents/LogoImage1';
import CustomButton from './styleComponents/customButton1';
import SearchBar from './styleComponents/SearchBar';
import TitleText1 from './styleComponents/TitleTextP1';

const LoginPage = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate to the Home screen (Page 6)
    navigation.navigate('Home');
  };

  const handleSignup = () => {
    // Navigate to the Sign Up screen (Page 2)
    navigation.navigate('PageTwo');
  };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <LogoImage source={require('./assets/Icons/Logo-02.png')} />
      <SearchBar
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ top: 354 }}
      />
      <TitleText1 style={{ position: 'absolute', top: 282 }}>Rambler Registrar</TitleText1>
      <SearchBar
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        style={{ top: 400 }}
      />
      <CustomButton
        onPress={handleLogin}
        style={{ position: 'absolute', top: 465, left: 84 }}
      >
        Login
      </CustomButton>
      <CustomButton
        onPress={handleSignup}
        style={{ position: 'absolute', top: 465, left: 219 }}
      >
        Sign up
      </CustomButton>
    </BackgroundImage>
  );
};

export default LoginPage;
