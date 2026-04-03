import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from './auth';
import { fetchUserProfile, fetchProgramById } from './api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedProgram2, setSelectedProgram2] = useState(null);
  const [selectedMinors, setSelectedMinors] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [quizTags, setQuizTags] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [graduationYear, setGraduationYear] = useState('');

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
            if (profile.program) {
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
          }
        } catch (e) {
          // Profile restore failed — not critical, user can re-select
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setSelectedProgram(null);
        setSelectedProgram2(null);
        setSelectedMinors([]);
        setSelectedCourses([]);
        setQuizTags([]);
        setGraduationYear('');
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
