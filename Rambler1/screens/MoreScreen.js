import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAROON = '#A30046';

const MENU_ROWS = [
  {
    key: 'Map',
    label: 'Campus Map',
    sublabel: 'Buildings across LSC & WTC',
    icon: 'map-outline',
  },
  {
    key: 'Library',
    label: 'Library Hours',
    sublabel: 'Today’s hours at the libraries',
    icon: 'library-outline',
  },
  {
    key: 'Events',
    label: 'Campus Events',
    sublabel: 'What’s happening at Loyola',
    icon: 'calendar-outline',
  },
];

const MoreScreen = ({ navigation }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>More</Text>
    <Text style={styles.subtitle}>Campus tools and resources</Text>

    <View style={styles.card}>
      {MENU_ROWS.map((row, index) => (
        <TouchableOpacity
          key={row.key}
          style={[styles.row, index < MENU_ROWS.length - 1 && styles.rowBorder]}
          onPress={() => navigation.navigate(row.key)}
          activeOpacity={0.6}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={row.icon} size={22} color={MAROON} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowSublabel}>{row.sublabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, styles.iconWrapDisabled]}>
          <Ionicons name="settings-outline" size={22} color="#AAAAAA" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, styles.rowLabelDisabled]}>Settings</Text>
          <Text style={styles.rowSublabel}>Coming soon</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    color: MAROON,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapDisabled: {
    backgroundColor: '#F4F4F4',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  rowLabelDisabled: {
    color: '#999',
  },
  rowSublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
});

export default MoreScreen;
