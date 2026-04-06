import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import { useAppContext } from '../AppContext';
import { signOut, getIdToken } from '../auth';
import { fetchPrograms, fetchCourses, addUserCourse, saveUserProfile, fetchEnrichedRecommendations, fetchQuizFocusAreas } from '../api';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const ProfileScreen = ({ visible, onClose }) => {
  const {
    user, selectedProgram, setSelectedProgram, selectedProgram2, setSelectedProgram2,
    selectedMinors, setSelectedMinors, selectedCourses, setSelectedCourses, graduationYear,
    classYear, quizResults, selectedFocus, setSelectedFocus,
  } = useAppContext();

  const isUndecided = !selectedProgram || selectedProgram.id === 'undecided';
  const [mode, setMode] = useState('profile'); // 'profile', 'selectProgram', 'selectMinor', 'selectCourses'
  const [programs, setPrograms] = useState([]);
  const [minorsList, setMinorsList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [focusAreas, setFocusAreas] = useState([]);
  const [focusLoading, setFocusLoading] = useState(false);

  const initial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  // Load programs or courses when switching modes
  useEffect(() => {
    if (mode === 'selectProgram' && programs.length === 0) {
      setLoading(true);
      fetchPrograms('major').then(data => {
        setPrograms(data || []);
        setLoading(false);
      });
    }
    // Load enriched recommendations for undecided users
    if (mode === 'selectProgram' && isUndecided && quizResults?.code && user) {
      setRecsLoading(true);
      fetchEnrichedRecommendations(quizResults.code, user.uid, graduationYear || '')
        .then(data => setRecommendations(data || []))
        .catch(() => {})
        .finally(() => setRecsLoading(false));
    }
    if (mode === 'selectMinor' && minorsList.length === 0) {
      setLoading(true);
      fetchPrograms('minor').then(data => {
        setMinorsList(data || []);
        setLoading(false);
      });
    }
    if (mode === 'selectCourses' && courses.length === 0) {
      setLoading(true);
      fetchCourses().then(data => {
        setCourses(data || []);
        setLoading(false);
      });
    }
  }, [mode]);

  // Load focus areas for decided (non-undecided) major
  useEffect(() => {
    if (visible && !isUndecided && selectedProgram?.id && user) {
      setFocusLoading(true);
      fetchQuizFocusAreas(selectedProgram.id, user.uid)
        .then(data => setFocusAreas(data || []))
        .catch(() => {})
        .finally(() => setFocusLoading(false));
    }
  }, [visible, selectedProgram, user]);

  const handleSignOut = async () => {
    onClose();
    setMode('profile');
    await signOut();
  };

  const handleSelectProgram = async (program) => {
    setSelectedProgram(program);
    setMode('profile');
    // Save to backend
    try {
      const token = await getIdToken();
      if (token && user) {
        await saveUserProfile(user.uid, {
          selectedProgramId: program.id,
          selectedProgram2Id: selectedProgram2?.id || null,
          selectedMinors: (selectedMinors || []).map(m => m.id),
          graduationYear: graduationYear || '',
        }, token);
      }
    } catch (e) {}
  };

  const handleToggleMinor = async (minor) => {
    const current = selectedMinors || [];
    const isSelected = current.some(m => m.id === minor.id);
    let updated;
    if (isSelected) {
      updated = current.filter(m => m.id !== minor.id);
    } else {
      if (current.length >= 3) return; // Max 3 minors
      updated = [...current, minor];
    }
    setSelectedMinors(updated);
    // Save to backend
    try {
      const token = await getIdToken();
      if (token && user) {
        await saveUserProfile(user.uid, {
          selectedProgramId: selectedProgram?.id || null,
          selectedProgram2Id: selectedProgram2?.id || null,
          selectedMinors: updated.map(m => m.id),
          graduationYear: graduationYear || '',
        }, token);
      }
    } catch (e) {}
  };

  const handleToggleCourse = async (course) => {
    const isSelected = (selectedCourses || []).some(c => c.id === course.id);
    let updated;
    if (isSelected) {
      updated = selectedCourses.filter(c => c.id !== course.id);
    } else {
      updated = [...(selectedCourses || []), course];
      // Also save to backend
      try {
        const token = await getIdToken();
        if (token && user) {
          await addUserCourse(user.uid, course.code, null, null, token);
        }
      } catch (e) {}
    }
    setSelectedCourses(updated);
  };

  const handleClose = () => {
    setMode('profile');
    setSearch('');
    onClose();
  };

  // Filter for search
  const filteredPrograms = programs.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.degree || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredCourses = courses.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(search.toLowerCase())
  );

  // ==================== SELECT PROGRAM MODE ====================
  if (mode === 'selectProgram') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.panelFull}>
            <View style={s.headerRow}>
              <TouchableOpacity onPress={() => { setMode('profile'); setSearch(''); }}>
                <Text style={s.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={s.headerTitle}>Select Major</Text>
              <View style={{ width: 50 }} />
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search majors..."
              value={search}
              onChangeText={setSearch}
            />
            {loading ? (
              <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView contentContainerStyle={s.listContent}>
                {/* Recommendations section for undecided users */}
                {isUndecided && recommendations.length > 0 && !search && (
                  <View style={s.recsSection}>
                    <Text style={s.recsSectionTitle}>Recommended For You</Text>
                    {quizResults && (
                      <Text style={s.recsSectionSub}>
                        Based on your {quizResults.code} — {quizResults.profileName} profile
                      </Text>
                    )}
                    {recsLoading ? (
                      <ActivityIndicator color="#A30046" style={{ marginTop: 12 }} />
                    ) : (
                      recommendations.map((rec, i) => (
                        <TouchableOpacity
                          key={rec.program_id || i}
                          style={s.recItem}
                          onPress={() => {
                            const prog = programs.find(p => p.id === rec.program_id);
                            if (prog) handleSelectProgram(prog);
                          }}
                        >
                          <View style={s.recItemLeft}>
                            <View style={[s.recRankBadge, rec.feasible === false && s.recRankBadgeWarn]}>
                              <Text style={s.recRankText}>{i + 1}</Text>
                            </View>
                          </View>
                          <View style={s.recItemRight}>
                            <Text style={s.recItemName}>{rec.program_name}</Text>
                            <Text style={s.recItemDegree}>{rec.degree} — {rec.school}</Text>
                            {rec.rationale ? (
                              <Text style={s.recItemRationale}>{rec.rationale}</Text>
                            ) : null}
                            {rec.feasible !== null && (
                              <Text style={[s.recFeasibility, rec.feasible ? s.recFeasible : s.recNotFeasible]}>
                                {rec.feasible
                                  ? `Completable by ${graduationYear || 'graduation'} — ${rec.remainingCourses} courses left`
                                  : `May need extra time — ${rec.remainingCourses} courses, ~${rec.estimatedSemesters} semesters`}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                    <View style={s.recsDivider}>
                      <Text style={s.recsDividerText}>All Majors</Text>
                    </View>
                  </View>
                )}

                {filteredPrograms.map(prog => (
                  <TouchableOpacity
                    key={prog.id}
                    style={[s.listItem, selectedProgram?.id === prog.id && s.listItemSelected]}
                    onPress={() => handleSelectProgram(prog)}
                  >
                    <Text style={[s.listItemText, selectedProgram?.id === prog.id && s.listItemTextSelected]}>
                      {prog.name} ({prog.degree})
                    </Text>
                    <Text style={s.listItemSub}>{prog.school}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ==================== SELECT MINOR MODE ====================
  if (mode === 'selectMinor') {
    const selectedMinorIds = new Set((selectedMinors || []).map(m => m.id));
    const filteredMinors = minorsList.filter(m =>
      (m.name || '').toLowerCase().includes(search.toLowerCase())
    );
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.panelFull}>
            <View style={s.headerRow}>
              <TouchableOpacity onPress={() => { setMode('profile'); setSearch(''); }}>
                <Text style={s.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={s.headerTitle}>Select Minors</Text>
              <Text style={s.countBadge}>{(selectedMinors || []).length}/3</Text>
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search minors..."
              value={search}
              onChangeText={setSearch}
            />
            {loading ? (
              <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView contentContainerStyle={s.listContent}>
                {filteredMinors.map(minor => {
                  const isSelected = selectedMinorIds.has(minor.id);
                  return (
                    <TouchableOpacity
                      key={minor.id}
                      style={[s.listItem, isSelected && s.listItemSelected]}
                      onPress={() => handleToggleMinor(minor)}
                    >
                      <Text style={[s.listItemText, isSelected && s.listItemTextSelected]}>
                        {minor.name}
                      </Text>
                      <Text style={[s.listItemSub, isSelected && { color: '#ddd' }]}>{minor.school}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ==================== SELECT COURSES MODE ====================
  if (mode === 'selectCourses') {
    const selectedIds = new Set((selectedCourses || []).map(c => c.id));
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.panelFull}>
            <View style={s.headerRow}>
              <TouchableOpacity onPress={() => { setMode('profile'); setSearch(''); }}>
                <Text style={s.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={s.headerTitle}>Courses Taken</Text>
              <Text style={s.countBadge}>{(selectedCourses || []).length}</Text>
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Search courses..."
              value={search}
              onChangeText={setSearch}
            />
            {loading ? (
              <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView contentContainerStyle={s.listContent}>
                {filteredCourses.map(course => {
                  const isSelected = selectedIds.has(course.id);
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[s.listItem, isSelected && s.listItemSelected]}
                      onPress={() => handleToggleCourse(course)}
                    >
                      <Text style={[s.listItemCode, isSelected && s.listItemTextSelected]}>
                        {course.code}
                      </Text>
                      <Text style={[s.listItemText, isSelected && s.listItemTextSelected]}>
                        {course.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ==================== PROFILE MODE (default) ====================
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.panel}>
          <TouchableOpacity onPress={handleClose} style={s.closeButton}>
            <Text style={s.closeText}>X</Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={s.content}>
            {/* Avatar */}
            <View style={s.avatarLarge}>
              <Text style={s.avatarLargeText}>{initial}</Text>
            </View>
            <Text style={s.email}>{user?.email || 'Not signed in'}</Text>
            {user?.displayName && (
              <Text style={s.displayName}>{user.displayName}</Text>
            )}

            <View style={s.divider} />

            {/* Major */}
            {selectedProgram ? (
              <View style={s.infoBlockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Major</Text>
                  <Text style={s.value}>
                    {isUndecided ? 'Undecided' : `${selectedProgram.name} (${selectedProgram.degree})`}
                  </Text>
                  {!isUndecided && selectedProgram.school && (
                    <Text style={s.valueSmall}>{selectedProgram.school}</Text>
                  )}
                </View>
                <TouchableOpacity style={s.changeButton} onPress={() => setMode('selectProgram')}>
                  <Text style={s.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.selectButton} onPress={() => setMode('selectProgram')}>
                <Text style={s.selectButtonText}>Select Your Major</Text>
              </TouchableOpacity>
            )}

            {/* Double major */}
            {selectedProgram2 && (
              <View style={s.infoBlock}>
                <Text style={s.label}>Double Major</Text>
                <Text style={s.value}>{selectedProgram2.name} ({selectedProgram2.degree})</Text>
              </View>
            )}

            {/* Minors */}
            {selectedMinors && selectedMinors.length > 0 ? (
              <TouchableOpacity style={s.infoBlock} onPress={() => setMode('selectMinor')}>
                <Text style={s.label}>{selectedMinors.length > 1 ? 'Minors' : 'Minor'}</Text>
                {selectedMinors.map((m) => (
                  <Text key={m.id} style={s.value}>{m.name}</Text>
                ))}
                <Text style={s.editHint}>Tap to change</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.selectButtonOutline} onPress={() => setMode('selectMinor')}>
                <Text style={s.selectButtonOutlineText}>Add a Minor</Text>
              </TouchableOpacity>
            )}

            {/* Graduation year */}
            {graduationYear ? (
              <View style={s.infoBlock}>
                <Text style={s.label}>Graduation Year</Text>
                <Text style={s.value}>{graduationYear}</Text>
              </View>
            ) : null}

            {/* Class Year */}
            {classYear ? (
              <View style={s.infoBlock}>
                <Text style={s.label}>Class Year</Text>
                <Text style={s.value}>{classYear}</Text>
              </View>
            ) : null}

            {/* Courses completed */}
            <TouchableOpacity style={s.infoBlock} onPress={() => setMode('selectCourses')}>
              <Text style={s.label}>Courses Completed</Text>
              <Text style={s.value}>{(selectedCourses || []).length} courses</Text>
              <Text style={s.editHint}>Tap to add or remove</Text>
            </TouchableOpacity>

            {/* Focus Area — only for decided majors */}
            {!isUndecided && selectedProgram && (
              <View style={s.infoBlock}>
                <Text style={s.label}>Your Focus</Text>
                {focusLoading ? (
                  <ActivityIndicator color="#A30046" size="small" style={{ marginTop: 8 }} />
                ) : focusAreas.length > 0 ? (
                  <View>
                    {selectedFocus ? (
                      <View style={s.focusSelected}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.focusSelectedName}>{selectedFocus.name}</Text>
                          {selectedFocus.description && (
                            <Text style={s.focusSelectedDesc}>{selectedFocus.description}</Text>
                          )}
                          {selectedFocus.courses && selectedFocus.courses.length > 0 && (
                            <Text style={s.focusSelectedCourses}>Key courses: {selectedFocus.courses.join(', ')}</Text>
                          )}
                        </View>
                        <TouchableOpacity onPress={() => setSelectedFocus(null)} style={s.changeButton}>
                          <Text style={s.changeButtonText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <Text style={s.focusPrompt}>Choose a specialization within {selectedProgram.name}:</Text>
                        {focusAreas.map((area, i) => (
                          <TouchableOpacity
                            key={area.id || i}
                            style={s.focusOption}
                            onPress={() => setSelectedFocus(area)}
                          >
                            <View style={s.focusOptionLeft}>
                              {i === 0 && area.fitScore ? (
                                <View style={s.focusBestBadge}>
                                  <Text style={s.focusBestText}>Best Fit</Text>
                                </View>
                              ) : null}
                              <Text style={s.focusOptionName}>{area.name}</Text>
                              {area.description && (
                                <Text style={s.focusOptionDesc}>{area.description}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={s.valueSmall}>No focus areas available for this major yet</Text>
                )}
              </View>
            )}

            <View style={s.divider} />

            {/* RIASEC Quiz Results */}
            {quizResults && quizResults.scores ? (
              <View style={s.infoBlock}>
                <Text style={s.label}>Personality Profile</Text>
                <View style={s.riasecHeader}>
                  <Text style={s.riasecCode}>{quizResults.code}</Text>
                  <Text style={s.riasecProfileName}>{quizResults.profileName}</Text>
                </View>
                <View style={s.riasecBars}>
                  {['R', 'I', 'A', 'S', 'E', 'C'].map((dim) => {
                    const score = quizResults.scores[dim] || 0;
                    const max = Math.max(...Object.values(quizResults.scores), 1);
                    const pct = Math.round((score / max) * 100);
                    const colors = { R: '#2E7D32', I: '#1565C0', A: '#7B1FA2', S: '#E65100', E: '#C62828', C: '#37474F' };
                    const labels = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
                    return (
                      <View key={dim} style={s.riasecRow}>
                        <Text style={s.riasecDim}>{dim}</Text>
                        <View style={s.riasecBarBg}>
                          <View style={[s.riasecBarFill, { width: `${pct}%`, backgroundColor: colors[dim] }]} />
                        </View>
                        <Text style={s.riasecScore}>{score}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Scheduling Preferences */}
            {quizResults && quizResults.schedulingPrefs && Object.keys(quizResults.schedulingPrefs).length > 0 ? (
              <View style={s.infoBlock}>
                <Text style={s.label}>Scheduling Preferences</Text>
                {Object.entries(quizResults.schedulingPrefs).map(([key, val]) => {
                  const labels = {
                    timePreference: 'Time',
                    weekShape: 'Week Shape',
                    classSize: 'Class Size',
                    modality: 'Modality',
                    campus: 'Campus',
                  };
                  return (
                    <Text key={key} style={s.schedPref}>
                      {labels[key] || key}: {val}
                    </Text>
                  );
                })}
              </View>
            ) : null}

            <View style={s.divider} />

            {/* Sign Out */}
            <TouchableOpacity style={s.signOutButton} onPress={handleSignOut}>
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    paddingTop: 16,
  },
  panelFull: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUSBAR_HEIGHT,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#A30046',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  email: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#333',
  },
  displayName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginVertical: 20,
  },
  infoBlock: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
  },
  valueSmall: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
  },
  editHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#A30046',
    marginTop: 4,
  },
  selectButton: {
    width: '100%',
    backgroundColor: '#A30046',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectButtonOutline: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#A30046',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectButtonOutlineText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#A30046',
    fontWeight: 'bold',
  },
  focusSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#E8C8D4',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  focusSelectedName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#A30046',
    fontWeight: 'bold',
  },
  focusSelectedDesc: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  focusSelectedCourses: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  focusPrompt: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  focusOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  focusOptionLeft: {
    flex: 1,
  },
  focusOptionName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
  },
  focusOptionDesc: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  focusBestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A30046',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  focusBestText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  riasecHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  riasecCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    color: '#A30046',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  riasecProfileName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#666',
  },
  riasecBars: {
    width: '100%',
  },
  riasecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  riasecDim: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 18,
  },
  riasecBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  riasecBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  riasecScore: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 24,
    textAlign: 'right',
  },
  schedPref: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  infoBlockRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeButton: {
    backgroundColor: '#A30046',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
  },
  changeButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recsSection: {
    marginBottom: 8,
  },
  recsSectionTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#A30046',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recsSectionSub: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  recItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#E8C8D4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  recItemLeft: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  recRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recRankBadgeWarn: {
    backgroundColor: '#999',
  },
  recRankText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recItemRight: {
    flex: 1,
  },
  recItemName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
  },
  recItemDegree: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  recItemRationale: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  recFeasibility: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
  },
  recFeasible: {
    color: '#2E7D32',
  },
  recNotFeasible: {
    color: '#C62828',
  },
  recsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 8,
  },
  recsDividerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#A30046',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Select program / courses mode
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  countBadge: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    fontWeight: 'bold',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond-Regular',
    color: '#000',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 42,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 6,
  },
  listItemSelected: {
    backgroundColor: '#A30046',
  },
  listItemText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#333',
  },
  listItemTextSelected: {
    color: '#FFFFFF',
  },
  listItemCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  listItemSub: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});

export default ProfileScreen;
