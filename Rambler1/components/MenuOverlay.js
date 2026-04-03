import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, StatusBar, Image } from 'react-native';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const MENU_ITEMS = [
  { label: 'Home', tab: 'Home' },
  { label: 'Schedule', tab: 'Schedule' },
  { label: 'Search', tab: 'Search' },
  { label: 'Progress', tab: 'Progress' },
  { label: 'More', tab: 'More' },
];

const EXTRA_ITEMS = [
  { label: 'Library Hours', screen: 'More' },
  { label: 'Campus Events', screen: 'More' },
  { label: 'Campus Map', screen: 'More' },
];

const MenuOverlay = ({ visible, onClose, onNavigate }) => {
  const handleItemPress = (tab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.panel}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={s.closeButton}>
            <Text style={s.closeText}>X</Text>
          </TouchableOpacity>

          {/* Brand */}
          <View style={s.brandSection}>
            <Text style={s.brandText}>Rambler</Text>
            <Text style={s.brandTextBold}>Registrar</Text>
          </View>

          <View style={s.divider} />

          {/* Main nav items */}
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.menuItem}
              onPress={() => handleItemPress(item.tab)}
            >
              <Text style={s.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <View style={s.divider} />

          {/* Extra items */}
          {EXTRA_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.menuItem}
              onPress={() => handleItemPress(item.screen)}
            >
              <Text style={s.menuItemTextSecondary}>{item.label}</Text>
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 26,
    color: '#333',
  },
  brandTextBold: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 26,
    color: '#A30046',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginVertical: 16,
  },
  menuItem: {
    paddingVertical: 14,
  },
  menuItemText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  menuItemTextSecondary: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#888',
  },
});

export default MenuOverlay;
