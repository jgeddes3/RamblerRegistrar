// components/PhoenixPreviewModal.js — in-app preview for a Loyola Phoenix
// story: headline, section/author line, the article's first paragraph, and a
// button that opens the full article in the browser. Shared by the Phoenix
// headlines screen and Home's "From the Phoenix" card. Standard toggled
// Modal (safe: never mounted permanently-visible inside a navigated screen).

import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAROON = '#A30046';

function dateLine(item) {
  if (!item?.publishedAt) return null;
  const d = new Date(item.publishedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

const PhoenixPreviewModal = ({ item, visible, onClose }) => {
  if (!item) return null;
  const metaParts = [];
  if (item.categories && item.categories.length > 0) metaParts.push(item.categories[0]);
  if (item.creator) metaParts.push(item.creator);
  const when = dateLine(item);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.panel}>
          <View style={s.headerRow}>
            <Text style={s.masthead}>The Loyola Phoenix</Text>
            <TouchableOpacity
              onPress={onClose}
              style={s.closeBtn}
              accessibilityLabel="Close story preview"
            >
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.title}>{item.title}</Text>
            {metaParts.length > 0 || when ? (
              <Text style={s.meta}>
                {[metaParts.join(' · '), when].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <Text style={s.paragraph}>
              {item.firstParagraph || 'Preview unavailable for this story.'}
            </Text>

            <TouchableOpacity
              style={s.readBtn}
              onPress={() => Linking.openURL(item.link).catch(() => {})}
              accessibilityLabel={`Read ${item.title} on the Loyola Phoenix site`}
            >
              <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              <Text style={s.readBtnText}>Read the full article</Text>
            </TouchableOpacity>
          </ScrollView>
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
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '75%',
    paddingTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  masthead: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: MAROON,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: { padding: 4 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 30 },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    lineHeight: 29,
    color: '#1a1a1a',
  },
  meta: { fontSize: 12, color: '#888', marginTop: 6 },
  paragraph: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 17,
    lineHeight: 25,
    color: '#333',
    marginTop: 12,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MAROON,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 18,
  },
  readBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default PhoenixPreviewModal;
