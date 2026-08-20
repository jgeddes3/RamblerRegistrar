// screens/PlanningScreen.js — Multi-year course planner (F-P1).
// One card per upcoming semester (now → Spring of graduationYear); each holds
// planned COURSES (no sections — the Schedule tab owns section choices for the
// registration term). Courses arrive here from in-page search, from Progress
// ("plan it"), or from any course detail modal.
//
// The header banner ties the plan into the requirement engine: planned codes
// feed planning-insights.requirementCoverage, so students see "your plan
// covers N of your remaining requirements" as they build it.

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Alert, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import {
  fetchPlans, addCourseToPlan, removeCourseFromPlan, searchCourses,
  fetchDegreeProgress, fetchUserCoreProgress, fetchPrerequisites, PLAN_TERM_CAP,
} from '../firestore-data';
import { planSemesters, allPlannedCodes, planOrderingIssues, termLabelFor } from '../plan-utils';
import { requirementCoverage } from '../planning-insights';
import { buildRecommendations } from '../recommend';
import { FONT, MAROON, EYEBROW } from '../theme';
import showAlert from '../alert';
import WhatIfModal from '../components/WhatIfModal';

// Bottom sheet must ride above the keyboard: iOS pads, Android shrinks.
// (react-native-web ignores `behavior`, so web is unaffected.)
const KAV_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height';

const PlanningScreen = () => {
  const {
    user, isLoggedIn, graduationYear, selectedProgram, selectedProgram2, selectedMinors,
    selectedCourses, selectedFocus,
  } = useAppContext();
  const uid = user?.uid;

  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(null); // {degreeProgress, additionalDegreeProgress, coreProgress}
  const [saving, setSaving] = useState(false);

  // Add-course modal state
  const [addTarget, setAddTarget] = useState(null); // termCode being added to
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);
  const seqRef = useRef(0);

  const semesters = useMemo(() => planSemesters(graduationYear), [graduationYear]);

  const load = useCallback(async (isActive) => {
    if (!uid) return;
    const [planMap, degreeProgress, coreProgress, ...additional] = await Promise.all([
      fetchPlans(uid),
      selectedProgram && selectedProgram.id !== 'undecided'
        ? fetchDegreeProgress(uid, selectedProgram.id).catch(() => null)
        : null,
      fetchUserCoreProgress(uid, selectedProgram?.school || null).catch(() => null),
      ...(selectedProgram2 ? [fetchDegreeProgress(uid, selectedProgram2.id).catch(() => null)] : []),
      ...((selectedMinors || []).map((m) => fetchDegreeProgress(uid, m.id).catch(() => null))),
    ]);
    if (!isActive()) return;
    setPlans(planMap || {});
    setPlanning({
      degreeProgress: degreeProgress && !degreeProgress.error ? degreeProgress : null,
      additionalDegreeProgress: additional.filter((p) => p && !p.error),
      coreProgress: coreProgress && !coreProgress.error ? coreProgress : null,
    });
    setLoading(false);
  }, [uid, selectedProgram, selectedProgram2, selectedMinors]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load(() => active);
      return () => { active = false; };
    }, [load])
  );

  // Coverage banner: how much of the remaining requirements the plan covers —
  // and how many remain UNPLANNED (planner v2: makes the outlook actionable).
  const coverage = useMemo(() => {
    if (!planning) return null;
    try {
      const planned = allPlannedCodes(plans);
      if (!planned.length) return null;
      const cov = requirementCoverage({
        degreeProgress: planning.degreeProgress,
        additionalDegreeProgress: planning.additionalDegreeProgress,
        coreProgress: planning.coreProgress,
        plannedCourseCodes: planned,
      });
      return {
        covered: cov.coveredCount,
        planned: planned.length,
        unplanned: Math.max(0, (cov.remainingTotal || 0) - cov.coveredCount),
      };
    } catch (e) {
      return null;
    }
  }, [planning, plans]);

  const plannedEverywhere = useMemo(() => new Set(allPlannedCodes(plans)), [plans]);

  // Prereq-ordering warnings (planner v2). Prereqs fetched once per planned
  // course; completed codes come from the user's course history in context.
  const [prereqsByCode, setPrereqsByCode] = useState({});
  const [whatIfVisible, setWhatIfVisible] = useState(false);
  useEffect(() => {
    let alive = true;
    const codes = allPlannedCodes(plans).filter((c) => prereqsByCode[c] === undefined);
    if (!codes.length) return () => { alive = false; };
    Promise.all(codes.map(async (c) => {
      try {
        const rows = await fetchPrerequisites(c);
        return [c, (rows || []).map((r) => r.prerequisite_code)];
      } catch (e) {
        return [c, []];
      }
    })).then((pairs) => {
      if (!alive) return;
      setPrereqsByCode((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => { alive = false; };
  }, [plans]); // eslint-disable-line react-hooks/exhaustive-deps

  // Baseline for the what-if explorer: unplanned requirement units across the
  // user's CURRENT programs + core (0-planned case included).
  const baseRemaining = useMemo(() => {
    if (!planning) return 0;
    try {
      const cov = requirementCoverage({
        degreeProgress: planning.degreeProgress,
        additionalDegreeProgress: planning.additionalDegreeProgress,
        coreProgress: planning.coreProgress,
        plannedCourseCodes: allPlannedCodes(plans),
      });
      return Math.max(0, (cov.remainingTotal || 0) - cov.coveredCount);
    } catch (e) {
      return 0;
    }
  }, [planning, plans]);

  const orderingIssues = useMemo(() => planOrderingIssues({
    planByTerm: plans,
    termOrder: semesters.map((sm) => sm.code),
    prereqsByCode,
    completedCodes: (selectedCourses || []).map((c) => c.code),
  }), [plans, semesters, prereqsByCode, selectedCourses]);

  // "Recommended for you" in the add modal (empty-query state): remaining
  // requirements ordered focus-first, minus anything already planned.
  const recommendations = useMemo(() => {
    try {
      return buildRecommendations({
        remaining: planning?.degreeProgress?.remaining || [],
        focusCourses: selectedFocus?.courses || [],
        excludeCodes: allPlannedCodes(plans),
        limit: 6,
      });
    } catch (e) {
      return [];
    }
  }, [planning, selectedFocus, plans]);

  // ------------------------------------------------------------------ add
  const openAdd = (termCode) => {
    setAddTarget(termCode);
    setQuery('');
    setResults([]);
  };
  const closeAdd = () => {
    seqRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAddTarget(null);
    setQuery('');
    setResults([]);
    setSearchLoading(false);
  };

  const onSearchChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++seqRef.current;
    if (!text.trim()) { setResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      let found = [];
      try { found = (await searchCourses(text.trim())) || []; } catch (e) { found = []; }
      if (seq !== seqRef.current) return;
      setResults(found.slice(0, 25));
      setSearchLoading(false);
    }, 250);
  };

  const addCourse = async (course) => {
    if (saving || !addTarget) return;
    setSaving(true);
    const res = await addCourseToPlan(uid, addTarget, course.code);
    setSaving(false);
    if (res?.added) {
      setPlans((prev) => ({
        ...prev,
        [addTarget]: [...(prev[addTarget] || []), course.code.toUpperCase()],
      }));
      closeAdd();
    } else if (res?.already) {
      showAlert('Already planned', `${course.code} is already in this semester.`);
    } else if (res?.full) {
      showAlert('Semester full', `A semester plan holds at most ${PLAN_TERM_CAP} courses.`);
    } else {
      showAlert('Save failed', 'Could not update your plan. Please try again.');
    }
  };

  const confirmRemove = (termCode, code) => {
    showAlert(code, 'Remove from this semester?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const res = await removeCourseFromPlan(uid, termCode, code);
          if (res) {
            setPlans((prev) => ({
              ...prev,
              [termCode]: (prev[termCode] || []).filter((c) => c.toUpperCase() !== code.toUpperCase()),
            }));
          } else {
            showAlert('Remove failed', 'Could not update your plan. Please try again.');
          }
        },
      },
    ]);
  };

  // ------------------------------------------------------------------ render
  if (!isLoggedIn) {
    return (
      <View style={s.centerWrap}>
        <Text style={s.emptyTitle}>Sign in to plan your semesters</Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={s.centerWrap}>
        <ActivityIndicator size="large" color={MAROON} />
        <Text style={s.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {coverage ? (
        <View style={s.coverageBanner}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#065f46" />
          <Text style={s.coverageText}>
            Your plan covers {coverage.covered} of your remaining requirements
            ({coverage.planned} course{coverage.planned === 1 ? '' : 's'} planned
            {coverage.unplanned > 0 ? `, ${coverage.unplanned} requirement${coverage.unplanned === 1 ? '' : 's'} still unplanned` : ', everything is planned!'}).
          </Text>
        </View>
      ) : (
        <Text style={s.introText}>
          Sketch future semesters with courses. Add them here, from Progress,
          or from any course page. Sections come later on the Schedule tab.
        </Text>
      )}

      {/* What-if explorer (planner v2): change/add major, add minor — with
          honest time-cost estimates against completed + planned courses. */}
      <TouchableOpacity
        style={s.whatIfBtn}
        onPress={() => setWhatIfVisible(true)}
        accessibilityLabel="Explore majors and minors"
      >
        <Ionicons name="compass-outline" size={18} color={MAROON} />
        <Text style={s.whatIfBtnText}>
          What if? Change or add a major/minor and see the time cost
        </Text>
      </TouchableOpacity>

      {/* Prereq-ordering warnings (planner v2) */}
      {orderingIssues.length > 0 ? (
        <View style={s.orderBanner}>
          {orderingIssues.slice(0, 4).map((iss, i) => (
            <View key={`${iss.code}-${iss.prereq}-${i}`} style={s.orderRow}>
              <Ionicons name="warning-outline" size={13} color="#92400E" style={{ marginTop: 2 }} />
              <Text style={s.orderText}>
                {iss.code} ({termLabelFor(iss.term)}) needs {iss.prereq}
                {iss.reason === 'later' ? ' (planned AFTER it)'
                  : iss.reason === 'same' ? ' (planned the same semester)'
                  : ' (not completed or planned)'}
              </Text>
            </View>
          ))}
          {orderingIssues.length > 4 ? (
            <Text style={s.orderText}>…and {orderingIssues.length - 4} more.</Text>
          ) : null}
        </View>
      ) : null}

      {semesters.map((sem) => {
        const codes = plans[sem.code] || [];
        return (
          <View key={sem.code} style={s.semCard}>
            <View style={s.semHeader}>
              <Text style={s.semTitle}>{sem.label}</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => openAdd(sem.code)}
                accessibilityLabel={`Add course to ${sem.label}`}
              >
                <Text style={s.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {codes.length === 0 ? (
              <Text style={s.semEmpty}>Nothing planned yet.</Text>
            ) : (
              <View style={s.chipsWrap}>
                {codes.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={s.chip}
                    onPress={() => confirmRemove(sem.code, code)}
                    accessibilityLabel={`Remove ${code} from ${sem.label}`}
                  >
                    <Text style={s.chipText}>{code}  ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 30 }} />

      <WhatIfModal
        visible={whatIfVisible}
        onClose={() => setWhatIfVisible(false)}
        baseRemainingCount={baseRemaining}
        semestersLeft={semesters.length}
        plans={plans}
      />

      {/* ------------------------- ADD-COURSE MODAL ------------------------- */}
      <Modal visible={!!addTarget} animationType="slide" transparent onRequestClose={closeAdd}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={KAV_BEHAVIOR}>
          <View style={s.modalPanel}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Add to {semesters.find((x) => x.code === addTarget)?.label || 'semester'}
              </Text>
              <TouchableOpacity onPress={closeAdd} style={s.modalClose} accessibilityLabel="Close add course">
                <Text style={s.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search courses (e.g. PHIL 181)"
              placeholderTextColor="#999"
              value={query}
              onChangeText={onSearchChange}
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {searchLoading && <ActivityIndicator style={{ marginTop: 10 }} color={MAROON} />}
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
              {/* Empty query → surface remaining requirements, focus-first. */}
              {!query.trim() && recommendations.length > 0 ? (
                <>
                  <Text style={s.recHeading}>Recommended for you</Text>
                  {recommendations.map((rec) => (
                    <TouchableOpacity
                      key={rec.code}
                      style={s.resultRow}
                      onPress={() => addCourse({ code: rec.code, name: rec.name })}
                      disabled={saving}
                      accessibilityLabel={`Plan recommended course ${rec.code}`}
                    >
                      <Text style={s.resultCode}>{rec.code}</Text>
                      <Text style={s.resultName} numberOfLines={1}>{rec.name || ''}</Text>
                      {rec.isFocus ? (
                        <View style={s.focusBadge}>
                          <Ionicons name="star" size={10} color="#FFF" />
                          <Text style={s.focusBadgeText}>Focus</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </>
              ) : null}
              {results.map((course) => {
                const already = plannedEverywhere.has(String(course.code).toUpperCase());
                return (
                  <TouchableOpacity
                    key={course.code}
                    style={[s.resultRow, already && { opacity: 0.45 }]}
                    onPress={() => addCourse(course)}
                    disabled={saving}
                    accessibilityLabel={`Plan ${course.code}`}
                  >
                    <Text style={s.resultCode}>{course.code}</Text>
                    <Text style={s.resultName} numberOfLines={1}>
                      {course.name || ''}{already ? '  · planned' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF9F4' },
  content: { padding: 16, paddingBottom: 32 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBF9F4', padding: 24 },
  loadingText: { fontFamily: FONT, fontSize: 16, color: '#999', marginTop: 12 },
  emptyTitle: { fontFamily: FONT, fontSize: 22, color: '#999', textAlign: 'center' },
  introText: { fontFamily: FONT, fontSize: 15, color: '#777', marginBottom: 14, lineHeight: 21 },

  coverageBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#d1fae5', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  coverageText: { flex: 1, fontFamily: FONT, fontSize: 15, color: '#065f46' },
  orderBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 3 },
  orderText: { flex: 1, fontFamily: FONT, fontSize: 14, color: '#92400E', lineHeight: 19 },
  whatIfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E8CDD9', backgroundColor: '#FBF0F5',
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  whatIfBtnText: { flex: 1, fontFamily: FONT, fontSize: 15, color: MAROON, fontWeight: '600' },

  semCard: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12,
    padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF',
  },
  semHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  semTitle: { fontFamily: FONT, fontSize: 22, color: MAROON },
  addBtn: {
    borderWidth: 1, borderColor: MAROON, borderRadius: 14,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  addBtnText: { fontFamily: FONT, fontSize: 15, color: MAROON, fontWeight: '600' },
  semEmpty: { fontFamily: FONT, fontSize: 14, color: '#AAA' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#FBF0F5', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 11,
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E8CDD9',
  },
  chipText: { fontFamily: FONT, fontSize: 15, color: MAROON, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalPanel: {
    backgroundColor: '#FFF', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 16, minHeight: 320,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontFamily: FONT, fontSize: 22, color: '#1a1a1a' },
  modalClose: { padding: 6 },
  modalCloseText: { fontFamily: FONT, fontSize: 17, color: MAROON, fontWeight: '600' },
  searchInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12,
    fontFamily: FONT, fontSize: 17, color: '#1a1a1a', marginBottom: 6,
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  resultCode: { fontFamily: FONT, fontSize: 16, fontWeight: '700', color: MAROON, width: 104 },
  resultName: { fontFamily: FONT, fontSize: 16, flex: 1, color: '#444' },
  recHeading: { ...EYEBROW, marginTop: 8, marginBottom: 2 },
  focusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: MAROON, borderRadius: 9,
    paddingVertical: 2, paddingHorizontal: 7, marginLeft: 8,
  },
  focusBadgeText: { fontFamily: FONT, fontSize: 13, color: '#FFF', fontWeight: '600' },
});

export default PlanningScreen;
