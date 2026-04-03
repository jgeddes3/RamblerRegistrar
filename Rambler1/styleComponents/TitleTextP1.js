import React from 'react';
import { Text, StyleSheet } from 'react-native';

const TitleText1 = ({ children }) => {
  return <Text style={styles.text}>{children}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    textAlign: 'center',
    color: 'black',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default TitleText1;
