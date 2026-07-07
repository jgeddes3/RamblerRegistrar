// push.js — Expo push notification registration for seat alerts.
//
// GRACEFUL DEGRADATION IS THE CONTRACT. Every export resolves to null / no-ops
// instead of throwing, because push is unavailable in several normal setups:
//   - web                    -> null (remote push not wired up for web)
//   - simulators/emulators   -> null (Device.isDevice is false)
//   - permission denied      -> null
//   - no EAS projectId yet   -> null + console hint (user runs `eas init` later;
//                               remote push also does not work in Expo Go on
//                               SDK 53+, so this is the Expo Go path too)
// The static import of expo-notifications is safe on web (the package ships
// web stubs); we additionally never CALL its APIs on web (Platform.OS guard).

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { saveUserProfile } from './firestore-data';

// Show notifications as banners even while the app is foregrounded (the OS
// default is to silently swallow them). Call ONCE at app startup.
// shouldShowBanner/shouldShowList are the SDK 54 names; shouldShowAlert kept
// for older runtime compatibility.
export function setupNotificationHandler() {
  if (Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    // Never let notification plumbing break app startup.
    console.log('[push] notification handler setup skipped:', error.message || String(error));
  }
}

// Full registration chain -> Expo push token string, or null when any link is
// unavailable. Never throws.
export async function registerForPushNotifications() {
  if (Platform.OS === 'web') return null;
  try {
    // Simulators/emulators cannot receive remote push.
    if (!Device.isDevice) return null;

    // Android: the channel must exist for alerts to heads-up display. Safe to
    // call repeatedly (idempotent) and before permissions are granted.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('seat-alerts', {
        name: 'Seat alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#A30046',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    // Remote push token requires an EAS projectId (app.json extra.eas.projectId,
    // minted by `eas init`). This app does not have one yet — degrade quietly.
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('[push] no EAS projectId yet — run eas init');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse && tokenResponse.data;
    return typeof token === 'string' && token ? token : null;
  } catch (error) {
    console.log('[push] registration skipped:', error.message || String(error));
    return null;
  }
}

// Register and persist the token onto users/{uid}.expoPushToken via
// saveUserProfile (include-when-provided semantics — the token field is only
// written when a real token string exists, so the null paths above write
// nothing). Fire-and-forget safe: resolves to the token string or null.
export async function registerAndSaveToken(uid) {
  try {
    if (!uid) return null;
    const token = await registerForPushNotifications();
    if (!token) return null;
    // saveUserProfile resolves to null (not a throw) on failure — surface that
    // as null so callers can't mistake an unsaved token for a successful save.
    const saved = await saveUserProfile(uid, { expoPushToken: token });
    if (!saved) return null;
    return token;
  } catch (error) {
    console.log('[push] token save skipped:', error.message || String(error));
    return null;
  }
}
