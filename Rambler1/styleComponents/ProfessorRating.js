import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProfessorRating = ({ professor }) => {
  const rating = professor.avg_rating ? professor.avg_rating.toFixed(1) : 'N/A';
  const difficulty = professor.avg_difficulty ? professor.avg_difficulty.toFixed(1) : 'N/A';
  const wouldTakeAgain = professor.would_take_again > 0
    ? `${Math.round(professor.would_take_again)}%`
    : 'N/A';

  const ratingColor = professor.avg_rating >= 4 ? '#2d6a4f'
    : professor.avg_rating >= 3 ? '#e9c46a'
    : professor.avg_rating >= 2 ? '#e76f51'
    : '#d00000';

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>
          {professor.first_name} {professor.last_name}
        </Text>
        <View style={[styles.ratingBadge, { backgroundColor: professor.avg_rating ? ratingColor : '#999' }]}>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>Difficulty: {difficulty}</Text>
        <Text style={styles.statSeparator}>|</Text>
        <Text style={styles.stat}>{wouldTakeAgain} would take again</Text>
      </View>
      <Text style={styles.ratingsCount}>{professor.num_ratings || 0} ratings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#000',
    flex: 1,
  },
  ratingBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stat: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: '#555',
  },
  statSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  ratingsCount: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: '#999',
  },
});

export default ProfessorRating;
