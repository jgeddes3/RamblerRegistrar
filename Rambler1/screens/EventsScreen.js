// screens/EventsScreen.js — Campus events (Localist, via campus-api).
// Upcoming events (next 14 days) as cards: maroon date badge, title, time,
// location. Tapping a card opens the event page (when it has a URL).
// No back button / no giant header here: the More stack header owns the title.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEvents } from '../campus-api';
import { BG } from '../theme';

const MAROON = '#A30046';
const DAYS_AHEAD = 14;

// ---------------------------------------------------------------- formatting

function parseStart(ev) {
  if (!ev?.start) return null;
  const d = new Date(ev.start);
  return Number.isNaN(d.getTime()) ? null : d;
}

function badgeParts(ev) {
  const d = parseStart(ev);
  if (!d) return { month: 'TBA', day: '—' };
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function timeText(ev) {
  if (ev.allDay) return 'All day';
  const start = parseStart(ev);
  if (!start) return 'Time TBA';
  const fmt = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  let out = `${start.toLocaleDateString(undefined, { weekday: 'short' })} · ${fmt(start)}`;
  const end = ev.end ? new Date(ev.end) : null;
  if (end && !Number.isNaN(end.getTime())) out += ` – ${fmt(end)}`;
  return out;
}

// ------------------------------------------------------------------- pieces

const EventCard = ({ event, onPress }) => {
  const { month, day } = badgeParts(event);
  const hasUrl = !!event.url;
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      disabled={!hasUrl}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      <View style={s.badge}>
        <Text style={s.badgeMonth}>{month}</Text>
        <Text style={s.badgeDay}>{day}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{event.title || 'Untitled event'}</Text>
        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={13} color="#888" />
          <Text style={s.metaText} numberOfLines={1}>{timeText(event)}</Text>
        </View>
        {event.location ? (
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={13} color="#888" />
            <Text style={s.metaText} numberOfLines={1}>{event.location}</Text>
          </View>
        ) : null}
      </View>
      {hasUrl ? <Ionicons name="chevron-forward" size={18} color="#CCC" /> : null}
    </TouchableOpacity>
  );
};

// -------------------------------------------------------------------- screen

const EventsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState(null); // null = not loaded / failed, [] = empty

  const load = useCallback(async () => {
    // campus-api never throws (contract: null/[] on failure), but stay defensive.
    let list = null;
    try {
      list = await getEvents(DAYS_AHEAD);
    } catch (e) { /* keep null */ }
    setEvents(Array.isArray(list) ? list : null);
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

  const openEvent = useCallback((event) => {
    if (!event?.url) return; // guard missing url
    Linking.openURL(event.url).catch(() => {});
  }, []);

  // Sort by start time ascending; undated events sink to the bottom.
  const sorted = useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => {
      const ta = parseStart(a)?.getTime() ?? Infinity;
      const tb = parseStart(b)?.getTime() ?? Infinity;
      return ta - tb;
    });
  }, [events]);

  if (loading) {
    return (
      <View style={s.centerWrap}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={s.loadingText}>Loading campus events...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={s.container}
      data={sorted}
      keyExtractor={(item, index) => item.instanceKey ?? String(item.id ?? index)}
      renderItem={({ item }) => <EventCard event={item} onPress={() => openEvent(item)} />}
      contentContainerStyle={sorted.length === 0 ? s.emptyContainer : s.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} colors={[MAROON]} />
      }
      ListHeaderComponent={
        sorted.length > 0 ? <Text style={s.sectionTitle}>Next {DAYS_AHEAD} days</Text> : null
      }
      ListEmptyComponent={
        <View style={s.centerWrap}>
          <Ionicons name="calendar-outline" size={40} color="#DDD" />
          <Text style={s.emptyTitle}>
            {events === null ? 'Events unavailable right now' : 'No upcoming events'}
          </Text>
          <Text style={s.emptyHint}>Pull down to try again.</Text>
        </View>
      }
    />
  );
};

// -------------------------------------------------------------------- styles

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1 },
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: BG, paddingHorizontal: 24,
  },
  loadingText: { fontFamily: 'CormorantGaramond-Regular', fontSize: 16, color: '#999', marginTop: 12 },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 22, color: '#999',
    textAlign: 'center', marginTop: 10,
  },
  emptyHint: { fontFamily: 'CormorantGaramond-Regular', fontSize: 15, color: '#CCC', marginTop: 6, textAlign: 'center' },

  sectionTitle: { fontFamily: 'CormorantGaramond-Regular', fontSize: 24, color: MAROON, marginBottom: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  badge: {
    width: 48, height: 52, borderRadius: 10, backgroundColor: MAROON,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeMonth: { color: '#FFFFFF', fontFamily: 'CormorantGaramond-Regular', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  badgeDay: { color: '#FFFFFF', fontFamily: 'CormorantGaramond-Regular', fontSize: 20, fontWeight: 'bold', marginTop: -1 },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: 'CormorantGaramond-Regular', fontSize: 18, color: '#333' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { flex: 1, fontFamily: 'CormorantGaramond-Regular', fontSize: 12, color: '#777' },
});

export default EventsScreen;
