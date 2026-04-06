import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from './auth';
import { fetchUserProfile, fetchProgramById, fetchQuizResults, fetchUserCourses, fetchCourseDetail, fetchUserLocations } from './api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedProgram2, setSelectedProgram2] = useState(null);
  const [selectedMinors, setSelectedMinors] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [quizTags, setQuizTags] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [graduationYear, setGraduationYear] = useState('');
  const [classYear, setClassYear] = useState('');
  const [userLocations, setUserLocations] = useState([]);
  const [selectedFocus, setSelectedFocus] = useState(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setIsLoggedIn(true);

        // Restore saved profile from backend
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          if (profile && !profile.error) {
            // Restore program objects
            if (profile.selected_program_id === 'undecided') {
              setSelectedProgram({ id: 'undecided', name: 'Undecided', type: 'major', degree: null });
            } else if (profile.program) {
              setSelectedProgram(profile.program);
            } else if (profile.selected_program_id) {
              const prog = await fetchProgramById(profile.selected_program_id);
              if (prog && !prog.error) setSelectedProgram(prog);
            }

            if (profile.program2) {
              setSelectedProgram2(profile.program2);
            } else if (profile.selected_program2_id) {
              const prog2 = await fetchProgramById(profile.selected_program2_id);
              if (prog2 && !prog2.error) setSelectedProgram2(prog2);
            }

            if (profile.minors && profile.minors.length > 0) {
              setSelectedMinors(profile.minors);
            }

            if (profile.graduation_year) {
              setGraduationYear(profile.graduation_year);
            }
            if (profile.class_year) {
              setClassYear(profile.class_year);
            }
          }
        } catch (e) {
          // Profile restore failed — not critical, user can re-select
        }

        // Restore quiz results, courses, and locations in parallel
        try {
          const [quizSettled, coursesSettled, locationsSettled] = await Promise.allSettled([
            fetchQuizResults(firebaseUser.uid),
            fetchUserCourses(firebaseUser.uid),
            fetchUserLocations(firebaseUser.uid),
          ]);

          // Quiz results
          if (quizSettled.status === 'fulfilled' && quizSettled.value && !quizSettled.value.error) {
            const q = quizSettled.value;
            setQuizResults({
              scores: q.scores,
              code: q.code,
              profileName: q.profile_name,
              answers: q.answers,
              schedulingPrefs: q.scheduling_prefs,
            });
          }

          // Courses — hydrate course_code into full course objects
          if (coursesSettled.status === 'fulfilled' && coursesSettled.value && coursesSettled.value.length > 0) {
            const hydrated = await Promise.allSettled(
              coursesSettled.value.map(uc => fetchCourseDetail(uc.course_code))
            );
            const fullCourses = hydrated
              .filter(r => r.status === 'fulfilled' && r.value && !r.value.error)
              .map(r => r.value);
            if (fullCourses.length > 0) {
              setSelectedCourses(fullCourses);
            }
          }

          // Locations
          if (locationsSettled.status === 'fulfilled' && locationsSettled.value && locationsSettled.value.length > 0) {
            setUserLocations(locationsSettled.value);
          }
        } catch (e) {
          // Non-critical — user can re-do quiz, re-select courses
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setSelectedProgram(null);
        setSelectedProgram2(null);
        setSelectedMinors([]);
        setSelectedCourses([]);
        setQuizTags([]);
        setQuizResults(null);
        setGraduationYear('');
        setClassYear('');
        setUserLocations([]);
        setSelectedFocus(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedProgram,
        setSelectedProgram,
        selectedProgram2,
        setSelectedProgram2,
        selectedMinors,
        setSelectedMinors,
        selectedCourses,
        setSelectedCourses,
        quizTags,
        setQuizTags,
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        authLoading,
        graduationYear,
        setGraduationYear,
        classYear,
        setClassYear,
        quizResults,
        setQuizResults,
        userLocations,
        setUserLocations,
        selectedFocus,
        setSelectedFocus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
