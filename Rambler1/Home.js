import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from './AppContext';
import Skeleton from './components/Skeleton';
import {
  FONT, FONT_MED, FONT_SEMI, FONT_ITALIC, MAROON, PARCHMENT, INK, STONE, HAIRLINE, GOLD,
  CARD, EYEBROW,
} from './theme';
import {
  fetchSchedule,
  getSectionsByClassNumbers,
  fetchDegreeProgress,
  fetchUserCoreProgress,
  fetchUserPrimaryLocation,
} from './firestore-data';
import { parseMeetingPatterns, courseColor } from './schedule-utils';
import { getLibraryHours, getEventsToday, getPhoenixHeadlines } from './campus-api';
import PhoenixPreviewModal from './components/PhoenixPreviewModal';
import { nearestStation, getTrainArrivals, groupArrivalsBothWays } from './cta';
import { walkMinutesFromMeters } from './commute-utils';
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
export function buildTodayRows(sections, dayCode) {
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
        classNumber: section.class_number,
        instructor: section.instructor || '',
      });
    }
  }
  rows.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  return rows;
}

// Today's slice of a getEventsToday() list: all-day events plus events whose
// start falls on `now`'s local date (the days=1 API window can bleed into
// tomorrow), timed events first in start order, capped at 3 for the card.
export function eventsForToday(events, now) {
  const startTime = (ev) => {
    const t = ev.start ? new Date(ev.start).getTime() : NaN;
    return Number.isNaN(t) ? Infinity : t;
  };
  const isToday = (ev) => {
    if (ev.allDay) return true;
    const t = startTime(ev);
    if (t === Infinity) return false;
    const d = new Date(t);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  return (events || [])
    .filter(isToday)
    .sort((a, b) => {
      if (!a.allDay !== !b.allDay) return a.allDay ? 1 : -1;
      return startTime(a) - startTime(b);
    })
    .slice(0, 3);
}

// Today's slice of the Phoenix feed: stories whose publishedAt falls on
// `now`'s local date, feed order (newest first), capped at 3 for the card.
// The card only renders on days the paper actually published.
export function phoenixForToday(items, now) {
  return (items || [])
    .filter((item) => {
      if (!item || !item.publishedAt) return false;
      const d = new Date(item.publishedAt);
      if (Number.isNaN(d.getTime())) return false;
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    })
    .slice(0, 3);
}

// Event row time slot: "7:00 PM" / "All day".
function eventTimeLabel(ev) {
  if (ev.allDay) return 'All day';
  const d = new Date(ev.start);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
  if (outlook.status === 'at-risk') return 'At risk: see Progress';
  return 'Off track: see your advisor';
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

  // Campus-events state: [] = section hidden (loading, no events today, or the
  // web/CORS case where getEventsToday() resolves []).
  const [todayEvents, setTodayEvents] = useState([]);

  // Phoenix state: [] = section hidden (loading, nothing published today, or
  // fetch failure). phoenixPreview holds the story open in the preview modal.
  const [phoenixToday, setPhoenixToday] = useState([]);
  const [phoenixPreview, setPhoenixPreview] = useState(null);

  // Graduation-outlook state: null = hidden (loading, unknown, or failed),
  // otherwise the computeGraduationOutlook() result. Failures never surface
  // as an error card on Home — the card just doesn't render.
  const [outlook, setOutlook] = useState(null);

  // "Your train" tile: null = hidden (no saved home address / signed out),
  // else { station, walkMin, arrivalGroups }. arrivalGroups is [] when live
  // times are unavailable (no CTA key, web CORS, or API failure) — the tile
  // still shows the station + walk time.
  const [train, setTrain] = useState(null);
  const trainStationRef = useRef(null); // for the focused-interval arrivals refresh

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

  const loadEvents = useCallback(async (isActive) => {
    const events = await getEventsToday(); // campus-api: [] on failure
    if (isActive()) setTodayEvents(eventsForToday(events, new Date()));
  }, []);

  const loadPhoenix = useCallback(async (isActive) => {
    const items = await getPhoenixHeadlines(); // campus-api: [] on failure
    if (isActive()) setPhoenixToday(phoenixForToday(items, new Date()));
  }, []);

  const loadTrain = useCallback(async (isActive) => {
    if (!signedIn) {
      trainStationRef.current = null;
      if (isActive()) setTrain(null);
      return;
    }
    const loc = await fetchUserPrimaryLocation(uid); // null / { error } on failure
    if (!isActive()) return;
    const lat = Number(loc?.latitude);
    const lon = Number(loc?.longitude);
    if (!loc || loc.error || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      trainStationRef.current = null;
      setTrain(null);
      return;
    }
    const { station, meters } = nearestStation(lat, lon);
    if (!station) {
      trainStationRef.current = null;
      setTrain(null);
      return;
    }
    trainStationRef.current = station;
    const walkMin = walkMinutesFromMeters(meters);
    // max=10: enough window that one busy direction can't crowd the other out
    // of the response — the tile always shows BOTH ways.
    const arrivals = await getTrainArrivals(station.mapId, 10);
    if (isActive()) {
      setTrain({ station, walkMin, arrivalGroups: groupArrivalsBothWays(arrivals) });
    }
  }, [uid, signedIn]);

  // Countdowns go stale fast — refresh arrivals every 60s while Home is
  // focused (matches cta.js's cache TTL). Only the arrivals refetch; the
  // home-address lookup stays a once-per-focus Firestore read.
  const refreshArrivals = useCallback(async (isActive) => {
    const station = trainStationRef.current;
    if (!station) return;
    const arrivals = await getTrainArrivals(station.mapId, 10);
    if (isActive()) {
      setTrain((cur) =>
        cur && cur.station.mapId === station.mapId
          ? { ...cur, arrivalGroups: groupArrivalsBothWays(arrivals) }
          : cur
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;
      loadToday(isActive);
      loadLibrary(isActive);
      loadEvents(isActive);
      loadPhoenix(isActive);
      loadOutlook(isActive);
      loadTrain(isActive);
      const arrivalsTimer = setInterval(() => refreshArrivals(isActive), 60000);
      return () => { active = false; clearInterval(arrivalsTimer); };
    }, [loadToday, loadLibrary, loadEvents, loadPhoenix, loadOutlook, loadTrain, refreshArrivals])
  );

  const navigation = useNavigation();

  // Bulletin masthead date: "WEDNESDAY, JULY 9"
  const now = new Date();
  const mastheadDate = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
  const firstName = (user?.displayName || user?.email || '').split(/[\s@]/)[0];

  // Compact identity line under the greeting: "Computer Science (BS) · Class of 2027"
  const identityBits = [];
  if (selectedProgram && selectedProgram.id !== 'undecided') {
    identityBits.push(`${selectedProgram.name}${selectedProgram.degree ? ` (${selectedProgram.degree})` : ''}`);
  }
  if (selectedProgram2) identityBits.push(selectedProgram2.name);
  for (const minor of selectedMinors) identityBits.push(`${minor.name} minor`);
  if (graduationYear) identityBits.push(`Class of ${graduationYear}`);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* ------------------------------ Masthead --------------------------- */}
        <Text style={s.mastheadDate}>{mastheadDate}</Text>
        <Text style={s.greeting}>
          {firstName ? `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, ${firstName}` : 'Welcome'}
        </Text>
        {identityBits.length > 0 ? (
          <Text style={s.identityLine} numberOfLines={2}>{identityBits.join('  ·  ')}</Text>
        ) : null}
        <View style={s.mastheadRule} />

        {/* ------------------------------- Today's Schedule ------------------ */}
        <Text style={s.eyebrow}>Today's classes</Text>
        <View style={s.card}>
          {schedState === 'loading' ? (
            <View>
              {[0, 1].map((i) => (
                <View key={i} style={s.classRow}>
                  <Skeleton width={54} height={12} style={{ marginTop: 3, marginRight: 16 }} />
                  <View style={s.classMain}>
                    <Skeleton width={92} height={14} />
                    <Skeleton width={160} height={11} style={{ marginTop: 7 }} />
                  </View>
                </View>
              ))}
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
                Enjoy summer break. Your schedule returns in the fall.
              </Text>
            </View>
          ) : schedState === 'none' ? (
            <TouchableOpacity
              style={s.cardCenter}
              onPress={() => navigation.navigate('Schedule')}
              accessibilityLabel="Build your schedule"
            >
              <Text style={s.cardEmptyText}>Build your schedule</Text>
              <Text style={s.cardHintText}>
                Add classes on the Schedule tab to see your day here.
              </Text>
            </TouchableOpacity>
          ) : todayRows.length === 0 ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>No classes today</Text>
              <Text style={s.cardHintText}>The day is yours.</Text>
            </View>
          ) : (
            todayRows.map((row, i) => (
              <View
                key={row.key}
                style={[s.classRow, i < todayRows.length - 1 && s.rowBorder]}
              >
                <View style={s.classTimeCol}>
                  <Text style={s.classTimeStart}>{formatMinutes(row.startMin)}</Text>
                  <Text style={s.classTimeEnd}>{formatMinutes(row.endMin)}</Text>
                </View>
                <View style={[s.classRail, { backgroundColor: row.color }]} />
                <View style={s.classMain}>
                  <Text style={s.classCode}>{row.code}</Text>
                  {row.title ? (
                    <Text style={s.classTitle} numberOfLines={1}>{row.title}</Text>
                  ) : null}
                  {row.building ? (
                    <View style={s.classMetaRow}>
                      <Ionicons name="location-outline" size={12} color={STONE} />
                      <Text style={s.classBuilding} numberOfLines={1}>{row.building}</Text>
                    </View>
                  ) : null}
                  {row.instructor || row.classNumber ? (
                    <View style={s.classMetaRow}>
                      {row.instructor ? (
                        <>
                          <Ionicons name="person-outline" size={12} color={STONE} />
                          <Text style={s.classInstructor} numberOfLines={1}>
                            {row.instructor}
                          </Text>
                        </>
                      ) : (
                        <View style={s.classMetaFill} />
                      )}
                      {row.classNumber ? (
                        <Text style={s.classNumber}>#{row.classNumber}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* -------------------------------- Your train ----------------------- */}
        {train ? (
          <>
            <Text style={s.eyebrow}>Your train</Text>
            <View style={s.card}>
              <View style={[s.trainHeaderRow, train.arrivalGroups.length > 0 && s.rowBorder]}>
                <Ionicons name="train-outline" size={15} color={MAROON} />
                <Text style={s.trainStation} numberOfLines={1}>
                  {train.station.name} station
                </Text>
                <Text style={s.trainWalk}>{train.walkMin} min walk</Text>
              </View>
              {train.arrivalGroups.length > 0 ? (
                train.arrivalGroups.map((g, i, arr) => (
                  <View
                    key={g.destination}
                    style={[s.trainRow, i < arr.length - 1 && s.rowBorder]}
                  >
                    <Text style={s.trainDest} numberOfLines={1}>To {g.destination}</Text>
                    {g.minutes.length > 0 ? (
                      <Text style={s.trainTimes}>
                        {g.minutes.map((m) => (m === 0 ? 'Due' : String(m))).join(', ')}
                        {g.minutes.some((m) => m > 0) ? ' min' : ''}
                      </Text>
                    ) : (
                      <Text style={s.trainNoTrains}>No trains soon</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={s.trainHint}>Live arrival times are unavailable right now.</Text>
              )}
            </View>
          </>
        ) : null}

        {/* ---------------------------- Happening on campus ------------------ */}
        {todayEvents.length > 0 ? (
          <>
            <Text style={s.eyebrow}>Happening on campus</Text>
            <View style={s.card}>
              {todayEvents.map((ev, i) => (
                <View
                  key={ev.instanceKey != null ? ev.instanceKey : `${ev.id}-${i}`}
                  style={[s.eventRow, s.rowBorder]}
                >
                  <Text style={s.eventTime}>{eventTimeLabel(ev)}</Text>
                  <View style={s.eventMain}>
                    <Text style={s.eventTitle} numberOfLines={1}>{ev.title}</Text>
                    {ev.location ? (
                      <Text style={s.eventLocation} numberOfLines={1}>{ev.location}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={s.eventSeeAll}
                onPress={() => navigation.navigate('More', { screen: 'Events' })}
                accessibilityLabel="See all events"
              >
                <Text style={s.eventSeeAllText}>See all events</Text>
                <Ionicons name="chevron-forward" size={13} color={MAROON} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* ----------------------------- From the Phoenix -------------------- */}
        {phoenixToday.length > 0 ? (
          <>
            <Text style={s.eyebrow}>From the Phoenix</Text>
            <View style={s.card}>
              {phoenixToday.map((story, i) => (
                <TouchableOpacity
                  key={story.link}
                  style={[s.phoenixRow, s.rowBorder]}
                  onPress={() => setPhoenixPreview(story)}
                  activeOpacity={0.6}
                  accessibilityLabel={`Preview ${story.title}`}
                >
                  <Ionicons name="newspaper-outline" size={15} color={MAROON} style={s.phoenixIcon} />
                  <View style={s.phoenixMain}>
                    <Text style={s.phoenixTitle} numberOfLines={2}>{story.title}</Text>
                    {story.categories && story.categories.length > 0 ? (
                      <Text style={s.phoenixMeta} numberOfLines={1}>{story.categories[0]}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={s.eventSeeAll}
                onPress={() => navigation.navigate('More', { screen: 'Phoenix' })}
                accessibilityLabel="All Loyola Phoenix headlines"
              >
                <Text style={s.eventSeeAllText}>All headlines</Text>
                <Ionicons name="chevron-forward" size={13} color={MAROON} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* ----------------------------- Graduation Outlook ------------------ */}
        {outlook ? (
          <>
            <Text style={s.eyebrow}>Graduation outlook</Text>
            <View
              style={[
                s.card,
                s.outlookCard,
                { borderLeftColor: OUTLOOK_COLORS[outlook.status] || HAIRLINE },
              ]}
            >
              <View style={s.outlookRow}>
                <Ionicons
                  name={outlook.status === 'on-track' ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={OUTLOOK_COLORS[outlook.status] || STONE}
                />
                <Text
                  style={[
                    s.outlookStatus,
                    { color: OUTLOOK_COLORS[outlook.status] || INK },
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
                Estimate only. Confirm with your advisor and the LOCUS degree audit.
              </Text>
            </View>
          </>
        ) : null}

        {/* -------------------------------- Library Hours -------------------- */}
        <Text style={s.eyebrow}>Library hours</Text>
        <View style={s.card}>
          {libLoading ? (
            <View>
              {[0, 1, 2].map((i) => (
                <View key={i} style={s.libRow}>
                  <Skeleton width={150} height={13} />
                  <Skeleton width={70} height={13} />
                </View>
              ))}
            </View>
          ) : libLocations.length === 0 ? (
            <View style={s.cardCenter}>
              <Text style={s.cardEmptyText}>Hours unavailable</Text>
            </View>
          ) : (
            libLocations.slice(0, 6).map((loc, i, arr) => (
              <View
                key={loc.id != null ? String(loc.id) : `${loc.name}-${i}`}
                style={[s.libRow, i < arr.length - 1 && s.rowBorder]}
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

      <PhoenixPreviewModal
        item={phoenixPreview}
        visible={phoenixPreview != null}
        onClose={() => setPhoenixPreview(null)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARCHMENT,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },

  // Masthead — the page's signature. Dated eyebrow, serif greeting, gold rule.
  mastheadDate: {
    ...EYEBROW,
    marginBottom: 6,
  },
  greeting: {
    fontFamily: FONT_MED,
    fontSize: 30,
    lineHeight: 34,
    color: INK,
  },
  identityLine: {
    fontFamily: FONT_ITALIC,
    fontSize: 16,
    color: STONE,
    marginTop: 5,
    lineHeight: 20,
  },
  mastheadRule: {
    height: 2,
    width: 44,
    backgroundColor: GOLD,
    marginTop: 14,
    marginBottom: 4,
  },

  eyebrow: {
    ...EYEBROW,
    marginTop: 22,
    marginBottom: 8,
  },

  card: {
    ...CARD,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
  },
  cardEmptyText: {
    fontFamily: FONT_MED,
    fontSize: 19,
    color: STONE,
    textAlign: 'center',
  },
  cardHintText: {
    fontFamily: FONT_ITALIC,
    fontSize: 15,
    color: '#B3ABA1',
    marginTop: 4,
    textAlign: 'center',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEE6',
  },

  // Today's classes — timeline rows: sans time column, color rail, serif course
  classRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 11,
  },
  classTimeCol: {
    width: 64,
    paddingTop: 1,
  },
  classTimeStart: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    fontVariant: ['tabular-nums'],
  },
  classTimeEnd: {
    fontSize: 12,
    color: STONE,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  classRail: {
    width: 3,
    borderRadius: 2,
    marginRight: 12,
  },
  classMain: {
    flex: 1,
  },
  classCode: {
    fontFamily: FONT_SEMI,
    fontSize: 18,
    color: INK,
  },
  classTitle: {
    fontFamily: FONT,
    fontSize: 14,
    color: STONE,
    marginTop: 1,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  classBuilding: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 13,
    color: STONE,
  },
  classInstructor: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 13,
    color: STONE,
  },
  classMetaFill: {
    flex: 1,
  },
  classNumber: {
    flexShrink: 0,
    fontSize: 12,
    color: STONE,
    fontVariant: ['tabular-nums'],
  },

  // Your train — serif station/destination words, sans walk time + countdowns
  trainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  trainStation: {
    flex: 1,
    fontFamily: FONT_MED,
    fontSize: 16,
    color: INK,
  },
  trainWalk: {
    flexShrink: 0,
    fontSize: 13,
    color: STONE,
    fontVariant: ['tabular-nums'],
  },
  trainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  trainDest: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 15,
    color: INK,
    marginRight: 10,
  },
  trainTimes: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    fontVariant: ['tabular-nums'],
  },
  trainNoTrains: {
    flexShrink: 0,
    fontFamily: FONT_ITALIC,
    fontSize: 13,
    color: '#B3ABA1',
  },
  trainHint: {
    fontFamily: FONT_ITALIC,
    fontSize: 13,
    color: '#B3ABA1',
    paddingVertical: 10,
  },

  // Happening on campus — sans time slot, serif title/location, see-all footer
  eventRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  eventTime: {
    width: 64,
    paddingTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    fontVariant: ['tabular-nums'],
  },
  eventMain: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: FONT_MED,
    fontSize: 16,
    color: INK,
  },
  eventLocation: {
    fontFamily: FONT,
    fontSize: 13,
    color: STONE,
    marginTop: 1,
  },
  eventSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
  },
  eventSeeAllText: {
    fontFamily: FONT_MED,
    fontSize: 15,
    color: MAROON,
  },

  // From the Phoenix — serif headline rows, section tag, same see-all footer
  phoenixRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  phoenixIcon: {
    marginTop: 3,
    marginRight: 10,
  },
  phoenixMain: {
    flex: 1,
  },
  phoenixTitle: {
    fontFamily: FONT_MED,
    fontSize: 16,
    lineHeight: 21,
    color: INK,
  },
  phoenixMeta: {
    fontFamily: FONT,
    fontSize: 13,
    color: STONE,
    marginTop: 1,
  },

  // Graduation outlook card
  outlookCard: {
    borderLeftWidth: 3,
    paddingVertical: 12,
  },
  outlookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  outlookStatus: {
    flex: 1,
    fontFamily: FONT_SEMI,
    fontSize: 17,
  },
  outlookDetail: {
    fontFamily: FONT,
    fontSize: 14,
    color: STONE,
    marginTop: 4,
    marginLeft: 23,
    lineHeight: 19,
  },
  outlookDisclaimer: {
    fontFamily: FONT_ITALIC,
    fontSize: 13,
    color: '#B3ABA1',
    marginTop: 6,
    marginLeft: 23,
  },

  // Library hours rows
  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  libName: {
    flex: 1,
    fontFamily: FONT_MED,
    fontSize: 15,
    color: INK,
    marginRight: 10,
  },
  libHours: {
    fontSize: 13,
    color: STONE,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  emptyText: {
    fontFamily: FONT,
    fontSize: 16,
    color: STONE,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default Home;
