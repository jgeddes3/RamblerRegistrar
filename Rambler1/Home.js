import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from './AppContext';
import {
  fetchSchedule,
  getSectionsByClassNumbers,
  fetchDegreeProgress,
  fetchUserCoreProgress,
} from './firestore-data';
import { parseMeetingPatterns, courseColor } from './schedule-utils';
import { getLibraryHours } from './campus-api';
import { computeGraduationOutlook } from './graduation-outlook';

// Term currently IN SESSION — deliberately different from the
// getRegistrationTerm() helper used by ScheduleScreen/SearchScreen/
// ProgressScreen, which targets the term students are registering FOR.
// "Today's Schedule" must show the term happening now:
//   Jan-May -> Spring of the current year, Aug-Dec -> Fall of the current
//   year, Jun-Jul -> null (no in-session term; the card shows a summer state).
function getCurrentTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yy = year % 100;
  if (month >= 8) return { code: `1${yy}6`, label: `Fall ${year}` };
  if (month <= 5) return { code: `1${yy}2`, label: `Spring ${year}` };
  return null; // June/July: summer break
}

const TERM = getCurrentTerm();

// JS Date.getDay() (Sun=0..Sat=6) -> LOCUS day token.
const JS_DOW_TO_DAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatMinutes(min) {
  if (min == null) return '';
  let hour = Math.floor(min / 60);
  const m = min % 60;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

// Flatten section rows into today's meetings, sorted by start time.
function buildTodayRows(sections, dayCode) {
  const rows = [];
  for (const section of sections || []) {
    const code = `${section.subject || ''} ${section.catalog_number || ''}`.trim();
    for (const p of parseMeetingPatterns(section)) {
      if (!p.days.includes(dayCode)) continue;
      rows.push({
        // Include the pattern's day-set: two patterns of one section can share
        // times on different day-sets that both include today — keys must differ.
        key: `${section.class_number}:${p.days.join('')}:${p.startMin}-${p.endMin}`,
        startMin: p.startMin,
        endMin: p.endMin,
        code,
        color: courseColor(code),
        title: section.title || '',
        building: section.building || '',
      });
    }
  }
  rows.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  return rows;
}

// Graduation-outlook status -> accent color (dot, left border, status text).
// Strong tones from the app's badge palette (ok/warning/danger).
const OUTLOOK_COLORS = {
  'on-track': '#065f46',
  'at-risk': '#92400e',
  'off-track': '#b91c1c',
};

// One-line status label for the outlook card.
function outlookStatusLine(outlook) {
  if (outlook.status === 'on-track') return `On track for ${outlook.gradLabel}`;
  if (outlook.status === 'at-risk') return 'At risk — see Progress';
  return 'Off track — see your advisor';
}

// Compact one-line hours string for a LibCal location.
function hoursLabel(loc) {
  const hours = Array.isArray(loc.hours) ? loc.hours : [];
  const spans = hours
    .map((h) => (h && h.from && h.to ? `${h.from} – ${h.to}` : null))
    .filter(Boolean);
  if (spans.length > 0) return spans.join(', ');
  if (loc.status === '24hours') return 'Open 24 hours';
  if (loc.status === 'closed') return 'Closed';
  if (loc.note) return String(loc.note);
  return 'Hours unavailable';
}

const Home = () => {
  const ctx = useAppContext();
  const selectedProgram = ctx.selectedProgram;
  const selectedProgram2 = ctx.selectedProgram2;
  const selectedMinors = ctx.selectedMinors || [];
  const selectedCourses = ctx.selectedCourses || [];
  const quizTags = ctx.quizTags || [];
  const user = ctx.user;
  const graduationYear = ctx.graduationYear;
  const uid = user?.uid;
  const signedIn = !!user && !user.isAnonymous;

  // Today's-schedule state:
  // 'loading' | 'none' | 'unavailable' | 'summer' | 'ready'
  const [schedState, setSchedState] = useState('loading');
  const [todayRows, setTodayRows] = useState([]);

  // Library-hours state: null = loading/unavailable, [] = unavailable, rows = ready
  const [libLoading, setLibLoading] = useState(true);
  const [libLocations, setLibLocations] = useState([]);

  // Graduation-outlook state: null = hidden (loading, unknown, or failed),
  // otherwise the computeGraduationOutlook() result. Failures never surface
  // as an error card on Home — the card just doesn't render.
  const [outlook, setOutlook] = useState(null);

  const loadOutlook = useCallback(async (isActive) => {
    // Needs a signed-in user with a real (non-undecided) program and a
    // graduation year — otherwise the outlook is 'unknown' and hidden anyway,
    // so skip the Firestore reads entirely.
    if (
      !signedIn ||
      !selectedProgram ||
      selectedProgram.id === 'undecided' ||
      !graduationYear
    ) {
      if (isActive()) setOutlook(null);
      return;
    }
    try {
      // firestore-data wrappers around progress.js getDegreeProgress /
      // getUserCoreProgress — both return null on failure (never throw).
      // 2nd major + minors are fetched too so the outlook counts their
      // remaining requirements (matches ProgressScreen's 'All' banner).
      const otherPrograms = [selectedProgram2, ...selectedMinors].filter(
        (p) => p && p.id != null
      );
      const [degreeProgress, coreProgress, ...additionalDegreeProgress] =
        await Promise.all([
          fetchDegreeProgress(uid, selectedProgram.id),
          fetchUserCoreProgress(uid, selectedProgram.school),
          ...otherPrograms.map((p) => fetchDegreeProgress(uid, p.id)),
        ]);
      const result = computeGraduationOutlook({
        degreeProgress,
        additionalDegreeProgress,
        coreProgress,
        graduationYear,
      });
      if (isActive()) setOutlook(result.status === 'unknown' ? null : result);
    } catch (e) {
      if (isActive()) setOutlook(null);
    }
  }, [uid, signedIn, selectedProgram, selectedProgram2, selectedMinors, graduationYear]);

  const loadToday = useCallback(async (isActive) => {
    if (!TERM) {
      // June/July: no term in session — nothing to fetch.
      if (isActive()) { setSchedState('summer'); setTodayRows([]); }
      return;
    }
    if (!signedIn) {
      if (isActive()) { setSchedState('none'); setTodayRows([]); }
      return;
    }
    if (isActive()) setSchedState('loading');
    try {
      const sched = await fetchSchedule(uid, TERM.code); // THROWS on read error
      const ids = sched?.section_ids || [];
      if (ids.length === 0) {
        if (isActive()) { setTodayRows([]); setSchedState('none'); }
        return;
      }
      const rows = await getSectionsByClassNumbers(TERM.code, ids);
      const dayCode = JS_DOW_TO_DAY[new Date().getDay()];
      if (isActive()) {
        setTodayRows(buildTodayRows(rows || [], dayCode));
        setSchedState('ready');
      }
    } catch (e) {
      // Read error != empty schedule — show an unavailable state.
      if (isActive()) { setTodayRows([]); setSchedState('unavailable'); }
    }
  }, [uid, signedIn]);

  const loadLibrary = useCallback(async (isActive) => {
    if (isActive()) setLibLoading(true);
    const data = await getLibraryHours(); // campus-api: null on failure
    if (!isActive()) return;
    const locations = data && Array.isArray(data.locations) ? data.locations : [];
    // LibCal returns parent + child desks with duplicate display names
    // (e.g. two "Research Help Desk Hours" rows) — keep the first of each name.
    const seen = new Set();
    setLibLocations(locations.filter((l) => {
      const name = (l.name || '').trim();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    }));
    setLibLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;
      loadToday(isActive);
      loadLibrary(isActive);
      loadOutlook(isActive);
      return () => { active = false; };
    }, [loadToday, loadLibrary, loadOutlook])
  );

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {user ? (
          <Text style={s.welcome}>Welcome, {user.displayName || user.email}</Text>
        ) : null}

        {selectedProgram ? (
          <>
            <Text style={s.sectionHeader}>{selectedProgram2 ? 'Your Majors' : 'Your Major'}</Text>
            <Text style={s.infoText}>
              {selectedProgram.name} ({selectedProgram.degree}) — {selectedProgram.school}
            </Text>
            {selectedProgram2 ? (
              <Text style={s.infoText}>
                {selectedProgram2.name} ({selectedProgram2.degree}) — {selectedProgram2.school}
              </Text>
            ) : null}
          </>
        ) : null}

        {selectedMinors && selectedMinors.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>{selectedMinors.length > 1 ? 'Your Minors' : 'Your Minor'}</Text>
            {selectedMinors.map((minor) => (
              <Text key={minor.id} style={s.infoText}>
                {minor.name} — {minor.school}
              </Text>
            ))}
          </>
        ) : null}

        {graduationYear ? (
          <Text style={s.infoText}>Expected Graduation: {graduationYear}</Text>
        ) : null}

        {selectedCourses.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>Courses Taken ({selectedCourses.length})</Text>
            {selectedCourses.map((c) => (
              <Text key={c.id} style={s.classItem}>{c.code} — {c.name}</Text>
            ))}
          </>
        ) : null}

        {quizTags.length > 0 ? (
          <>
            <Text style={s.sectionHeader}>Your Preferences</Text>
            <View style={s.tagContainer}>
              {quizTags.map((tag, index) => (
                <View key={index} style={s.tag}>
                  <Text style={s.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ------------------------------- Today's Schedule ------------------ */}
        <Text style={s.sectionHeader}>Today's Schedule</Text>
        <View style={s.card}>
          {schedState === 'loading' ? (
            <View style={s.cardCenter}>
              <ActivityIndicator color="#A30046" />
            </View>
          ) : schedState === 'unavailable' ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>Couldn't load your schedule</Text>
              <Text style={s.cardHintText}>Check your connection and try again.</Text>
            </View>
          ) : schedState === 'summer' ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>No term in session</Text>
              <Text style={s.cardHintText}>
                Enjoy summer break — your schedule returns in the fall.
              </Text>
            </View>
          ) : schedState === 'none' ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>Build your schedule</Text>
              <Text style={s.cardHintText}>
                Add classes on the Schedule tab to see your day here.
              </Text>
            </View>
          ) : todayRows.length === 0 ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>No classes today 🎉</Text>
            </View>
          ) : (
            todayRows.map((row, i) => (
              <View
                key={row.key}
                style={[s.classRow, i < todayRows.length - 1 && s.classRowBorder]}
              >
                <Text style={s.classTime}>
                  {formatMinutes(row.startMin)} – {formatMinutes(row.endMin)}
                </Text>
                <View style={s.classMain}>
                  <View style={s.classCodeRow}>
                    <View style={[s.classDot, { backgroundColor: row.color }]} />
                    <Text style={s.classCode}>{row.code}</Text>
                  </View>
                  {row.title ? (
                    <Text style={s.classTitle} numberOfLines={1}>{row.title}</Text>
                  ) : null}
                  {row.building ? (
                    <Text style={s.classBuilding} numberOfLines={1}>{row.building}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ----------------------------- Graduation Outlook ------------------ */}
        {outlook ? (
          <>
            <Text style={s.sectionHeader}>Graduation Outlook</Text>
            <View
              style={[
                s.card,
                s.outlookCard,
                { borderLeftColor: OUTLOOK_COLORS[outlook.status] || '#F0F0F0' },
              ]}
            >
              <View style={s.outlookRow}>
                <View
                  style={[
                    s.outlookDot,
                    { backgroundColor: OUTLOOK_COLORS[outlook.status] || '#999' },
                  ]}
                />
                <Text
                  style={[
                    s.outlookStatus,
                    { color: OUTLOOK_COLORS[outlook.status] || '#333' },
                  ]}
                  numberOfLines={1}
                >
                  {outlookStatusLine(outlook)}
                </Text>
              </View>
              {outlook.status !== 'on-track' ? (
                <Text style={s.outlookDetail} numberOfLines={2}>
                  {outlook.message}
                </Text>
              ) : null}
              {/* The heuristic must never be surfaced without its disclaimer. */}
              <Text style={s.outlookDisclaimer} numberOfLines={2}>
                Estimate only — confirm with your advisor and the LOCUS degree audit.
              </Text>
            </View>
          </>
        ) : null}

        {/* -------------------------------- Library Hours -------------------- */}
        <Text style={s.sectionHeader}>Library Hours</Text>
        <View style={s.card}>
          {libLoading ? (
            <View style={s.cardCenter}>
              <ActivityIndicator color="#A30046" />
            </View>
          ) : libLocations.length === 0 ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>Hours unavailable</Text>
            </View>
          ) : (
            libLocations.slice(0, 6).map((loc, i, arr) => (
              <View
                key={loc.id != null ? String(loc.id) : `${loc.name}-${i}`}
                style={[s.libRow, i < arr.length - 1 && s.classRowBorder]}
              >
                <Text style={s.libName} numberOfLines={1}>{loc.name}</Text>
                <Text style={s.libHours} numberOfLines={1}>{hoursLabel(loc)}</Text>
              </View>
            ))
          )}
        </View>

        {!selectedProgram && selectedCourses.length === 0 ? (
          <Text style={s.emptyText}>
            Complete the signup flow to see your profile here
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcome: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#333',
    marginBottom: 12,
  },
  sectionHeader: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#A30046',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    marginBottom: 4,
    color: '#333',
  },
  classItem: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    marginLeft: 8,
    marginBottom: 2,
    color: '#555',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
  },

  // Dashboard cards
  card: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardEmptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  cardHintText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
    textAlign: 'center',
  },

  // Today's schedule rows
  classRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  classRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  classTime: {
    width: 128,
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  classMain: {
    flex: 1,
  },
  classCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  classCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  classTitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 1,
  },
  classBuilding: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },

  // Graduation outlook card
  outlookCard: {
    borderLeftWidth: 4,
    paddingVertical: 12,
  },
  outlookRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outlookDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  outlookStatus: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  outlookDetail: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
    marginLeft: 18,
  },
  outlookDisclaimer: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 18,
  },

  // Library hours rows
  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  libName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  libHours: {
    fontSize: 13,
    color: '#555',
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },

  emptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default Home;
