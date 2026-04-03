import React, { useEffect, useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import ProfessorRating from './styleComponents/ProfessorRating';
import { getCachedProfessorsForCourse, cacheProfessor } from './Database';
import { searchProfessors, getProfessorDetail } from './rmp';

const CourseDetailModal = ({ visible, course, onClose }) => {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && course) {
      loadProfessors();
    }
  }, [visible, course]);

  const loadProfessors = async () => {
    if (!course) return;
    setLoading(true);
    setError('');

    try {
      // Check cache first
      const cached = await getCachedProfessorsForCourse(course.code);
      if (cached.length > 0) {
        setProfessors(cached);
        setLoading(false);
        return;
      }

      // No cache — search RMP using the course code prefix (e.g., "COMP" from "COMP 170")
      // RMP search is name-based, but searching the dept prefix finds professors in that dept
      const prefix = course.code.split(' ')[0] || '';
      const searchResults = await searchProfessors(prefix);

      // For each professor found, get their detail and check courseCodes
      const matchingProfs = [];
      for (const prof of searchResults.slice(0, 10)) {
        try {
          const detail = await getProfessorDetail(prof.rmpId);
          // courseCodes are already normalized by rmp.js (e.g., "COMP 170")
          const teachesThisCourse = detail.courseCodes.some(
            (c) => c.name === course.code
          );

          if (teachesThisCourse) {
            await cacheProfessor(detail);
            matchingProfs.push(detail);
          }
        } catch (e) {
          // Skip individual professor errors
        }
      }

      if (matchingProfs.length > 0) {
        // Re-fetch from cache to get proper format
        const freshCached = await getCachedProfessorsForCourse(course.code);
        setProfessors(freshCached);
      } else {
        setProfessors([]);
      }
    } catch (e) {
      setError('Could not load professor ratings');
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.courseCode}>{course.code}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.courseName}>{course.name}</Text>
          {course.credits ? (
            <Text style={styles.credits}>{course.credits} credit{course.credits !== 1 ? 's' : ''}</Text>
          ) : null}
          {course.description ? (
            <Text style={styles.description}>{course.description}</Text>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Professor Ratings</Text>

          <ScrollView style={styles.professorList}>
            {loading ? (
              <ActivityIndicator size="large" color="#A30046" style={{ marginTop: 20 }} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : professors.length > 0 ? (
              professors.map((prof) => (
                <ProfessorRating key={prof.id} professor={prof} />
              ))
            ) : (
              <Text style={styles.emptyText}>No professor ratings found for this course</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: '#A30046',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  courseName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
    marginBottom: 4,
  },
  credits: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  divider: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#A30046',
    marginBottom: 12,
  },
  professorList: {
    maxHeight: 300,
  },
  errorText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#A30046',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default CourseDetailModal;
