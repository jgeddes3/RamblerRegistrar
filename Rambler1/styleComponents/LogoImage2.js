import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LogoImage2 = ({ source }) => {
  return <Image source={source} style={styles.image} />;
};

const styles = StyleSheet.create({
  image: {
    width: 99,
    height: 84,
    alignSelf: 'center',
    marginTop: 13,
  },
});

export default LogoImage2;
