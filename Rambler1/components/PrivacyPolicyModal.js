// components/PrivacyPolicyModal.js — full-screen legal document reader.
// Renders the Privacy Policy by default; pass `title`/`sections`/`agreeLabel`
// (e.g. from terms-content.js) to show the Terms of Service with the same
// reader and consent chrome.
// Two modes:
//   'view'    — just reading; Close affordance in the header (onClose).
//   'consent' — blocking agreement gate; no close, sticky bottom bar with
//               "I agree" (onAccept) and "Not now" (onDecline). The Android
//               back button is a no-op here on purpose — declining must be
//               the explicit "Not now" tap, never an accidental dismiss.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POLICY_TITLE, POLICY_SECTIONS } from '../privacy-policy-content';
import { FONT, FONT_MED, FONT_SEMI, MAROON, PARCHMENT, INK, STONE, HAIRLINE, SURFACE } from '../theme';

const PrivacyPolicyModal = ({
  visible,
  mode = 'view',
  onClose,
  onAccept,
  onDecline,
  title = POLICY_TITLE,
  sections = POLICY_SECTIONS,
  agreeLabel = 'I agree to the Privacy Policy',
}) => {
  const consent = mode === 'consent';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={consent ? () => {} : onClose}
    >
      <View style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{title}</Text>
          {!consent ? (
            <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel={`Close ${title}`}>
              <Ionicons name="close" size={26} color={MAROON} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {sections.map((section, i) => (
            <View key={i} style={s.section}>
              {section.title ? <Text style={s.sectionTitle}>{section.title}</Text> : null}
              {section.paragraphs.map((p, j) => (
                <Text key={j} style={s.paragraph}>{p}</Text>
              ))}
            </View>
          ))}
        </ScrollView>

        {consent ? (
          <View style={s.consentBar}>
            <TouchableOpacity
              style={s.agreeBtn}
              onPress={onAccept}
              accessibilityLabel={agreeLabel}
            >
              <Text style={s.agreeBtnText}>{agreeLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.declineBtn}
              onPress={onDecline}
              accessibilityLabel="Not now"
            >
              <Text style={s.declineText}>Not now</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PARCHMENT,
    paddingTop: Platform.OS === 'ios' ? 54 : 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  headerTitle: {
    fontFamily: FONT_SEMI,
    fontSize: 28,
    color: MAROON,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: FONT_MED,
    fontSize: 21,
    color: MAROON,
    marginBottom: 6,
  },
  paragraph: {
    fontFamily: FONT,
    fontSize: 16,
    lineHeight: 23,
    color: INK,
    marginBottom: 10,
  },
  consentBar: {
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
  },
  agreeBtn: {
    backgroundColor: MAROON,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  agreeBtnText: {
    fontFamily: FONT_MED,
    fontSize: 18,
    color: '#FFFFFF',
  },
  declineBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  declineText: {
    fontFamily: FONT,
    fontSize: 16,
    color: STONE,
  },
});

export default PrivacyPolicyModal;
