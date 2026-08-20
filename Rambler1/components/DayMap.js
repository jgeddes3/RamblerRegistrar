// components/DayMap.js — WEB fallback for the schedule day map (F-Q7).
// react-native-maps can't render in the browser (same platform split as
// MapScreen); the day panel below the map carries all the information, so the
// web build just says so. DayMap.native.js is the real one.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../theme';

const DayMap = () => (
  <View style={s.wrap}>
    <Ionicons name="map-outline" size={28} color="#999" style={{ marginBottom: 4 }} />
    <Text style={s.text}>The map renders in the mobile app.</Text>
  </View>
);

const s = StyleSheet.create({
  wrap: {
    height: 160, borderRadius: 12, backgroundColor: '#F6F6F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  text: { fontFamily: FONT, fontSize: 14, color: '#999' },
});

export default DayMap;
