// styleComponents/CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ onPress, children, style, width, height }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style, {width, height}]}>
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#A30046',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 19,
    color: '#FFFFFF',
  },
});

export default CustomButton;
