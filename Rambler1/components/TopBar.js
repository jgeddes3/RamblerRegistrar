import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { useAppContext } from '../AppContext';

const TopBar = ({ onMenuPress, onProfilePress }) => {
  const { user } = useAppContext();

  // Get user initial for avatar
  const initial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A30046" />

      <View style={styles.content}>
        {/* Menu button (left) */}
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>

        {/* Logo (center) */}
        <Image
          source={require('../assets/Icons/Logo2-02.png')}
          style={styles.logo}
        />

        {/* Profile button (right) */}
        <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#A30046',
    paddingTop: STATUSBAR_HEIGHT,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  logo: {
    width: 50,
    height: 42,
    resizeMode: 'contain',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: '#A30046',
    fontWeight: 'bold',
  },
});

export default TopBar;
