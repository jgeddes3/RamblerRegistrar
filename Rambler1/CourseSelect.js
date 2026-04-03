import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses } from './Database';
import { useAppContext } from './AppContext';
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import { ScrollView } from 'react-native';
import BackgroundImage from './styleComponents/BackgroundImage';
import CourseDetailModal from './CourseDetailModal';

const CourseSelect =() => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [detailCourse, setDetailCourse] = useState(null);
  const { selectedCourses, setSelectedCourses } = useAppContext();
  const navigation = useNavigation();

  const loadCourses = () => {
    setLoading(true);
    setError('');
    fetchCourses()
      .then((data) => setCourses(data))
      .catch(() => setError('Failed to load courses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCoursePress = (item) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.id === item.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleNextButtonPress = () => {
    navigation.navigate('PreferenceQuiz');
  };

  const filteredCourses = courses.filter((item) =>
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(search.toLowerCase())
  );

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
          <View style={s.headerSide} />
        </View>
        <View style={s.pageTitleBadge}>
          <Text style={s.pageTitle}>Select Courses You've Taken</Text>
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
            <Text style={{ color: '#A30046', textAlign: 'center', fontFamily: 'CormorantGaramond-Regular', fontSize: 18 }}>
              {error}
            </Text>
            <TouchableOpacity onPress={loadCourses} style={s.retryButton}>
              <Text style={s.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}>
            {filteredCourses.map((item) => (
              <CustomLongButton1
                key={item.id}
                onPress={() => handleCoursePress(item)}
                onLongPress={() => setDetailCourse(item)}
                selected={selectedCourses.some((c) => c.id === item.id)}
              >
                {item.code} — {item.name}
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#A30046',
    fontWeight: 'bold',
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    textAlign: 'center',
    color: 'black',
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

export default CourseSelect;
