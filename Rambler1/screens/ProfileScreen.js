import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import { useAppContext } from '../AppContext';
import { signOut, getIdToken } from '../auth';
import { fetchPrograms, fetchCourses, addUserCourse, saveUserProfile } from '../api';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const ProfileScreen = ({ visible, onClose }) => {
  const {
    user, selectedProgram, setSelectedProgram, selectedProgram2, setSelectedProgram2,
    selectedMinors, setSelectedMinors, selectedCourses, setSelectedCourses, graduationYear,
  } = useAppContext();

  const [mode, setMode] = useState('profile'); // 'profile', 'selectProgram', 'selectMinor', 'selectCourses'
  const [programs, setPrograms] = useState([]);
  const [minorsList, setMinorsList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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
              <TouchableOpacity style={s.infoBlock} onPress={() => setMode('selectProgram')}>
                <Text style={s.label}>Major</Text>
                <Text style={s.value}>{selectedProgram.name} ({selectedProgram.degree})</Text>
                {selectedProgram.school && (
                  <Text style={s.valueSmall}>{selectedProgram.school}</Text>
                )}
                <Text style={s.editHint}>Tap to change</Text>
              </TouchableOpacity>
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

            {/* Courses completed */}
            <TouchableOpacity style={s.infoBlock} onPress={() => setMode('selectCourses')}>
              <Text style={s.label}>Courses Completed</Text>
              <Text style={s.value}>{(selectedCourses || []).length} courses</Text>
              <Text style={s.editHint}>Tap to add or remove</Text>
            </TouchableOpacity>

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
