// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginPage from './LoginPage';
import PageTwo from './PageTwo';
import PageSix from './PageSix';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Home" component={PageSix} />
        <Stack.Screen name="PageTwo" component={PageTwo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
