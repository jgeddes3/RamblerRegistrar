import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, Keyboard, Animated, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../AppContext';
import { searchCourses as apiSearchCourses, getCourseSections, searchByInstructor } from '../api';
import { fetchCourses as fetchLocalCourses } from '../Database';
import CourseDetailModal from '../CourseDetailModal';

// =============================================================================
// CONSTANTS
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

const SectionRow = ({ section, onPress }) => {
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
        <View style={[s.badge, badgeStyle]}>
          <Text style={s.badgeText}>{badgeLabel}</Text>
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
          <Text style={s.sectionRoom}>{[section.building, section.room].filter(Boolean).join(' ')}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// =============================================================================
// COURSE CARD
// =============================================================================

const CourseCard = ({ course, sections, sectionsLoading, filters, onCoursePress, onSectionPress }) => {
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

  return (
    <View style={s.card}>
      <TouchableOpacity style={s.cardHeader} onPress={() => onCoursePress(course)} activeOpacity={0.7}>
        <View style={s.cardDot} />
        <View style={s.cardInfo}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardCode}>{course.code}</Text>
            <Text style={s.cardCredits}>{course.credits || 3} cr</Text>
          </View>
          <Text style={s.cardName} numberOfLines={1}>{course.name}</Text>
        </View>
        <Text style={s.cardChevron}>›</Text>
      </TouchableOpacity>

      <View style={s.cardSections}>
        {sectionsLoading ? (
          <ActivityIndicator color="#A30046" style={{ padding: 12 }} />
        ) : filteredSections.length > 0 ? (
          filteredSections.map((sec, i) => (
            <SectionRow
              key={sec.id || sec.class_number || i}
              section={sec}
              onPress={() => onSectionPress(sec, course)}
            />
          ))
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
    <Text style={s.deptTitle}>Browse by Department</Text>
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
      <Text style={s.recentTitle}>Recent Searches</Text>
      {searches.map((term, i) => (
        <View key={`${term}-${i}`} style={s.recentRow}>
          <TouchableOpacity style={s.recentTerm} onPress={() => onSelect(term)}>
            <Text style={s.recentText}>{term}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(term)} style={s.recentX}>
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

const SearchScreen = () => {
  const { selectedProgram } = useAppContext();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({});
  const [sectionsLoading, setSectionsLoading] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [filters, setFilters] = useState({ timeOfDay: null, days: null, openOnly: false });
  const [detailModal, setDetailModal] = useState({ visible: false, course: null, section: null, sections: null });

  const debounceRef = useRef(null);
  const allCoursesRef = useRef([]);
  const inputRef = useRef(null);

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

  const performSearch = useCallback(async (q) => {
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
      const apiResults = await apiSearchCourses(q) || [];
      // Merge: API results may have data local doesn't
      const codeSet = new Set(localMatches.map(c => c.code));
      const merged = [...localMatches];
      for (const r of apiResults) {
        if (!codeSet.has(r.code)) {
          merged.push(r);
          codeSet.add(r.code);
        }
      }

      // If query looks like an instructor name (letters/spaces only, no digits)
      if (/^[a-zA-Z\s.]+$/.test(q) && q.length > 2 && !DEPARTMENTS.some(d => d.code === q.toUpperCase())) {
        try {
          const instrSections = await searchByInstructor(TERM.code, q);
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

      const finalResults = sortResults(merged, q);
      setResults(finalResults);

      // Pre-load sections for all results in background
      loadSectionsForCourses(finalResults);
    } catch (e) {}
    setLoading(false);
    saveRecent(q);
  }, [sortResults, saveRecent]);

  // Batch-load sections for a list of courses
  const loadSectionsForCourses = useCallback(async (courses) => {
    const toLoad = courses.filter(c => c.code && !sections[c.code]).slice(0, 30); // Cap at 30
    if (toLoad.length === 0) return;

    const loading = {};
    toLoad.forEach(c => { loading[c.code] = true; });
    setSectionsLoading(prev => ({ ...prev, ...loading }));

    const results = await Promise.allSettled(
      toLoad.map(c => getCourseSections(TERM.code, c.code).then(data => ({ code: c.code, data })))
    );

    const newSections = {};
    const doneLoading = {};
    for (const r of results) {
      if (r.status === 'fulfilled') {
        newSections[r.value.code] = r.value.data || [];
        doneLoading[r.value.code] = false;
      }
    }
    setSections(prev => ({ ...prev, ...newSections }));
    setSectionsLoading(prev => ({ ...prev, ...doneLoading }));
  }, [sections]);

  const onSearchChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => performSearch(text.trim()), 250);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleCoursePress = (course) => {
    setDetailModal({
      visible: true,
      course: {
        code: course.code,
        name: course.name,
        credits: course.credits,
        description: course.description,
      },
      section: null,
      sections: sections[course.code] || null,
    });
  };

  const handleSectionPress = (section, course) => {
    setDetailModal({
      visible: true,
      course: {
        code: course.code || `${section.subject} ${section.catalog_number}`,
        name: course.name || section.title,
        credits: course.credits,
        description: course.description,
      },
      section: section,
      sections: null,
    });
  };

  const handleDeptSelect = (code) => {
    setQuery(code);
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
          placeholderTextColor="#999"
          value={query}
          onChangeText={onSearchChange}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={clearSearch}>
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
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#A30046" />
          <Text style={s.loadingText}>Searching...</Text>
        </View>
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
              filters={filters}
              onCoursePress={handleCoursePress}
              onSectionPress={handleSectionPress}
            />
          )}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Search bar
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    position: 'relative',
  },
  searchInput: {
    fontFamily: 'CormorantGaramond-Regular',
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
  chipActive: { backgroundColor: '#A30046' },
  chipText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
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
    backgroundColor: '#A30046',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  cardCredits: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#999',
  },
  cardName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#555',
    marginTop: 2,
  },
  cardSub: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  cardChevron: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#CCC',
    marginLeft: 8,
  },
  cardSections: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  noMatchText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#999',
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
  sectionNum: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: { borderRadius: 8, paddingVertical: 1, paddingHorizontal: 6 },
  badgeOpen: { backgroundColor: '#d1fae5' },
  badgeLow: { backgroundColor: '#fef3c7' },
  badgeFull: { backgroundColor: '#fee2e2' },
  badgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionInfo: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  sectionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionInstructor: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#A30046',
  },
  sectionRoom: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#888',
  },

  // Department grid
  deptSection: { paddingHorizontal: 16, marginTop: 16 },
  deptTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#A30046',
    fontWeight: 'bold',
  },
  deptName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  },

  // Recent searches
  recentSection: { paddingHorizontal: 16, marginTop: 8 },
  recentTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#333',
  },
  recentX: { padding: 4 },
  recentXText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#CCC',
    fontWeight: 'bold',
  },

  // Empty / loading states
  emptyContent: { paddingBottom: 40 },
  hintText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 30,
  },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#999',
  },
  emptyHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#CCC',
    marginTop: 6,
  },
});

export default SearchScreen;
