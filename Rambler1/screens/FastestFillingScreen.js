// screens/FastestFillingScreen.js — F-QW1: courses that filled fastest in the
// last registration cycle (empirical fillStats from backend/fill-stats.js).
// Personalized: underclassmen see the standing note that day-1/2 courses were
// gone before their registration window even opened, and signed-in students
// with a declared program get a "For you" split — the fast-filling courses
// that actually touch their remaining requirements, focus area, or plan.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import { fetchFastestFilling, fetchDegreeProgress, fetchPlans } from '../firestore-data';
import { allPlannedCodes, normCode } from '../plan-utils';
import CourseDetailModal from '../CourseDetailModal';
import { FONT, MAROON, EYEBROW } from '../theme';

const CLASS_LABELS = {
  'day1-2': 'Filled in 1–2 days',
  'first-week': 'Filled in the first week',
};

const FastestFillingScreen = () => {
  const {
    classYear, isHonors, isAthlete, user, selectedProgram, selectedFocus,
  } = useAppContext();
  const [courses, setCourses] = useState(null);
  const [relevantCodes, setRelevantCodes] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchFastestFilling().then((rows) => { if (alive) setCourses(rows); });
    return () => { alive = false; };
  }, []);

  // "For you" relevance set: codes from remaining degree requirements, the
  // focus area, and the multi-year plan. Signed-out or undecided students
  // just see the plain ranked list (relevantCodes stays null).
  const signedIn = !!user && !user.isAnonymous;
  const hasProgram = !!selectedProgram && selectedProgram.id !== 'undecided';
  useEffect(() => {
    if (!signedIn || !hasProgram) { setRelevantCodes(null); return undefined; }
    let alive = true;
    (async () => {
      // firestore-data wrappers return null/{} on failure (never throw).
      const [degreeProgress, plans] = await Promise.all([
        fetchDegreeProgress(user.uid, selectedProgram.id),
        fetchPlans(user.uid),
      ]);
      if (!alive) return;
      const codes = new Set();
      for (const row of degreeProgress?.remaining || []) {
        if (!row || row.is_placeholder || !row.code) continue;
        codes.add(normCode(row.code));
      }
      for (const c of selectedFocus?.courses || []) codes.add(normCode(c));
      for (const c of allPlannedCodes(plans)) codes.add(c); // already normalized
      setRelevantCodes(codes);
    })();
    return () => { alive = false; };
  }, [signedIn, hasProgram, user, selectedProgram, selectedFocus]);

  const isUnderclass = /freshman|sophomore/i.test(String(classYear || ''));
  const hasPriority = isHonors === true || isAthlete === true;

  // One virtualized list: section labels are inline items with a type marker,
  // so the personalized split doesn't cost FlatList its recycling.
  const listData = useMemo(() => {
    if (!courses) return [];
    if (relevantCodes && relevantCodes.size > 0) {
      const forYou = courses.filter((c) => relevantCodes.has(normCode(c.code)));
      if (forYou.length > 0) {
        const rest = courses.filter((c) => !relevantCodes.has(normCode(c.code)));
        return [
          { type: 'header', title: 'For you' },
          ...forYou.map((course) => ({ type: 'course', course })),
          { type: 'header', title: 'Everything that fills fast' },
          ...rest.map((course) => ({ type: 'course', course })),
        ];
      }
    }
    return courses.map((course) => ({ type: 'course', course }));
  }, [courses, relevantCodes]);

  if (courses === null) {
    return (
      <View style={s.centerWrap}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={s.loadingText}>Loading fill history...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => (item.type === 'header' ? `header:${item.title}` : item.course.code)}
        ListHeaderComponent={
          <View style={s.headerWrap}>
            <Text style={s.headerText}>
              Ranked by how fast they filled last registration cycle
              (measured from our daily enrollment snapshots).
            </Text>
            {isUnderclass && !hasPriority ? (
              <View style={s.noteBanner}>
                <Ionicons name="flash-outline" size={16} color="#92400E" />
                <Text style={s.noteText}>
                  Day-1/2 courses were full before sophomore registration
                  opened last term — have backups ready for anything here.
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={s.sectionLabel}>{item.title}</Text>;
          }
          const course = item.course;
          const fs = course.fill_stats || {};
          const days = fs.days_to_90;
          return (
            <TouchableOpacity
              style={s.row}
              onPress={() => setDetail(course)}
              accessibilityLabel={`${course.code} fill details`}
            >
              <View style={s.daysBadge}>
                <Text style={s.daysBadgeNum}>{Number.isFinite(days) ? days : '–'}</Text>
                <Text style={s.daysBadgeUnit}>day{days === 1 ? '' : 's'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowCode}>{course.code}</Text>
                <Text style={s.rowName} numberOfLines={1}>{course.name || ''}</Text>
                <Text style={s.rowClass}>{CLASS_LABELS[fs.class] || fs.class || ''}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.centerWrap}>
            <Text style={s.emptyTitle}>No fill history yet</Text>
            <Text style={s.emptyHint}>Fill stats are computed after each registration cycle.</Text>
          </View>
        }
        contentContainerStyle={courses.length === 0 ? { flexGrow: 1 } : { paddingBottom: 30 }}
      />
      {detail ? (
        <CourseDetailModal
          visible={!!detail}
          course={detail}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9F4' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontFamily: FONT, fontSize: 16, color: '#999', marginTop: 12 },
  emptyTitle: { fontFamily: FONT, fontSize: 22, color: '#999', textAlign: 'center' },
  emptyHint: { fontFamily: FONT, fontSize: 15, color: '#CCC', marginTop: 6, textAlign: 'center' },

  headerWrap: { padding: 16, paddingBottom: 8 },
  headerText: { fontFamily: FONT, fontSize: 15, color: '#777', lineHeight: 21 },
  sectionLabel: { ...EYEBROW, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  noteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 10,
  },
  noteText: { flex: 1, fontFamily: FONT, fontSize: 14, color: '#92400E' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  daysBadge: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: '#FBF0F5',
    alignItems: 'center', justifyContent: 'center',
  },
  daysBadgeNum: { fontFamily: FONT, fontSize: 20, fontWeight: '700', color: MAROON },
  daysBadgeUnit: { fontFamily: FONT, fontSize: 11, color: MAROON, marginTop: -3 },
  rowCode: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#333' },
  rowName: { fontFamily: FONT, fontSize: 14, color: '#777' },
  rowClass: { fontFamily: FONT, fontSize: 13, color: '#B45309', marginTop: 1 },
  chevron: { fontFamily: FONT, fontSize: 24, color: '#CCC' },
});

export default FastestFillingScreen;
