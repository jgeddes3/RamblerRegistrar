import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCourseSections, fetchCourseDetail, fetchWatches, addWatch, removeWatch,
  addCourseToPlan, addSectionToSchedule, PLAN_TERM_CAP,
} from './firestore-data';
import { getInstructorRating, noRatingCopy, ratingsAttribution } from './ratings';
import { FONT_ITALIC, STONE } from './theme';
import { useAppContext } from './AppContext';
import { fillWarning } from './planning-insights';
import { planSemesters } from './plan-utils';
import TrendChart from './components/TrendChart';
import FeedbackModal from './components/FeedbackModal';
import showAlert from './alert';

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
// - watchState: optional { watchedSet, toggleWatch } — when provided (nested
//   single-section instance), the outermost modal owns the seat-watch state so
//   bell toggles stay in sync between the sections list and the detail view.
// - onRemove: optional (section) => void — single-section view opened from the
//   schedule grid shows a destructive 'Remove from schedule' button.
const CourseDetailModal = ({ visible, course, section: singleSection, sections: preSections, onClose, watchState, onRemove }) => {
  const { user, quizResults, classYear, isHonors, isAthlete, graduationYear } = useAppContext();
  const prefs = quizResults?.schedulingPrefs || {};
  const signedIn = !!user && !user.isAnonymous; // anonymous users can't own watches

  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [profRatings, setProfRatings] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  // Seat watches for this term: Set of watched class_number strings. Only the
  // outermost instance owns this; nested instances use watchState from props.
  const [ownWatchedSet, setOwnWatchedSet] = useState(() => new Set());
  const isControlled = !!watchState;
  const watchedSet = isControlled ? watchState.watchedSet : ownWatchedSet;
  // fill_stats (legacy snake_case row from firestore-data). undefined = not yet
  // known, null = known absent, object = present.
  const [fillStats, setFillStats] = useState(undefined);
  // Planner integration (F-P2/F-P3): inline semester picker + in-flight guard.
  const [planPicker, setPlanPicker] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  // Report-a-problem (#17): pre-tagged with this course's code.
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const addToPlan = async (termCode, label) => {
    if (!signedIn || actionBusy) return;
    setActionBusy(true);
    const res = await addCourseToPlan(user.uid, termCode, course.code);
    setActionBusy(false);
    setPlanPicker(false);
    if (res?.added) showAlert('Planned', `${course.code} added to ${label}.`);
    else if (res?.already) showAlert('Already planned', `${course.code} is already in ${label}.`);
    else if (res?.full) showAlert('Semester full', `A semester plan holds at most ${PLAN_TERM_CAP} courses.`);
    else showAlert('Save failed', 'Could not update your plan. Please try again.');
  };

  const addSecToSchedule = async (sec) => {
    if (!signedIn || actionBusy) return;
    setActionBusy(true);
    const res = await addSectionToSchedule(user.uid, TERM.code, sec.class_number);
    setActionBusy(false);
    if (res?.added) {
      showAlert('Added to schedule', `${course.code} Sec ${sec.section_number} is on your ${TERM.label} schedule.`);
    } else if (res?.already) {
      showAlert('Already scheduled', 'This section is already on your schedule.');
    } else if (res?.full) {
      showAlert('Schedule full', 'A schedule holds at most 40 sections.');
    } else {
      showAlert('Save failed', 'Could not update your schedule. Please try again.');
    }
  };

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

  // Seat watches: load the user's watches for this term each time the modal
  // opens. fetchWatches returns [] on failure, so this never throws.
  // Skipped when controlled — the parent instance already owns the state.
  useEffect(() => {
    if (isControlled || !visible) return;
    if (!signedIn) { setOwnWatchedSet(new Set()); return; }
    let cancelled = false;
    fetchWatches(user.uid, TERM.code).then((watches) => {
      if (!cancelled) {
        setOwnWatchedSet(new Set((watches || []).map((w) => String(w.class_number))));
      }
    });
    return () => { cancelled = true; };
  }, [isControlled, visible, signedIn, user]);

  // Optimistic bell flip, reverted with an alert if the write fails.
  const ownToggleWatch = async (sec) => {
    if (!signedIn) return; // bell is rendered disabled for anonymous users
    const classNum = String(sec.class_number);
    const wasWatching = ownWatchedSet.has(classNum);
    const applyWatching = (nowWatching) => {
      setOwnWatchedSet((prev) => {
        const next = new Set(prev);
        if (nowWatching) next.add(classNum); else next.delete(classNum);
        return next;
      });
    };
    applyWatching(!wasWatching);
    const res = wasWatching
      ? await removeWatch(user.uid, classNum)
      : await addWatch(user.uid, TERM.code, classNum);
    if (!res) {
      applyWatching(wasWatching); // revert
      showAlert('Watch update failed', 'Could not update your seat watch. Please try again.');
    }
  };
  const toggleWatch = isControlled ? watchState.toggleWatch : ownToggleWatch;

  // Fill-speed stats: the course prop may come from the local sqlite cache
  // WITHOUT fill_stats. Fetch the Firestore-mapped course once per open to get
  // it. Fire-and-forget — the modal never blocks on this; no stats, no banner.
  useEffect(() => {
    if (!visible || !course) return;
    if (course.fill_stats !== undefined) {
      setFillStats(course.fill_stats);
      return;
    }
    setFillStats(undefined);
    let cancelled = false;
    fetchCourseDetail(course.code)
      .then((detail) => {
        if (!cancelled) setFillStats((detail && detail.fill_stats) || null);
      })
      .catch(() => {
        if (!cancelled) setFillStats(null);
      });
    return () => { cancelled = true; };
  }, [visible, course]);

  // Adapt the legacy snake_case row to fillWarning's field names.
  const fillNotice = fillWarning(
    fillStats ? { class: fillStats.class, capChanged: fillStats.cap_changed === true } : null,
    classYear,
    { isHonors, isAthlete }
  );

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
      const rating = await getInstructorRating(name);
      if (rating) setProfRatings(prev => ({ ...prev, [name]: rating }));
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
            <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Close course details">
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Fill-speed warning (empirical, last registration term) */}
          {fillNotice ? (
            fillNotice.level === 'info' ? (
              <View style={s.fillInfoRow}>
                <Ionicons name="flash-outline" size={13} color="#888" />
                <Text style={s.fillInfoLine}>{fillNotice.text}</Text>
              </View>
            ) : (
              <View style={[s.fillBanner, fillNotice.level === 'high' ? s.fillBannerHigh : s.fillBannerWarn]}>
                <Ionicons
                  name="flash"
                  size={14}
                  color={fillNotice.level === 'high' ? '#b91c1c' : '#92400e'}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={[
                    s.fillBannerText,
                    fillNotice.level === 'high' ? s.fillBannerTextHigh : s.fillBannerTextWarn,
                  ]}
                >
                  {fillNotice.text}
                </Text>
              </View>
            )
          ) : null}

          {/* Add to Plan (F-P2/F-P3): course-level, any future semester */}
          {signedIn && !singleSection ? (
            <View style={s.planWrap}>
              <TouchableOpacity
                style={s.planBtn}
                onPress={() => setPlanPicker(!planPicker)}
                accessibilityLabel="Add to plan"
              >
                <View style={s.planBtnInner}>
                  <Ionicons name="calendar-outline" size={15} color="#A30046" />
                  <Text style={s.planBtnText}>Add to Plan</Text>
                  <Ionicons name={planPicker ? 'chevron-up' : 'chevron-down'} size={13} color="#A30046" />
                </View>
              </TouchableOpacity>
              {planPicker ? (
                <View style={s.planChips}>
                  {planSemesters(graduationYear).map((sem) => (
                    <TouchableOpacity
                      key={sem.code}
                      style={s.planChip}
                      onPress={() => addToPlan(sem.code, sem.label)}
                      disabled={actionBusy}
                      accessibilityLabel={`Plan for ${sem.label}`}
                    >
                      <Text style={s.planChipText}>{sem.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

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
                // Bell only for sections explicitly not open (Closed / Wait List).
                const canBellWatch = isClosed || isWaitList;
                const isWatched = watchedSet.has(String(sec.class_number));

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
                    {/* Top row: section + badges (F-HI4: top-rated prof flag) */}
                    <View style={s.sectionTop}>
                      <Text style={s.sectionNum}>Section {sec.section_number}</Text>
                      <View style={s.badgeRow}>
                        {prof && prof.rating >= 4 ? (
                          <View style={s.topProfBadge}>
                            <View style={s.topProfBadgeInner}>
                              <Ionicons name="star" size={10} color="#92400E" />
                              <Text style={s.topProfBadgeText}>Top prof</Text>
                            </View>
                          </View>
                        ) : null}
                        <View style={[s.badge, badgeStyle]}>
                          <Text style={s.badgeText}>{badgeLabel}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Schedule */}
                    {(sec.meeting_days || sec.meeting_time_start) ? (
                      <View style={s.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#8A8177" style={s.infoIconGlyph} />
                        <Text style={s.infoText}>
                          {sec.meeting_days}{sec.meeting_time_start ? `  ${sec.meeting_time_start} - ${sec.meeting_time_end}` : ''}
                        </Text>
                      </View>
                    ) : null}

                    {/* Location — room strings often embed the building name
                        ("Dumbach Hall-Room 227"), so don't print it twice. */}
                    {(sec.building || sec.room) ? (
                      <View style={s.infoRow}>
                        <Ionicons name="location-outline" size={14} color="#8A8177" style={s.infoIconGlyph} />
                        <Text style={s.infoText}>
                          {sec.room && sec.building && sec.room.toLowerCase().includes(sec.building.toLowerCase())
                            ? sec.room
                            : [sec.building, sec.room].filter(Boolean).join(' ')}
                        </Text>
                      </View>
                    ) : null}

                    {/* Enrollment */}
                    <View style={s.infoRow}>
                      <Ionicons name="people-outline" size={14} color="#8A8177" style={s.infoIconGlyph} />
                      <Text style={s.infoText}>
                        {hasEnrollment
                          ? `${sec.enrollment_total} / ${sec.enrollment_cap} enrolled${spotsLeft > 0 ? `  •  ${spotsLeft} seats open` : ''}`
                          : sec.status || 'Enrollment TBD'}
                      </Text>
                    </View>

                    {/* Enrollment + waitlist trend (single-section view only —
                        F-QW1 sparkline / F-HI3 waitlist movement) */}
                    {singleSection && Array.isArray(sec.recent_history) && sec.recent_history.length > 1 ? (
                      <View>
                        <Text style={s.trendLabel}>Enrollment trend (last {sec.recent_history.length} snapshots)</Text>
                        <TrendChart history={sec.recent_history} />
                      </View>
                    ) : null}

                    {/* Quick add to the registration-term schedule (F-P3).
                        Hidden when opened FROM the schedule (onRemove) — the
                        section is already there; adding only alerts. */}
                    {signedIn && !onRemove ? (
                      <TouchableOpacity
                        style={s.schedAddBtn}
                        onPress={() => addSecToSchedule(sec)}
                        disabled={actionBusy}
                        accessibilityLabel={`Add section ${sec.section_number} to schedule`}
                      >
                        <View style={s.btnInner}>
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                          <Text style={s.schedAddBtnText}>Add to schedule</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Seat watch bell (Closed / Wait List sections only) */}
                    {canBellWatch ? (
                      <TouchableOpacity
                        style={[s.watchBtn, isWatched && s.watchBtnActive, !signedIn && s.watchBtnDisabled]}
                        onPress={() => toggleWatch(sec)}
                        disabled={!signedIn}
                        accessibilityLabel={isWatched ? 'Stop watching for open seats' : 'Watch for open seats'}
                      >
                        <View style={s.btnInner}>
                          <Ionicons
                            name={isWatched ? 'notifications' : 'notifications-outline'}
                            size={13}
                            color={isWatched ? '#FFFFFF' : '#A30046'}
                          />
                          <Text style={[s.watchBtnText, isWatched && s.watchBtnTextActive]}>
                            {isWatched ? 'Watching' : 'Watch for seats'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Remove from schedule (single-section view opened from the grid) */}
                    {onRemove && singleSection ? (
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => onRemove(sec)}
                        accessibilityLabel="Remove from schedule"
                      >
                        <View style={s.btnInner}>
                          <Ionicons name="trash-outline" size={13} color="#b91c1c" />
                          <Text style={s.removeBtnText}>Remove from schedule</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Professor + rating (via the ratings.js source adapter) */}
                    {sec.instructor ? (
                      <View style={s.profSection}>
                        <Text style={s.profName}>{sec.instructor}</Text>
                        {prof && prof.rating ? (
                          <View style={s.profStats}>
                            <View style={[s.ratingBadge, {
                              backgroundColor: prof.rating >= 4 ? '#2d6a4f' : prof.rating >= 3 ? '#d97706' : '#C62828'
                            }]}>
                              <View style={s.btnInner}>
                                <Ionicons name="star" size={10} color="#FFFFFF" />
                                <Text style={s.ratingBadgeText}>{prof.rating.toFixed(1)}</Text>
                              </View>
                            </View>
                            {prof.wouldTakeAgainPercent > 0 ? (
                              <Text style={s.profStat}>{Math.round(prof.wouldTakeAgainPercent)}% would take again</Text>
                            ) : null}
                            {prof.difficulty ? (
                              <Text style={s.profStat}>Diff: {prof.difficulty.toFixed(1)}</Text>
                            ) : null}
                            {prof.numRatings ? (
                              <Text style={s.profStatLight}>{prof.numRatings} ratings</Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={s.profStatLight}>{noRatingCopy()}</Text>
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
            {/* Attribution — once per modal, only when a rating rendered */}
            {displaySections.some((sec) => sec.instructor && profRatings[sec.instructor]?.rating) ? (
              <Text style={s.ratingsAttribution}>{ratingsAttribution()}</Text>
            ) : null}
            {/* Report a problem (#17) — pre-tagged with the course code */}
            {!singleSection ? (
              <TouchableOpacity
                onPress={() => setFeedbackVisible(true)}
                accessibilityLabel={`Report a problem with ${course.code}`}
              >
                <Text style={s.reportLink}>Something wrong with this course's data? Report it</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        context={`course ${course.code}`}
      />

      {/* Single section detail — opened by tapping a section card */}
      {selectedSection && (
        <CourseDetailModal
          visible={!!selectedSection}
          course={fillStats !== undefined ? { ...course, fill_stats: fillStats } : course}
          section={selectedSection}
          watchState={{ watchedSet, toggleWatch }}
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

  // Fill-speed warning banner
  fillBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  fillBannerHigh: { backgroundColor: '#fee2e2' },
  fillBannerWarn: { backgroundColor: '#fef3c7' },
  fillBannerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  fillBannerTextHigh: { color: '#b91c1c' },
  fillBannerTextWarn: { color: '#92400e' },
  fillInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  fillInfoLine: {
    flex: 1,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
  },
  // Icon+text pair inside pill buttons/badges
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIconGlyph: {
    width: 22,
    marginTop: 1,
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

  // Seat watch bell
  watchBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#A30046',
    backgroundColor: '#FFFFFF',
  },
  watchBtnActive: { backgroundColor: '#A30046' },
  watchBtnDisabled: { opacity: 0.4 },
  watchBtnText: { fontFamily: 'CormorantGaramond-Medium', fontSize: 14, color: '#A30046' },
  watchBtnTextActive: { color: '#FFFFFF' },

  // Section badges row (status + F-HI4 top-prof)
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topProfBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  topProfBadgeInner: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  topProfBadgeText: {
    fontFamily: 'CormorantGaramond-Medium', fontSize: 13, color: '#92400E',
  },
  // Trend chart label (F-QW1/F-HI3)
  trendLabel: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 13, color: '#888', marginTop: 8,
  },

  // Remove from schedule (schedule-opened single-section view)
  removeBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#b91c1c',
    backgroundColor: '#FFFFFF',
  },
  removeBtnText: { fontFamily: 'CormorantGaramond-Medium', fontSize: 14, color: '#b91c1c' },

  // Quick add-to-schedule (F-P3)
  schedAddBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: '#A30046',
  },
  schedAddBtnText: {
    fontFamily: 'CormorantGaramond-Medium', fontSize: 14, color: '#FFFFFF',
  },

  // Report a problem (#17)
  reportLink: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 14, color: '#A30046',
    textDecorationLine: 'underline', textAlign: 'center', marginTop: 14,
  },

  // Add to Plan (F-P2/F-P3)
  planWrap: { marginTop: 6, marginBottom: 2 },
  planBtn: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A30046',
  },
  planBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planBtnText: {
    fontFamily: 'CormorantGaramond-Medium', fontSize: 15, color: '#A30046',
  },
  planChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  planChip: {
    backgroundColor: '#FBF0F5',
    borderWidth: 1,
    borderColor: '#E8CDD9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  planChipText: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 14, color: '#A30046', fontWeight: '600',
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
  ratingsAttribution: {
    fontFamily: FONT_ITALIC,
    fontSize: 12,
    color: STONE,
    textAlign: 'center',
    marginTop: 4,
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
