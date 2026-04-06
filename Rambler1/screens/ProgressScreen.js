import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppContext } from '../AppContext';
import { fetchDegreeProgress, fetchPrerequisites, addUserCourse, fetchUserCourses, fetchUserCoreProgress } from '../api';
import { getIdToken } from '../auth';

// ============================================================
// Progress Bar Component
// ============================================================
const ProgressBar = ({ label, percent, completed, total, unit, color }) => (
  <View style={s.progressCard}>
    <View style={s.progressCardHeader}>
      <Text style={s.progressCardLabel}>{label}</Text>
      <Text style={s.progressCardPercent}>{percent}%</Text>
    </View>
    <View style={s.progressBarBg}>
      <View style={[s.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color || '#A30046' }]} />
    </View>
    <Text style={s.progressCardDetail}>{completed} / {total} {unit}</Text>
  </View>
);

// ============================================================
// Course Row Component
// ============================================================
const CourseRow = ({ icon, iconColor, code, name, detail, indent }) => (
  <View style={[s.courseRow, indent && { paddingLeft: 28 }]}>
    <Text style={[s.rowIcon, { color: iconColor || '#A30046' }]}>{icon}</Text>
    <View style={s.courseInfo}>
      <Text style={s.courseCode}>{code}</Text>
      {name ? <Text style={s.courseName}>{name}</Text> : null}
      {detail ? <Text style={s.courseDetail}>{detail}</Text> : null}
    </View>
  </View>
);

// ============================================================
// Main Progress Screen
// ============================================================
const ProgressScreen = () => {
  const { selectedProgram, selectedProgram2, selectedMinors, selectedCourses, user } = useAppContext();

  const [view, setView] = useState('all'); // 'all', 'major', 'core', or a program id
  const [progress, setProgress] = useState(null);
  const [upNext, setUpNext] = useState([]);
  const [needsPrereqs, setNeedsPrereqs] = useState([]);
  const [coreProgress, setCoreProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  const allPrograms = [];
  if (selectedProgram) allPrograms.push(selectedProgram);
  if (selectedProgram2) allPrograms.push(selectedProgram2);
  if (selectedMinors) for (const m of selectedMinors) allPrograms.push(m);

  const activeProgram = view === 'major' ? selectedProgram : allPrograms.find(p => p?.id === parseInt(view)) || selectedProgram;

  // Sync courses on first load
  useEffect(() => {
    if (!user || synced || !selectedCourses || selectedCourses.length === 0) {
      setSynced(true);
      return;
    }
    const sync = async () => {
      try {
        const token = await getIdToken();
        if (!token) { setSynced(true); return; }
        const existing = await fetchUserCourses(user.uid);
        const existingCodes = new Set((existing || []).map(c => c.course_code));
        for (const course of selectedCourses) {
          if (!existingCodes.has(course.code)) {
            await addUserCourse(user.uid, course.code, null, null, token);
          }
        }
      } catch (e) {}
      setSynced(true);
    };
    sync();
  }, [user, selectedCourses]);

  // Load major progress
  const loadMajorProgress = useCallback(async (programId) => {
    if (!user || !synced || !programId) return null;
    try {
      const data = await fetchDegreeProgress(user.uid, programId);
      if (!data || data.error) return null;

      const completedCodes = new Set((data.completed || []).map(c => c.code));
      const upNextList = [];
      const needsList = [];

      for (const course of (data.remaining || [])) {
        const prereqs = await fetchPrerequisites(course.code);
        const prereqCodes = (prereqs || []).map(p => p.prerequisite_code);
        if (prereqCodes.length === 0) {
          upNextList.push({ ...course, prereqs: [] });
        } else {
          const allMet = prereqCodes.every(p => completedCodes.has(p));
          if (allMet) {
            upNextList.push({ ...course, prereqs: prereqCodes });
          } else {
            needsList.push({ ...course, missingPrereqs: prereqCodes.filter(p => !completedCodes.has(p)) });
          }
        }
      }

      return { progress: data, upNext: upNextList, needsPrereqs: needsList };
    } catch (e) { return null; }
  }, [user, synced]);

  // Load core progress
  const loadCoreProgress = useCallback(async () => {
    if (!user || !synced) return null;
    try {
      const school = selectedProgram?.school || null;
      const data = await fetchUserCoreProgress(user.uid, school);
      return (data && !data.error) ? data : null;
    } catch (e) { return null; }
  }, [user, synced, selectedProgram]);

  // Load everything
  useEffect(() => {
    if (!synced) return;
    setLoading(true);
    Promise.all([
      selectedProgram ? loadMajorProgress(selectedProgram.id) : null,
      loadCoreProgress(),
    ]).then(([majorData, coreData]) => {
      if (majorData) {
        setProgress(majorData.progress);
        setUpNext(majorData.upNext);
        setNeedsPrereqs(majorData.needsPrereqs);
      }
      if (coreData) setCoreProgress(coreData);
      setLoading(false);
    });
  }, [synced, selectedProgram, loadMajorProgress, loadCoreProgress]);

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 80 }} />
      </View>
    );
  }

  // Calculate total credits (120 minimum for graduation)
  const majorCreditsCompleted = progress?.creditsCompleted || 0;
  const majorCreditsRequired = progress?.totalCreditsRequired || 0;
  const coreCreditsCompleted = coreProgress?.completedCredits || 0;
  const coreCreditsRequired = coreProgress?.totalCredits || 0;
  const totalCreditsNeeded = 120;

  // Electives = everything not covered by major or core requirements
  const accountedFor = majorCreditsRequired + coreCreditsRequired;
  const electiveCreditsNeeded = Math.max(totalCreditsNeeded - accountedFor, 0);
  // User's completed elective credits = total completed minus what counts toward major/core
  const userTotalCompleted = (selectedCourses || []).length * 3; // rough: 3 credits per course
  const electiveCreditsCompleted = Math.max(userTotalCompleted - majorCreditsCompleted - coreCreditsCompleted, 0);
  const totalCreditsCompleted = majorCreditsCompleted + coreCreditsCompleted + Math.min(electiveCreditsCompleted, electiveCreditsNeeded);

  // ==================== ALL VIEW ====================
  const renderAllView = () => (
    <ScrollView contentContainerStyle={s.scrollContent}>
      <Text style={s.heading}>Degree Overview</Text>

      {/* Overall 120-credit bar */}
      <ProgressBar
        label="Total Credits to Graduate"
        percent={Math.round((totalCreditsCompleted / totalCreditsNeeded) * 100)}
        completed={totalCreditsCompleted}
        total={totalCreditsNeeded}
        unit="credits"
        color="#333"
      />

      {/* Major bar */}
      {progress && selectedProgram && (
        <TouchableOpacity onPress={() => setView('major')}>
          <ProgressBar
            label={`${selectedProgram.name} (${selectedProgram.degree})`}
            percent={progress.percentComplete}
            completed={progress.creditsCompleted}
            total={progress.totalCreditsRequired}
            unit="credits"
            color="#A30046"
          />
        </TouchableOpacity>
      )}

      {/* Double major bar */}
      {selectedProgram2 && (
        <TouchableOpacity onPress={() => setView(String(selectedProgram2.id))}>
          <ProgressBar
            label={`${selectedProgram2.name} (${selectedProgram2.degree})`}
            percent={0}
            completed={0}
            total={selectedProgram2.min_credits || 60}
            unit="credits"
            color="#2563eb"
          />
        </TouchableOpacity>
      )}

      {/* Minor bars */}
      {(selectedMinors || []).map((minor) => (
        <TouchableOpacity key={minor.id} onPress={() => setView(String(minor.id))}>
          <ProgressBar
            label={`${minor.name} (Minor)`}
            percent={0}
            completed={0}
            total={minor.min_credits || 18}
            unit="credits"
            color="#059669"
          />
        </TouchableOpacity>
      ))}

      {/* Core bar */}
      {coreProgress && (
        <TouchableOpacity onPress={() => setView('core')}>
          <ProgressBar
            label="University Core"
            percent={coreProgress.percentComplete}
            completed={coreProgress.completedCredits}
            total={coreProgress.totalCredits}
            unit="credits"
            color="#7c3aed"
          />
        </TouchableOpacity>
      )}

      {/* Electives / Free credits bar */}
      {electiveCreditsNeeded > 0 && (
        <ProgressBar
          label="Electives / Free Credits"
          percent={Math.round((Math.min(electiveCreditsCompleted, electiveCreditsNeeded) / electiveCreditsNeeded) * 100)}
          completed={Math.min(electiveCreditsCompleted, electiveCreditsNeeded)}
          total={electiveCreditsNeeded}
          unit="credits"
          color="#d97706"
        />
      )}

      {!selectedProgram && (
        <Text style={s.emptyText}>Select a major in your Profile to track progress</Text>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );

  // ==================== MAJOR VIEW ====================
  const renderMajorView = () => {
    if (!progress || !selectedProgram) {
      return <Text style={s.emptyText}>No major selected</Text>;
    }
    return (
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.heading}>{selectedProgram.name} ({selectedProgram.degree})</Text>
        {selectedProgram.school && <Text style={s.subheading}>{selectedProgram.school}</Text>}

        <ProgressBar
          label="Major Progress"
          percent={progress.percentComplete}
          completed={progress.completedCount}
          total={progress.totalRequired}
          unit="courses"
          color="#A30046"
        />

        {progress.completed && progress.completed.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Completed</Text>
            {progress.completed.map((c) => (
              <CourseRow key={c.code || c.id} icon="✓" iconColor="#2d6a4f" code={c.code} name={c.name} />
            ))}
          </View>
        )}

        {upNext.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Up Next</Text>
            <Text style={s.sectionSub}>Prerequisites met — ready to take</Text>
            {upNext.map((c) => (
              <CourseRow key={c.code || c.id} icon="○" iconColor="#A30046" code={c.code} name={c.name} />
            ))}
          </View>
        )}

        {needsPrereqs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Remaining</Text>
            <Text style={s.sectionSub}>Need prerequisites first</Text>
            {needsPrereqs.map((c) => (
              <CourseRow key={c.code || c.id} icon="○" iconColor="#CCC" code={c.code} name={c.name}
                detail={`Needs: ${c.missingPrereqs.join(', ')}`} />
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  };

  // ==================== CORE VIEW ====================
  const renderCoreView = () => {
    if (!coreProgress) {
      return <Text style={s.emptyText}>Could not load core progress</Text>;
    }

    // Group areas: one-course areas first, then tiered pairs, then other
    const singleAreas = coreProgress.areas.filter(a => a.category === 'one-course' && a.name !== 'First Year Seminar' && a.name !== 'Engaged Learning');
    const tieredAreas = coreProgress.areas.filter(a => a.category === 'tiered');
    const otherAreas = coreProgress.areas.filter(a => a.name === 'First Year Seminar' || a.name === 'Engaged Learning');

    // Group tiered by base name
    const tieredGroups = {};
    for (const a of tieredAreas) {
      const baseName = a.name.replace(/ - Tier [12]/, '');
      if (!tieredGroups[baseName]) tieredGroups[baseName] = [];
      tieredGroups[baseName].push(a);
    }

    return (
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.heading}>University Core Curriculum</Text>
        <Text style={s.subheading}>Required for all undergraduates</Text>

        <ProgressBar
          label="Core Progress"
          percent={coreProgress.percentComplete}
          completed={coreProgress.completedAreas}
          total={coreProgress.totalAreas}
          unit="areas"
          color="#7c3aed"
        />

        {/* One-course areas */}
        <View style={s.section}>
          <Text style={s.sectionHeader}>One-Course Requirements</Text>
          {singleAreas.map((a) => {
            const icon = a.status === 'completed' || a.status === 'satisfied' ? '✓' : a.status === 'waived' ? '—' : '○';
            const iconColor = a.status === 'completed' || a.status === 'satisfied' ? '#2d6a4f' : a.status === 'waived' ? '#999' : '#A30046';
            const detail = a.status === 'completed' || a.status === 'satisfied' ? a.satisfiedBy
              : a.status === 'waived' ? (a.override?.notes || 'Waived')
              : a.courseOptions?.find(o => o.is_required) ? `Required: ${a.courseOptions.find(o => o.is_required).course_code}`
              : `Choose from ${a.courseOptions?.length || 0} options`;
            return <CourseRow key={a.id} icon={icon} iconColor={iconColor} code={a.name} detail={detail} />;
          })}
        </View>

        {/* Tiered areas */}
        <View style={s.section}>
          <Text style={s.sectionHeader}>Tiered Requirements</Text>
          <Text style={s.sectionSub}>Complete Tier 1 before Tier 2</Text>
          {Object.entries(tieredGroups).map(([baseName, tiers]) => (
            <View key={baseName} style={s.tieredGroup}>
              <Text style={s.tieredGroupName}>{baseName}</Text>
              {tiers.sort((a, b) => (a.tier === 'tier1' ? -1 : 1)).map((a) => {
                const icon = a.status === 'completed' || a.status === 'satisfied' ? '✓' : a.status === 'waived' ? '—' : '○';
                const iconColor = a.status === 'completed' || a.status === 'satisfied' ? '#2d6a4f' : a.status === 'waived' ? '#999' : '#A30046';
                const tierLabel = a.tier === 'tier1' ? 'Tier 1' : 'Tier 2';
                const detail = a.status === 'completed' || a.status === 'satisfied' ? a.satisfiedBy
                  : a.status === 'waived' ? (a.override?.notes || 'Waived')
                  : a.courseOptions?.find(o => o.is_required) ? `Required: ${a.courseOptions.find(o => o.is_required).course_code}`
                  : `Choose from ${a.courseOptions?.length || 0} options`;
                return <CourseRow key={a.id} icon={icon} iconColor={iconColor} code={tierLabel} detail={detail} indent />;
              })}
            </View>
          ))}
        </View>

        {/* Other requirements */}
        {otherAreas.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Other Requirements</Text>
            {otherAreas.map((a) => {
              const icon = a.status === 'completed' ? '✓' : '○';
              const iconColor = a.status === 'completed' ? '#2d6a4f' : '#A30046';
              const detail = a.status === 'completed' ? a.satisfiedBy : a.description || 'Not yet completed';
              return <CourseRow key={a.id} icon={icon} iconColor={iconColor} code={a.name} name={`${a.credits} credit${a.credits !== 1 ? 's' : ''}`} detail={detail} />;
            })}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  };

  // ==================== TAB BAR ====================
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'major', label: 'Major' },
    { key: 'core', label: 'Core' },
  ];

  return (
    <View style={s.container}>
      {/* Tab toggle */}
      <View style={s.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabButton, view === tab.key && s.tabButtonActive]}
            onPress={() => setView(tab.key)}
          >
            <Text style={[s.tabText, view === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'all' && renderAllView()}
      {view === 'major' && renderMajorView()}
      {view === 'core' && renderCoreView()}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Tab toggle
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: { backgroundColor: '#A30046' },
  tabText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  tabTextActive: { color: '#FFFFFF' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  heading: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 26,
    color: '#A30046',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subheading: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
  },

  // Progress card
  progressCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressCardLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
  },
  progressCardPercent: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressCardDetail: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#999',
  },

  // Sections
  section: { marginTop: 16 },
  sectionHeader: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#A30046',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },

  // Course rows
  courseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: 4,
  },
  rowIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  courseInfo: { flex: 1, marginLeft: 4 },
  courseCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  courseName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#666',
  },
  courseDetail: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#e76f51',
    marginTop: 1,
  },

  // Tiered groups
  tieredGroup: { marginBottom: 8 },
  tieredGroupName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: 4,
  },

  emptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ProgressScreen;
