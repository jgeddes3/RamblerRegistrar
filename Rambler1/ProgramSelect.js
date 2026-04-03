import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchPrograms } from './Database';
import { useAppContext } from './AppContext';
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import { ScrollView } from 'react-native';
import BackgroundImage from './styleComponents/BackgroundImage';

// Phases: 'major' -> 'doubleMajor' -> 'minorChoice' -> 'minor'
const PHASES = ['major', 'doubleMajor', 'minorChoice', 'minor'];
const PHASE_LABELS = ['Major', 'Double Major', 'Minor', 'Minor'];

const ProgramSelect =() => {
  const [programs, setPrograms] = useState([]);
  const [minors, setMinors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState('major');
  const {
    selectedProgram, setSelectedProgram,
    selectedProgram2, setSelectedProgram2,
    selectedMinors, setSelectedMinors,
    setSelectedCourses, setQuizTags, setUser, setIsLoggedIn,
  } = useAppContext();
  const navigation = useNavigation();

  const loadPrograms = () => {
    setLoading(true);
    setError('');
    Promise.all([fetchPrograms('major'), fetchPrograms('minor')])
      .then(([majorData, minorData]) => {
        setPrograms(majorData);
        setMinors(minorData);
      })
      .catch(() => setError('Failed to load programs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleBack = () => {
    if (phase === 'major') {
      // First phase — go back to login
      navigation.goBack();
    } else if (phase === 'doubleMajor') {
      setPhase('major');
      setSearch('');
    } else if (phase === 'minorChoice') {
      setPhase('doubleMajor');
      setSearch('');
    } else if (phase === 'minor') {
      setPhase('minorChoice');
      setSelectedMinors([]);
      setSearch('');
    }
  };

  const handleProgramPress = (item) => {
    if (phase === 'major') {
      setSelectedProgram((prev) => (prev && prev.id === item.id ? null : item));
    } else if (phase === 'doubleMajor') {
      if (selectedProgram && item.id === selectedProgram.id) return;
      setSelectedProgram2((prev) => (prev && prev.id === item.id ? null : item));
    } else if (phase === 'minor') {
      setSelectedMinors((prev) => {
        const isAlreadySelected = prev.some((m) => m.id === item.id);
        if (isAlreadySelected) {
          return prev.filter((m) => m.id !== item.id);
        }
        if (prev.length >= 3) return prev;
        return [...prev, item];
      });
    }
  };

  const handleRemoveFirst = () => {
    setSelectedProgram(selectedProgram2);
    setSelectedProgram2(null);
  };

  const handleRemoveSecond = () => {
    setSelectedProgram2(null);
  };

  const handleRemoveMinor = (minorId) => {
    setSelectedMinors((prev) => prev.filter((m) => m.id !== minorId));
  };

  const handleNextButtonPress = () => {
    if (phase === 'major' && selectedProgram) {
      setPhase('doubleMajor');
      setSearch('');
    } else if (phase === 'doubleMajor') {
      setPhase('minorChoice');
      setSearch('');
    } else if (phase === 'minor') {
      navigation.navigate('CourseSelect');
    }
  };

  const handleMinorChoice = (wantsMinor) => {
    if (wantsMinor) {
      setPhase('minor');
      setSearch('');
    } else {
      setSelectedMinors([]);
      navigation.navigate('CourseSelect');
    }
  };

  const currentList = phase === 'minor' ? minors : programs;
  const filteredList = currentList.filter((item) => {
    const searchLower = search.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(searchLower);
    const degreeMatch = item.degree ? item.degree.toLowerCase().includes(searchLower) : false;
    return nameMatch || degreeMatch;
  });

  const isSelected = (item) => {
    if (phase === 'major') {
      return selectedProgram && selectedProgram.id === item.id;
    } else if (phase === 'doubleMajor') {
      return (selectedProgram && selectedProgram.id === item.id) ||
             (selectedProgram2 && selectedProgram2.id === item.id);
    } else if (phase === 'minor') {
      return selectedMinors.some((m) => m.id === item.id);
    }
    return false;
  };

  const getTitle = () => {
    if (phase === 'major') return 'Choose Your Major';
    if (phase === 'doubleMajor') return 'Double Major?';
    if (phase === 'minorChoice') return 'Would you like a Minor?';
    if (phase === 'minor') return selectedMinors.length > 0 ? `Choose Your Minors (${selectedMinors.length}/3)` : 'Choose Your Minor(s)';
    return '';
  };

  const getSearchPlaceholder = () => {
    if (phase === 'minor') return 'Search minors...';
    return 'Search majors...';
  };

  const currentPhaseIndex = PHASES.indexOf(phase);

  const renderHeader = () => (
    <View style={s.headerBar}>
      <View style={s.headerSide}>
        <TouchableOpacity onPress={handleBack} style={s.backButton}>
          <Text style={s.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      <Image source={require('./assets/Icons/Logo2-02.png')} style={s.headerLogo} />
      <View style={s.headerSide} />
    </View>
  );

  const renderProgress = () => (
    <View style={s.progressBar}>
      {['Major', 'Double Major', 'Minor'].map((label, i) => {
        const isActive = i <= (phase === 'minor' ? 2 : phase === 'minorChoice' ? 2 : currentPhaseIndex);
        const isCurrent = (i === 0 && phase === 'major') ||
                          (i === 1 && phase === 'doubleMajor') ||
                          (i === 2 && (phase === 'minorChoice' || phase === 'minor'));
        return (
          <View key={i} style={s.progressStep}>
            <View style={[s.progressDot, isActive ? s.progressDotActive : {}, isCurrent ? s.progressDotCurrent : {}]} />
            <Text style={[s.progressLabel, isActive ? s.progressLabelActive : {}]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );

  // Minor choice phase — just show two buttons
  if (phase === 'minorChoice') {
    return (
      <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
        <View style={{ flex: 1 }}>
          {renderHeader()}
          {renderProgress()}
          <Text style={s.pageTitle}>{getTitle()}</Text>
          <View style={s.choiceContainer}>
            <TouchableOpacity style={s.choiceButton} onPress={() => handleMinorChoice(true)}>
              <Text style={s.choiceButtonText}>Minor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.choiceButton, s.choiceButtonSecondary]} onPress={() => handleMinorChoice(false)}>
              <Text style={[s.choiceButtonText, s.choiceButtonTextSecondary]}>No Minor</Text>
            </TouchableOpacity>
            <Text style={s.skipHint}>You can always add a minor later</Text>
          </View>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        {renderHeader()}
        {renderProgress()}
        <Text style={s.pageTitle}>{getTitle()}</Text>

        {/* Major phase: show selected major with remove */}
        {phase === 'major' && selectedProgram && (
          <View style={s.selectedBadge}>
            <Text style={s.selectedBadgeText}>
              {selectedProgram.name} ({selectedProgram.degree})
            </Text>
            <TouchableOpacity onPress={() => setSelectedProgram(null)} style={s.removeButton}>
              <Text style={s.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Double major phase: show first major as info, second with remove */}
        {phase === 'doubleMajor' && selectedProgram && (
          <View style={s.selectedBadgeInfo}>
            <Text style={s.selectedBadgeInfoText}>
              Major: {selectedProgram.name} ({selectedProgram.degree})
            </Text>
          </View>
        )}
        {phase === 'doubleMajor' && selectedProgram2 && (
          <View style={s.selectedBadge}>
            <Text style={s.selectedBadgeText}>
              {selectedProgram2.name} ({selectedProgram2.degree})
            </Text>
            <TouchableOpacity onPress={handleRemoveSecond} style={s.removeButton}>
              <Text style={s.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show selected minor badges in minor phase */}
        {phase === 'minor' && selectedMinors.length > 0 && selectedMinors.map((minor) => (
          <View key={minor.id} style={s.selectedBadge}>
            <Text style={s.selectedBadgeText}>
              {minor.name}
            </Text>
            <TouchableOpacity onPress={() => handleRemoveMinor(minor.id)} style={s.removeButton}>
              <Text style={s.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        {phase === 'minor' && selectedMinors.length >= 3 && (
          <Text style={{ fontFamily: 'CormorantGaramond-Regular', fontSize: 14, color: '#A30046', textAlign: 'center', marginTop: 4 }}>
            Maximum of 3 minors selected
          </Text>
        )}

        <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
          <TextInput
            style={s.searchInput}
            placeholder={getSearchPlaceholder()}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 100 }} />
        ) : error ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Text style={{ color: '#A30046', textAlign: 'center', fontFamily: 'CormorantGaramond-Regular', fontSize: 18 }}>
              {error}
            </Text>
            <TouchableOpacity onPress={loadPrograms} style={s.retryButton}>
              <Text style={s.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}>
            {filteredList.map((item) => (
              <CustomLongButton1
                key={item.id}
                onPress={() => handleProgramPress(item)}
                selected={isSelected(item)}
              >
                {item.name}{item.degree ? ` (${item.degree})` : ''}
              </CustomLongButton1>
            ))}
          </ScrollView>
        )}
        <View style={s.stickyBottom}>
          <TouchableOpacity style={s.nextButton} onPress={handleNextButtonPress}>
            <Text style={s.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundImage>
  );
};

const s = StyleSheet.create({
  headerBar: {
    height: 120,
    backgroundColor: '#A30046',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 90,
    alignItems: 'flex-start',
  },
  headerLogo: {
    width: 50,
    height: 42,
    resizeMode: 'contain',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  backButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#A30046',
    fontWeight: 'bold',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 30,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D9D9D9',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#A30046',
  },
  progressDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#999',
  },
  progressLabelActive: {
    color: '#A30046',
    fontWeight: 'bold',
  },
  pageTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    textAlign: 'center',
    color: 'black',
    marginTop: 5,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  selectedBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    flexShrink: 1,
  },
  selectedBadgeInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  selectedBadgeInfoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#A30046',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  removeButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  searchInput: {
    fontSize: 17,
    fontFamily: 'CormorantGaramond-Regular',
    color: '#000000',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 4,
    paddingHorizontal: 10,
    width: 300,
    height: 38,
  },
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  choiceButton: {
    backgroundColor: '#A30046',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 6,
    width: 220,
    alignItems: 'center',
  },
  choiceButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A30046',
  },
  choiceButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#FFFFFF',
  },
  choiceButtonTextSecondary: {
    color: '#A30046',
  },
  skipHint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#A30046',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  stickyBottom: {
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    width: 128,
    height: 53,
  },
  nextButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: '#FFFFFF',
  },
});

export default ProgramSelect;
