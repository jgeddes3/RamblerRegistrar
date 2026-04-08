import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { getCourseSections } from './api';
import { searchProfessors } from './rmp';
import { useAppContext } from './AppContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Dynamic term (same logic as ProgressScreen)
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

// Props:
// - course: { code, name, credits, description }
// - section: single section object (shows just this one section)
// - sections: array of sections (shows all — used when no single section passed)
const CourseDetailModal = ({ visible, course, section: singleSection, sections: preSections, onClose }) => {
  const { quizResults } = useAppContext();
  const prefs = quizResults?.schedulingPrefs || {};

  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [profRatings, setProfRatings] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);

  // Score a section based on user's scheduling preferences (higher = better match)
  const scoreSection = (sec) => {
    let score = 0;
    const days = sec.meeting_days || '';
    const timeStart = sec.meeting_time_start || '';

    // Time preference
    if (prefs.timePreference && timeStart) {
      const hour = parseInt(timeStart);
      const isPM = timeStart.includes('PM') && hour !== 12;
      const h24 = isPM ? hour + 12 : (timeStart.includes('AM') && hour === 12 ? 0 : hour);
      if (prefs.timePreference === 'early' && h24 < 12) score += 3;
      if (prefs.timePreference === 'night' && h24 >= 10) score += 3;
      if (prefs.timePreference === 'middle' && h24 >= 10 && h24 < 15) score += 3;
    }

    // Week shape
    if (prefs.weekShape && days) {
      if (prefs.weekShape === 'mwf' && /Mo|We|Fr/.test(days)) score += 2;
      if (prefs.weekShape === 'tuth' && /Tu|Th/.test(days)) score += 2;
      if (prefs.weekShape === 'fewest' && /Tu|Th/.test(days) && !/Mo|We|Fr/.test(days)) score += 2;
      if (prefs.weekShape === 'spread' && /Mo|We|Fr/.test(days)) score += 1;
    }

    // Campus
    if (prefs.campus && prefs.campus !== 'either') {
      const building = (sec.building || '').toLowerCase();
      const isWTC = building.includes('water tower') || building.includes('corboy') || building.includes('schreiber');
      if (prefs.campus === 'lsc' && !isWTC) score += 1;
      if (prefs.campus === 'wtc' && isWTC) score += 1;
    }

    // Open seats bonus
    const hasEnroll = sec.enrollment_cap > 0;
    const statusText = (sec.status || '').toLowerCase();
    if (hasEnroll && sec.enrollment_total < sec.enrollment_cap) score += 1;
    else if (!hasEnroll && !statusText.includes('closed')) score += 1;

    return score;
  };

  // Sort and tag sections
  const sortedSections = singleSection ? [singleSection] : [...sections].map(sec => ({
    ...sec,
    _prefScore: scoreSection(sec),
  })).sort((a, b) => b._prefScore - a._prefScore);

  const topScore = sortedSections.length > 0 ? sortedSections[0]._prefScore : 0;
  const displaySections = sortedSections;

  useEffect(() => {
    if (!visible || !course) return;

    if (singleSection) {
      fetchProfRatings([singleSection]);
    } else if (preSections && preSections.length > 0) {
      setSections(preSections);
      fetchProfRatings(preSections);
    } else {
      loadSections();
    }
  }, [visible, course, singleSection]);

  const loadSections = async () => {
    setSectionsLoading(true);
    try {
      const data = await getCourseSections(TERM.code, course.code);
      setSections(data || []);
      if (data && data.length > 0) fetchProfRatings(data);
    } catch (e) {}
    setSectionsLoading(false);
  };

  const fetchProfRatings = async (secs) => {
    const instructors = [...new Set(secs.map(s => s.instructor).filter(Boolean))];
    for (const name of instructors) {
      if (profRatings[name]) continue;
      const lastName = name.split(',')[0]?.trim() || name.split(' ').pop();
      try {
        const results = await searchProfessors(lastName);
        if (results && results.length > 0) {
          const match = results.find(r =>
            name.toLowerCase().includes(r.lastName.toLowerCase())
          ) || results[0];
          setProfRatings(prev => ({ ...prev, [name]: match }));
        }
      } catch (e) {}
    }
  };

  if (!course) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modal}>
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.courseCode}>{course.code}</Text>
              <Text style={s.courseName}>{course.name}</Text>
              {course.credits ? (
                <Text style={s.credits}>{course.credits} credit{course.credits !== 1 ? 's' : ''}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          {course.description ? (
            <Text style={s.description}>{course.description}</Text>
          ) : null}

          <View style={s.divider} />

          {/* Sections */}
          <Text style={s.termLabel}>
            {singleSection ? `Section ${singleSection.section_number} — ${TERM.label}` : `${TERM.label} Sections`}
          </Text>

          <ScrollView style={s.sectionsList} showsVerticalScrollIndicator={false}>
            {sectionsLoading ? (
              <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 24 }} />
            ) : displaySections.length > 0 ? (
              displaySections.map((sec, i) => {
                const hasEnrollment = sec.enrollment_cap > 0;
                const statusText = (sec.status || '').toLowerCase();
                const isClosed = statusText.includes('closed');
                const isWaitList = statusText.includes('wait');
                const spotsLeft = hasEnrollment ? sec.enrollment_cap - sec.enrollment_total : null;
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

                const prof = sec.instructor ? profRatings[sec.instructor] : null;
                const isRecommended = !singleSection && sec._prefScore > 0 && sec._prefScore >= topScore && topScore > 0;

                return (
                  <TouchableOpacity
                    key={sec.id || sec.class_number || i}
                    style={[s.sectionCard, isFull && s.sectionCardFull, isRecommended && s.sectionCardRecommended]}
                    onPress={() => !singleSection && setSelectedSection(sec)}
                    activeOpacity={singleSection ? 1 : 0.7}
                  >
                    {isRecommended && (
                      <View style={s.recommendedBadge}>
                        <Text style={s.recommendedText}>Recommended for you</Text>
                      </View>
                    )}
                    {/* Top row: section + badge */}
                    <View style={s.sectionTop}>
                      <Text style={s.sectionNum}>Section {sec.section_number}</Text>
                      <View style={[s.badge, badgeStyle]}>
                        <Text style={s.badgeText}>{badgeLabel}</Text>
                      </View>
                    </View>

                    {/* Schedule */}
                    {(sec.meeting_days || sec.meeting_time_start) ? (
                      <View style={s.infoRow}>
                        <Text style={s.infoIcon}>🕐</Text>
                        <Text style={s.infoText}>
                          {sec.meeting_days}{sec.meeting_time_start ? `  ${sec.meeting_time_start} - ${sec.meeting_time_end}` : ''}
                        </Text>
                      </View>
                    ) : null}

                    {/* Location */}
                    {(sec.building || sec.room) ? (
                      <View style={s.infoRow}>
                        <Text style={s.infoIcon}>📍</Text>
                        <Text style={s.infoText}>{[sec.building, sec.room].filter(Boolean).join(' ')}</Text>
                      </View>
                    ) : null}

                    {/* Enrollment */}
                    <View style={s.infoRow}>
                      <Text style={s.infoIcon}>👥</Text>
                      <Text style={s.infoText}>
                        {hasEnrollment
                          ? `${sec.enrollment_total} / ${sec.enrollment_cap} enrolled${spotsLeft > 0 ? `  •  ${spotsLeft} seats open` : ''}`
                          : sec.status || 'Enrollment TBD'}
                      </Text>
                    </View>

                    {/* Professor + RMP Rating */}
                    {sec.instructor ? (
                      <View style={s.profSection}>
                        <Text style={s.profName}>{sec.instructor}</Text>
                        {prof && prof.avgRating ? (
                          <View style={s.profStats}>
                            <View style={[s.ratingBadge, {
                              backgroundColor: prof.avgRating >= 4 ? '#2d6a4f' : prof.avgRating >= 3 ? '#d97706' : '#C62828'
                            }]}>
                              <Text style={s.ratingBadgeText}>★ {prof.avgRating.toFixed(1)}</Text>
                            </View>
                            {prof.wouldTakeAgainPercent > 0 ? (
                              <Text style={s.profStat}>{Math.round(prof.wouldTakeAgainPercent)}% would take again</Text>
                            ) : null}
                            {prof.avgDifficulty ? (
                              <Text style={s.profStat}>Diff: {prof.avgDifficulty.toFixed(1)}</Text>
                            ) : null}
                            {prof.numRatings ? (
                              <Text style={s.profStatLight}>{prof.numRatings} ratings</Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={s.profStatLight}>No RMP rating found</Text>
                        )}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>No sections found</Text>
                <Text style={s.emptyHint}>This course may not be offered in {TERM.label}</Text>
              </View>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>

      {/* Single section detail — opened by tapping a section card */}
      {selectedSection && (
        <CourseDetailModal
          visible={!!selectedSection}
          course={course}
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.7,
    maxHeight: SCREEN_HEIGHT * 0.92,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  courseCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: '#A30046',
    fontWeight: 'bold',
  },
  courseName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#333',
    marginTop: 2,
  },
  credits: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  description: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginVertical: 12,
  },
  termLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#A30046',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionsList: {
    flex: 1,
  },

  // Section card
  sectionCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionCardFull: { opacity: 0.5 },
  sectionCardRecommended: {
    borderColor: '#A30046',
    borderWidth: 2,
    backgroundColor: '#FFF8FA',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A30046',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  recommendedText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionNum: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: { borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  badgeOpen: { backgroundColor: '#d1fae5' },
  badgeLow: { backgroundColor: '#fef3c7' },
  badgeFull: { backgroundColor: '#fee2e2' },
  badgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    width: 24,
  },
  infoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#444',
    flex: 1,
  },

  // Professor
  profSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  profName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    fontWeight: 'bold',
  },
  profStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profStat: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#555',
  },
  profStatLight: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 30 },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#999',
  },
  emptyHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
});

export default CourseDetailModal;
