// screens/LibraryScreen.js — Library hours (LibCal, via campus-api).
// Today's hours per location as cards + a compact "This week" day grid.
// No back button / no giant header here: the More stack header owns the title.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLibraryHours, getLibraryHoursWeekly } from '../campus-api';

const MAROON = '#A30046';
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREV = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

// ---------------------------------------------------------------- formatting

// Today's location: { name, hours:[{from,to}], status, note }
function hoursText(loc) {
  const status = String(loc?.status || '').toLowerCase();
  if (status === '24hours') return 'Open 24 hours';
  const spans = (loc?.hours || [])
    .map((h) => (h && h.from && h.to ? `${h.from} – ${h.to}` : null))
    .filter(Boolean);
  if (spans.length > 0) return spans.join(', ');
  if (status === 'closed') return 'Closed';
  return loc?.note || 'Hours not posted';
}

// LibCal's `status` is a day-level flag ('open' = hours are set today), NOT
// "open right now". Use the live `currentlyOpen` flag (times.currently_open),
// treating 24-hour locations as always open.
function isOpenNow(loc) {
  const s = String(loc?.status || '').toLowerCase();
  return s === '24hours' || !!loc?.currentlyOpen;
}

// Weekly grid day entry (LibCal api_hours_grid): { date, times:{status,hours}, rendered }
function weeklyDayText(day) {
  if (!day) return '—';
  if (day.rendered) return day.rendered;
  return hoursText({ status: day.times?.status, hours: day.times?.hours });
}

// ------------------------------------------------------------------- pieces

const TodayCard = ({ loc }) => {
  const open = isOpenNow(loc);
  return (
    <View style={[s.card, { borderLeftColor: open ? '#059669' : '#C9C9C9' }]}>
      <View style={s.cardTop}>
        <Text style={s.cardName} numberOfLines={2}>{loc.name}</Text>
        <View style={[s.statusPill, open ? s.statusOpen : s.statusClosed]}>
          <View style={[s.statusDot, { backgroundColor: open ? '#059669' : '#9CA3AF' }]} />
          <Text style={[s.statusText, { color: open ? '#065F46' : '#6B7280' }]}>
            {open ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
      <View style={s.hoursRow}>
        <Ionicons name="time-outline" size={14} color="#888" style={{ marginTop: 1 }} />
        <Text style={s.hoursText}>{hoursText(loc)}</Text>
      </View>
      {loc.note ? <Text style={s.noteText}>{loc.note}</Text> : null}
    </View>
  );
};

const WeeklyLocation = ({ loc }) => {
  const week = Array.isArray(loc.weeks) ? loc.weeks[0] : null;
  if (!week) return null;
  return (
    <View style={s.weekCard}>
      <Text style={s.weekLocName} numberOfLines={1}>{loc.name}</Text>
      <View style={s.weekGrid}>
        {DAY_ORDER.map((day) => (
          <View key={day} style={s.weekRow}>
            <Text style={s.weekDay}>{DAY_ABBREV[day]}</Text>
            <Text style={s.weekHours} numberOfLines={1}>{weeklyDayText(week[day])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// -------------------------------------------------------------------- screen

const LibraryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [today, setToday] = useState(null);   // { date, locations: [...] } | null
  const [weekly, setWeekly] = useState(null); // raw LibCal grid { locations: [...] } | null

  const load = useCallback(async () => {
    // campus-api never throws (contract: null/[] on failure), but stay defensive.
    let t = null;
    let w = null;
    try {
      [t, w] = await Promise.all([getLibraryHours(), getLibraryHoursWeekly()]);
    } catch (e) { /* keep nulls */ }
    setToday(t || null);
    setWeekly(w || null);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const todayLocations = today?.locations || [];
  const weeklyLocations = (weekly?.locations || []).filter(
    (loc) => loc && Array.isArray(loc.weeks) && loc.weeks.length > 0
  );
  const nothing = todayLocations.length === 0 && weeklyLocations.length === 0;

  if (loading) {
    return (
      <View style={s.centerWrap}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={s.loadingText}>Loading library hours...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={nothing ? s.emptyContainer : s.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} colors={[MAROON]} />
      }
    >
      {nothing ? (
        <View style={s.centerWrap}>
          <Ionicons name="library-outline" size={40} color="#DDD" />
          <Text style={s.emptyTitle}>Hours unavailable right now</Text>
          <Text style={s.emptyHint}>Pull down to try again.</Text>
        </View>
      ) : (
        <>
          {todayLocations.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Today</Text>
              {todayLocations.map((loc) => (
                <TodayCard key={String(loc.id ?? loc.name)} loc={loc} />
              ))}
            </>
          )}

          {weeklyLocations.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 18 }]}>This week</Text>
              {weeklyLocations.map((loc) => (
                <WeeklyLocation key={String(loc.lid ?? loc.name)} loc={loc} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

// -------------------------------------------------------------------- styles

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1 },
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 24,
  },
  loadingText: { fontFamily: 'CormorantGaramond-Regular', fontSize: 16, color: '#999', marginTop: 12 },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 22, color: '#999',
    textAlign: 'center', marginTop: 10,
  },
  emptyHint: { fontFamily: 'CormorantGaramond-Regular', fontSize: 15, color: '#CCC', marginTop: 6, textAlign: 'center' },

  sectionTitle: { fontFamily: 'CormorantGaramond-Regular', fontSize: 24, color: MAROON, marginBottom: 8 },

  // Today card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0', borderLeftWidth: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardName: { flex: 1, fontFamily: 'CormorantGaramond-Regular', fontSize: 19, color: '#333' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingVertical: 2, paddingHorizontal: 9,
  },
  statusOpen: { backgroundColor: '#d1fae5' },
  statusClosed: { backgroundColor: '#F3F4F6' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  hoursRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  hoursText: { flex: 1, fontSize: 13, color: '#555' },
  noteText: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },

  // Weekly grid
  weekCard: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  weekLocName: { fontFamily: 'CormorantGaramond-Regular', fontSize: 18, color: '#333', marginBottom: 6 },
  weekGrid: { gap: 2 },
  weekRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  weekDay: { width: 44, fontSize: 12, fontWeight: '600', color: MAROON },
  weekHours: { flex: 1, fontSize: 12, color: '#555', textAlign: 'right' },
});

export default LibraryScreen;
