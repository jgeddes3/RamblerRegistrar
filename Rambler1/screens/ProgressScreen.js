import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { useAppContext } from '../AppContext';
import { fetchDegreeProgress, fetchPrerequisites, addUserCourse, fetchUserCourses, fetchUserCoreProgress } from '../api';
import { getIdToken } from '../auth';
import CourseDetailModal from '../CourseDetailModal';

// Loyola term codes: 1 + 2-digit-year + semester (6=Fall, 2=Spring, 1=J-term, 4=Summer)
// E.g., Fall 2026 = 1266, Spring 2027 = 1272
function getRegistrationTerm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const yy = year % 100;

  if (month >= 10) {
    // Oct-Dec: registering for Spring next year
    return { code: `1${(yy + 1)}2`, label: `Spring ${year + 1}` };
  } else if (month >= 3) {
    // Mar-Sep: registering for Fall
    return { code: `1${yy}6`, label: `Fall ${year}` };
  } else {
    // Jan-Feb: registering for Spring
    return { code: `1${yy}2`, label: `Spring ${year}` };
  }
}
const REGISTRATION_TERM = getRegistrationTerm();
const CURRENT_TERM = REGISTRATION_TERM.code;
const CURRENT_TERM_LABEL = REGISTRATION_TERM.label;

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
const CourseRow = ({ icon, iconColor, code, name, detail, indent, onPress }) => {
  const content = (
    <View style={[s.courseRow, indent && { paddingLeft: 28 }]}>
      <Text style={[s.rowIcon, { color: iconColor || '#A30046' }]}>{icon}</Text>
      <View style={s.courseInfo}>
        <Text style={s.courseCode}>{code}</Text>
        {name ? <Text style={s.courseName}>{name}</Text> : null}
        {detail ? <Text style={s.courseDetail}>{detail}</Text> : null}
      </View>
      {onPress && <Text style={s.rowChevron}>›</Text>}
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
};

// ============================================================
// Main Progress Screen
// ============================================================
const ProgressScreen = () => {
  const { selectedProgram, selectedProgram2, selectedMinors, selectedCourses, user, quizResults } = useAppContext();

  const [view, setView] = useState('all'); // 'all', 'major', 'core', or a program id
  const [progress, setProgress] = useState(null);
  const [upNext, setUpNext] = useState([]);
  const [needsPrereqs, setNeedsPrereqs] = useState([]);
  const [coreProgress, setCoreProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
 // { "instructor name": { avgRating, avgDifficulty, wouldTakeAgainPercent, numRatings } }
  const [coreAreaModal, setCoreAreaModal] = useState(null);
  const [courseDetail, setCourseDetail] = useState({ visible: false, course: null });

  const allPrograms = [];
  if (selectedProgram) allPrograms.push(selectedProgram);
  if (selectedProgram2) allPrograms.push(selectedProgram2);
  if (selectedMinors) for (const m of selectedMinors) allPrograms.push(m);

  const activeProgram = view === 'major' ? selectedProgram : allPrograms.find(p => p?.id === parseInt(view)) || selectedProgram;

  // Build set of all major/minor required course codes for sorting
  const programCourseCodes = new Set();
  if (progress?.completed) progress.completed.forEach(c => programCourseCodes.add(c.code));
  if (progress?.remaining) progress.remaining.forEach(c => programCourseCodes.add(c.code));
  if (upNext) upNext.forEach(c => programCourseCodes.add(c.code));
  if (needsPrereqs) needsPrereqs.forEach(c => programCourseCodes.add(c.code));
  // Add minor courses too (we don't have them loaded, but codes from program_courses would be ideal)

  // Sort core course options: major/minor overlap first, then by scheduling pref match, then rest
  const sortCoreOptions = (options) => {
    if (!options || options.length === 0) return [];
    return [...options].sort((a, b) => {
      const aInProgram = programCourseCodes.has(a.course_code) ? 1 : 0;
      const bInProgram = programCourseCodes.has(b.course_code) ? 1 : 0;
      if (aInProgram !== bInProgram) return bInProgram - aInProgram;
      // Required courses first
      if (a.is_required && !b.is_required) return -1;
      if (!a.is_required && b.is_required) return 1;
      return 0;
    });
  };

  const openCoreArea = (area) => {
    if (area.status === 'completed' || area.status === 'satisfied' || area.status === 'waived') return;
    if (!area.courseOptions || area.courseOptions.length === 0) return;
    setCoreAreaModal(area);
  };

  const openCourseDetail = (course) => {
    setCourseDetail({
      visible: true,
      course: { code: course.code, name: course.name, credits: course.credits, description: course.description },
    });
  };

  const openCourseModal = (course) => {
    setCourseDetail({
      visible: true,
      course: { code: course.code, name: course.name, credits: course.credits, description: course.description },
    });
  };

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
            const missing = prereqCodes.filter(p => !completedCodes.has(p));
            const fulfilled = prereqCodes.filter(p => completedCodes.has(p));
            needsList.push({ ...course, missingPrereqs: missing, fulfilledPrereqs: fulfilled });
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
  const overflows = accountedFor > totalCreditsNeeded; // core + major > 120
  const addedCredits = overflows ? accountedFor - totalCreditsNeeded : 0;
  const electiveCreditsNeeded = overflows ? 0 : Math.max(totalCreditsNeeded - accountedFor, 0);
  // User's completed elective credits = total completed minus what counts toward major/core
  const userTotalCompleted = (selectedCourses || []).length * 3; // rough: 3 credits per course
  const electiveCreditsCompleted = Math.max(userTotalCompleted - majorCreditsCompleted - coreCreditsCompleted, 0);
  const totalCreditsCompleted = overflows
    ? majorCreditsCompleted + coreCreditsCompleted
    : majorCreditsCompleted + coreCreditsCompleted + Math.min(electiveCreditsCompleted, electiveCreditsNeeded);
  const actualTotalNeeded = overflows ? accountedFor : totalCreditsNeeded;

  // ==================== ALL VIEW ====================
  const renderAllView = () => (
    <ScrollView contentContainerStyle={s.scrollContent}>
      <Text style={s.heading}>Degree Overview</Text>

      {/* Overall credit bar */}
      <ProgressBar
        label="Total Credits to Graduate"
        percent={Math.round((totalCreditsCompleted / actualTotalNeeded) * 100)}
        completed={totalCreditsCompleted}
        total={actualTotalNeeded}
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

      {/* Electives or Added Classes */}
      {overflows ? (
        <View style={s.addedClassesCard}>
          <Text style={s.addedClassesTitle}>Added Classes</Text>
          <Text style={s.addedClassesDetail}>
            Your major ({majorCreditsRequired}cr) + core ({coreCreditsRequired}cr) = {accountedFor} credits — {addedCredits} more than the standard 120. No electives needed.
          </Text>
        </View>
      ) : electiveCreditsNeeded > 0 ? (
        <ProgressBar
          label="Electives / Free Credits"
          percent={Math.round((Math.min(electiveCreditsCompleted, electiveCreditsNeeded) / electiveCreditsNeeded) * 100)}
          completed={Math.min(electiveCreditsCompleted, electiveCreditsNeeded)}
          total={electiveCreditsNeeded}
          unit="credits"
          color="#d97706"
        />
      ) : null}

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
              <CourseRow key={c.code || c.id} icon="✓" iconColor="#2d6a4f" code={c.code} name={c.name} onPress={() => openCourseModal(c)} />
            ))}
          </View>
        )}

        {upNext.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Up Next</Text>
            <Text style={s.sectionSub}>Prerequisites met — ready to take</Text>
            {upNext.map((c) => (
              <CourseRow key={c.code || c.id} icon="○" iconColor="#A30046" code={c.code} name={c.name} onPress={() => openCourseModal(c)} />
            ))}
          </View>
        )}

        {needsPrereqs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeader}>Remaining</Text>
            <Text style={s.sectionSub}>Need prerequisites first</Text>
            {needsPrereqs.map((c) => (
              <TouchableOpacity key={c.code || c.id} onPress={() => openCourseModal(c)}>
                <View style={s.courseRow}>
                  <Text style={[s.rowIcon, { color: '#CCC' }]}>○</Text>
                  <View style={s.courseInfo}>
                    <Text style={s.courseCode}>{c.code}</Text>
                    {c.name ? <Text style={s.courseName}>{c.name}</Text> : null}
                    <View style={s.prereqList}>
                      {(c.fulfilledPrereqs || []).map(p => (
                        <Text key={p} style={s.prereqFulfilled}>✓ {p} Fulfilled</Text>
                      ))}
                      {(c.missingPrereqs || []).map(p => (
                        <Text key={p} style={s.prereqMissing}>○ Needs {p}</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={s.rowChevron}>›</Text>
                </View>
              </TouchableOpacity>
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
            const done = a.status === 'completed' || a.status === 'satisfied';
            const waived = a.status === 'waived';
            const icon = done ? '✓' : waived ? '—' : '○';
            const iconColor = done ? '#2d6a4f' : waived ? '#999' : '#A30046';
            const detail = done ? a.satisfiedBy
              : waived ? (a.override?.notes || 'Waived')
              : a.courseOptions?.find(o => o.is_required) ? `Required: ${a.courseOptions.find(o => o.is_required).course_code}`
              : `Choose from ${a.courseOptions?.length || 0} options`;
            const canTap = !done && !waived && a.courseOptions?.length > 0;
            return <CourseRow key={a.id} icon={icon} iconColor={iconColor} code={a.name} detail={detail}
              onPress={canTap ? () => openCoreArea(a) : undefined} />;
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
                const done = a.status === 'completed' || a.status === 'satisfied';
                const waived = a.status === 'waived';
                const icon = done ? '✓' : waived ? '—' : '○';
                const iconColor = done ? '#2d6a4f' : waived ? '#999' : '#A30046';
                const tierLabel = a.tier === 'tier1' ? 'Tier 1' : 'Tier 2';
                const detail = done ? a.satisfiedBy
                  : waived ? (a.override?.notes || 'Waived')
                  : a.courseOptions?.find(o => o.is_required) ? `Required: ${a.courseOptions.find(o => o.is_required).course_code}`
                  : `Choose from ${a.courseOptions?.length || 0} options`;
                const canTap = !done && !waived && a.courseOptions?.length > 0;
                return <CourseRow key={a.id} icon={icon} iconColor={iconColor} code={tierLabel} detail={detail} indent
                  onPress={canTap ? () => openCoreArea(a) : undefined} />;
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
  const isUndecided = !selectedProgram || selectedProgram.id === 'undecided';
  const tabs = [{ key: 'all', label: 'All', percent: null }];

  if (selectedProgram && !isUndecided) {
    tabs.push({
      key: 'major',
      label: selectedProgram.name.length > 12 ? selectedProgram.name.substring(0, 12) + '...' : selectedProgram.name,
      percent: progress?.percentComplete || 0,
      color: '#A30046',
    });
  }

  if (selectedProgram2) {
    tabs.push({
      key: String(selectedProgram2.id),
      label: selectedProgram2.name.length > 12 ? selectedProgram2.name.substring(0, 12) + '...' : selectedProgram2.name,
      percent: 0,
      color: '#2563eb',
    });
  }

  if (selectedMinors) {
    for (const minor of selectedMinors) {
      tabs.push({
        key: String(minor.id),
        label: minor.name.length > 12 ? minor.name.substring(0, 12) + '...' : minor.name,
        percent: 0,
        color: '#059669',
      });
    }
  }

  if (coreProgress) {
    tabs.push({
      key: 'core',
      label: 'Core',
      percent: coreProgress.percentComplete || 0,
      color: '#7c3aed',
    });
  }

  if (overflows) {
    tabs.push({
      key: 'electives',
      label: 'Added',
      percent: null,
      color: '#d97706',
    });
  } else if (electiveCreditsNeeded > 0) {
    const elecPct = Math.round((Math.min(electiveCreditsCompleted, electiveCreditsNeeded) / electiveCreditsNeeded) * 100);
    tabs.push({
      key: 'electives',
      label: 'Electives',
      percent: elecPct,
      color: '#d97706',
    });
  }

  return (
    <View style={s.container}>
      {/* Tab toggle */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScrollRow} contentContainerStyle={s.tabScrollContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabButton, view === tab.key && s.tabButtonActive]}
            onPress={() => setView(tab.key)}
          >
            <Text style={[s.tabText, view === tab.key && s.tabTextActive]}>{tab.label}</Text>
            {tab.percent !== null && (
              <View style={s.tabBarMini}>
                <View style={[s.tabBarMiniFill, { width: `${Math.min(tab.percent, 100)}%`, backgroundColor: tab.color || '#A30046' }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {view === 'all' && renderAllView()}
      {view === 'major' && renderMajorView()}
      {view === 'core' && renderCoreView()}
      {view === 'electives' && (() => {
        // Build sets of codes that count toward major and core
        const majorCodes = new Set();
        if (progress?.completed) progress.completed.forEach(c => majorCodes.add(c.code));
        const coreCodes = new Set();
        if (coreProgress?.areas) {
          for (const area of coreProgress.areas) {
            if (area.satisfiedBy) coreCodes.add(area.satisfiedBy);
          }
        }
        const electiveCourses = (selectedCourses || []).filter(c =>
          !majorCodes.has(c.code) && !coreCodes.has(c.code)
        );

        if (overflows) {
          return (
            <ScrollView contentContainerStyle={s.scrollContent}>
              <Text style={s.heading}>Added Classes</Text>
              <Text style={s.subheading}>Your major requires more than 120 credits</Text>
              <View style={s.addedClassesCard}>
                <Text style={s.addedClassesDetail}>
                  Your major requires {majorCreditsRequired} credits and the university core requires {coreCreditsRequired} credits, totaling {accountedFor} credits — {addedCredits} beyond the standard 120. No elective space is needed.
                </Text>
              </View>
              {electiveCourses.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionHeader}>Additional Courses Taken</Text>
                  {electiveCourses.map((c) => (
                    <CourseRow key={c.code || c.id} icon="✓" iconColor="#d97706" code={c.code} name={c.name}
                      detail={`${c.credits || 3} credits`} onPress={() => openCourseModal(c)} />
                  ))}
                </View>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          );
        }

        return (
          <ScrollView contentContainerStyle={s.scrollContent}>
            <Text style={s.heading}>Electives / Free Credits</Text>
            <Text style={s.subheading}>Credits outside of major and core requirements</Text>
            <ProgressBar
              label="Elective Progress"
              percent={electiveCreditsNeeded > 0 ? Math.round((Math.min(electiveCreditsCompleted, electiveCreditsNeeded) / electiveCreditsNeeded) * 100) : 0}
              completed={Math.min(electiveCreditsCompleted, electiveCreditsNeeded)}
              total={electiveCreditsNeeded}
              unit="credits"
              color="#d97706"
            />
            <Text style={s.electiveHint}>
              Your degree requires {totalCreditsNeeded} total credits. Major accounts for {majorCreditsRequired} and Core for {coreCreditsRequired}, leaving {electiveCreditsNeeded} credits for electives, minors, or additional courses.
            </Text>
            {electiveCourses.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionHeader}>Your Elective Courses</Text>
                {electiveCourses.map((c) => (
                  <CourseRow key={c.code || c.id} icon="✓" iconColor="#d97706" code={c.code} name={c.name}
                    detail={`${c.credits || 3} credits`} onPress={() => openCourseModal(c)} />
                ))}
              </View>
            )}
            {electiveCourses.length === 0 && (
              <Text style={[s.electiveHint, { marginTop: 24 }]}>
                No elective courses taken yet. Any course outside your major and core requirements will count here.
              </Text>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        );
      })()}

      {/* Core Area Options Modal */}
      <Modal visible={!!coreAreaModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalPanel}>
            <View style={s.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>{coreAreaModal?.name}</Text>
                <Text style={s.modalSubtitle}>{coreAreaModal?.credits} credits required</Text>
              </View>
              <TouchableOpacity onPress={() => setCoreAreaModal(null)} style={s.modalClose}>
                <Text style={s.modalCloseText}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={s.modalContent}>
              {coreAreaModal && sortCoreOptions(coreAreaModal.courseOptions).map((opt, i) => {
                const inProgram = programCourseCodes.has(opt.course_code);
                return (
                  <TouchableOpacity
                    key={opt.course_code || i}
                    style={[s.coreOptionCard, inProgram && s.coreOptionHighlight]}
                    onPress={() => { setCoreAreaModal(null); openCourseModal({ code: opt.course_code, name: opt.course_name }); }}
                  >
                    <View style={s.coreOptionTop}>
                      <Text style={s.coreOptionCode}>{opt.course_code}</Text>
                      {inProgram && (
                        <View style={s.overlapBadge}>
                          <Text style={s.overlapBadgeText}>Counts for major</Text>
                        </View>
                      )}
                      {opt.is_required ? (
                        <View style={s.requiredBadge}>
                          <Text style={s.requiredBadgeText}>Required</Text>
                        </View>
                      ) : null}
                    </View>
                    {opt.course_name && <Text style={s.coreOptionName}>{opt.course_name}</Text>}
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CourseDetailModal
        visible={courseDetail.visible}
        course={courseDetail.course}
        onClose={() => setCourseDetail({ visible: false, course: null })}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Tab toggle
  tabScrollRow: {
    flexGrow: 0,
    marginTop: 12,
    marginBottom: 8,
  },
  tabScrollContent: {
    paddingHorizontal: 12,
    gap: 6,
    justifyContent: 'center',
    flexGrow: 1,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    minWidth: 70,
  },
  tabButtonActive: { backgroundColor: '#A30046' },
  tabText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  tabTextActive: { color: '#FFFFFF' },
  tabBarMini: {
    width: '100%',
    height: 4,
    backgroundColor: '#D9D9D9',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  tabBarMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  addedClassesCard: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F0D9B5',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  addedClassesTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#d97706',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addedClassesDetail: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  electiveHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginTop: 16,
  },

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

  coreOptionCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  coreOptionHighlight: {
    backgroundColor: '#FFF0F5',
    borderColor: '#E8C8D4',
  },
  coreOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  coreOptionCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coreOptionName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
  },
  overlapBadge: {
    backgroundColor: '#A30046',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  overlapBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  requiredBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  requiredBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  prereqList: {
    marginTop: 4,
  },
  prereqFulfilled: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#2d6a4f',
    fontWeight: 'bold',
    marginBottom: 1,
  },
  prereqMissing: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#e76f51',
    marginBottom: 1,
  },
  rowChevron: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },

  // Sections modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#A30046',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  modalContent: { padding: 16 },
  modalEmpty: { alignItems: 'center', paddingTop: 40, paddingBottom: 40 },
  modalEmptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#999',
  },
  modalEmptyHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#CCC',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  sectionCardFull: {
    opacity: 0.5,
  },
  sectionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionNumber: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  spotsBadge: {
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  spotsBadgeOpen: { backgroundColor: '#d1fae5' },
  spotsBadgeLow: { backgroundColor: '#fef3c7' },
  spotsBadgeFull: { backgroundColor: '#fee2e2' },
  spotsBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  sectionInfoBlock: {
    marginBottom: 4,
  },
  sectionInfoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  profRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionInstructor: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#A30046',
    fontWeight: 'bold',
  },
  profRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  profStar: {
    fontSize: 14,
    color: '#d97706',
  },
  profRating: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  profAgain: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#2E7D32',
  },
  profDiff: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#888',
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
