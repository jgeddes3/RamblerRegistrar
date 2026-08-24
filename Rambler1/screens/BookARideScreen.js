// screens/BookARideScreen.js — dedicated "Book a Ride" page (user request
// 2026-07-09). Everything Loyola offers for getting around, bookable in two
// taps: 8-RIDE (evening safety rides) and the intercampus shuttle.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, FONT_MED, FONT_ITALIC, MAROON, PARCHMENT, INK, STONE, CARD, EYEBROW } from '../theme';

const RIDE_PHONE = '773-508-7433';
const open = (url) => Linking.openURL(url).catch(() => {});

const BookARideScreen = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    {/* ------------------------------ 8-RIDE ------------------------------- */}
    <Text style={s.eyebrow}>Evening safety rides</Text>
    <View style={s.card}>
      <View style={s.cardTitleRow}>
        <Ionicons name="bus-outline" size={18} color={MAROON} />
        <Text style={s.cardTitle}>8-RIDE</Text>
      </View>
      <Text style={s.cardBody}>
        Free evening rides for Loyola students around the Lake Shore Campus and
        Rogers Park: to the library, the grocery store, or home after a late
        class.
      </Text>
      <View style={s.factRow}>
        <Ionicons name="time-outline" size={14} color={STONE} />
        <Text style={s.factText}>6:30 PM – 2:30 AM, seven days a week while school is in session</Text>
      </View>
      <View style={s.factRow}>
        <Ionicons name="location-outline" size={14} color={STONE} />
        <Text style={s.factText}>Campus and nearby Rogers Park; bring your Loyola ID</Text>
      </View>
      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => open('https://luc.tripshot.com')}
          accessibilityLabel="Book an 8-RIDE in TripShot"
        >
          <Ionicons name="open-outline" size={14} color="#FFFFFF" />
          <Text style={s.btnPrimaryText}>Book a ride</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => open(`tel:${RIDE_PHONE.replace(/-/g, '')}`)}
          accessibilityLabel="Call 8-RIDE"
        >
          <Ionicons name="call-outline" size={14} color={MAROON} />
          <Text style={s.btnSecondaryText}>{RIDE_PHONE}</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.hint}>
        Booking opens TripShot. Sign in with your Loyola account; the TripShot
        app also shows your driver's live location.
      </Text>
    </View>

    {/* ------------------------- Intercampus shuttle ----------------------- */}
    <Text style={s.eyebrow}>Between campuses</Text>
    <View style={s.card}>
      <View style={s.cardTitleRow}>
        <Ionicons name="swap-horizontal-outline" size={18} color={MAROON} />
        <Text style={s.cardTitle}>Intercampus Shuttle</Text>
      </View>
      <Text style={s.cardBody}>
        A continuous loop between Lake Shore and Water Tower, free with your
        Campus Card. No booking needed; just be at the stop.
      </Text>
      <View style={s.factRow}>
        <Ionicons name="time-outline" size={14} color={STONE} />
        <Text style={s.factText}>Weekdays about 7:00 AM – 12:10 AM, every 20–30 minutes</Text>
      </View>
      <View style={s.factRow}>
        <Ionicons name="location-outline" size={14} color={STONE} />
        <Text style={s.factText}>LSC: south end of the West Quad · WTC: Corboy Law Center</Text>
      </View>
      <View style={s.factRow}>
        <Ionicons name="alert-circle-outline" size={14} color={STONE} />
        <Text style={s.factText}>Budget about an hour door-to-door between classes on different campuses</Text>
      </View>
      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => open('https://luc.tripshot.com')}
          accessibilityLabel="Track the shuttle in TripShot"
        >
          <Ionicons name="navigate-outline" size={14} color={MAROON} />
          <Text style={s.btnSecondaryText}>Track it live</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => open('https://www.luc.edu/campustransportation/services/intercampusshuttle/')}
          accessibilityLabel="Open the shuttle schedule"
        >
          <Ionicons name="open-outline" size={14} color={MAROON} />
          <Text style={s.btnSecondaryText}>Full schedule</Text>
        </TouchableOpacity>
      </View>
    </View>

    <Text style={s.footer}>
      Service details come from Loyola Campus Transportation and can change
      around breaks and holidays.
    </Text>
  </ScrollView>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PARCHMENT },
  content: { padding: 16, paddingBottom: 32 },
  eyebrow: { ...EYEBROW, marginTop: 8, marginBottom: 8 },
  card: { ...CARD, padding: 14, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: FONT_MED, fontSize: 22, color: INK },
  cardBody: { fontFamily: FONT, fontSize: 15, color: '#555', marginTop: 6, lineHeight: 21 },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  factText: { flex: 1, fontFamily: FONT, fontSize: 14, color: STONE, lineHeight: 19 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: MAROON, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
  },
  btnPrimaryText: { fontFamily: FONT_MED, fontSize: 15, color: '#FFFFFF' },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: MAROON, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
  },
  btnSecondaryText: { fontFamily: FONT_MED, fontSize: 14, color: MAROON },
  hint: { fontFamily: FONT_ITALIC, fontSize: 13, color: '#999', marginTop: 9 },
  footer: { fontFamily: FONT_ITALIC, fontSize: 13, color: '#B3ABA1', textAlign: 'center', marginTop: 4 },
});

export default BookARideScreen;
