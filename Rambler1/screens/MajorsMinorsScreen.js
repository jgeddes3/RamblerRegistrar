// screens/MajorsMinorsScreen.js — the What-If explorer as its own page (user
// request 2026-07-09: "include Change major/add major/add minor as a page").
// Wraps WhatIfModal; closing it leaves the page. The coverage baseline is
// computed the same way PlanningScreen does it.

import React, { useMemo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import WhatIfModal from '../components/WhatIfModal';
import { useAppContext } from '../AppContext';
import { fetchPlans, fetchDegreeProgress, fetchUserCoreProgress } from '../firestore-data';
import { planSemesters, allPlannedCodes } from '../plan-utils';
import { requirementCoverage } from '../planning-insights';
import { PARCHMENT } from '../theme';

const MajorsMinorsScreen = () => {
  const navigation = useNavigation();
  const { user, graduationYear, selectedProgram, selectedProgram2, selectedMinors } = useAppContext();
  const uid = user?.uid;

  const [plans, setPlans] = useState({});
  const [baseRemaining, setBaseRemaining] = useState(0);
  const semesters = useMemo(() => planSemesters(graduationYear), [graduationYear]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
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
        if (!active) return;
        setPlans(planMap || {});
        try {
          const cov = requirementCoverage({
            degreeProgress: degreeProgress && !degreeProgress.error ? degreeProgress : null,
            additionalDegreeProgress: additional.filter((p) => p && !p.error),
            coreProgress: coreProgress && !coreProgress.error ? coreProgress : null,
            plannedCourseCodes: allPlannedCodes(planMap || {}),
          });
          setBaseRemaining(Math.max(0, (cov.remainingTotal || 0) - cov.coveredCount));
        } catch (e) {
          setBaseRemaining(0);
        }
      })();
      return () => { active = false; };
    }, [uid, selectedProgram, selectedProgram2, selectedMinors])
  );

  return (
    <View style={{ flex: 1, backgroundColor: PARCHMENT }}>
      <WhatIfModal
        visible
        asScreen
        onClose={() => navigation.goBack()}
        baseRemainingCount={baseRemaining}
        semestersLeft={semesters.length}
        plans={plans}
      />
    </View>
  );
};

export default MajorsMinorsScreen;
