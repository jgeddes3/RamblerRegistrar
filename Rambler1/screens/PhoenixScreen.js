// screens/PhoenixScreen.js — Loyola Phoenix headlines (the student newspaper,
// via campus-api's RSS fetcher). Recent stories as cards: maroon date badge,
// headline, section/author. Tapping opens the in-app preview (first paragraph
// plus a read-the-full-article button that leaves for the browser).
// No back button / no giant header here: the More stack header owns the title.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPhoenixHeadlines } from '../campus-api';
import PhoenixPreviewModal from '../components/PhoenixPreviewModal';

const MAROON = '#A30046';

// ---------------------------------------------------------------- formatting

function parseDate(item) {
  if (!item?.publishedAt) return null;
  const d = new Date(item.publishedAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function badgeParts(item) {
  const d = parseDate(item);
  if (!d) return { month: 'NEW', day: '—' };
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function metaText(item) {
  const parts = [];
  if (item.categories && item.categories.length > 0) parts.push(item.categories[0]);
  if (item.creator) parts.push(item.creator);
  return parts.join(' · ');
}

// ------------------------------------------------------------------- pieces

const HeadlineCard = ({ item, onPress }) => {
  const { month, day } = badgeParts(item);
  const meta = metaText(item);
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Preview ${item.title}`}
    >
      <View style={s.badge}>
        <Text style={s.badgeMonth}>{month}</Text>
        <Text style={s.badgeDay}>{day}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={3}>{item.title}</Text>
        {meta ? (
          <View style={s.metaRow}>
            <Ionicons name="newspaper-outline" size={13} color="#888" />
            <Text style={s.metaText} numberOfLines={1}>{meta}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );
};

// -------------------------------------------------------------------- screen

const PhoenixScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState(null); // null = not loaded / failed, [] = empty
  const [preview, setPreview] = useState(null); // story shown in the preview modal

  const load = useCallback(async () => {
    // campus-api never throws (contract: [] on failure), but stay defensive.
    let list = null;
    try {
      list = await getPhoenixHeadlines();
    } catch (e) { /* keep null */ }
    setItems(Array.isArray(list) && list.length > 0 ? list : null);
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

  if (loading) {
    return (
      <View style={s.centerWrap}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={s.loadingText}>Loading headlines...</Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
      style={s.container}
      data={items || []}
      keyExtractor={(item, index) => item.link ?? String(index)}
      renderItem={({ item }) => <HeadlineCard item={item} onPress={() => setPreview(item)} />}
      contentContainerStyle={items ? s.content : s.emptyContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MAROON} colors={[MAROON]} />
      }
      ListHeaderComponent={
        items ? <Text style={s.sectionTitle}>Latest from the Phoenix</Text> : null
      }
      ListEmptyComponent={
        <View style={s.centerWrap}>
          <Ionicons name="newspaper-outline" size={40} color="#DDD" />
          <Text style={s.emptyTitle}>Headlines unavailable right now</Text>
          <Text style={s.emptyHint}>Pull down to try again.</Text>
        </View>
      }
    />
    <PhoenixPreviewModal
      item={preview}
      visible={preview != null}
      onClose={() => setPreview(null)}
    />
    </>
  );
};

// -------------------------------------------------------------------- styles

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9F4' },
  content: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1 },
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FBF9F4', paddingHorizontal: 24,
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

export default PhoenixScreen;
