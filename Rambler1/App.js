// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { initDatabase } from './Database';
import { ensureAnonymousSignIn } from './auth';
import { setupNotificationHandler, registerAndSaveToken } from './push';
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
import QuizResults from './screens/QuizResults';
import SchedulingPrefs from './screens/SchedulingPrefs';

// Main tab screens
import Home from './Home';
import ScheduleScreen from './screens/ScheduleScreen';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import MoreScreen from './screens/MoreScreen';
import MapScreen from './screens/MapScreen';
import LibraryScreen from './screens/LibraryScreen';
import EventsScreen from './screens/EventsScreen';

SplashScreen.preventAutoHideAsync();

// Foreground notification display — once, at module init (no-op on web,
// never throws; see push.js).
setupNotificationHandler();

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
    <Stack.Screen name="QuizResults" component={QuizResults} />
    <Stack.Screen name="SchedulingPrefs" component={SchedulingPrefs} />
    <Stack.Screen name="AccountSetup" component={AccountSetup} />
  </Stack.Navigator>
);

// =============================================================================
// TAB ICON — Ionicons, focused/unfocused variants
// =============================================================================
const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Schedule: { focused: 'calendar', unfocused: 'calendar-outline' },
  Search: { focused: 'search', unfocused: 'search-outline' },
  Progress: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  More: { focused: 'ellipsis-horizontal', unfocused: 'ellipsis-horizontal-outline' },
};

const TabIcon = ({ label, focused }) => {
  const icons = TAB_ICONS[label] || { focused: 'apps', unfocused: 'apps-outline' };
  return (
    <Ionicons
      name={focused ? icons.focused : icons.unfocused}
      size={22}
      color={focused ? '#A30046' : '#8e8e93'}
    />
  );
};

// =============================================================================
// MORE STACK — Hub screen + campus sub-screens (Map / Library / Events)
// =============================================================================
const MoreStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: '#A30046',
      headerTitleStyle: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 22,
        color: '#A30046',
      },
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerBackTitleVisible: false,
      cardStyle: { backgroundColor: '#FFFFFF' },
    }}
  >
    <Stack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Campus Map' }} />
    <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'Library Hours' }} />
    <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Campus Events' }} />
  </Stack.Navigator>
);

// =============================================================================
// MAIN TABS — Top bar + bottom tab navigation (post-login)
// =============================================================================
const MainTabs = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  // Root navigation object (falls back to the container ref since MainTabs
  // is rendered inside NavigationContainer but outside any screen).
  const navigation = useNavigation();

  const handleMenuNavigate = (tabName, params) => {
    navigation.navigate(tabName, params);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <TopBar
        onMenuPress={() => setMenuVisible(true)}
        onProfilePress={() => setProfileVisible(true)}
      />
      <Tab.Navigator
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
        <Tab.Screen name="More" component={MoreStack} />
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
// PUSH TOKEN GATE — Renders nothing; watches auth via AppContext and, once a
// signed-in NON-anonymous user appears, fire-and-forgets push registration
// (which saves users/{uid}.expoPushToken). registerAndSaveToken never throws
// and resolves null on web/simulator/denied-permission/no-EAS-projectId, so
// this is safe in every environment including Expo Go.
// =============================================================================
const PushTokenGate = () => {
  const { user } = useAppContext();
  const uid = user && !user.isAnonymous ? user.uid : null;

  useEffect(() => {
    if (uid) {
      registerAndSaveToken(uid);
    }
  }, [uid]);

  return null;
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
    // Anonymous sign-in first (Firestore catalog reads require auth — anonymous
    // counts), then init/sync the local sqlite cache. ensureAnonymousSignIn
    // never throws, so an offline launch still boots from the cached catalog.
    ensureAnonymousSignIn()
      .catch(() => {})
      .finally(() => {
        initDatabase()
          .then(() => setDbReady(true))
          .catch((error) => {
            // The sqlite cache is an optimization — Firestore is the source of
            // truth. Never brick the app over it (it also doesn't exist on web).
            console.error('Database init failed (continuing without local cache):', error);
            setDbReady(true);
          });
      });
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
      <PushTokenGate />
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
