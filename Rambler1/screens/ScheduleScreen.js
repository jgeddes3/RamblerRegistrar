import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScheduleScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Schedule Builder</Text>
    <Text style={styles.subtitle}>Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  title: { fontFamily: 'CormorantGaramond-Regular', fontSize: 32, color: '#A30046', marginBottom: 8 },
  subtitle: { fontFamily: 'CormorantGaramond-Regular', fontSize: 18, color: '#999' },
});

export default ScheduleScreen;
