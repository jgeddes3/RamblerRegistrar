import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedbackModal from '../components/FeedbackModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import { TERMS_TITLE, TERMS_SECTIONS } from '../terms-content';
import ProfileScreen from './ProfileScreen';

const MAROON = '#A30046';

const MENU_ROWS = [
  {
    key: 'Planning',
    label: 'Planning',
    sublabel: 'Map courses to future semesters',
    icon: 'trail-sign-outline',
  },
  {
    key: 'MajorsMinors',
    label: 'Majors & Minors',
    sublabel: 'Change or add a major or minor, with the time cost',
    icon: 'compass-outline',
  },
  {
    key: 'FastestFilling',
    label: 'Fills Fast',
    sublabel: 'Courses that filled quickest last cycle',
    icon: 'flash-outline',
  },
  {
    key: 'BookARide',
    label: 'Book a Ride',
    sublabel: '8-RIDE evenings & the intercampus shuttle',
    icon: 'bus-outline',
  },
  {
    key: 'Map',
    label: 'Campus Map',
    sublabel: 'Buildings across LSC & WTC',
    icon: 'map-outline',
  },
  {
    key: 'Library',
    label: 'Library Hours',
    sublabel: 'Hours and study-room booking',
    icon: 'library-outline',
  },
  {
    key: 'Events',
    label: 'Campus Events',
    sublabel: 'What’s happening at Loyola',
    icon: 'calendar-outline',
  },
  {
    key: 'Phoenix',
    label: 'Loyola Phoenix',
    sublabel: 'Headlines from the student newspaper',
    icon: 'newspaper-outline',
  },
  {
    key: 'PreferenceQuiz',
    label: 'Retake the Quiz',
    sublabel: 'Redo your interests & scheduling preferences',
    icon: 'refresh-outline',
  },
];

const MoreScreen = ({ navigation }) => {
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  return (
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
      <TouchableOpacity
        style={[styles.row, styles.rowBorder]}
        onPress={() => setFeedbackVisible(true)}
        activeOpacity={0.6}
        accessibilityLabel="Send feedback"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="chatbox-ellipses-outline" size={22} color={MAROON} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Send Feedback</Text>
          <Text style={styles.rowSublabel}>Bugs, wrong data, ideas — straight to us</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, styles.rowBorder]}
        onPress={() => setProfileVisible(true)}
        activeOpacity={0.6}
        accessibilityLabel="Open settings and profile"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="settings-outline" size={22} color={MAROON} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Settings</Text>
          <Text style={styles.rowSublabel}>Your profile, programs, and preferences</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.row, styles.rowBorder]}
        onPress={() => setTermsVisible(true)}
        activeOpacity={0.6}
        accessibilityLabel="Read the Terms of Service"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={22} color={MAROON} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Terms of Service</Text>
          <Text style={styles.rowSublabel}>The agreement covering your use</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setPolicyVisible(true)}
        activeOpacity={0.6}
        accessibilityLabel="Read the Privacy Policy"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={22} color={MAROON} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Privacy Policy</Text>
          <Text style={styles.rowSublabel}>What we collect, why, and your choices</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
      </TouchableOpacity>
    </View>

    <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} context="More screen" />
    <ProfileScreen visible={profileVisible} onClose={() => setProfileVisible(false)} />
    <PrivacyPolicyModal visible={policyVisible} mode="view" onClose={() => setPolicyVisible(false)} />
    <PrivacyPolicyModal
      visible={termsVisible}
      mode="view"
      title={TERMS_TITLE}
      sections={TERMS_SECTIONS}
      onClose={() => setTermsVisible(false)}
    />
  </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F4',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontFamily: 'CormorantGaramond-Regular', fontSize: 32,
    color: MAROON,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 14,
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
    fontFamily: 'CormorantGaramond-Regular', fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  rowLabelDisabled: {
    color: '#999',
  },
  rowSublabel: {
    fontFamily: 'CormorantGaramond-Regular', fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
});

export default MoreScreen;
