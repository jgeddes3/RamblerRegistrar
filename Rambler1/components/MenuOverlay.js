import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STONE, INK, MAROON, FONT, FONT_SEMI, EYEBROW, HAIRLINE } from '../theme';
import { CAMPUS_LINKS } from '../campus-links';
import { slopTo } from './ui/hitSlop';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

// The top-bar menu is the Campus menu: campus-life screens, which otherwise
// sit one level down in More. It used to repeat the five tabs, which are
// always on screen anyway. Same list as More (campus-links.js).
const MenuOverlay = ({ visible, onClose, onNavigate }) => {
  const open = (screen) => {
    onNavigate('More', { screen });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} accessible={false} importantForAccessibility="no" />
        <View style={s.panel} accessibilityViewIsModal>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={s.closeButton} hitSlop={slopTo(36)} accessibilityRole="button" accessibilityLabel="Close menu">
            <Text style={s.closeText}>X</Text>
          </TouchableOpacity>

          {/* Brand */}
          <View style={s.brandSection}>
            <Text style={s.brandText}>Rambler</Text>
            <Text style={s.brandTextBold}>Registrar</Text>
          </View>

          <View style={s.divider} />

          <Text accessibilityRole="header" style={s.heading}>Campus</Text>
          {CAMPUS_LINKS.map((link) => (
            <TouchableOpacity
              key={link.key}
              style={s.menuItem}
              accessibilityRole="button"
              accessibilityLabel={`${link.label}. ${link.sublabel}`}
              onPress={() => open(link.key)}
            >
              <Ionicons name={link.icon} size={20} color={MAROON} style={s.menuIcon} />
              <View style={{ flex: 1 }}>
                <Text style={s.menuItemText}>{link.label}</Text>
                <Text style={s.menuItemSub}>{link.sublabel}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUSBAR_HEIGHT + 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  brandSection: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 4,
  },
  brandText: {
    fontFamily: FONT,
    fontSize: 26,
    color: INK,
  },
  brandTextBold: {
    fontFamily: FONT_SEMI,
    fontSize: 26,
    color: MAROON,
    marginLeft: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    marginVertical: 16,
  },
  heading: { ...EYEBROW, marginBottom: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  menuIcon: { marginRight: 14 },
  menuItemText: {
    fontFamily: FONT_SEMI,
    fontSize: 19,
    color: INK,
  },
  menuItemSub: {
    fontSize: 13,
    color: STONE,
    marginTop: 1,
  },
});

export default MenuOverlay;
