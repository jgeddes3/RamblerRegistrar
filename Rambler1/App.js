// App.js
import React, { useEffect, useState } from 'react';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginPage from './LoginPage';
import PageTwo from './PageTwo';
import PageSix from './PageSix';
import PageThree from './PageThree';
import PageFive from './PageFive';
import setupDatabase from './dbSetup';
import PageFour from './PageFour';

const Stack = createStackNavigator();

const App = () => {
  const [fontsLoaded] = useFonts({
    'CormorantGaramond-Regular': require('./assets/Fonts/CormorantGaramond-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Home" component={PageSix} />
        <Stack.Screen name="PageTwo" component={PageTwo} />
        <Stack.Screen name="PageThree" component={PageThree} />
        <Stack.Screen name="PageFour" component={PageFour} />
        <Stack.Screen name="PageFive" component={PageFive} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
