import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LogoImage1 = ({ source }) => {
  return <Image source={source} style={styles.image} />;
};

const styles = StyleSheet.create({
  image: {
    width: 195,
    height: 164,
    alignSelf: 'center',
    marginTop: -60,
  },
});

export default LogoImage1;
