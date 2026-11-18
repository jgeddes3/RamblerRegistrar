import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity, Platform, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses, fetchProgramCourses, ensureCatalog } from './Database';
import { useAppContext } from './AppContext';
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import BackgroundImage from './styleComponents/BackgroundImage';
import CourseDetailModal from './CourseDetailModal';
import { buildCourseRows } from './course-list';
import StepCounter from './components/ui/StepCounter';
import useOnboardingDraft from './components/ui/useOnboardingDraft';
import { FONT, FONT_SEMI } from './theme';

// Bottom inset so the sticky bar clears the home indicator / nav bar
const BOTTOM_SAFE = Platform.OS === 'ios' ? 34 : 20;

// One course row. Memoized: with ~2,000 courses in the catalog, a tap must
// re-render the row that changed, not the whole list.
const CourseRow = React.memo(({ course, selected, onPress, onLongPress }) => (
  <CustomLongButton1
    onPress={() => onPress(course)}
    onLongPress={() => onLongPress(course)}
    selected={selected}
  >
    {course.code} · {course.name}
  </CustomLongButton1>
));

const CourseSelect =() => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detailCourse, setDetailCourse] = useState(null);
  const [majorCourseIds, setMajorCourseIds] = useState(null);
  const { selectedCourses, setSelectedCourses, selectedProgram } = useAppContext();
  const navigation = useNavigation();
  useOnboardingDraft('CourseSelect', { selectedCourses });

  const loadCourses = () => {
    setLoading(true);
    setError('');
    // ensureCatalog: if the local catalog is empty (first launch was offline),
    // try the download again now instead of showing an empty list forever.
    ensureCatalog()
      .then(() => fetchCourses())
      .then((data) => {
        setCourses(data || []);
        if (!data || data.length === 0) setError("Couldn't load courses. Check your connection and retry.");
      })
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Surface the user's major courses first — fall back silently to the
  // default ordering if the program lookup fails or they're undecided.
  useEffect(() => {
    let cancelled = false;
    const programId = selectedProgram && selectedProgram.id;
    if (!programId || programId === 'undecided') {
      setMajorCourseIds(null);
      return;
    }
    fetchProgramCourses(programId)
      .then((rows) => {
        if (!cancelled) setMajorCourseIds(new Set(rows.map((r) => r.id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedProgram]);

  const handleCoursePress = useCallback((item) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.id === item.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== item.id);
      }
      return [...prev, item];
    });
  }, [setSelectedCourses]);

  const handleNextButtonPress = () => {
    navigation.navigate('PreferenceQuiz');
  };

  // Rows for the list: filtered by search, the user's major courses first.
  const rows = useMemo(
    () => buildCourseRows(courses, search, majorCourseIds),
    [courses, search, majorCourseIds]
  );
  const selectedIds = useMemo(
    () => new Set((selectedCourses || []).map((c) => c.id)),
    [selectedCourses]
  );

  const renderRow = useCallback(({ item }) => (
    item.type === 'label' ? (
      <Text style={s.sectionLabel}>{item.title}</Text>
    ) : (
      <CourseRow
        course={item.course}
        selected={selectedIds.has(item.course.id)}
        onPress={handleCoursePress}
        onLongPress={setDetailCourse}
      />
    )
  ), [selectedIds, handleCoursePress]);

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        <View style={s.headerBar}>
          <View style={s.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('./assets/Icons/Logo2-02.png')} style={s.headerLogo} />
          <View style={s.headerSide}>
            <StepCounter route="CourseSelect" />
          </View>
        </View>
        <View style={s.pageTitleBadge}>
          <Text accessibilityRole="header" style={s.pageTitle}>Select Courses You've Taken</Text>
        </View>
        <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
          <TextInput
            style={s.searchInput}
            placeholder="Search courses..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 100 }} />
        ) : error ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Text style={{ color: '#A30046', textAlign: 'center', fontFamily: FONT, fontSize: 18 }}>
              {error}
            </Text>
            <TouchableOpacity onPress={loadCourses} style={s.retryButton}>
              <Text style={s.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // FlatList, not ScrollView + map: only the rows near the viewport are
          // mounted. Rendering all ~2,000 at once (and again on every tap and
          // keystroke) is what locked this screen up.
          <FlatList
            data={rows}
            keyExtractor={(item) => item.key}
            renderItem={renderRow}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={9}
          />
        )}
        <View style={s.stickyBottom}>
          <TouchableOpacity style={s.nextButton} onPress={handleNextButtonPress} accessibilityLabel="Next">
            <Text style={s.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
      <CourseDetailModal
        visible={!!detailCourse}
        course={detailCourse}
        onClose={() => setDetailCourse(null)}
      />
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
    fontFamily: FONT_SEMI,
    fontSize: 15,
    color: '#A30046',
  },
  pageTitleBadge: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 15,
  },
  pageTitle: {
    fontFamily: FONT,
    fontSize: 36,
    textAlign: 'center',
    color: 'black',
  },
  searchInput: {
    fontSize: 17,
    fontFamily: FONT,
    color: '#000000',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 4,
    paddingHorizontal: 10,
    width: 300,
    height: 38,
  },
  retryButton: {
    backgroundColor: '#A30046',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: FONT,
    fontSize: 18,
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontFamily: FONT_SEMI,
    fontSize: 14,
    color: '#A30046',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  stickyBottom: {
    paddingTop: 4,
    paddingBottom: 8 + BOTTOM_SAFE,
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
    fontFamily: FONT,
    fontSize: 19,
    color: '#FFFFFF',
  },
});

export default CourseSelect;
