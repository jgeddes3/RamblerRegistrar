// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { initDatabase } from './Database';
import { AppProvider, useAppContext } from './AppContext';
import TopBar from './components/TopBar';
import MenuOverlay from './components/MenuOverlay';
import ProfileScreen from './screens/ProfileScreen';

// Auth screens
import Login from './Login';
import ProgramSelect from './ProgramSelect';
import CourseSelect from './CourseSelect';
import PreferenceQuiz from './PreferenceQuiz';
import AccountSetup from './AccountSetup';

// Main tab screens
import Home from './Home';
import ScheduleScreen from './screens/ScheduleScreen';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreScreen from './screens/MoreScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// =============================================================================
// AUTH STACK — No top bar, no bottom tabs (onboarding flow)
// =============================================================================
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: false,
      animationEnabled: false,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="ProgramSelect" component={ProgramSelect} />
    <Stack.Screen name="CourseSelect" component={CourseSelect} />
    <Stack.Screen name="PreferenceQuiz" component={PreferenceQuiz} />
    <Stack.Screen name="AccountSetup" component={AccountSetup} />
  </Stack.Navigator>
);

// =============================================================================
// TAB ICON — Simple text-based icons (replace with proper icons later)
// =============================================================================
const TabIcon = ({ label, focused }) => {
  const icons = {
    Home: '  ',
    Schedule: '  ',
    Search: '  ',
    Progress: '  ',
    More: '  ',
  };
  return (
    <Text style={{
      fontSize: focused ? 22 : 20,
      opacity: focused ? 1 : 0.5,
    }}>
      {icons[label] || '  '}
    </Text>
  );
};

// =============================================================================
// MAIN TABS — Top bar + bottom tab navigation (post-login)
// =============================================================================
const MainTabs = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const navigationRef = React.useRef(null);

  const handleMenuNavigate = (tabName) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(tabName);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <TopBar
        onMenuPress={() => setMenuVisible(true)}
        onProfilePress={() => setProfileVisible(true)}
      />
      <Tab.Navigator
        ref={navigationRef}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarActiveTintColor: '#A30046',
          tabBarInactiveTintColor: '#999',
          tabBarLabelStyle: {
            fontFamily: 'CormorantGaramond-Regular',
            fontSize: 14,
            fontWeight: 'bold',
          },
          tabBarItemStyle: {
            paddingBottom: 14,
          },
          tabBarStyle: {
            height: 90,
            paddingTop: 6,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
          },
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Schedule" component={ScheduleScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>

      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
      />
      <ProfileScreen
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </View>
  );
};

// =============================================================================
// ROOT — Switches between Auth and Main based on login state
// =============================================================================
const RootNavigator = () => {
  const { isLoggedIn, authLoading } = useAppContext();

  if (authLoading) return null; // Still checking Firebase auth state

  return isLoggedIn ? <MainTabs /> : <AuthStack />;
};

// =============================================================================
// APP — Font loading, DB init, providers
// =============================================================================
const App = () => {
  const [fontsLoaded] = useFonts({
    'CormorantGaramond-Regular': require('./assets/Fonts/CormorantGaramond-Regular.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((error) => console.error('Database initialization failed:', error));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && dbReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <AppProvider>
      <View style={{ flex: 1, backgroundColor: '#A30046' }} onLayout={onLayoutRootView}>
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: '#A30046',
              background: '#FFFFFF',
              card: '#FFFFFF',
              text: '#000',
              border: '#E0E0E0',
              notification: '#A30046',
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </View>
    </AppProvider>
  );
};

export default App;
