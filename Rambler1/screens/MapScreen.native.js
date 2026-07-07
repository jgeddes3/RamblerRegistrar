// screens/MapScreen.native.js — Campus map (react-native-maps), NATIVE ONLY.
// Shows every campus building as a maroon pin, highlights buildings that host
// the user's scheduled classes this term (gold pins + course callout), and the
// user's saved home/dorm location (blue pin). LSC/WTC toggle animates the map
// between campuses.
//
// WEB: react-native-maps has no web implementation, and a runtime
// Platform.OS guard around require() is NOT enough — babel-preset-expo only
// inlines Platform.OS in production builds, so dev web bundling would still
// resolve react-native-maps and hard-fail. Metro platform extensions solve
// this: this .native.js file is resolved for iOS/Android, while
// MapScreen.js (the web fallback) never mentions react-native-maps.
//
// Navigation: default-exports the screen only — NO back button here (the More
// stack navigator owns headers/back).

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useAppContext } from '../AppContext';
import {
  fetchBuildings, fetchSchedule, getSectionsByClassNumbers,
  fetchUserPrimaryLocation,
} from '../firestore-data';

const MAROON = '#A30046';
const GOLD = '#FFB81C'; // Loyola gold — "your classes" pins
const HOME_BLUE = '#2563eb';

// =============================================================================
// TERM (same helper as ScheduleScreen/SearchScreen/ProgressScreen)
// =============================================================================

function getRegistrationTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yy = year % 100;
  if (month >= 10) return { code: `1${yy + 1}2`, label: `Spring ${year + 1}` };
  if (month >= 3) return { code: `1${yy}6`, label: `Fall ${year}` };
  return { code: `1${yy}2`, label: `Spring ${year}` };
}

const TERM = getRegistrationTerm();

// =============================================================================
// CAMPUS REGIONS
// =============================================================================

const CAMPUS_REGIONS = {
  LSC: {
    latitude: 41.9990, longitude: -87.6575,
    latitudeDelta: 0.012, longitudeDelta: 0.012,
  },
  WTC: {
    latitude: 41.8969, longitude: -87.6262,
    latitudeDelta: 0.012, longitudeDelta: 0.012,
  },
};

// =============================================================================
// BUILDING MATCHING (same substring-tolerant logic as ScheduleScreen)
// Section rows carry raw strings like 'Life Science Building-Room 412' —
// match the longest building name contained in (or containing) the raw value.
// =============================================================================

function matchBuilding(buildings, raw) {
  if (!raw || !buildings || !buildings.length) return null;
  const needle = String(raw).toLowerCase().trim();
  if (!needle) return null;
  let best = null;
  for (const b of buildings) {
    const name = String(b.name || '').toLowerCase();
    if (!name) continue;
    if (needle.includes(name) || name.includes(needle)) {
      if (!best || name.length > String(best.name).length) best = b;
    }
  }
  return best;
}

const courseCodeOf = (section) =>
  `${section.subject || ''} ${section.catalog_number || ''}`.trim();

// buildings + schedule sections -> Map(buildingId -> sorted [courseCode])
function coursesByBuilding(buildings, sections) {
  const map = new Map();
  for (const section of sections || []) {
    const building = matchBuilding(buildings, section.building);
    const code = courseCodeOf(section);
    if (!building || !code) continue;
    if (!map.has(building.id)) map.set(building.id, new Set());
    map.get(building.id).add(code);
  }
  const out = new Map();
  for (const [id, codes] of map) out.set(id, [...codes].sort());
  return out;
}

const hasCoords = (p) =>
  p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude));

// =============================================================================
// LEGEND
// =============================================================================

const LegendRow = ({ color, label }) => (
  <View style={s.legendRow}>
    <View style={[s.legendDot, { backgroundColor: color }]} />
    <Text style={s.legendLabel}>{label}</Text>
  </View>
);

// =============================================================================
// MAIN SCREEN
// =============================================================================

const MapScreen = () => {
  const { user } = useAppContext();
  const uid = user?.uid;
  const signedIn = !!user && !user.isAnonymous;

  const [buildings, setBuildings] = useState([]);
  const [classCourses, setClassCourses] = useState(new Map()); // buildingId -> [codes]
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('LSC');
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // Reset user-scoped pins so a signed-out or switched account never shows
    // the previous user's home/class markers while (or after) this effect runs.
    setClassCourses(new Map());
    setHome(null);
    (async () => {
      // Buildings first — everything else keys off them. fetchBuildings
      // resolves to [] on failure, so the map still renders empty.
      let bldgs = [];
      try {
        bldgs = (await fetchBuildings()) || [];
      } catch (e) {
        bldgs = [];
      }
      if (cancelled) return;
      setBuildings(bldgs);

      if (signedIn && uid) {
        // Schedule highlights and home pin are independent — one failing
        // must not take out the other. fetchSchedule THROWS on read errors.
        const [schedRes, homeRes] = await Promise.allSettled([
          (async () => {
            const sched = await fetchSchedule(uid, TERM.code);
            const ids = sched?.section_ids || [];
            if (ids.length === 0) return [];
            return (await getSectionsByClassNumbers(TERM.code, ids)) || [];
          })(),
          fetchUserPrimaryLocation(uid),
        ]);
        if (cancelled) return;
        if (schedRes.status === 'fulfilled' && bldgs.length > 0) {
          setClassCourses(coursesByBuilding(bldgs, schedRes.value));
        }
        const loc = homeRes.status === 'fulfilled' ? homeRes.value : null;
        if (loc && !loc.error && hasCoords(loc)) setHome(loc);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [uid, signedIn]);

  const switchCampus = useCallback((next) => {
    setCampus(next);
    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion(CAMPUS_REGIONS[next], 650);
    }
  }, []);

  const showHome = !!home;
  const showClasses = classCourses.size > 0;

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={CAMPUS_REGIONS.LSC}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {buildings.filter(hasCoords).map((b) => {
          const courses = classCourses.get(b.id);
          if (courses && courses.length > 0) {
            // Building hosting the user's classes this term — gold pin,
            // callout lists the courses meeting there.
            return (
              <Marker
                key={`b-${b.id}`}
                coordinate={{ latitude: Number(b.latitude), longitude: Number(b.longitude) }}
                pinColor={GOLD}
              >
                <Callout>
                  <View style={s.callout}>
                    <Text style={s.calloutTitle}>{b.name}</Text>
                    <Text style={s.calloutSub}>Your classes here:</Text>
                    {courses.map((code) => (
                      <Text key={code} style={s.calloutCourse}>{code}</Text>
                    ))}
                  </View>
                </Callout>
              </Marker>
            );
          }
          return (
            <Marker
              key={`b-${b.id}`}
              coordinate={{ latitude: Number(b.latitude), longitude: Number(b.longitude) }}
              pinColor={MAROON}
              title={b.name}
              description={b.address || undefined}
            />
          );
        })}

        {showHome && (
          <Marker
            key="home"
            coordinate={{ latitude: Number(home.latitude), longitude: Number(home.longitude) }}
            pinColor={HOME_BLUE}
            title={home.label || 'Home'}
            description={home.address || undefined}
          />
        )}
      </MapView>

      {/* Title overlay */}
      <View style={s.titleCard} pointerEvents="none">
        <Text style={s.title}>Campus Map</Text>
        <Text style={s.subtitle}>{TERM.label}</Text>
      </View>

      {/* Campus toggle */}
      <View style={s.toggleWrap}>
        {['LSC', 'WTC'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[s.toggleBtn, campus === c && s.toggleBtnActive]}
            onPress={() => switchCampus(c)}
            accessibilityLabel={c === 'LSC' ? 'Lake Shore Campus' : 'Water Tower Campus'}
          >
            <Text style={[s.toggleText, campus === c && s.toggleTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={s.legend} pointerEvents="none">
        <LegendRow color={MAROON} label="Campus building" />
        {showClasses && <LegendRow color={GOLD} label="Your classes" />}
        {showHome && <LegendRow color={HOME_BLUE} label={home.label || 'Home'} />}
      </View>

      {loading && (
        <View style={s.loadingPill} pointerEvents="none">
          <ActivityIndicator size="small" color={MAROON} />
          <Text style={s.loadingText}>Loading buildings…</Text>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  title: { fontFamily: 'CormorantGaramond-Regular', fontSize: 28, color: MAROON },
  subtitle: { fontFamily: 'CormorantGaramond-Regular', fontSize: 15, color: '#999', marginTop: -2 },

  // Overlays
  titleCard: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  toggleWrap: {
    position: 'absolute', top: 16, right: 12, flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 3,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  toggleBtn: {
    borderRadius: 17, paddingVertical: 6, paddingHorizontal: 14,
  },
  toggleBtnActive: { backgroundColor: MAROON },
  toggleText: { fontSize: 13, fontWeight: '600', color: MAROON },
  toggleTextActive: { color: '#FFFFFF' },

  legend: {
    position: 'absolute', bottom: 24, left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, gap: 5,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 11, height: 11, borderRadius: 5.5, marginRight: 7 },
  legendLabel: { fontSize: 12, color: '#333' },

  loadingPill: {
    position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  loadingText: { fontSize: 13, color: '#555', marginLeft: 8 },

  // Callout (class buildings)
  callout: { minWidth: 160, maxWidth: 230, paddingVertical: 2 },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  calloutSub: { fontSize: 12, color: MAROON, marginBottom: 2 },
  calloutCourse: { fontSize: 12, color: '#555' },
});

export default MapScreen;
