// screens/ScheduleScreen.js — Schedule Builder container.
// Loads the user's saved schedule (one per term, doc id = termCode), renders
// the weekly grid + warnings, and hosts the add/remove/export flows.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, Modal, Alert, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useAppContext } from '../AppContext';
import {
  fetchSchedule, saveSchedule, getSectionsByClassNumbers,
  addSectionToSchedule, removeSectionFromSchedule,
  searchCourses, getCourseSections, fetchBuildings,
  fetchDegreeProgress, fetchUserCoreProgress,
  fetchWatches, addWatch, removeWatch,
} from '../firestore-data';
import {
  sectionsToBlocks, gridBounds, findConflicts, findTightGaps,
  unscheduledSections, buildIcs,
} from '../schedule-utils';
import { fillWarning, requirementCoverage, coverageSummaryLine } from '../planning-insights';
import { campusOf } from '../commute-utils';
import { computeGraduationOutlook } from '../graduation-outlook';
import { buildRecommendations } from '../recommend';
import ScheduleGrid from '../components/ScheduleGrid';
import GenerateScheduleModal from '../components/GenerateScheduleModal';
import ScheduleMapModal from '../components/ScheduleMapModal';
import CourseDetailModal from '../CourseDetailModal';
import showAlert from '../alert';
import { useToast } from '../components/ui/Toast';
import { useRegistrationTerm, resolveRegistrationTerm, scheduleTermOptions } from '../term';
import { afterModalDismiss } from '../modal-sequencing';
import { writeCacheFile } from '../ics-export';
import { STONE, FONT, FONT_SEMI, FONT_MED, MAROON, OK, WARN, DANGER, PARCHMENT } from '../theme';

// Same pattern as ProfileScreen: RN Modal covers the status bar / notch on iOS.
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

// The registration term comes from term.js (useRegistrationTerm inside the
// component) so every screen agrees on it and follows the published terms.

// Rough end-of-term for the ICS weekly RRULE UNTIL (mid-May / late Dec).
function getTermEndDate(term) {
  const year = parseInt(String(term.label).split(' ')[1], 10) || new Date().getFullYear();
  return term.label.startsWith('Spring') ? new Date(year, 4, 15) : new Date(year, 11, 20);
}

// =============================================================================
// WALK-TIME HELPER (screen-local; schedule-utils stays pure)
// =============================================================================

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Substring/prefix-tolerant match: section rows carry things like
// 'Life Science Building-Room 412' — match the longest building name that is
// contained in (or contains) the raw string.
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

function makeWalkMinutes(buildings) {
  return (fromRaw, toRaw) => {
    const a = matchBuilding(buildings, fromRaw);
    const b = matchBuilding(buildings, toRaw);
    if (!a || !b) return null;
    if (a.id === b.id) return 0;
    if (
      !Number.isFinite(a.latitude) || !Number.isFinite(a.longitude) ||
      !Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)
    ) return null;
    const meters = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude) * 1.3;
    return Math.round(meters / 80);
  };
}

// =============================================================================
// SMALL PRESENTATIONAL PIECES
// =============================================================================

const courseCodeOf = (section) =>
  `${section.subject || ''} ${section.catalog_number || ''}`.trim();

// firestore-data maps courses/{code}.fillStats to legacy snake_case
// (fill_stats.cap_changed); planning-insights.fillWarning expects the
// analysis-side camelCase names. Bridge the two here.
const toFillStats = (fs) =>
  fs && typeof fs === 'object' ? { class: fs.class, capChanged: fs.cap_changed === true } : null;

// Same normalization planning-insights uses for coverage matching.
const normCode = (code) =>
  String(code || '').trim().replace(/\s+/g, ' ').toUpperCase();

const PACING_DOT_COLORS = {
  'on-track': OK.fg,
  'at-risk': WARN.fg,
  'off-track': DANGER.fg,
};

const meetingSummary = (section) => {
  const days = (section.meeting_days || '').split('\n')[0];
  if (!days || days === 'TBA') return 'TBA';
  return section.meeting_time_start
    ? `${days} ${section.meeting_time_start} - ${section.meeting_time_end}`
    : days;
};

const StatusBadge = ({ section }) => {
  const status = (section.status || '').toLowerCase();
  let style = s.badgeOpen;
  let label = section.status || 'Open';
  if (status.includes('closed')) style = s.badgeFull;
  else if (status.includes('wait')) style = s.badgeLow;
  return (
    <View style={[s.badge, style]}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
};

// A section can be watched for open seats when it is explicitly not open
// (Closed / Wait List). Open sections need no watch; blank/removed statuses
// get no bell either.
const isWatchable = (section) => {
  const status = String(section.status || '').toLowerCase();
  return status.includes('closed') || status.includes('wait');
};

// Bell toggle for seat watches. `disabled` = anonymous user (no uid to own
// users/{uid}/watches) — rendered dimmed and inert.
const WatchToggle = ({ watching, disabled, onPress }) => (
  <TouchableOpacity
    style={[s.watchBtn, watching && s.watchBtnActive, disabled && s.watchBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={watching ? 'Stop watching for open seats' : 'Watch for open seats'}
  >
    <View style={s.watchBtnInner}>
      <Ionicons
        name={watching ? 'notifications' : 'notifications-outline'}
        size={12}
        color={watching ? '#FFFFFF' : MAROON}
      />
      <Text style={[s.watchBtnText, watching && s.watchBtnTextActive]}>
        {watching ? 'Watching' : 'Watch'}
      </Text>
    </View>
  </TouchableOpacity>
);

const ModalSectionRow = ({ section, added, onPress, watching, canWatch, onToggleWatch }) => (
  <TouchableOpacity style={[s.sectionRow, added && { opacity: 0.45 }]} onPress={onPress}>
    <View style={s.sectionTop}>
      <Text style={s.sectionNum}>
        Sec {section.section_number}{added ? '  · added' : ''}
      </Text>
      <StatusBadge section={section} />
    </View>
    <Text style={s.sectionInfo}>{meetingSummary(section)}</Text>
    <View style={s.sectionMeta}>
      {section.instructor ? <Text style={s.sectionInstructor}>{section.instructor}</Text> : null}
      {section.enrollment_cap > 0 ? (
        <Text style={s.sectionSeats}>
          {section.enrollment_total}/{section.enrollment_cap} seats
        </Text>
      ) : null}
      {section.building ? (
        <Text style={s.sectionRoom} numberOfLines={1}>{section.room || section.building}</Text>
      ) : null}
    </View>
    {isWatchable(section) ? (
      <WatchToggle watching={watching} disabled={!canWatch} onPress={onToggleWatch} />
    ) : null}
  </TouchableOpacity>
);

// =============================================================================
// MAIN SCREEN
// =============================================================================

const ScheduleScreen = () => {
  const {
    user, selectedProgram, selectedProgram2, selectedMinors, selectedFocus,
    graduationYear, classYear, isHonors, isAthlete, userLocations, quizResults,
  } = useAppContext();
  const uid = user?.uid;
  const signedIn = !!user && !user.isAnonymous;
  // The tab opens on the term being registered for, and can be switched to
  // the term in session (the classes being taken now) when that is a
  // different term. viewTermCode null = follow the registration term.
  const registrationTerm = useRegistrationTerm();
  const [viewTermCode, setViewTermCode] = useState(null);
  const termOptions = useMemo(() => scheduleTermOptions(registrationTerm), [registrationTerm]);
  const TERM = termOptions.find((t) => t.code === viewTermCode) || registrationTerm;

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);        // legacy section rows on the schedule
  const [scheduleIds, setScheduleIds] = useState([]);  // class_number strings
  const toast = useToast();
  // A toast's Undo runs seconds later, maybe after the term chip was switched.
  // It works on the term the change was made in (the term-scoped helpers
  // read and write that term's schedule, queued behind any other schedule
  // write) and reloads only if that term is still the one on screen.
  const termCodeRef = useRef(TERM.code);
  termCodeRef.current = TERM.code;
  const loadScheduleRef = useRef(null);
  const undoFor = (termCode, revert) => async () => {
    const res = await revert();
    if (!res) {
      showAlert("Couldn't undo", 'Check your connection, then make the change again.');
      return;
    }
    if (termCodeRef.current === termCode && loadScheduleRef.current) loadScheduleRef.current();
  };
  const [buildings, setBuildings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false); // read error ≠ empty schedule

  // Seat watches: Set of watched class_number strings + resolved section rows
  // for the 'Watching' list. Watches must never break the schedule UI.
  const [watched, setWatched] = useState(() => new Set());
  const [watchRows, setWatchRows] = useState([]);
  const [watchHintVisible, setWatchHintVisible] = useState(false);
  const watchHintShownRef = useRef(false); // show the push hint once per mount

  // Degree/core progress for the pacing strip + add-modal markers.
  // null = hidden (not loaded, no program/year, or fetch failed) — planning
  // insights must never break the schedule UI.
  const [planning, setPlanning] = useState(null);

  // Add-class modal state
  const [addVisible, setAddVisible] = useState(false);
  const [genVisible, setGenVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [detailSection, setDetailSection] = useState(null); // grid-tapped legacy row (course detail modal)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickedCourse, setPickedCourse] = useState(null); // {code, name}
  const [courseSections, setCourseSections] = useState(null);
  const [courseSectionsLoading, setCourseSectionsLoading] = useState(false);
  const debounceRef = useRef(null);
  const searchSeqRef = useRef(0); // bumped to invalidate pending/in-flight searches
  const pickSeqRef = useRef(0); // bumped to invalidate in-flight section fetches

  // Clear any pending search debounce on unmount (avoids setState after unmount).
  useEffect(() => () => {
    searchSeqRef.current += 1;
    pickSeqRef.current += 1;
    clearTimeout(debounceRef.current);
  }, []);

  // ---------------------------------------------------------------- loading
  const loadSchedule = useCallback(async () => {
    if (!signedIn) { setLoading(false); return; }
    setLoading(true);
    try {
      const sched = await fetchSchedule(uid, TERM.code); // throws on read error
      const ids = sched?.section_ids || [];
      if (ids.length > 0) {
        const rows = await getSectionsByClassNumbers(TERM.code, ids);
        setSections(rows || []);
        // Prune ghost ids: sections deleted/removed from LOCUS vanish from the
        // rows but would otherwise stay in scheduleIds forever, silently eating
        // the 40-slot cap. Base future saves on the surviving ids.
        const surviving = (rows || []).map((r) => String(r.class_number));
        setScheduleIds(surviving.length !== ids.length ? surviving : ids);
      } else {
        setScheduleIds([]);
        setSections([]);
      }
      setLoadFailed(false);
    } catch (e) {
      // Read failed (network blip / offline). Keep whatever state we had and
      // flag the failure so writes can't clobber a schedule we never read.
      setLoadFailed(true);
    }
    setLoading(false);
  }, [uid, signedIn, TERM.code]);
  loadScheduleRef.current = loadSchedule; // the current term's, for Undo

  // Load this term's seat watches + resolve them to section rows for the
  // 'Watching' list. fetchWatches/getSectionsByClassNumbers return [] on
  // failure, so a blip clears to empty rather than crashing.
  const loadWatches = useCallback(async (isActive) => {
    if (!signedIn) {
      if (isActive()) { setWatched(new Set()); setWatchRows([]); }
      return;
    }
    const watches = await fetchWatches(uid, TERM.code);
    const nums = watches.map((w) => String(w.class_number)).filter(Boolean);
    const rows = nums.length ? await getSectionsByClassNumbers(TERM.code, nums) : [];
    if (isActive()) {
      setWatched(new Set(nums));
      setWatchRows(rows || []);
    }
  }, [uid, signedIn, TERM.code]);

  // One-time hint when the Watching list first becomes non-empty.
  useEffect(() => {
    if (watchRows.length > 0 && !watchHintShownRef.current) {
      watchHintShownRef.current = true;
      setWatchHintVisible(true);
    }
  }, [watchRows]);

  // Mirrors Home.js's loadOutlook: needs a signed-in user with a real
  // (non-undecided) program and a graduation year; otherwise the strip hides.
  const loadPlanning = useCallback(async (isActive) => {
    if (
      !signedIn ||
      !selectedProgram ||
      selectedProgram.id === 'undecided' ||
      !graduationYear
    ) {
      if (isActive()) setPlanning(null);
      return;
    }
    try {
      const otherPrograms = [selectedProgram2, ...(selectedMinors || [])].filter(
        (p) => p && p.id != null
      );
      // firestore-data wrappers return null on failure (never throw).
      const [degreeProgress, coreProgress, ...additionalDegreeProgress] =
        await Promise.all([
          fetchDegreeProgress(uid, selectedProgram.id),
          fetchUserCoreProgress(uid, selectedProgram.school),
          ...otherPrograms.map((p) => fetchDegreeProgress(uid, p.id)),
        ]);
      if (isActive()) {
        setPlanning(degreeProgress ? { degreeProgress, coreProgress, additionalDegreeProgress } : null);
      }
    } catch (e) {
      if (isActive()) setPlanning(null);
    }
  }, [uid, signedIn, selectedProgram, selectedProgram2, selectedMinors, graduationYear]);

  // Ref, not state-dep: keying the focus effect on buildings.length made the
  // whole effect (loadSchedule + loadPlanning) re-run when the buildings fetch
  // resolved on first focus. The ref self-heals failed fetches on later focuses
  // without re-triggering the other loaders.
  const buildingsLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const isActive = () => active;
      resolveRegistrationTerm(); // retries if the published terms weren't reachable earlier
      loadSchedule();
      loadPlanning(isActive);
      loadWatches(isActive);
      if (!buildingsLoadedRef.current) {
        fetchBuildings().then((b) => {
          const list = b || [];
          if (list.length > 0) buildingsLoadedRef.current = true;
          if (active) setBuildings(list);
        }).catch(() => {});
      }
      return () => { active = false; };
    }, [loadSchedule, loadPlanning, loadWatches])
  );

  // ---------------------------------------------------------------- derived
  const blocks = useMemo(() => sectionsToBlocks(sections), [sections]);
  const bounds = useMemo(() => gridBounds(blocks), [blocks]);
  const conflicts = useMemo(() => findConflicts(blocks), [blocks]);
  const unscheduled = useMemo(() => unscheduledSections(sections), [sections]);
  const walkMinutes = useMemo(() => makeWalkMinutes(buildings), [buildings]);
  // Generator personalization (F-HI4): null until buildings load so the
  // generator just skips campus scoring instead of resolving everything null.
  const sectionCampus = useMemo(
    () => (buildings.length ? (section) => campusOf(section?.building, buildings) : null),
    [buildings]
  );
  const tightGaps = useMemo(
    () => (buildings.length ? findTightGaps(blocks, walkMinutes) : []),
    [blocks, walkMinutes, buildings]
  );

  const warnings = useMemo(() => {
    const out = [];
    // Conflicts: group day-block pairs per course pair.
    const pairDays = new Map();
    for (const { a, b } of conflicts) {
      const [l1, l2] = [a.label, b.label].sort();
      const key = `${l1}|${l2}`;
      if (!pairDays.has(key)) pairDays.set(key, new Set());
      pairDays.get(key).add(a.day);
    }
    for (const [key, days] of pairDays) {
      const [l1, l2] = key.split('|');
      out.push({ kind: 'conflict', text: `${l1} overlaps ${l2} (${[...days].join(', ')})` });
    }
    for (const g of tightGaps) {
      const from = matchBuilding(buildings, g.from.section?.building);
      const to = matchBuilding(buildings, g.to.section?.building);
      const fromName = from?.name || g.from.section?.building || '?';
      const toName = to?.name || g.to.section?.building || '?';
      out.push({
        kind: 'gap',
        text: `${g.gapMin} min gap, about ${g.walkMin} min walk: ${fromName} to ${toName} (${g.from.day})`,
      });
    }
    return out;
  }, [conflicts, tightGaps, buildings]);

  // Pacing strip: coverage of the current schedule against remaining
  // requirements + graduation-outlook pace. null = strip hidden.
  const pacing = useMemo(() => {
    if (!planning) return null;
    try {
      const plannedCourseCodes = [...new Set(sections.map(courseCodeOf).filter(Boolean))];
      const coverage = requirementCoverage({
        degreeProgress: planning.degreeProgress,
        additionalDegreeProgress: planning.additionalDegreeProgress,
        coreProgress: planning.coreProgress,
        plannedCourseCodes,
      });
      const outlook = computeGraduationOutlook({
        degreeProgress: planning.degreeProgress,
        additionalDegreeProgress: planning.additionalDegreeProgress,
        coreProgress: planning.coreProgress,
        graduationYear,
      });
      if (outlook.status === 'unknown') return null;
      const line = coverageSummaryLine({
        coveredCount: coverage.coveredCount,
        plannedCount: coverage.planned.length,
        neededPerSemester: outlook.pace,
      });
      if (!line) return null;
      return { line, dotColor: PACING_DOT_COLORS[outlook.status] || STONE };
    } catch (e) {
      return null; // insights never break the schedule UI
    }
  }, [planning, sections, graduationYear]);

  // Add-modal: which of the current search results sit in the
  // remaining-requirements universe ('✓ Counts toward your degree').
  const coveredResultCodes = useMemo(() => {
    if (!planning || results.length === 0) return null;
    try {
      const coverage = requirementCoverage({
        degreeProgress: planning.degreeProgress,
        additionalDegreeProgress: planning.additionalDegreeProgress,
        coreProgress: planning.coreProgress,
        plannedCourseCodes: results.map((r) => r.code),
      });
      return new Set(
        coverage.planned.filter((p) => p.satisfies.length > 0).map((p) => p.code)
      );
    } catch (e) {
      return null;
    }
  }, [planning, results]);

  // F-P4: personalized quick-adds shown in the add modal (and the generator)
  // before any search — shared ../recommend ordering over the user's remaining
  // requirements + focus-area courses (tagged isFocus). Placeholders and
  // courses already on the schedule are excluded.
  const recommendedCourses = useMemo(() => {
    const onSchedule = new Set(sections.map((sec) => normCode(courseCodeOf(sec))));
    return buildRecommendations({
      remaining: planning?.degreeProgress?.remaining,
      focusCourses: selectedFocus?.courses,
      excludeCodes: onSchedule,
      limit: 6,
    });
  }, [planning, sections, selectedFocus]);

  // Section-picker header: fill-speed warning line for the picked course.
  const pickedWarning = useMemo(() => {
    try {
      return pickedCourse
        ? fillWarning(toFillStats(pickedCourse.fill_stats), classYear, { isHonors, isAthlete })
        : null;
    } catch (e) {
      return null;
    }
  }, [pickedCourse, classYear, isHonors, isAthlete]);

  // ------------------------------------------------------------------- save
  const persistIds = useCallback(async (ids) => {
    if (loadFailed) {
      showAlert(
        'Schedule not loaded',
        "Your saved schedule couldn't be loaded, so changes are disabled to protect it. Retry loading first."
      );
      return false;
    }
    setSaving(true);
    const res = await saveSchedule(uid, TERM.code, ids);
    setSaving(false);
    if (!res) {
      showAlert('Save failed', 'Could not update your schedule. Please try again.');
      return false;
    }
    await loadSchedule();
    return true;
  }, [uid, loadSchedule, loadFailed, TERM.code]);

  // -------------------------------------------------------------------- add
  const closeAddModal = () => {
    searchSeqRef.current += 1; // invalidate any pending/in-flight search
    pickSeqRef.current += 1; // invalidate any in-flight section fetch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAddVisible(false);
    setQuery('');
    setResults([]);
    setSearchLoading(false);
    setPickedCourse(null);
    setCourseSections(null);
  };

  const onSearchChange = (text) => {
    setQuery(text);
    setPickedCourse(null);
    setCourseSections(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++searchSeqRef.current;
    if (!text.trim()) { setResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      let found = [];
      try {
        found = (await searchCourses(text.trim())) || [];
      } catch (e) { found = []; }
      if (seq !== searchSeqRef.current) return; // stale: closed, unmounted, or newer query
      setResults(found.slice(0, 40));
      setSearchLoading(false);
    }, 250);
  };

  const pickCourse = async (course) => {
    const seq = ++pickSeqRef.current;
    setPickedCourse(course);
    setCourseSections(null);
    setCourseSectionsLoading(true);
    let secs = [];
    try {
      secs = (await getCourseSections(TERM.code, course.code)) || [];
    } catch (e) {
      secs = [];
    }
    if (seq !== pickSeqRef.current) return; // stale: another course picked, back-to-results, or modal closed
    setCourseSections(secs);
    setCourseSectionsLoading(false);
  };

  const addSection = (section) => {
    if (saving) return; // a save is in flight — a second tap would race it and lose the first add
    if (loadFailed) {
      showAlert(
        'Schedule not loaded',
        "Your saved schedule couldn't be loaded, so adding is disabled to protect it. Retry loading first."
      );
      return;
    }
    const classNum = String(section.class_number);
    if (scheduleIds.includes(classNum)) {
      showAlert('Already added', `${courseCodeOf(section)} (class ${classNum}) is already on your schedule.`);
      return;
    }
    if (scheduleIds.length >= 40) {
      showAlert('Schedule full', 'A schedule can hold at most 40 sections. Remove one to add another.');
      return;
    }
    const doAdd = async () => {
      const ok = await persistIds([...scheduleIds, classNum]);
      if (ok) {
        closeAddModal();
        toast.show({
          message: `${courseCodeOf(section)} Sec ${section.section_number} added.`,
          actionLabel: 'Undo',
          onAction: undoFor(TERM.code, () => removeSectionFromSchedule(uid, TERM.code, classNum)),
        });
      }
    };
    // Conflict check against the current schedule — warn but allow.
    const candidateBlocks = sectionsToBlocks([...sections, section]);
    const newConflicts = findConflicts(candidateBlocks).filter(
      ({ a, b }) =>
        (String(a.section.class_number) === classNum) !== (String(b.section.class_number) === classNum)
    );
    if (newConflicts.length > 0) {
      const other = newConflicts.map(({ a, b }) =>
        String(a.section.class_number) === classNum ? b.label : a.label
      );
      showAlert(
        'Time conflict',
        `${courseCodeOf(section)} overlaps ${[...new Set(other)].join(', ')}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add anyway', onPress: doAdd },
        ]
      );
      return;
    }
    doAdd();
  };

  // ----------------------------------------------------------------- remove
  const confirmRemove = (section) => {
    const classNum = String(section.class_number);
    const code = courseCodeOf(section);
    showAlert(
      code,
      `${section.title || ''}\n${meetingSummary(section)}${section.instructor ? `\n${section.instructor}` : ''}`.trim(),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove from schedule',
          style: 'destructive',
          onPress: async () => {
            const ok = await persistIds(scheduleIds.filter((id) => id !== classNum));
            if (!ok) return;
            toast.show({
              message: `${code} removed.`,
              actionLabel: 'Undo',
              onAction: undoFor(TERM.code, () => addSectionToSchedule(uid, TERM.code, classNum)),
            });
          },
        },
      ]
    );
  };

  // ------------------------------------------------------------ seat watches
  // Optimistic flip of the bell + Watching list; reverted with an alert if the
  // Firestore write fails. `section` is a full legacy row so the Watching list
  // can show it immediately without a refetch.
  const toggleWatch = useCallback(async (section) => {
    if (!signedIn) return; // bell is rendered disabled for anonymous users
    const classNum = String(section.class_number);
    const wasWatching = watched.has(classNum);

    const applyWatching = (nowWatching) => {
      setWatched((prev) => {
        const next = new Set(prev);
        if (nowWatching) next.add(classNum); else next.delete(classNum);
        return next;
      });
      setWatchRows((prev) => {
        const has = prev.some((r) => String(r.class_number) === classNum);
        if (nowWatching) return has ? prev : [...prev, section];
        return has ? prev.filter((r) => String(r.class_number) !== classNum) : prev;
      });
    };

    applyWatching(!wasWatching);
    const res = wasWatching
      ? await removeWatch(uid, classNum)
      : await addWatch(uid, TERM.code, classNum);
    if (!res) {
      applyWatching(wasWatching); // revert
      showAlert('Watch update failed', 'Could not update your seat watch. Please try again.');
    }
  }, [uid, signedIn, watched, TERM.code]);

  const confirmUnwatch = (section) => {
    showAlert(
      courseCodeOf(section),
      `Stop watching Sec ${section.section_number} for open seats?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop watching', style: 'destructive', onPress: () => toggleWatch(section) },
      ]
    );
  };

  // ----------------------------------------------------------------- export
  const exportIcs = async () => {
    try {
      if (!sections.length) {
        showAlert('Nothing to export', 'Add some classes first.');
        return;
      }
      const ics = buildIcs(sections, getTermEndDate(TERM));
      const uri = await writeCacheFile(`schedule-${TERM.code}.ics`, ics);
      if (!uri) {
        showAlert('Export failed', 'No writable directory available on this device.');
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        showAlert('Sharing unavailable', 'This device cannot share files.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'text/calendar', dialogTitle: `My ${TERM.label} Schedule` });
    } catch (e) {
      showAlert('Export failed', 'Could not export your schedule. Please try again.');
    }
  };

  // ----------------------------------------------------------------- render
  if (!signedIn) {
    return (
      <View style={s.centerWrap}>
        <Text accessibilityRole="header" style={s.title}>My Schedule</Text>
        <Text style={s.emptyTitle}>Sign in to build your schedule</Text>
        <Text style={s.emptyHint}>Your saved classes will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={s.title}>My Schedule</Text>
          {termOptions.length > 1 ? (
            <View style={s.termRow}>
              {termOptions.map((t) => {
                const active = t.code === TERM.code;
                return (
                  <TouchableOpacity
                    key={t.code}
                    style={[s.termChip, active && s.termChipActive]}
                    onPress={() => setViewTermCode(t.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${t.label} schedule`}
                  >
                    <Text style={[s.termChipText, active && s.termChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={s.subtitle}>{TERM.label}</Text>
          )}
        </View>
        <TouchableOpacity style={s.headerBtn} onPress={exportIcs} accessibilityLabel="Export schedule">
          <Ionicons name="share-outline" size={19} color={MAROON} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => setMapVisible(true)}
          accessibilityLabel="Day map"
        >
          <Ionicons name="map-outline" size={18} color={MAROON} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => setGenVisible(true)}
          accessibilityLabel="Generate schedule"
        >
          <Ionicons name="sparkles-outline" size={18} color={MAROON} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.headerBtn, s.headerBtnPrimary]}
          onPress={() => setAddVisible(true)}
          accessibilityLabel="Add class"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={MAROON} />
          <Text style={s.loadingText}>Loading your schedule...</Text>
        </View>
      ) : loadFailed ? (
        <View style={s.centerWrap}>
          <Text style={s.emptyTitle}>Couldn't load your schedule</Text>
          <Text style={s.emptyHint}>Check your connection and try again.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadSchedule} accessibilityLabel="Retry loading schedule">
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sections.length === 0 ? (
        <View style={s.centerWrap}>
          <Text style={s.emptyTitle}>No classes yet. Tap + to add</Text>
          <Text style={s.emptyHint}>Search any course and pick a section.</Text>
        </View>
      ) : (
        <>
          {/* Warnings banner */}
          {warnings.length > 0 && (
            <View style={s.warnBanner}>
              {warnings.map((w, i) => (
                <View key={i} style={s.warnRow}>
                  <Ionicons
                    name={w.kind === 'conflict' ? 'close-circle' : 'warning-outline'}
                    size={13}
                    color={w.kind === 'conflict' ? '#b00020' : '#8a6d1d'}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={[s.warnText, w.kind === 'conflict' && s.warnTextConflict]}>
                    {w.text}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Pacing strip: requirement coverage + graduation pace */}
          {pacing && (
            <View style={s.pacingStrip}>
              <View style={[s.pacingDot, { backgroundColor: pacing.dotColor }]} />
              <Text style={s.pacingText}>{pacing.line}</Text>
            </View>
          )}

          {/* Grid */}
          <View style={{ flex: 1 }}>
            <ScheduleGrid
              blocks={blocks}
              conflicts={conflicts}
              startHour={bounds.startHour}
              endHour={bounds.endHour}
              days={bounds.days}
              onPressBlock={(block) => setDetailSection(block.section)}
            />
          </View>

          {/* Unscheduled (TBA) sections */}
          {unscheduled.length > 0 && (
            <View style={s.unschedWrap}>
              <Text accessibilityRole="header" style={s.unschedTitle}>Unscheduled</Text>
              <ScrollView style={{ maxHeight: 140 }}>
                {unscheduled.map((sec) => (
                  <TouchableOpacity
                    key={sec.class_number}
                    style={s.unschedRow}
                    onPress={() => confirmRemove(sec)}
                  >
                    <Text style={s.unschedCode}>{courseCodeOf(sec)}</Text>
                    <Text style={s.unschedDetail} numberOfLines={1}>
                      {sec.title || ''} · TBA{sec.instructor ? ` · ${sec.instructor}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {/* Watching (seat watches) — shown under Unscheduled; also visible when
          the schedule itself is empty, since watches live independently. */}
      {!loading && !loadFailed && watchRows.length > 0 && (
        <View style={s.watchWrap}>
          <Text accessibilityRole="header" style={s.watchTitle}>Watching</Text>
          {watchHintVisible && (
            <Text style={s.watchHintText}>
              You'll get a push when a seat opens (requires the mobile app build).
            </Text>
          )}
          <ScrollView style={{ maxHeight: 140 }}>
            {watchRows.map((sec) => (
              <TouchableOpacity
                key={String(sec.class_number)}
                style={s.watchRow}
                onPress={() => confirmUnwatch(sec)}
                accessibilityLabel={`Stop watching ${courseCodeOf(sec)}`}
              >
                <Text style={s.watchRowCode} numberOfLines={1}>
                  {courseCodeOf(sec)}
                  {sec.section_number ? ` · Sec ${sec.section_number}` : ''}
                </Text>
                <StatusBadge section={sec} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {saving && (
        <View style={s.savingOverlay} pointerEvents="none">
          <ActivityIndicator color={MAROON} />
        </View>
      )}

      {/* ====================== COURSE-DETAIL MODAL (grid tap) ================== */}
      <CourseDetailModal
        visible={!!detailSection}
        course={
          detailSection
            ? { code: courseCodeOf(detailSection), name: detailSection.title }
            : null
        }
        section={detailSection}
        sections={null}
        onClose={() => setDetailSection(null)}
        onRemove={(sec) => {
          // Confirm only once the detail modal is gone (see modal-sequencing.js).
          setDetailSection(null);
          afterModalDismiss(() => confirmRemove(sec));
        }}
      />

      {/* =========================== DAY-MAP MODAL ============================== */}
      <ScheduleMapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        sections={sections}
        buildings={buildings}
        home={(userLocations || []).find((l) => l.is_primary) || null}
      />

      {/* ======================= GENERATE-SCHEDULE MODAL ======================== */}
      <GenerateScheduleModal
        visible={genVisible}
        onClose={() => setGenVisible(false)}
        termCode={TERM.code}
        termLabel={TERM.label}
        currentSections={sections}
        walkMinutes={walkMinutes}
        schedulingPrefs={quizResults?.schedulingPrefs || null}
        sectionCampus={sectionCampus}
        recommended={recommendedCourses}
        onApply={persistIds}
      />

      {/* ============================ ADD-CLASS MODAL ============================ */}
      <Modal visible={addVisible} animationType="slide" onRequestClose={closeAddModal}>
        <View accessibilityViewIsModal style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text accessibilityRole="header" style={s.modalTitle}>Add a Class</Text>
            <TouchableOpacity onPress={closeAddModal} style={s.modalClose}>
              <Text style={s.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={s.searchInput}
            placeholder="Search courses (e.g. COMP 170)"
            placeholderTextColor={STONE}
            value={query}
            onChangeText={onSearchChange}
            autoCorrect={false}
            autoCapitalize="characters"
            returnKeyType="search"
          />

          {pickedCourse ? (
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => {
                  pickSeqRef.current += 1; // invalidate any in-flight section fetch
                  setPickedCourse(null);
                  setCourseSections(null);
                  setCourseSectionsLoading(false);
                }}
              >
                <Text style={s.backLink}>‹ Back to results</Text>
              </TouchableOpacity>
              <Text style={s.pickedCode}>{pickedCourse.code}</Text>
              <Text style={s.pickedName}>{pickedCourse.name}</Text>
              {pickedWarning && (pickedWarning.level === 'high' || pickedWarning.level === 'warn') ? (
                <View
                  style={[
                    s.pickedFillWarn,
                    pickedWarning.level === 'high' ? s.pickedFillWarnHigh : s.pickedFillWarnAmber,
                  ]}
                >
                  <Ionicons
                    name="flash"
                    size={13}
                    color={pickedWarning.level === 'high' ? DANGER.fg : WARN.fg}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    style={[
                      s.pickedFillWarnText,
                      { color: pickedWarning.level === 'high' ? DANGER.fg : WARN.fg },
                    ]}
                  >
                    {pickedWarning.text}
                  </Text>
                </View>
              ) : null}
              {courseSectionsLoading ? (
                <ActivityIndicator color={MAROON} style={{ marginTop: 24 }} />
              ) : courseSections && courseSections.length > 0 ? (
                <FlatList
                  data={courseSections}
                  keyExtractor={(item) => String(item.class_number)}
                  renderItem={({ item }) => (
                    <ModalSectionRow
                      section={item}
                      added={scheduleIds.includes(String(item.class_number))}
                      onPress={() => addSection(item)}
                      watching={watched.has(String(item.class_number))}
                      canWatch={signedIn}
                      onToggleWatch={() => toggleWatch(item)}
                    />
                  )}
                  contentContainerStyle={{ paddingBottom: 30 }}
                />
              ) : (
                <Text style={s.noMatchText}>No sections for {TERM.label}</Text>
              )}
            </View>
          ) : searchLoading ? (
            <ActivityIndicator color={MAROON} style={{ marginTop: 24 }} />
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.code || String(item.id)}
              renderItem={({ item }) => {
                const fw = fillWarning(toFillStats(item.fill_stats), classYear, { isHonors, isAthlete });
                const counts = !!(coveredResultCodes && coveredResultCodes.has(normCode(item.code)));
                return (
                  <TouchableOpacity style={s.courseRow} onPress={() => pickCourse(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.courseRowCode}>{item.code}</Text>
                      <Text style={s.courseRowName} numberOfLines={1}>{item.name}</Text>
                      {counts ? (
                        <View style={s.countsRow}>
                          <Ionicons name="checkmark-circle" size={12} color={OK.fg} />
                          <Text style={s.countsMarker}>Counts toward your degree</Text>
                        </View>
                      ) : null}
                    </View>
                    {fw ? (
                      fw.level === 'info' ? (
                        <Ionicons name="flash-outline" size={15} color="#B3ABA1" />
                      ) : (
                        <View style={[s.fillBadge, fw.level === 'high' ? s.fillBadgeHigh : s.fillBadgeAmber]}>
                          <Ionicons
                            name="flash"
                            size={11}
                            color={fw.level === 'high' ? DANGER.fg : WARN.fg}
                          />
                          <Text
                            style={[
                              s.fillBadgeText,
                              fw.level === 'high' ? s.fillBadgeTextHigh : s.fillBadgeTextAmber,
                            ]}
                          >
                            Fills fast
                          </Text>
                        </View>
                      )
                    ) : null}
                    <Text style={s.courseRowChevron}>›</Text>
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 30 }}
            />
          ) : query.trim().length > 0 ? (
            <Text style={s.noMatchText}>No courses found</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {recommendedCourses.length > 0 ? (
                <View style={s.recWrap}>
                  <Text accessibilityRole="header" style={s.recTitle}>Recommended for you</Text>
                  <Text style={s.recSub}>Your remaining requirements and focus courses</Text>
                  {recommendedCourses.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={s.courseRow}
                      onPress={() => pickCourse(c)}
                      accessibilityLabel={`Recommended ${c.code}`}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={s.recCodeRow}>
                          <Text style={s.courseRowCode}>{c.code}</Text>
                          {c.isFocus ? (
                            <View style={s.focusPill}>
                              <Ionicons name="star" size={10} color="#FFFFFF" />
                              <Text style={s.focusPillText}>Focus</Text>
                            </View>
                          ) : null}
                        </View>
                        {c.name ? <Text style={s.courseRowName} numberOfLines={1}>{c.name}</Text> : null}
                      </View>
                      <Text style={s.courseRowChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <Text style={s.noMatchText}>Search by course code or name</Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PARCHMENT },
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: PARCHMENT, paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontFamily: FONT, fontSize: 28, color: MAROON },
  subtitle: { fontFamily: FONT, fontSize: 15, color: STONE, marginTop: -2 },
  // Term switcher (shown in place of the subtitle when two terms are open)
  termRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  termChip: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
    borderWidth: 1, borderColor: '#D8D8D8', backgroundColor: '#FFFFFF',
  },
  termChipActive: { borderColor: MAROON, backgroundColor: MAROON },
  termChipText: { fontFamily: FONT, fontSize: 14, color: '#666' },
  termChipTextActive: { color: '#FFFFFF' },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, marginLeft: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: MAROON, backgroundColor: '#FFFFFF',
  },
  headerBtnPrimary: { backgroundColor: MAROON },
  headerBtnText: { fontFamily: FONT, fontSize: 18, color: MAROON, marginTop: -2 },
  headerBtnTextPrimary: { color: '#FFFFFF', fontFamily: FONT, fontSize: 22 },

  // Warnings banner
  warnBanner: {
    backgroundColor: '#FFF8E6', borderBottomWidth: 1, borderBottomColor: '#F3E3B8',
    paddingHorizontal: 14, paddingVertical: 8, gap: 3,
  },
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  warnText: { flex: 1, fontFamily: FONT, fontSize: 15, color: '#8a6d1d', lineHeight: 19 },
  warnTextConflict: { color: '#b00020', fontWeight: '600' },
  watchBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Pacing strip (requirement coverage + graduation pace)
  pacingStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#FBF6F8',
    borderLeftWidth: 3, borderLeftColor: MAROON,
    borderBottomWidth: 1, borderBottomColor: '#F0E6EB',
  },
  pacingDot: { width: 8, height: 8, borderRadius: 4 },
  pacingText: { flex: 1, fontFamily: FONT, fontSize: 14, color: '#555' },

  // Unscheduled
  unschedWrap: {
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  unschedTitle: {
    fontFamily: FONT_SEMI, fontSize: 17,
    color: MAROON, marginBottom: 4,
  },
  unschedRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  unschedCode: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  unschedDetail: { fontSize: 12, color: STONE, marginTop: 1 },

  // Watching (seat watches)
  watchWrap: {
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  watchTitle: {
    fontFamily: FONT_SEMI, fontSize: 17,
    color: MAROON, marginBottom: 4,
  },
  watchHintText: { fontSize: 11, color: STONE, marginBottom: 4 },
  watchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 8,
  },
  watchRowCode: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#333' },

  // Bell toggle (section rows)
  watchBtn: {
    alignSelf: 'flex-start', marginTop: 6,
    borderRadius: 14, paddingVertical: 3, paddingHorizontal: 10,
    borderWidth: 1, borderColor: MAROON, backgroundColor: '#FFFFFF',
  },
  watchBtnActive: { backgroundColor: MAROON },
  watchBtnDisabled: { opacity: 0.4 },
  watchBtnText: { fontFamily: FONT_MED, fontSize: 14, color: MAROON },
  watchBtnTextActive: { color: '#FFFFFF' },

  // Loading / empty
  loadingText: { fontFamily: FONT, fontSize: 16, color: STONE, marginTop: 12 },
  emptyTitle: { fontFamily: FONT, fontSize: 22, color: STONE, textAlign: 'center' },
  emptyHint: { fontFamily: FONT, fontSize: 15, color: STONE, marginTop: 6, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 28,
    backgroundColor: MAROON,
  },
  retryBtnText: { color: '#FFFFFF', fontFamily: FONT_SEMI, fontSize: 15, },

  savingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: STATUSBAR_HEIGHT },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  modalTitle: { flex: 1, fontFamily: FONT, fontSize: 26, color: MAROON },
  modalClose: { padding: 6 },
  modalCloseText: { fontFamily: FONT_SEMI, fontSize: 16, color: MAROON, },
  searchInput: {
    fontFamily: FONT, fontSize: 17, color: '#333',
    backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 16,
    height: 44, marginHorizontal: 16, marginBottom: 8,
  },
  backLink: { fontFamily: FONT, fontSize: 14, color: MAROON, paddingHorizontal: 16, paddingVertical: 6 },
  pickedCode: {
    fontFamily: FONT_SEMI, fontSize: 22, 
    color: '#333', paddingHorizontal: 16,
  },
  pickedName: {
    fontFamily: FONT, fontSize: 15, color: '#555',
    paddingHorizontal: 16, marginBottom: 6,
  },
  noMatchText: {
    fontFamily: FONT, fontSize: 15, color: STONE,
    textAlign: 'center', padding: 24,
  },
  // F-P4 recommended rail (add modal, pre-search)
  recWrap: { paddingTop: 8 },
  recTitle: {
    fontFamily: FONT, fontSize: 20, color: MAROON,
    paddingHorizontal: 16, marginBottom: 2,
  },
  recSub: {
    fontSize: 13, color: STONE,
    paddingHorizontal: 16, marginBottom: 6,
  },
  recCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: MAROON,
    borderRadius: 8, paddingVertical: 1, paddingHorizontal: 7,
  },
  focusPillText: { fontSize: 13, color: '#FFFFFF' },

  // Course result row
  courseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  courseRowCode: { fontFamily: FONT_SEMI, fontSize: 17, color: '#333' },
  courseRowName: { fontFamily: FONT, fontSize: 14, color: STONE, marginTop: 1 },
  courseRowChevron: { fontFamily: FONT, fontSize: 20, color: STONE, marginLeft: 8 },
  countsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  countsMarker: { fontSize: 13, color: OK.fg },
  fillBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, marginLeft: 8,
  },
  fillBadgeHigh: { backgroundColor: DANGER.bg },
  fillBadgeAmber: { backgroundColor: WARN.bg },
  fillBadgeText: { fontSize: 13 },
  fillBadgeTextHigh: { color: DANGER.fg },
  fillBadgeTextAmber: { color: WARN.fg },
  pickedFillWarn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    paddingHorizontal: 16, marginBottom: 6,
  },
  pickedFillWarnHigh: {},
  pickedFillWarnAmber: {},
  pickedFillWarnText: { flex: 1, fontFamily: FONT_MED, fontSize: 14, lineHeight: 18 },

  // Section row (modal)
  sectionRow: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  sectionTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 3,
  },
  sectionNum: { fontFamily: FONT_SEMI, fontSize: 14, color: '#333' },
  badge: { borderRadius: 8, paddingVertical: 1, paddingHorizontal: 8 },
  badgeOpen: { backgroundColor: OK.bg },
  badgeLow: { backgroundColor: WARN.bg },
  badgeFull: { backgroundColor: DANGER.bg },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  sectionInfo: { fontFamily: FONT, fontSize: 14, color: '#555', marginBottom: 2 },
  sectionMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  sectionInstructor: { fontSize: 13, color: MAROON },
  sectionSeats: { fontSize: 13, color: '#555' },
  sectionRoom: { fontSize: 13, color: STONE, flexShrink: 1 },
});

export default ScheduleScreen;
