// styleComponents/CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton2 = ({ onPress, children, width, height }) => {
  const buttonStyles = [
    styles.button,
    { width: width || 128, height: height || 53  },
  ];

  return (
    <TouchableOpacity onPress={onPress} style={buttonStyles}>
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  buttonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: '#FFFFFF',
  },
});

export default CustomButton2;
