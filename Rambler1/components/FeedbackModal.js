// components/FeedbackModal.js — in-app feedback (#17). Type chips + message
// box -> write-only `feedback` collection. Opened from the More hub and from
// "Report a problem" on course details (which passes context, e.g. the course
// code, so bad-data reports arrive pre-tagged).

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { submitFeedback } from '../firestore-data';
import showAlert from '../alert';
import { FONT, MAROON } from '../theme';

// Bottom sheet must ride above the keyboard: iOS pads, Android shrinks.
// (react-native-web ignores `behavior`, so web is unaffected.)
const KAV_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height';

const TYPES = [
  { key: 'bug', label: 'Bug' },
  { key: 'data', label: 'Wrong data' },
  { key: 'idea', label: 'Idea' },
];

const FeedbackModal = ({ visible, onClose, context = '' }) => {
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => {
    setType('bug');
    setMessage('');
    setSending(false);
    onClose();
  };

  const send = async () => {
    if (sending || message.trim().length < 3) return;
    setSending(true);
    const res = await submitFeedback({ type, message, context });
    setSending(false);
    if (res) {
      close();
      showAlert('Thanks!', 'Your feedback is in. It genuinely helps.');
    } else {
      showAlert('Send failed', 'Could not send feedback. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={s.overlay} behavior={KAV_BEHAVIOR}>
        <View style={s.panel}>
          <View style={s.header}>
            <Text style={s.title}>Send Feedback</Text>
            <TouchableOpacity onPress={close} style={s.closeBtn} accessibilityLabel="Close feedback">
              <Text style={s.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {context ? <Text style={s.contextText}>About: {context}</Text> : null}

          <View style={s.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeChip, type === t.key && s.typeChipOn]}
                onPress={() => setType(t.key)}
                accessibilityLabel={`Feedback type ${t.label}`}
              >
                <Text style={[s.typeChipText, type === t.key && s.typeChipTextOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={s.messageInput}
            placeholder="What happened? What should be different?"
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            maxLength={2000}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.sendBtn, (message.trim().length < 3 || sending) && { opacity: 0.4 }]}
            onPress={send}
            disabled={message.trim().length < 3 || sending}
            accessibilityLabel="Send feedback"
          >
            {sending ? <ActivityIndicator color="#FFF" /> : <Text style={s.sendBtnText}>Send</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: '#FFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONT, fontSize: 22, color: '#1a1a1a' },
  closeBtn: { padding: 6 },
  closeText: { fontFamily: FONT, fontSize: 16, color: MAROON, fontWeight: '600' },
  contextText: { fontFamily: FONT, fontSize: 14, color: '#888', marginTop: 2 },

  typeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  typeChip: {
    borderWidth: 1, borderColor: '#CCC', borderRadius: 14,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  typeChipOn: { backgroundColor: MAROON, borderColor: MAROON },
  typeChipText: { fontFamily: FONT, fontSize: 15, fontWeight: '600', color: '#444' },
  typeChipTextOn: { color: '#FFF' },

  messageInput: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, marginTop: 12,
    fontFamily: FONT, fontSize: 16, color: '#1a1a1a', minHeight: 110,
  },
  sendBtn: {
    backgroundColor: MAROON, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', marginTop: 12, marginBottom: 8,
  },
  sendBtnText: { fontFamily: FONT, fontSize: 17, fontWeight: '700', color: '#FFF' },
});

export default FeedbackModal;
