// App.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppLoading } from 'expo';
import * as Font from 'expo-font';

import LoginPage from './LoginPage';
import PageTwo from './PageTwo';

const Stack = createStackNavigator();

const loadFonts = () => {
  return Font.loadAsync({
    'Cormorant Garamond': require('./assets/Fonts/CormorantGaramond-Regular.ttf'),
  });
};

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  if (!fontsLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setFontsLoaded(true)}
        onError={console.warn}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="PageTwo" component={PageTwo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
