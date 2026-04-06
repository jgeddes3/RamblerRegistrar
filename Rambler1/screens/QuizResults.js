import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { fetchQuizRecommendations, fetchQuizFocusAreas } from '../api';
import BackgroundImage from '../styleComponents/BackgroundImage';

// =============================================================================
// RIASEC DIMENSION INFO
// =============================================================================

const DIMENSION_INFO = {
  R: { name: 'Realistic', label: 'Builder', color: '#2E7D32' },
  I: { name: 'Investigative', label: 'Thinker', color: '#1565C0' },
  A: { name: 'Artistic', label: 'Creator', color: '#7B1FA2' },
  S: { name: 'Social', label: 'Helper', color: '#E65100' },
  E: { name: 'Enterprising', label: 'Persuader', color: '#C62828' },
  C: { name: 'Conventional', label: 'Organizer', color: '#37474F' },
};

const DIMENSION_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

// =============================================================================
// COMPONENT
// =============================================================================

const QuizResults = () => {
  const navigation = useNavigation();
  const { quizResults, selectedProgram } = useAppContext();
  const [recommendations, setRecommendations] = useState([]);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  const isUndecided = !selectedProgram || selectedProgram.id === 'undecided';

  useEffect(() => {
    if (!quizResults) return;

    const loadData = async () => {
      try {
        if (isUndecided) {
          const recs = await fetchQuizRecommendations(quizResults.code);
          setRecommendations(recs || []);
        } else {
          const areas = await fetchQuizFocusAreas(selectedProgram.id);
          // Client-side ranking if backend returns unranked
          if (areas.length > 0 && !areas[0].fitScore) {
            for (const area of areas) {
              area.fitScore = 0;
              if (area.riasec) {
                for (const { dimension, weight } of area.riasec) {
                  area.fitScore += (quizResults.scores[dimension] || 0) * weight;
                }
              }
            }
            areas.sort((a, b) => b.fitScore - a.fitScore);
          }
          setFocusAreas(areas || []);
        }
      } catch (e) {
        // Non-critical — results screen still shows profile
      }
      setLoading(false);
    };
    loadData();
  }, [quizResults]);

  if (!quizResults) {
    return (
      <View style={s.container}>
        <Text style={s.errorText}>No quiz results found. Please retake the quiz.</Text>
        <TouchableOpacity style={s.continueButton} onPress={() => navigation.goBack()}>
          <Text style={s.continueButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { scores, code, profileName } = quizResults;
  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <BackgroundImage source={require('../assets/Backgrounds/Wallpaper-01.jpg')}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          {/* Profile header */}
          <View style={s.profileCard}>
            <Text style={s.codeLabel}>{code}</Text>
            <Text style={s.profileName}>{profileName}</Text>
            <Text style={s.profileSubtitle}>Your RIASEC Profile</Text>
          </View>

          {/* Score bars */}
          <View style={s.scoresCard}>
            <Text style={s.cardTitle}>Your Scores</Text>
            {DIMENSION_ORDER.map((dim) => {
              const info = DIMENSION_INFO[dim];
              const score = scores[dim] || 0;
              const pct = Math.round((score / maxScore) * 100);
              return (
                <View key={dim} style={s.scoreRow}>
                  <View style={s.scoreLabelCol}>
                    <Text style={s.scoreDimLetter}>{dim}</Text>
                    <Text style={s.scoreDimName}>{info.label}</Text>
                  </View>
                  <View style={s.scoreBarBg}>
                    <View
                      style={[s.scoreBarFill, { width: `${pct}%`, backgroundColor: info.color }]}
                    />
                  </View>
                  <Text style={s.scoreValue}>{score}</Text>
                </View>
              );
            })}
          </View>

          {/* Recommendations for undecided */}
          {isUndecided && (
            <View style={s.recsCard}>
              <Text style={s.cardTitle}>Recommended Majors</Text>
              <Text style={s.cardSubtitle}>Based on your personality profile</Text>
              {loading ? (
                <ActivityIndicator color="#A30046" style={{ marginTop: 16 }} />
              ) : recommendations.length > 0 ? (
                recommendations.map((rec, i) => (
                  <View key={rec.program_id || i} style={s.recRow}>
                    <View style={s.recRank}>
                      <Text style={s.recRankText}>{i + 1}</Text>
                    </View>
                    <View style={s.recInfo}>
                      <Text style={s.recName}>{rec.program_name}</Text>
                      {rec.degree && <Text style={s.recDegree}>{rec.degree}</Text>}
                      {rec.rationale && <Text style={s.recRationale}>{rec.rationale}</Text>}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={s.noDataText}>
                  Recommendations will be available once program data is seeded.
                  {'\n\n'}Your code "{code}" suggests you thrive as {profileName.toLowerCase()}.
                </Text>
              )}
            </View>
          )}

          {/* Focus areas for decided students */}
          {!isUndecided && (
            <View style={s.recsCard}>
              <Text style={s.cardTitle}>Your Focus Within {selectedProgram.name}</Text>
              <Text style={s.cardSubtitle}>Ranked by fit with your personality</Text>
              {loading ? (
                <ActivityIndicator color="#A30046" style={{ marginTop: 16 }} />
              ) : focusAreas.length > 0 ? (
                focusAreas.map((area, i) => (
                  <View key={area.id || i} style={s.focusRow}>
                    <View style={[s.focusBadge, i === 0 && s.focusBadgeTop]}>
                      <Text style={[s.focusBadgeText, i === 0 && s.focusBadgeTextTop]}>
                        {i === 0 ? 'Best Fit' : `#${i + 1}`}
                      </Text>
                    </View>
                    <Text style={s.focusName}>{area.name}</Text>
                    {area.description && (
                      <Text style={s.focusDesc}>{area.description}</Text>
                    )}
                    {area.courses && area.courses.length > 0 && (
                      <Text style={s.focusCourses}>
                        Key courses: {area.courses.join(', ')}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={s.noDataText}>
                  Focus area data for {selectedProgram.name} will be available soon.
                  {'\n\n'}Your profile as "{profileName}" suggests focusing on areas that
                  emphasize {code.split('').map(l => DIMENSION_INFO[l]?.label).filter(Boolean).join(' and ').toLowerCase()} skills.
                </Text>
              )}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Continue button */}
        <View style={s.stickyBottom}>
          <TouchableOpacity
            style={s.continueButton}
            onPress={() => navigation.navigate('SchedulingPrefs')}
          >
            <Text style={s.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundImage>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#A30046',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  // Profile card
  profileCard: {
    backgroundColor: '#A30046',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  profileName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 26,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  // Scores card
  scoresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: '#A30046',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabelCol: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreDimLetter: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    width: 16,
  },
  scoreDimName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#888',
  },
  scoreBarBg: {
    flex: 1,
    height: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  scoreValue: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  // Recommendations card
  recsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recRankText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recInfo: {
    flex: 1,
  },
  recName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  recDegree: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#888',
  },
  recRationale: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noDataText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    lineHeight: 24,
  },
  // Focus areas
  focusRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  focusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  focusBadgeTop: {
    backgroundColor: '#A30046',
  },
  focusBadgeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
  },
  focusBadgeTextTop: {
    color: '#FFFFFF',
  },
  focusName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  focusDesc: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  focusCourses: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 13,
    color: '#A30046',
    marginTop: 6,
  },
  // Bottom
  stickyBottom: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    width: 180,
    height: 50,
  },
  continueButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default QuizResults;
