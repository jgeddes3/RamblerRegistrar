// components/ScheduleMapModal.js — Schedule "Map" day view (F-Q7).
// Pick a weekday -> see where that day's classes are (numbered pins + home),
// when to LEAVE HOME (and wake up) for the first class, and whether each
// between-class transition is actually doable — same-campus walks can be
// "tight", but LSC->WTC with a 15-minute gap is flagged IMPOSSIBLE (the
// intercampus shuttle needs about 60 minutes door-to-door).
//
// Pure math: commute-utils.js (tested). Map: DayMap (native) / fallback (web).

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform, StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sectionsToBlocks } from '../schedule-utils';
import {
  dayTransitions, homeCommute, matchBuilding, endsInEvening, EVENING_RIDE_PHONE,
  HOME_BUFFER_MINUTES, PREP_MINUTES,
} from '../commute-utils';
import { transitEstimate, getTrainArrivals } from '../cta';
import { formatMinutes } from '../schedule-generator';
import DayMap from './DayMap';
import { FONT, MAROON } from '../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;
const WEEKDAYS = [
  { key: 'Mo', label: 'Mon' }, { key: 'Tu', label: 'Tue' }, { key: 'We', label: 'Wed' },
  { key: 'Th', label: 'Thu' }, { key: 'Fr', label: 'Fri' },
];

const STATUS_STYLE = {
  ok: { text: 'OK', color: '#065f46', bg: '#d1fae5' },
  tight: { text: 'Tight', color: '#92400e', bg: '#fef3c7' },
  impossible: { text: 'Impossible', color: '#b91c1c', bg: '#fee2e2' },
  unknown: { text: '?', color: '#6b7280', bg: '#f3f4f6' },
};

const ScheduleMapModal = ({ visible, onClose, sections, buildings, home }) => {
  const [day, setDay] = useState('Mo');

  const blocks = useMemo(() => sectionsToBlocks(sections || []), [sections]);
  const dayBlocks = useMemo(
    () => blocks.filter((b) => b.day === day).sort((a, b) => a.startMin - b.startMin),
    [blocks, day]
  );
  const transitions = useMemo(() => dayTransitions(dayBlocks, buildings), [dayBlocks, buildings]);
  const commute = useMemo(() => homeCommute(home, dayBlocks, buildings), [home, dayBlocks, buildings]);

  // Home beyond walking range -> Red Line estimate to the first class.
  const transit = useMemo(() => {
    if (!commute || commute.mode !== 'far') return null;
    const building = matchBuilding(buildings, commute.firstBlock.section?.building);
    return transitEstimate({ home, building });
  }, [commute, home, buildings]);
  const transitLeaveBy = transit ? commute.firstBlock.startMin - transit.totalMin - HOME_BUFFER_MINUTES : null;

  // Live arrivals at the boarding station (empty without a Train Tracker key —
  // getTrainArrivals resolves [] on no-key and on any failure).
  const [arrivals, setArrivals] = useState([]);
  const fromMapId = transit && transit.rideMin > 0 ? transit.fromStation.mapId : null;
  useEffect(() => {
    setArrivals([]);
    if (!visible || !fromMapId) return undefined;
    let alive = true;
    getTrainArrivals(fromMapId)
      .then((rows) => { if (alive) setArrivals(rows); })
      .catch(() => {});
    return () => { alive = false; };
  }, [visible, day, fromMapId]);

  const stops = useMemo(() => {
    const out = [];
    const seen = new Set();
    dayBlocks.forEach((b, i) => {
      const bld = matchBuilding(buildings, b.section?.building);
      if (!bld || !Number.isFinite(bld.latitude)) return;
      const key = `${bld.id}-${b.startMin}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        latitude: bld.latitude,
        longitude: bld.longitude,
        campus: bld.campus || null,
        title: `${i + 1}. ${b.label}`,
        description: `${formatMinutes(b.startMin)} · ${bld.name}`,
      });
    });
    return out;
  }, [dayBlocks, buildings]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Day Map</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Close day map">
            <Text style={s.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Day selector */}
        <View style={s.dayRow}>
          {WEEKDAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[s.dayChip, day === d.key && s.dayChipOn]}
              onPress={() => setDay(d.key)}
              accessibilityLabel={`Show ${d.label}`}
            >
              <Text style={[s.dayChipText, day === d.key && s.dayChipTextOn]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
          {dayBlocks.length === 0 ? (
            <Text style={s.emptyText}>No classes this day.</Text>
          ) : (
            <>
              <DayMap stops={stops} home={home} />

              {/* Leave-by / wake-by (first class of the day) */}
              {commute ? (
                commute.mode === 'walk' ? (
                  <View style={s.commuteCard}>
                    <View style={s.commuteTitleRow}>
                      <Ionicons name="home-outline" size={15} color="#1e40af" />
                      <Text style={s.commuteTitle}>
                        Leave home by {formatMinutes(commute.leaveByMin)}
                      </Text>
                    </View>
                    <Text style={s.commuteSub}>
                      Wake by {formatMinutes(commute.wakeByMin)} · {commute.minutes} min walk to{' '}
                      {commute.firstBlock.label} at {formatMinutes(commute.firstBlock.startMin)}
                    </Text>
                  </View>
                ) : transit ? (
                  <View style={s.commuteCard}>
                    <View style={s.commuteTitleRow}>
                      <Ionicons name="train-outline" size={15} color="#1e40af" />
                      <Text style={s.commuteTitle}>
                        {transit.rideMin > 0
                          ? `About ${transit.totalMin} min by Red Line`
                          : `About ${transit.totalMin} min on foot via ${transit.fromStation.name}`}
                      </Text>
                    </View>
                    <Text style={s.commuteSub}>
                      Leave home by {formatMinutes(transitLeaveBy)} · wake by{' '}
                      {formatMinutes(transitLeaveBy - PREP_MINUTES)} for {commute.firstBlock.label} at{' '}
                      {formatMinutes(commute.firstBlock.startMin)}
                    </Text>
                    <Text style={s.commuteSub}>
                      {transit.rideMin > 0
                        ? `${transit.walkToStationMin} min walk to ${transit.fromStation.name} + train + ${transit.walkFromStationMin} min walk`
                        : `${transit.walkToStationMin} min walk to ${transit.fromStation.name} + ${transit.walkFromStationMin} min walk from there`}
                    </Text>
                    {arrivals.length ? (
                      <View style={s.trainRow}>
                        <Text style={s.trainLabel}>Next trains at {transit.fromStation.name}:</Text>
                        <Text style={s.trainTimes}>
                          {arrivals.map((a) => a.arrivalMin).join(' · ')} min
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={s.commuteCard}>
                    <View style={s.commuteTitleRow}>
                      <Ionicons name="home-outline" size={15} color="#1e40af" />
                      <Text style={s.commuteTitle}>
                        Home is about {(commute.meters / 1609).toFixed(1)} mi from your first class
                      </Text>
                    </View>
                    <Text style={s.commuteSub}>Plan transit time to campus.</Text>
                  </View>
                )
              ) : home ? null : (
                <View style={s.commuteCardMuted}>
                  <Text style={s.commuteSub}>
                    Add your home address in Profile to see leave-by and wake-up times here.
                  </Text>
                </View>
              )}

              {/* Class list + transition feasibility */}
              {dayBlocks.map((b, i) => {
                const t = i > 0 ? transitions[i - 1] : null;
                const st = t ? STATUS_STYLE[t.status] : null;
                return (
                  <View key={`${b.key}`}>
                    {t ? (
                      <View style={s.transRow}>
                        <View style={[s.transBadge, { backgroundColor: st.bg }]}>
                          <Text style={[s.transBadgeText, { color: st.color }]}>{st.text}</Text>
                        </View>
                        <Text style={s.transText}>
                          {t.gapMin} min gap
                          {t.neededMin != null
                            ? t.mode === 'shuttle'
                              ? ` · different campuses, shuttle needs about ${t.neededMin} min`
                              : ` · ${t.neededMin} min walk`
                            : ' · route unknown'}
                        </Text>
                      </View>
                    ) : null}
                    <View style={s.classRow}>
                      <View style={s.orderBubble}><Text style={s.orderBubbleText}>{i + 1}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.classCode}>{b.label}</Text>
                        <Text style={s.classMeta}>
                          {formatMinutes(b.startMin)} – {formatMinutes(b.endMin)}
                          {b.section?.building ? ` · ${b.section.building}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {transitions.some((t) => t.status === 'impossible') ? (
                <View style={s.impossibleRow}>
                  <Ionicons name="close-circle" size={15} color="#b91c1c" style={{ marginTop: 2 }} />
                  <Text style={s.impossibleNote}>
                    An impossible transfer means these classes can't both be attended.
                    Swap one section before registration.
                  </Text>
                </View>
              ) : null}

              {/* 8-RIDE (user request): evening classes -> safe ride home.
                  Loyola's LSC evening service, 6:30 PM–2:30 AM, campus +
                  Rogers Park. Booking is TripShot or phone — no public API. */}
              {endsInEvening(dayBlocks) ? (
                <View style={s.rideCard}>
                  <View style={s.commuteTitleRow}>
                    <Ionicons name="bus-outline" size={15} color={MAROON} />
                    <Text style={s.rideTitle}>Class ends after dark?</Text>
                  </View>
                  <Text style={s.rideText}>
                    8-RIDE gives Loyola students free evening rides around campus and
                    Rogers Park, 6:30 PM–2:30 AM.
                  </Text>
                  <View style={s.rideBtnRow}>
                    <TouchableOpacity
                      style={s.rideBtnPrimary}
                      onPress={() => Linking.openURL('https://luc.tripshot.com').catch(() => {})}
                      accessibilityLabel="Book an 8-RIDE in TripShot"
                    >
                      <Ionicons name="open-outline" size={13} color="#FFFFFF" />
                      <Text style={s.rideBtnPrimaryText}>Book a ride</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.rideBtnSecondary}
                      onPress={() => Linking.openURL(`tel:${EVENING_RIDE_PHONE.replace(/-/g, '')}`).catch(() => {})}
                      accessibilityLabel="Call 8-RIDE"
                    >
                      <Ionicons name="call-outline" size={13} color={MAROON} />
                      <Text style={s.rideBtnSecondaryText}>{EVENING_RIDE_PHONE}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.rideHint}>
                    Booking opens TripShot. Sign in with your Loyola account.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: STATUSBAR_HEIGHT },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 4,
  },
  title: { fontFamily: FONT, fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { padding: 8 },
  closeText: { fontFamily: FONT, fontSize: 18, fontWeight: '600', color: MAROON },

  dayRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 4, marginBottom: 4, gap: 8 },
  dayChip: {
    flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 14,
    paddingVertical: 6, alignItems: 'center',
  },
  dayChipOn: { backgroundColor: MAROON, borderColor: MAROON },
  dayChipText: { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: '#444' },
  dayChipTextOn: { color: '#FFF' },

  emptyText: { fontFamily: FONT, fontSize: 17, color: '#999', textAlign: 'center', marginTop: 40 },

  commuteCard: {
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 10,
  },
  commuteCardMuted: {
    backgroundColor: '#F6F6F6', borderRadius: 10, padding: 12, marginBottom: 10,
  },
  commuteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commuteTitle: { flex: 1, fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#1e40af' },
  commuteSub: { fontFamily: FONT, fontSize: 14, color: '#555', marginTop: 2 },
  trainRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  trainLabel: { fontFamily: FONT, fontSize: 14, color: '#555' },
  trainTimes: { fontSize: 13, color: '#1e40af', fontVariant: ['tabular-nums'] },

  classRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 10, padding: 10,
  },
  orderBubble: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: MAROON,
    alignItems: 'center', justifyContent: 'center',
  },
  orderBubbleText: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: '#FFF' },
  classCode: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#333' },
  classMeta: { fontFamily: FONT, fontSize: 13, color: '#777' },

  transRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 12 },
  transBadge: { borderRadius: 10, paddingVertical: 2, paddingHorizontal: 9 },
  transBadgeText: { fontFamily: FONT, fontSize: 12, fontWeight: '700' },
  transText: { flex: 1, fontFamily: FONT, fontSize: 13, color: '#666' },

  impossibleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  impossibleNote: {
    flex: 1, fontFamily: FONT, fontSize: 14, color: '#b91c1c', lineHeight: 20,
  },
  rideCard: {
    backgroundColor: '#FBF0F5', borderRadius: 10, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#E8CDD9',
  },
  rideTitle: { flex: 1, fontFamily: FONT, fontSize: 16, fontWeight: '700', color: MAROON },
  rideText: { fontFamily: FONT, fontSize: 14, color: '#555', marginTop: 3, lineHeight: 19 },
  rideBtnRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  rideBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: MAROON, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14,
  },
  rideBtnPrimaryText: { fontFamily: 'CormorantGaramond-Medium', fontSize: 14, color: '#FFFFFF' },
  rideBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: MAROON, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14,
  },
  rideBtnSecondaryText: { fontSize: 13, color: MAROON, fontVariant: ['tabular-nums'] },
  rideHint: { fontFamily: 'CormorantGaramond-Italic', fontSize: 13, color: '#999', marginTop: 7 },
});

export default ScheduleMapModal;
