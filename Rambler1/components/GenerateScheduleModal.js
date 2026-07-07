// components/GenerateScheduleModal.js — walk-time-aware schedule generator UI
// (F-HI2). Pick courses + preferences -> generateSchedules() -> ranked
// candidates -> grid preview -> apply.
//
// Pure logic lives in ../schedule-generator; this component only fetches
// sections (one query per picked course), renders, and hands the chosen
// candidate's class numbers back via onApply.

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, Modal, Alert, Switch, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { searchCourses, getCourseSections } from '../firestore-data';
import { generateSchedules, formatMinutes } from '../schedule-generator';
import { sectionsToBlocks, gridBounds, findConflicts } from '../schedule-utils';
import ScheduleGrid from './ScheduleGrid';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;
const MAX_COURSES = 8;
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
const START_CHOICES = [
  { label: 'Any time', value: null },
  { label: '9 AM+', value: 9 * 60 },
  { label: '10 AM+', value: 10 * 60 },
];

const courseCodeOf = (section) =>
  `${section.subject || ''} ${section.catalog_number || ''}`.trim();

function statsLine(candidate) {
  const st = candidate.stats;
  const parts = [];
  parts.push(`${st.daysOnCampus} day${st.daysOnCampus === 1 ? '' : 's'} on campus`);
  if (st.earliestStart != null) {
    parts.push(`${formatMinutes(st.earliestStart)} – ${formatMinutes(st.latestEnd)}`);
  }
  parts.push(st.tightGaps.length === 0
    ? 'no tight walks'
    : `${st.tightGaps.length} tight walk${st.tightGaps.length === 1 ? '' : 's'}`);
  if (st.idleMinutes > 0) parts.push(`${Math.round(st.idleMinutes / 60 * 10) / 10}h idle`);
  if (st.nonOpenCount > 0) parts.push(`${st.nonOpenCount} not open`);
  return parts.join(' · ');
}

const GenerateScheduleModal = ({
  visible,
  onClose,
  termCode,
  termLabel,
  currentSections = [],
  walkMinutes,
  onApply, // async (classNumbers: string[]) => boolean
}) => {
  // --- setup state ---
  const [picked, setPicked] = useState([]); // [{code, name}]
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openOnly, setOpenOnly] = useState(true);
  const [keepCurrent, setKeepCurrent] = useState(true);
  const [earliestStart, setEarliestStart] = useState(null);
  const [freeDays, setFreeDays] = useState([]); // ['Fr']
  // --- run state ---
  const [phase, setPhase] = useState('setup'); // 'setup' | 'results'
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null); // {candidates, notes}
  const [preview, setPreview] = useState(null); // candidate | null
  const [applying, setApplying] = useState(false);

  const debounceRef = useRef(null);
  const searchSeqRef = useRef(0);
  const hasCurrent = currentSections.length > 0;

  const resetAll = () => {
    searchSeqRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPicked([]);
    setQuery('');
    setResults([]);
    setSearchLoading(false);
    setPhase('setup');
    setGenerating(false);
    setGenerated(null);
    setPreview(null);
    setApplying(false);
  };

  const close = () => {
    resetAll();
    onClose();
  };

  const onSearchChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++searchSeqRef.current;
    if (!text.trim()) { setResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      let found = [];
      try {
        found = (await searchCourses(text.trim())) || [];
      } catch (e) { found = []; }
      if (seq !== searchSeqRef.current) return;
      setResults(found.slice(0, 25));
      setSearchLoading(false);
    }, 250);
  };

  const addCourse = (course) => {
    if (picked.some((c) => c.code === course.code)) return;
    if (picked.length >= MAX_COURSES) {
      Alert.alert('That’s plenty', `Pick at most ${MAX_COURSES} courses per run.`);
      return;
    }
    setPicked([...picked, { code: course.code, name: course.name || '' }]);
    setQuery('');
    setResults([]);
  };

  const removeCourse = (code) => setPicked(picked.filter((c) => c.code !== code));

  const toggleFreeDay = (day) =>
    setFreeDays(freeDays.includes(day) ? freeDays.filter((d) => d !== day) : [...freeDays, day]);

  const runGenerate = async () => {
    if (!picked.length || generating) return;
    setGenerating(true);
    try {
      const groups = await Promise.all(
        picked.map(async (c) => ({
          code: c.code,
          sections: (await getCourseSections(termCode, c.code)) || [],
        }))
      );
      const out = generateSchedules({
        courseGroups: groups,
        lockedSections: keepCurrent ? currentSections : [],
        prefs: { openOnly, earliestStart, freeDays },
        walkMinutes,
        limit: 5,
      });
      setGenerated(out);
      setPhase('results');
    } catch (e) {
      Alert.alert('Generation failed', 'Could not fetch sections. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const confirmApply = (candidate) => {
    const replacing = !keepCurrent && hasCurrent;
    const apply = async () => {
      if (applying) return;
      setApplying(true);
      const ids = candidate.sections.map((s) => String(s.class_number));
      const ok = await onApply(ids);
      setApplying(false);
      if (ok) close();
    };
    if (replacing) {
      Alert.alert(
        'Replace schedule?',
        `This replaces your current ${currentSections.length} class${currentSections.length === 1 ? '' : 'es'} for ${termLabel}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: apply },
        ]
      );
      return;
    }
    apply();
  };

  // ------------------------------------------------------------------ render
  const renderSetup = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={st.sectionLabel}>Courses ({picked.length}/{MAX_COURSES})</Text>
      {picked.length > 0 && (
        <View style={st.chipsWrap}>
          {picked.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={st.chip}
              onPress={() => removeCourse(c.code)}
              accessibilityLabel={`Remove ${c.code}`}
            >
              <Text style={st.chipText}>{c.code}  ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={st.searchInput}
        placeholder="Search courses to include (e.g. COMP 170)"
        placeholderTextColor="#999"
        value={query}
        onChangeText={onSearchChange}
        autoCorrect={false}
        autoCapitalize="characters"
      />
      {searchLoading && <ActivityIndicator style={{ marginTop: 8 }} color="#A30046" />}
      {results.map((course) => (
        <TouchableOpacity
          key={course.code}
          style={st.resultRow}
          onPress={() => addCourse(course)}
          accessibilityLabel={`Add ${course.code}`}
        >
          <Text style={st.resultCode}>{course.code}</Text>
          <Text style={st.resultName} numberOfLines={1}>{course.name || ''}</Text>
        </TouchableOpacity>
      ))}

      <Text style={st.sectionLabel}>Preferences</Text>
      <View style={st.prefRow}>
        <Text style={st.prefText}>Open sections only</Text>
        <Switch
          value={openOnly}
          onValueChange={setOpenOnly}
          trackColor={{ true: '#A30046' }}
          accessibilityLabel="Open sections only"
        />
      </View>
      {hasCurrent && (
        <View style={st.prefRow}>
          <Text style={st.prefText}>Keep my current classes ({currentSections.length})</Text>
          <Switch
            value={keepCurrent}
            onValueChange={setKeepCurrent}
            trackColor={{ true: '#A30046' }}
            accessibilityLabel="Keep my current classes"
          />
        </View>
      )}
      <Text style={st.prefSubLabel}>Earliest class</Text>
      <View style={st.chipsWrap}>
        {START_CHOICES.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[st.optChip, earliestStart === c.value && st.optChipOn]}
            onPress={() => setEarliestStart(c.value)}
            accessibilityLabel={`Earliest class ${c.label}`}
          >
            <Text style={[st.optChipText, earliestStart === c.value && st.optChipTextOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={st.prefSubLabel}>Days to keep free</Text>
      <View style={st.chipsWrap}>
        {WEEKDAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[st.optChip, freeDays.includes(d) && st.optChipOn]}
            onPress={() => toggleFreeDay(d)}
            accessibilityLabel={`Keep ${d} free`}
          >
            <Text style={[st.optChipText, freeDays.includes(d) && st.optChipTextOn]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[st.generateBtn, (!picked.length || generating) && st.generateBtnDisabled]}
        onPress={runGenerate}
        disabled={!picked.length || generating}
        accessibilityLabel="Generate schedules"
      >
        {generating
          ? <ActivityIndicator color="#fff" />
          : <Text style={st.generateBtnText}>Generate schedules</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderResults = () => (
    <View style={{ flex: 1 }}>
      {generated.notes.length > 0 && (
        <View style={st.notesWrap}>
          {generated.notes.map((n, i) => (
            <Text key={i} style={st.noteText}>• {n}</Text>
          ))}
        </View>
      )}
      {generated.candidates.length === 0 ? (
        <View style={st.emptyWrap}>
          <Text style={st.emptyText}>No schedules found.</Text>
          <Text style={st.emptyHint}>Try fewer courses or looser preferences.</Text>
        </View>
      ) : (
        <FlatList
          data={generated.candidates}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={st.candRow}
              onPress={() => setPreview(item)}
              accessibilityLabel={`Preview schedule option ${index + 1}`}
            >
              <View style={st.candScoreBadge}>
                <Text style={st.candScoreText}>{item.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.candTitle}>Option {index + 1}</Text>
                <Text style={st.candStats}>{statsLine(item)}</Text>
                <Text style={st.candCourses} numberOfLines={2}>
                  {item.sections.map((s) =>
                    `${courseCodeOf(s)}${s.section_number ? `-${s.section_number}` : ''}`).join('  ')}
                </Text>
              </View>
              <Text style={st.candChevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity
        style={st.adjustBtn}
        onPress={() => { setPhase('setup'); setGenerated(null); }}
        accessibilityLabel="Adjust courses and preferences"
      >
        <Text style={st.adjustBtnText}>Adjust courses / preferences</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => {
    const blocks = sectionsToBlocks(preview.sections);
    const bounds = gridBounds(blocks);
    const conflicts = findConflicts(blocks);
    return (
      <View style={{ flex: 1 }}>
        <Text style={st.previewStats}>{statsLine(preview)}</Text>
        <View style={{ flex: 1 }}>
          <ScheduleGrid
            blocks={blocks}
            conflicts={conflicts}
            startHour={bounds.startHour}
            endHour={bounds.endHour}
            days={bounds.days}
            onPressBlock={() => {}}
          />
        </View>
        <View style={st.previewBtnRow}>
          <TouchableOpacity
            style={st.backBtn}
            onPress={() => setPreview(null)}
            accessibilityLabel="Back to schedule options"
          >
            <Text style={st.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.useBtn, applying && st.generateBtnDisabled]}
            onPress={() => confirmApply(preview)}
            disabled={applying}
            accessibilityLabel="Use this schedule"
          >
            {applying
              ? <ActivityIndicator color="#fff" />
              : <Text style={st.useBtnText}>Use this schedule</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={st.container}>
        <View style={st.header}>
          <Text style={st.title}>
            {preview ? 'Preview' : phase === 'results' ? 'Suggested Schedules' : 'Generate Schedule'}
          </Text>
          <TouchableOpacity onPress={close} style={st.closeBtn} accessibilityLabel="Close generator">
            <Text style={st.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={st.termLabel}>{termLabel}</Text>
        {preview ? renderPreview() : phase === 'results' && generated ? renderResults() : renderSetup()}
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: STATUSBAR_HEIGHT },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { padding: 8 },
  closeText: { color: '#A30046', fontSize: 16, fontWeight: '600' },
  termLabel: { paddingHorizontal: 16, color: '#666', marginBottom: 8 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8, paddingHorizontal: 16,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: '#A30046', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12,
    marginRight: 8, marginBottom: 8,
  },
  chipText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
    marginHorizontal: 16, marginTop: 4, fontSize: 15, color: '#1a1a1a',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  resultCode: { fontWeight: '700', color: '#A30046', width: 100 },
  resultName: { flex: 1, color: '#444' },

  prefRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  prefText: { fontSize: 15, color: '#1a1a1a', flex: 1, paddingRight: 8 },
  prefSubLabel: { fontSize: 13, color: '#666', paddingHorizontal: 16, marginTop: 8, marginBottom: 6 },
  optChip: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 16,
    paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, marginBottom: 8,
  },
  optChipOn: { backgroundColor: '#A30046', borderColor: '#A30046' },
  optChipText: { color: '#444', fontSize: 13, fontWeight: '600' },
  optChipTextOn: { color: '#fff' },

  generateBtn: {
    backgroundColor: '#A30046', borderRadius: 12, margin: 16, paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  notesWrap: { backgroundColor: '#FEF3C7', padding: 12, marginHorizontal: 16, borderRadius: 10, marginBottom: 8 },
  noteText: { color: '#92400E', fontSize: 13, marginBottom: 2 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#444' },
  emptyHint: { color: '#888', marginTop: 6 },

  candRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  candScoreBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#A30046',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  candScoreText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  candTitle: { fontWeight: '700', color: '#1a1a1a', fontSize: 15 },
  candStats: { color: '#666', fontSize: 13, marginTop: 2 },
  candCourses: { color: '#888', fontSize: 12, marginTop: 3 },
  candChevron: { color: '#bbb', fontSize: 24, paddingLeft: 8 },

  adjustBtn: { padding: 14, alignItems: 'center' },
  adjustBtnText: { color: '#A30046', fontWeight: '600' },

  previewStats: { paddingHorizontal: 16, paddingBottom: 8, color: '#666', fontSize: 13 },
  previewBtnRow: { flexDirection: 'row', padding: 12, gap: 10 },
  backBtn: {
    flex: 1, borderWidth: 1, borderColor: '#A30046', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginRight: 10,
  },
  backBtnText: { color: '#A30046', fontWeight: '700', fontSize: 15 },
  useBtn: {
    flex: 2, backgroundColor: '#A30046', borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
  },
  useBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default GenerateScheduleModal;
