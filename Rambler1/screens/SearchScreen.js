import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, Keyboard, Animated, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import {
  searchCourses as apiSearchCourses, getCourseSections, searchByInstructor,
  addSectionToSchedule, removeSectionFromSchedule,
} from '../firestore-data';
import { useToast } from '../components/ui/Toast';
import showAlert from '../alert';
import { fetchCourses as fetchLocalCourses } from '../Database';
import CourseDetailModal from '../CourseDetailModal';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { seatAge } from '../seat-age';
import { useRegistrationTerm, resolveRegistrationTerm } from '../term';
import { STONE, WARN, FONT, FONT_SEMI, MAROON, DANGER, PARCHMENT, OK } from '../theme';
import { slopTo } from '../components/ui/hitSlop';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEPARTMENTS = [
  { code: 'COMP', name: 'Computer Science' },
  { code: 'MATH', name: 'Mathematics' },
  { code: 'BIOL', name: 'Biology' },
  { code: 'CHEM', name: 'Chemistry' },
  { code: 'PHYS', name: 'Physics' },
  { code: 'STAT', name: 'Statistics' },
  { code: 'PSYC', name: 'Psychology' },
  { code: 'ENGL', name: 'English' },
  { code: 'HIST', name: 'History' },
  { code: 'PHIL', name: 'Philosophy' },
  { code: 'PLSC', name: 'Political Sci' },
  { code: 'ECON', name: 'Economics' },
  { code: 'ACCT', name: 'Accounting' },
  { code: 'FIN', name: 'Finance' },
  { code: 'MGMT', name: 'Management' },
  { code: 'MKTG', name: 'Marketing' },
  { code: 'COMM', name: 'Communication' },
  { code: 'GNUR', name: 'Nursing' },
  { code: 'SOCL', name: 'Sociology' },
  { code: 'ANTH', name: 'Anthropology' },
  { code: 'THEO', name: 'Theology' },
  { code: 'ENVS', name: 'Env. Science' },
  { code: 'FNAR', name: 'Fine Arts' },
  { code: 'MUSC', name: 'Music' },
  { code: 'SPAN', name: 'Spanish' },
  { code: 'FREN', name: 'French' },
  { code: 'DANC', name: 'Dance' },
  { code: 'THEA', name: 'Theatre' },
  { code: 'NEUR', name: 'Neuroscience' },
  { code: 'CRIM', name: 'Criminal Justice' },
];

const RECENT_KEY = '@rambler_recent_searches';

// A search used to read and draw every section of up to 30 courses at once
// (about 50 Firestore reads). Now the first few results load their sections
// up front and the rest load as they scroll into view, and a card draws its
// first few sections with "Show all" for the rest. Sections are still read
// whole per course: the filters (open only, time, days) run on the phone and
// need every section to be right.
export const PRELOAD_COURSES = 8;
export const SECTIONS_SHOWN = 3;

// =============================================================================
// FILTER CHIPS
// =============================================================================

const FILTER_OPTIONS = [
  { key: 'morning', label: 'Morning', group: 'time' },
  { key: 'afternoon', label: 'Afternoon', group: 'time' },
  { key: 'evening', label: 'Evening', group: 'time' },
  { key: 'mwf', label: 'MWF', group: 'days' },
  { key: 'tuth', label: 'TuTh', group: 'days' },
  { key: 'openOnly', label: 'Open Seats', group: 'toggle' },
];

const FilterChips = ({ filters, onFilterChange }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow} contentContainerStyle={s.chipRowContent}>
    {FILTER_OPTIONS.map((opt) => {
      let active = false;
      if (opt.group === 'time') active = filters.timeOfDay === opt.key;
      else if (opt.group === 'days') active = filters.days === opt.key;
      else if (opt.group === 'toggle') active = filters.openOnly;

      return (
        <TouchableOpacity
          key={opt.key}
          style={[s.chip, active && s.chipActive]}
          hitSlop={slopTo(44, 30)}
          onPress={() => {
            if (opt.group === 'time') {
              onFilterChange(f => ({ ...f, timeOfDay: f.timeOfDay === opt.key ? null : opt.key }));
            } else if (opt.group === 'days') {
              onFilterChange(f => ({ ...f, days: f.days === opt.key ? null : opt.key }));
            } else {
              onFilterChange(f => ({ ...f, openOnly: !f.openOnly }));
            }
          }}
        >
          <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// =============================================================================
// SECTION ROW
// =============================================================================

// onAdd (signed-in only): the "+" that puts this section on the schedule
// without opening two modals first.
const SectionRow = ({ section, onPress, onAdd, courseCode }) => {
  const hasEnrollment = section.enrollment_cap > 0;
  const statusText = (section.status || '').toLowerCase();
  const isClosed = statusText.includes('closed');
  const isWaitList = statusText.includes('wait');
  const spotsLeft = hasEnrollment ? section.enrollment_cap - section.enrollment_total : null;
  const isFull = hasEnrollment ? spotsLeft <= 0 : isClosed;

  let badgeLabel, badgeStyle;
  if (hasEnrollment) {
    if (isFull) { badgeLabel = 'FULL'; badgeStyle = s.badgeFull; }
    else if (spotsLeft <= 5) { badgeLabel = `${spotsLeft} spots`; badgeStyle = s.badgeLow; }
    else { badgeLabel = `${spotsLeft} spots`; badgeStyle = s.badgeOpen; }
  } else {
    if (isClosed) { badgeLabel = 'Closed'; badgeStyle = s.badgeFull; }
    else if (isWaitList) { badgeLabel = 'Wait List'; badgeStyle = s.badgeLow; }
    else { badgeLabel = 'Open'; badgeStyle = s.badgeOpen; }
  }

  return (
    <TouchableOpacity style={[s.sectionRow, isFull && { opacity: 0.5 }]} onPress={onPress}>
      <View style={s.sectionTop}>
        <Text style={s.sectionNum}>Sec {section.section_number}</Text>
        <View style={s.sectionTopRight}>
          <View style={[s.badge, badgeStyle]}>
            <Text style={s.badgeText}>{badgeLabel}</Text>
          </View>
          {onAdd ? (
            <TouchableOpacity
              onPress={onAdd}
              hitSlop={slopTo(28)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${courseCode} Sec ${section.section_number} to your schedule`}
              style={s.addBtn}
            >
              <Ionicons name="add-circle-outline" size={26} color={MAROON} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {section.meeting_days || section.meeting_time_start ? (
        <Text style={s.sectionInfo}>
          {section.meeting_days}{section.meeting_time_start ? ` ${section.meeting_time_start} - ${section.meeting_time_end}` : ''}
        </Text>
      ) : null}
      <View style={s.sectionMeta}>
        {section.instructor ? <Text style={s.sectionInstructor}>{section.instructor}</Text> : null}
        {section.building || section.room ? (
          <Text style={s.sectionRoom}>
            {section.room && section.building &&
              section.room.toLowerCase().includes(section.building.toLowerCase())
              ? section.room
              : [section.building, section.room].filter(Boolean).join(' ')}
          </Text>
        ) : null}
      </View>
      {/* The spots badge is only as good as its last read: flag old ones. */}
      {hasEnrollment && seatAge(section.enrollment_read_at)?.stale ? (
        <Text style={s.staleSeats}>{seatAge(section.enrollment_read_at).label}, may have changed</Text>
      ) : null}
    </TouchableOpacity>
  );
};

// =============================================================================
// COURSE CARD
// =============================================================================

// Compact fast-fill flag for result rows (class-based, not personalized —
// personalized copy lives in CourseDetailModal). Rows without fill_stats
// (e.g. local sqlite instant-search rows) simply show no flag.
function getFillFlag(fillStats) {
  const cls = fillStats && typeof fillStats === 'object' ? fillStats.class : null;
  // cap_changed = seat counts moved >20% last term; mark the chip as an
  // estimate so the compact form stays honest (full nuance is in the modal).
  const est = fillStats && fillStats.cap_changed === true ? ' (est.)' : '';
  if (cls === 'day1-2') return { label: `Fills day 1${est}`, tone: 'danger' };
  if (cls === 'first-week') return { label: `Fills week 1${est}`, tone: 'warn' };
  return null;
}

const CourseCard = ({ course, sections, sectionsLoading, sectionsFailed, filters, onCoursePress, onSectionPress, onRetrySections, onAddSection }) => {
  const TERM = useRegistrationTerm();
  const [expanded, setExpanded] = useState(false);
  // Filter sections by active filters
  const filteredSections = (sections || []).filter(sec => {
    if (filters.openOnly) {
      const hasEnroll = sec.enrollment_cap > 0;
      const full = hasEnroll ? sec.enrollment_total >= sec.enrollment_cap : (sec.status || '').toLowerCase().includes('closed');
      if (full) return false;
    }
    if (filters.timeOfDay && sec.meeting_time_start) {
      const hour = parseInt(sec.meeting_time_start);
      const isPM = sec.meeting_time_start.includes('PM') && hour !== 12;
      const h24 = isPM ? hour + 12 : (sec.meeting_time_start.includes('AM') && hour === 12 ? 0 : hour);
      if (filters.timeOfDay === 'morning' && h24 >= 12) return false;
      if (filters.timeOfDay === 'afternoon' && (h24 < 12 || h24 >= 17)) return false;
      if (filters.timeOfDay === 'evening' && h24 < 17) return false;
    }
    if (filters.days && sec.meeting_days) {
      const days = sec.meeting_days;
      if (filters.days === 'mwf' && !(/Mo|We|Fr/.test(days))) return false;
      if (filters.days === 'tuth' && !(/Tu|Th/.test(days))) return false;
    }
    return true;
  });

  const sectionCount = sections ? filteredSections.length : null;
  const fillFlag = getFillFlag(course.fill_stats);

  return (
    <View style={s.card}>
      <TouchableOpacity style={s.cardHeader} onPress={() => onCoursePress(course)} activeOpacity={0.7}>
        <View style={s.cardDot} />
        <View style={s.cardInfo}>
          <View style={s.cardTitleRow}>
            <View style={s.cardCodeRow}>
              <Text style={s.cardCode}>{course.code}</Text>
              {fillFlag ? (
                <View style={[s.fillFlag, fillFlag.tone === 'danger' ? s.fillFlagDanger : s.fillFlagWarn]}>
                  <Ionicons
                    name="flash"
                    size={10}
                    color={fillFlag.tone === 'danger' ? DANGER.fg : WARN.fg}
                  />
                  <Text
                    numberOfLines={1}
                    style={[s.fillFlagText, fillFlag.tone === 'danger' ? s.fillFlagTextDanger : s.fillFlagTextWarn]}
                  >
                    {fillFlag.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={s.cardCredits}>{course.credits || 3} cr</Text>
          </View>
          <Text style={s.cardName} numberOfLines={1}>{course.name}</Text>
        </View>
        <Text style={s.cardChevron}>›</Text>
      </TouchableOpacity>

      <View style={s.cardSections}>
        {sectionsLoading ? (
          <ActivityIndicator color={MAROON} style={{ padding: 12 }} />
        ) : sectionsFailed ? (
          <ErrorState
            variant="inline"
            title="Couldn't load sections."
            onRetry={() => onRetrySections(course)}
            retryLabel={`Try again loading sections for ${course.code}`}
          />
        ) : filteredSections.length > 0 ? (
          <>
            {(expanded ? filteredSections : filteredSections.slice(0, SECTIONS_SHOWN)).map((sec, i) => (
              <SectionRow
                key={sec.id || sec.class_number || i}
                section={sec}
                courseCode={course.code}
                onPress={() => onSectionPress(sec, course)}
                onAdd={onAddSection ? () => onAddSection(sec, course) : undefined}
              />
            ))}
            {filteredSections.length > SECTIONS_SHOWN ? (
              <TouchableOpacity
                style={s.showAll}
                onPress={() => setExpanded((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={expanded
                  ? `Show fewer sections of ${course.code}`
                  : `Show all ${filteredSections.length} sections of ${course.code}`}
              >
                <Text style={s.showAllText}>
                  {expanded ? 'Show fewer' : `Show all ${filteredSections.length} sections`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : sections && sections.length > 0 ? (
          <Text style={s.noMatchText}>No sections match current filters</Text>
        ) : sections ? (
          <Text style={s.noMatchText}>No sections for {TERM.label}</Text>
        ) : null}
      </View>
    </View>
  );
};

// =============================================================================
// DEPARTMENT GRID
// =============================================================================

const DepartmentGrid = ({ onSelect }) => (
  <View style={s.deptSection}>
    <Text accessibilityRole="header" style={s.deptTitle}>Browse by Department</Text>
    <View style={s.deptGrid}>
      {DEPARTMENTS.map((dept) => (
        <TouchableOpacity key={dept.code} style={s.deptCard} onPress={() => onSelect(dept.code)}>
          <Text style={s.deptCode}>{dept.code}</Text>
          <Text style={s.deptName}>{dept.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// =============================================================================
// RECENT SEARCHES
// =============================================================================

const RecentSearches = ({ searches, onSelect, onRemove }) => {
  if (!searches || searches.length === 0) return null;
  return (
    <View style={s.recentSection}>
      <Text accessibilityRole="header" style={s.recentTitle}>Recent Searches</Text>
      {searches.map((term, i) => (
        <View key={`${term}-${i}`} style={s.recentRow}>
          <TouchableOpacity style={s.recentTerm} onPress={() => onSelect(term)}>
            <Text style={s.recentText}>{term}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(term)} style={s.recentX} hitSlop={slopTo(22)} accessibilityRole="button" accessibilityLabel={`Remove ${term} from recent searches`}>
            <Text style={s.recentXText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// =============================================================================
// MAIN SEARCH SCREEN
// =============================================================================

// A result counts as in view once any part of its card shows.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 1 };

const SearchScreen = () => {
  const { selectedProgram, user } = useAppContext();
  const signedIn = !!user && !user.isAnonymous; // anonymous users have no schedule
  const toast = useToast();
  const TERM = useRegistrationTerm();
  // Callbacks read the term through a ref so a term correction never leaves
  // an old code captured in a memoized closure.
  const termCodeRef = useRef(TERM.code);
  termCodeRef.current = TERM.code;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({});
  const [sectionsLoading, setSectionsLoading] = useState({});
  // Course codes whose last sections read failed (shown with Try again).
  const [sectionsFailed, setSectionsFailed] = useState({});
  // The catalog search itself failed: shown instead of "No courses found".
  const [searchFailed, setSearchFailed] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [filters, setFilters] = useState({ timeOfDay: null, days: null, openOnly: false });
  const [detailModal, setDetailModal] = useState({ visible: false, course: null, section: null, sections: null });

  const debounceRef = useRef(null);
  const allCoursesRef = useRef([]);
  const inputRef = useRef(null);
  // Monotonic token: a slower API response for an OLD query must not
  // overwrite the results of a newer one.
  const searchGenRef = useRef(0);
  // Course codes whose sections are loaded or loading for the current term.
  // A ref, not the `sections` state: performSearch is memoized, so reading
  // state here saw a stale empty map and refetched every course every search.
  const sectionsRequestedRef = useRef(new Set());
  const resultsRef = useRef([]);
  resultsRef.current = results;

  // Load local courses + recent searches on mount
  useEffect(() => {
    fetchLocalCourses()
      .then(courses => { allCoursesRef.current = courses || []; })
      .catch(() => {});
    AsyncStorage.getItem(RECENT_KEY)
      .then(val => { if (val) setRecentSearches(JSON.parse(val)); })
      .catch(() => {});
  }, []);

  const saveRecent = useCallback((term) => {
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const removeRecent = useCallback((term) => {
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Smart sort: exact match → prefix → major courses → alphabetical
  const sortResults = useCallback((courses, q) => {
    const qLower = q.toLowerCase();
    return [...courses].sort((a, b) => {
      const aExact = a.code.toLowerCase() === qLower ? 1 : 0;
      const bExact = b.code.toLowerCase() === qLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aPrefix = a.code.toLowerCase().startsWith(qLower) ? 1 : 0;
      const bPrefix = b.code.toLowerCase().startsWith(qLower) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;

      return a.code.localeCompare(b.code);
    });
  }, []);

  // Batch-load sections for a list of courses (skips ones already requested)
  const loadSectionsForCourses = useCallback(async (courses) => {
    const termCode = termCodeRef.current;
    const requested = sectionsRequestedRef.current;
    const toLoad = courses.filter(c => c.code && !requested.has(c.code)).slice(0, 30); // Cap at 30
    if (toLoad.length === 0) return;

    const loading = {};
    toLoad.forEach(c => { loading[c.code] = true; requested.add(c.code); });
    setSectionsLoading(prev => ({ ...prev, ...loading }));

    const results = await Promise.allSettled(
      toLoad.map(c => getCourseSections(termCode, c.code).then(data => ({ code: c.code, data })))
    );
    // The term was corrected while these were in flight: they belong to the
    // old term, and the term-change effect has already started a fresh load.
    if (termCodeRef.current !== termCode) return;

    const newSections = {};
    const doneLoading = {};
    const failed = {};
    toLoad.forEach(c => { doneLoading[c.code] = false; });
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value.data)) {
        newSections[r.value.code] = r.value.data;
        failed[r.value.code] = false;
      } else {
        requested.delete(toLoad[i].code); // failed read: let a later search retry
        failed[toLoad[i].code] = true;
      }
    });
    setSections(prev => ({ ...prev, ...newSections }));
    setSectionsLoading(prev => ({ ...prev, ...doneLoading }));
    setSectionsFailed(prev => ({ ...prev, ...failed }));
  }, []);

  // The registration term was corrected: sections on screen belong to the old
  // term. Drop them and reload for the results currently showing.
  const loadedTermRef = useRef(TERM.code);
  useEffect(() => {
    if (loadedTermRef.current === TERM.code) return;
    loadedTermRef.current = TERM.code;
    sectionsRequestedRef.current = new Set();
    setSections({});
    setSectionsLoading({});
    setSectionsFailed({});
    loadSectionsForCourses(resultsRef.current);
  }, [TERM.code, loadSectionsForCourses]);

  const performSearch = useCallback(async (q) => {
    const gen = ++searchGenRef.current;
    resolveRegistrationTerm(); // retries if the published terms weren't reachable earlier
    // Phase 1: instant local search
    const qLower = q.toLowerCase();
    const localMatches = allCoursesRef.current.filter(c =>
      (c.code || '').toLowerCase().includes(qLower) ||
      (c.name || '').toLowerCase().includes(qLower)
    );
    setResults(sortResults(localMatches, q));

    // Phase 2: API search
    setLoading(true);
    try {
      const fetched = await apiSearchCourses(q); // null = the read failed
      const apiResults = fetched || [];
      // Merge: API results may have data local doesn't
      const apiByCode = new Map(apiResults.map(r => [r.code, r]));
      // Local sqlite rows have no fill_stats — copy it from the matching API
      // row so fast-fill flags still show when a local row shadows the result.
      const merged = localMatches.map(c => {
        if (c.fill_stats === undefined) {
          const api = apiByCode.get(c.code);
          if (api && api.fill_stats !== undefined) return { ...c, fill_stats: api.fill_stats };
        }
        return c;
      });
      const codeSet = new Set(localMatches.map(c => c.code));
      for (const r of apiResults) {
        if (!codeSet.has(r.code)) {
          merged.push(r);
          codeSet.add(r.code);
        }
      }

      // If query looks like an instructor name (letters/spaces only, no digits)
      if (/^[a-zA-Z\s.]+$/.test(q) && q.length > 2 && !DEPARTMENTS.some(d => d.code === q.toUpperCase())) {
        try {
          const instrSections = await searchByInstructor(termCodeRef.current, q);
          if (instrSections && instrSections.length > 0) {
            // Convert instructor sections to course-like entries
            const instrCourses = {};
            for (const sec of instrSections) {
              const code = `${sec.subject} ${sec.catalog_number}`;
              if (!instrCourses[code] && !codeSet.has(code)) {
                instrCourses[code] = {
                  code,
                  name: sec.title || code,
                  credits: 3,
                  _fromInstructor: true,
                };
                codeSet.add(code);
              }
            }
            merged.push(...Object.values(instrCourses));
          }
        } catch (e) {}
      }

      // Stale guard: a newer query started while this one was in flight.
      if (gen !== searchGenRef.current) return;

      const finalResults = sortResults(merged, q);
      setResults(finalResults);
      setSearchFailed(fetched === null);

      // Sections for the first results now; the rest as they scroll into view.
      loadSectionsForCourses(finalResults.slice(0, PRELOAD_COURSES));
    } catch (e) {
      if (gen === searchGenRef.current) setSearchFailed(true);
    }
    if (gen === searchGenRef.current) setLoading(false);
  }, [sortResults, loadSectionsForCourses]);

  const retrySections = useCallback((course) => loadSectionsForCourses([course]), [loadSectionsForCourses]);

  // "+" on a section row: straight onto the registration-term schedule, with
  // a toast to undo it. A second tap while one add is in flight is ignored.
  const addingRef = useRef(new Set());
  const quickAdd = async (sec, course) => {
    const classNumber = String(sec.class_number);
    if (!signedIn || addingRef.current.has(classNumber)) return;
    addingRef.current.add(classNumber);
    rememberQuery();
    const termCode = termCodeRef.current;
    const code = course.code || `${sec.subject} ${sec.catalog_number}`;
    const res = await addSectionToSchedule(user.uid, termCode, classNumber);
    addingRef.current.delete(classNumber);
    if (res?.added) {
      toast.show({
        message: `${code} Sec ${sec.section_number} added to your ${TERM.label} schedule.`,
        actionLabel: 'Undo',
        onAction: async () => {
          const undone = await removeSectionFromSchedule(user.uid, termCode, classNumber);
          if (!undone) showAlert("Couldn't undo", 'The section is still on your schedule. Remove it on the Schedule tab.');
        },
      });
    } else if (res?.already) {
      toast.show({ message: `${code} Sec ${sec.section_number} is already on your schedule.` });
    } else if (res?.full) {
      showAlert('Schedule full', 'A schedule holds at most 40 sections. Remove one on the Schedule tab first.');
    } else {
      showAlert('Save failed', 'Could not update your schedule. Please try again.');
    }
  };

  // A query becomes a "recent search" only when the user commits to it:
  // submits the box, opens a result, or picks a department/recent. Saving on
  // every debounced keystroke filled the list with half-typed fragments.
  const rememberQuery = () => {
    const q = query.trim();
    if (q) saveRecent(q);
  };

  // Results past the first preloaded batch get their sections as they scroll
  // into view (they used to stay blank forever). loadSectionsForCourses skips
  // anything already requested, so this is cheap to call repeatedly. FlatList
  // requires this callback's identity never to change: its only dependency is
  // itself stable.
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    loadSectionsForCourses((viewableItems || []).map((v) => v.item).filter(Boolean));
  }, [loadSectionsForCourses]);

  const onSearchChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      setSearchFailed(false);
      return;
    }
    debounceRef.current = setTimeout(() => performSearch(text.trim()), 250);
  };

  const clearSearch = () => {
    // A search typed in the last 250 ms hasn't started yet: cancel it, and
    // drop the results of one still in flight, or they'd land on a cleared box.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchGenRef.current += 1;
    setQuery('');
    setResults([]);
    setLoading(false);
    setSearchFailed(false);
    inputRef.current?.focus();
  };

  const handleCoursePress = (course) => {
    rememberQuery();
    setDetailModal({
      visible: true,
      course: {
        code: course.code,
        name: course.name,
        credits: course.credits,
        description: course.description,
        fill_stats: course.fill_stats, // undefined -> modal fetches it itself
      },
      section: null,
      sections: sections[course.code] || null,
    });
  };

  const handleSectionPress = (section, course) => {
    rememberQuery();
    setDetailModal({
      visible: true,
      course: {
        code: course.code || `${section.subject} ${section.catalog_number}`,
        name: course.name || section.title,
        credits: course.credits,
        description: course.description,
        fill_stats: course.fill_stats, // undefined -> modal fetches it itself
      },
      section: section,
      sections: null,
    });
  };

  const handleDeptSelect = (code) => {
    setQuery(code);
    saveRecent(code);
    performSearch(code);
  };

  // ==================== RENDER ====================
  return (
    <View style={s.container}>
      {/* Search Bar */}
      <View style={s.searchBarWrap}>
        <TextInput
          ref={inputRef}
          style={s.searchInput}
          placeholder="Search courses, departments, professors..."
          placeholderTextColor={STONE}
          value={query}
          onChangeText={onSearchChange}
          onSubmitEditing={rememberQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={clearSearch} hitSlop={slopTo(24)} accessibilityRole="button" accessibilityLabel="Clear search">
            <Text style={s.clearBtnText}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      {query.length > 0 && <FilterChips filters={filters} onFilterChange={setFilters} />}

      {/* Content */}
      {query.length === 0 ? (
        <ScrollView
          contentContainerStyle={s.emptyContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <RecentSearches searches={recentSearches} onSelect={handleDeptSelect} onRemove={removeRecent} />
          <DepartmentGrid onSelect={handleDeptSelect} />
          <Text style={s.hintText}>Try: COMP 170, calculus, Dr. Smith</Text>
        </ScrollView>
      ) : loading && results.length === 0 ? (
        <View style={{ paddingTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={s.card}>
              <View style={{ padding: 14 }}>
                <Skeleton width={110} height={14} />
                <Skeleton width={210} height={12} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : results.length === 0 && !loading && searchFailed ? (
        <ErrorState
          title="Couldn't search the catalog"
          message="Check your connection, then try again."
          onRetry={() => performSearch(query.trim())}
        />
      ) : results.length === 0 && !loading ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>No courses found</Text>
          <Text style={s.emptyHint}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.code || String(item.id)}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              sections={sections[item.code]}
              sectionsLoading={sectionsLoading[item.code]}
              sectionsFailed={sectionsFailed[item.code]}
              filters={filters}
              onCoursePress={handleCoursePress}
              onSectionPress={handleSectionPress}
              onRetrySections={retrySections}
              onAddSection={signedIn ? quickAdd : undefined}
            />
          )}
          ListHeaderComponent={
            <Text style={s.seatNote}>
              Seat counts are read from LOCUS once a day. Confirm in LOCUS before you register.
            </Text>
          }
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      <CourseDetailModal
        visible={detailModal.visible}
        course={detailModal.course}
        section={detailModal.section}
        sections={detailModal.sections}
        onClose={() => setDetailModal({ visible: false, course: null, section: null, sections: null })}
      />
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PARCHMENT },

  // Seat-count age: the note above results, and the flag on an old count.
  seatNote: { fontSize: 13, color: STONE, marginHorizontal: 16, marginTop: 8, marginBottom: 2, lineHeight: 18 },
  staleSeats: { fontSize: 12, color: WARN.fg, marginTop: 4 },

  // Search bar
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    position: 'relative',
  },
  searchInput: {
    fontFamily: FONT,
    fontSize: 17,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 40,
    height: 44,
  },
  clearBtn: {
    position: 'absolute',
    right: 26,
    top: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },

  // Filter chips
  chipRow: { flexGrow: 0, marginBottom: 6 },
  chipRowContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: MAROON },
  chipText: {
    fontFamily: FONT_SEMI,
    fontSize: 14,
    color: '#555',
  },
  chipTextActive: { color: '#FFFFFF' },

  // Course card
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MAROON,
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCode: {
    fontFamily: FONT_SEMI,
    fontSize: 17,
    color: '#333',
  },
  cardCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  fillFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 6,
    marginLeft: 8,
    flexShrink: 1,
  },
  fillFlagDanger: { backgroundColor: DANGER.bg },
  fillFlagWarn: { backgroundColor: WARN.bg },
  fillFlagText: {
    // System font, not Cormorant: an 11px serif chip is illegible and the
    // design rule reserves Cormorant for headings.
    fontSize: 11,
    fontWeight: 'bold',
  },
  fillFlagTextDanger: { color: DANGER.fg },
  fillFlagTextWarn: { color: WARN.fg },
  cardCredits: {
    fontFamily: FONT,
    fontSize: 14,
    color: STONE,
  },
  cardName: {
    fontFamily: FONT,
    fontSize: 15,
    color: '#555',
    marginTop: 2,
  },
  cardSub: {
    fontSize: 13,
    color: STONE,
    marginTop: 2,
  },
  cardChevron: {
    fontFamily: FONT,
    fontSize: 20,
    color: STONE,
    marginLeft: 8,
  },
  cardSections: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  showAll: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 },
  showAllText: { fontSize: 14, fontWeight: '600', color: MAROON },
  noMatchText: {
    fontFamily: FONT,
    fontSize: 14,
    color: STONE,
    textAlign: 'center',
    padding: 16,
  },

  // Section row
  sectionRow: {
    padding: 12,
    paddingLeft: 36,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sectionNum: {
    fontFamily: FONT_SEMI,
    fontSize: 14,
    color: '#333',
  },
  badge: { borderRadius: 8, paddingVertical: 1, paddingHorizontal: 6 },
  badgeOpen: { backgroundColor: OK.bg },
  badgeLow: { backgroundColor: WARN.bg },
  badgeFull: { backgroundColor: DANGER.bg },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionInfo: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  sectionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionInstructor: {
    fontSize: 13,
    color: MAROON,
  },
  sectionRoom: {
    fontSize: 13,
    color: STONE,
  },

  // Department grid
  deptSection: { paddingHorizontal: 16, marginTop: 16 },
  deptTitle: {
    fontFamily: FONT_SEMI,
    fontSize: 20,
    color: '#333',
    marginBottom: 12,
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptCard: {
    width: '31%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 10,
    alignItems: 'center',
  },
  deptCode: {
    fontFamily: FONT_SEMI,
    fontSize: 18,
    color: MAROON,
  },
  deptName: {
    fontSize: 11,
    color: STONE,
    textAlign: 'center',
    marginTop: 2,
  },

  // Recent searches
  recentSection: { paddingHorizontal: 16, marginTop: 8 },
  recentTitle: {
    fontFamily: FONT_SEMI,
    fontSize: 16,
    color: STONE,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  recentTerm: { flex: 1 },
  recentText: {
    fontFamily: FONT,
    fontSize: 16,
    color: '#333',
  },
  recentX: { padding: 4 },
  recentXText: {
    fontFamily: FONT_SEMI,
    fontSize: 14,
    color: STONE,
  },

  // Empty / loading states
  emptyContent: { paddingBottom: 40 },
  hintText: {
    fontFamily: FONT,
    fontSize: 15,
    color: STONE,
    textAlign: 'center',
    marginTop: 30,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontFamily: FONT,
    fontSize: 16,
    color: STONE,
    marginTop: 12,
  },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: {
    fontFamily: FONT,
    fontSize: 22,
    color: STONE,
  },
  emptyHint: {
    fontFamily: FONT,
    fontSize: 15,
    color: STONE,
    marginTop: 6,
  },
});

export default SearchScreen;
