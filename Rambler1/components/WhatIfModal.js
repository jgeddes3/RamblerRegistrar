// components/WhatIfModal.js — "What if I changed/added a major or minor?"
// (planner v2, user request 2026-07-09).
//
// Sweeps every program of the chosen type, credits the user's COMPLETED +
// PLANNED courses against each program's requirements (choice-group and
// subject-elective aware via requirement-progress), and splits the results:
//   - "Fits your timeline": finishable by graduation at <= 5 courses/semester
//   - "Would extend your time": pickable, but with the honest warning —
//     "This will possibly add ~N semesters to your time in university."
// Programs whose requirements aren't loaded yet (B12 phase-2 leftovers) sit
// at the bottom, pickable with an impact-unknown caveat.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import {
  fetchPrograms, fetchProgramRequirementRowsLean, saveUserProfile,
} from '../firestore-data';
import { computeRequirementProgress } from '../requirement-progress';
import { programImpact, allPlannedCodes, normCode } from '../plan-utils';
import { useAppContext } from '../AppContext';
import showAlert from '../alert';
import { FONT, MAROON } from '../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;
const MAX_MINORS = 3;

const MODES = [
  { key: 'change', label: 'Change major', type: 'major' },
  { key: 'add2', label: 'Add 2nd major', type: 'major' },
  { key: 'minor', label: 'Add minor', type: 'minor' },
];

const WhatIfModal = ({
  visible, onClose,
  // asScreen: render as plain page content instead of a native Modal.
  // MajorsMinorsScreen mounts this permanently-visible inside a navigation
  // screen; popping that screen while a native Modal is still presented (and
  // often while a confirm alert is mid-dismiss) races the dismissal on iOS
  // and can leave a dead overlay that eats every touch — the "can't close
  // the page" freeze. A plain View has no native presentation to race.
  asScreen = false,
  // From PlanningScreen so the baseline matches what the user sees there:
  baseRemainingCount, semestersLeft, plans,
}) => {
  const {
    user, selectedCourses,
    selectedProgram, setSelectedProgram,
    selectedProgram2, setSelectedProgram2,
    selectedMinors, setSelectedMinors,
  } = useAppContext();

  const [mode, setMode] = useState('change');
  const [rows, setRows] = useState(null); // [{program, remaining, impact, unknown}]
  const [applying, setApplying] = useState(false);

  // Completed + planned both count as credit toward a candidate program.
  const creditedCodes = useMemo(() => new Set([
    ...(selectedCourses || []).map((c) => normCode(c.code)),
    ...allPlannedCodes(plans),
  ]), [selectedCourses, plans]);

  const modeDef = MODES.find((m) => m.key === mode);

  useEffect(() => {
    if (!visible) return undefined;
    let alive = true;
    setRows(null);
    (async () => {
      const programs = (await fetchPrograms(modeDef.type)) || [];
      // Exclude what the user already has in this slot.
      const excluded = new Set([
        ...(mode === 'change' || mode === 'add2' ? [selectedProgram?.id, selectedProgram2?.id] : []),
        ...(mode === 'minor' ? (selectedMinors || []).map((m) => m.id) : []),
      ].filter((x) => x != null).map(String));
      const candidates = programs.filter((p) => !excluded.has(String(p.id)));

      // Lean requirement sweep, small parallel batches.
      const out = [];
      for (let i = 0; i < candidates.length && alive; i += 12) {
        const batch = candidates.slice(i, i + 12);
        const results = await Promise.all(batch.map(async (p) => {
          const reqRows = await fetchProgramRequirementRowsLean(p.id);
          if (!reqRows.length) return { program: p, unknown: true };
          const prog = computeRequirementProgress(reqRows, creditedCodes);
          const impact = programImpact({
            programRemainingCount: prog.remainingCount,
            baseRemainingCount,
            semestersLeft,
          });
          return { program: p, remaining: prog.remainingCount, impact, unknown: false };
        }));
        out.push(...results);
      }
      if (!alive) return;
      out.sort((a, b) => (a.unknown - b.unknown) || ((a.remaining ?? 999) - (b.remaining ?? 999)));
      setRows(out);
    })();
    return () => { alive = false; };
  }, [visible, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async (entry) => {
    if (applying || !user) return;
    const p = entry.program;
    const doApply = async () => {
      setApplying(true);
      let ok = null;
      if (mode === 'change') {
        ok = await saveUserProfile(user.uid, { selectedProgramId: p.id });
        if (ok) setSelectedProgram(p);
      } else if (mode === 'add2') {
        ok = await saveUserProfile(user.uid, { selectedProgram2Id: p.id });
        if (ok) setSelectedProgram2(p);
      } else {
        const current = selectedMinors || [];
        if (current.length >= MAX_MINORS) {
          setApplying(false);
          showAlert('Minor limit', `You can have at most ${MAX_MINORS} minors.`);
          return;
        }
        ok = await saveUserProfile(user.uid, { selectedMinors: [...current.map((m) => m.id), p.id] });
        if (ok) setSelectedMinors([...current, p]);
      }
      setApplying(false);
      if (ok) {
        onClose();
        showAlert('Done', `${p.name} ${mode === 'change' ? 'is now your major' : 'added'}.`);
      } else {
        showAlert('Save failed', 'Could not update your profile. Please try again.');
      }
    };

    if (entry.unknown) {
      showAlert(
        p.name,
        "This program's requirements aren't loaded yet, so we can't estimate the time impact. Add anyway?",
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Add anyway', onPress: doApply }]
      );
    } else if (!entry.impact.fitsTimeline) {
      const n = Math.max(1, entry.impact.addedSemesters);
      showAlert(
        p.name,
        `This will possibly add ~${n} semester${n === 1 ? '' : 's'} to your time in university ` +
        `(${entry.remaining} more course units at a full load). Add anyway?`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Add anyway', onPress: doApply }]
      );
    } else {
      showAlert(
        p.name,
        `${entry.remaining} more course unit${entry.remaining === 1 ? '' : 's'}. Fits your current timeline. Confirm?`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: doApply }]
      );
    }
  };

  const fitting = (rows || []).filter((r) => !r.unknown && r.impact.fitsTimeline);
  const stretching = (rows || []).filter((r) => !r.unknown && !r.impact.fitsTimeline);
  const unknowns = (rows || []).filter((r) => r.unknown);

  const Row = ({ entry, badgeText, badgeStyle }) => (
    <TouchableOpacity
      style={s.row}
      onPress={() => apply(entry)}
      disabled={applying}
      accessibilityLabel={`Pick ${entry.program.name}`}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.rowName}>{entry.program.name}{entry.program.degree ? ` (${entry.program.degree})` : ''}</Text>
        <Text style={s.rowSub}>
          {entry.unknown
            ? 'Requirements not loaded yet, so impact is unknown'
            : `${entry.remaining} more unit${entry.remaining === 1 ? '' : 's'} after your completed + planned courses`}
        </Text>
      </View>
      <View style={[s.badge, badgeStyle]}>
        <Text style={s.badgeText}>{badgeText}</Text>
      </View>
    </TouchableOpacity>
  );

  const content = (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>What If?</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Close what-if explorer">
            <Text style={s.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.subtitle}>
          Every program, measured against what you've already completed and planned.
        </Text>

        <View style={s.modeRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.modeChip, mode === m.key && s.modeChipOn]}
              onPress={() => setMode(m.key)}
              accessibilityLabel={m.label}
            >
              <Text style={[s.modeChipText, mode === m.key && s.modeChipTextOn]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {rows === null ? (
          <View style={s.centerWrap}>
            <ActivityIndicator size="large" color={MAROON} />
            <Text style={s.loadingText}>Measuring every {modeDef.type} against your record...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
            {fitting.length > 0 && (
              <>
                <Text style={s.groupTitle}>Fits your timeline</Text>
                {fitting.map((r) => (
                  <Row key={r.program.id} entry={r} badgeText="Fits" badgeStyle={s.badgeFits} />
                ))}
              </>
            )}
            {stretching.length > 0 && (
              <>
                <Text style={s.groupTitle}>Would extend your time</Text>
                {stretching.map((r) => (
                  <Row
                    key={r.program.id}
                    entry={r}
                    badgeText={`+${Math.max(1, r.impact.addedSemesters)} sem`}
                    badgeStyle={s.badgeStretch}
                  />
                ))}
              </>
            )}
            {unknowns.length > 0 && (
              <>
                <Text style={s.groupTitle}>Requirements not loaded yet</Text>
                {unknowns.map((r) => (
                  <Row key={r.program.id} entry={r} badgeText="?" badgeStyle={s.badgeUnknown} />
                ))}
              </>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
  );

  if (asScreen) return visible ? content : null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: STATUSBAR_HEIGHT },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 2,
  },
  title: { fontFamily: FONT, fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  closeBtn: { padding: 8 },
  closeText: { fontFamily: FONT, fontSize: 18, fontWeight: '600', color: MAROON },
  subtitle: { fontFamily: FONT, fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 8 },

  modeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 6 },
  modeChip: {
    flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 14,
    paddingVertical: 7, alignItems: 'center',
  },
  modeChipOn: { backgroundColor: MAROON, borderColor: MAROON },
  modeChipText: { fontFamily: FONT, fontSize: 14, fontWeight: '600', color: '#444', textAlign: 'center' },
  modeChipTextOn: { color: '#FFF' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontFamily: FONT, fontSize: 15, color: '#999', marginTop: 12, textAlign: 'center' },

  groupTitle: { fontFamily: FONT, fontSize: 20, color: MAROON, marginTop: 10, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  rowName: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#333' },
  rowSub: { fontFamily: FONT, fontSize: 13, color: '#777', marginTop: 1 },
  badge: { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9 },
  badgeFits: { backgroundColor: '#d1fae5' },
  badgeStretch: { backgroundColor: '#fee2e2' },
  badgeUnknown: { backgroundColor: '#f3f4f6' },
  badgeText: { fontFamily: FONT, fontSize: 13, fontWeight: '700', color: '#333' },
});

export default WhatIfModal;
