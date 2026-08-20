// screens/MapScreen.js — WEB fallback for the campus map.
//
// react-native-maps has no web implementation, and a runtime Platform.OS
// guard around require('react-native-maps') is NOT safe: babel-preset-expo
// only inlines Platform.OS in production builds, so dev-mode web bundling
// (`expo start --web`) would still resolve the native-only module and fail
// the ENTIRE web bundle. Instead we use Metro platform extensions:
//   - MapScreen.native.js  -> real map (iOS/Android), imports react-native-maps
//   - MapScreen.js (this)  -> web placeholder, never mentions react-native-maps
// Metro resolves .native.js first on native platforms, so web (dev AND prod)
// never sees the react-native-maps dependency edge.
//
// Navigation: default-exports the screen only — NO back button here (the More
// stack navigator owns headers/back).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BG } from '../theme';

const MAROON = '#A30046';

const MapScreen = () => (
  <View style={s.centerWrap}>
    <Text style={s.title}>Campus Map</Text>
    <Ionicons name="map-outline" size={54} color="#CCC" style={{ marginTop: 18 }} />
    <Text style={s.emptyTitle}>The campus map is available in the mobile app</Text>
    <Text style={s.emptyHint}>Open Rambler Registrar on your phone to explore campus.</Text>
  </View>
);

const s = StyleSheet.create({
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: BG, paddingHorizontal: 24,
  },
  title: { fontFamily: 'CormorantGaramond-Regular', fontSize: 28, color: MAROON },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 22, color: '#999',
    textAlign: 'center', marginTop: 14,
  },
  emptyHint: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 15, color: '#CCC',
    marginTop: 6, textAlign: 'center',
  },
});

export default MapScreen;
