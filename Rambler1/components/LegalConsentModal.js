// components/LegalConsentModal.js — blocking Terms + Privacy acceptance sheet.
//
// Shown by LegalConsentGate (App.js) to any signed-in, non-anonymous account
// whose stored acceptance doesn't match the current TERMS_VERSION /
// PRIVACY_VERSION (legal.js) — that covers accounts created before the gate
// existed AND every future material change to either document. New signups
// accept inline in AccountSetup instead; this modal is the catch-all.
//
// Deliberately NOT dismissable: accepting or signing out are the only exits.
// The summary below must stay accurate to the canonical documents on the
// marketing site — when those change materially, update this summary AND bump
// the version constants in legal.js in the same commit.
import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, MAROON, BG } from '../theme';
import { openTerms, openPrivacy } from '../legal';

const CheckRow = ({ checked, onToggle, children, accessibilityLabel }) => (
  <TouchableOpacity
    style={s.checkRow}
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={accessibilityLabel}
  >
    <Ionicons
      name={checked ? 'checkbox' : 'square-outline'}
      size={24}
      color={checked ? MAROON : '#888'}
      style={s.checkIcon}
    />
    <Text style={s.checkLabel}>{children}</Text>
  </TouchableOpacity>
);

const LegalConsentModal = ({ visible, onAccept, onDecline }) => {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const canAccept = agreedTerms && agreedPrivacy && !saving;

  const handleAccept = async () => {
    if (!canAccept) return;
    setSaving(true);
    try {
      await onAccept();
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = () => {
    const message =
      'Rambler Registrar requires accepting the Terms of Service and Privacy Policy. Declining signs you out.';
    // RN-web's Alert is a no-op, which would make Decline a dead button in the
    // browser — fall back to the platform confirm dialog there.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) onDecline();
      return;
    }
    Alert.alert('Decline and sign out?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: onDecline },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => {}}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <Text style={s.title}>Terms & Privacy</Text>
          <Text style={s.subtitle}>Please review and accept to keep using Rambler Registrar.</Text>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <View style={s.summaryCard}>
              <Text style={s.summaryHeader}>The short version</Text>
              <Text style={s.summaryItem}>
                Rambler Registrar is a free course-planning tool built by students. It is
                not an official Loyola system, and course data can be inaccurate. Always
                verify seats, times, and requirements in LOCUS before you register.
              </Text>
              <Text style={s.summaryItem}>
                We never ask for or store your LOCUS password. The app reads the same
                public course catalog any student can access.
              </Text>
              <Text style={s.summaryItem}>
                The app stores your account info, schedules, preferences, course
                selections, quiz results, degree progress, notification settings, and
                (only if you add one) a home address for commute times.
              </Text>
              <Text style={s.summaryItem}>
                We may share and, in some cases, sell certain personal information (your
                name, email address, and the personal data you enter in the app) to
                third parties. You can opt out of all selling and sharing by emailing
                johngeddes@pm.me — details are in the Privacy Policy.
              </Text>
              <Text style={s.summaryFootnote}>
                This summary is for convenience. The full documents control.
              </Text>
            </View>

            <CheckRow
              checked={agreedTerms}
              onToggle={() => setAgreedTerms((v) => !v)}
              accessibilityLabel="Agree to the Terms of Service"
            >
              I have read and agree to the{' '}
              <Text style={s.link} onPress={openTerms}>Terms of Service</Text>
            </CheckRow>
            <CheckRow
              checked={agreedPrivacy}
              onToggle={() => setAgreedPrivacy((v) => !v)}
              accessibilityLabel="Agree to the Privacy Policy"
            >
              I have read and agree to the{' '}
              <Text style={s.link} onPress={openPrivacy}>Privacy Policy</Text>, including
              the data sharing and sale it describes
            </CheckRow>
          </ScrollView>

          <TouchableOpacity
            style={[s.acceptBtn, !canAccept && s.acceptBtnDisabled]}
            onPress={handleAccept}
            disabled={!canAccept}
            accessibilityLabel="Accept and continue"
          >
            <Text style={s.acceptBtnText}>{saving ? 'Saving...' : 'Accept & continue'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDecline} accessibilityLabel="Decline and sign out">
            <Text style={s.declineText}>Decline & sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  title: {
    fontFamily: FONT,
    fontSize: 28,
    color: MAROON,
    fontWeight: 'bold',
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 15,
    color: '#555',
    marginTop: 2,
    marginBottom: 14,
  },
  body: {
    flexGrow: 0,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryHeader: {
    fontFamily: FONT,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryItem: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryFootnote: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#888',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 6,
  },
  checkIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  checkLabel: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  link: {
    color: MAROON,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  acceptBtn: {
    backgroundColor: MAROON,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  acceptBtnDisabled: {
    opacity: 0.4,
  },
  acceptBtnText: {
    fontFamily: FONT,
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  declineText: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 14,
    textDecorationLine: 'underline',
  },
});

export default LegalConsentModal;
