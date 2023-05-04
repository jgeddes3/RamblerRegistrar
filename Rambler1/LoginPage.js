// LoginPage.js
import React, { useState } from 'react';
import { View } from 'react-native';
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
        <TitleText1>Rambler Registrar</TitleText1>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 100,
        }}
      >
        <SearchBar
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{ marginTop: 20 }}
        />
        <SearchBar
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          style={{ marginTop: 20 }}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
            width: 220,
          }}
        >
          <CustomButton onPress={handleLogin} style={{ width: 100, height: 50 }}>
            Login
          </CustomButton>
          <CustomButton onPress={handleSignup} style={{ width: 100, height: 50 }}>
            Sign up
          </CustomButton>
        </View>
      </View>
    </BackgroundImage>
  );
};

export default LoginPage;
