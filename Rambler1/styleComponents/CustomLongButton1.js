import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomLongButton1 = ({ onPress, onLongPress, children, selected }) => {
  const buttonStyles = [
    styles.button,
    selected ? styles.pressedButton : {},
  ];

  const textStyles = [
    styles.buttonText,
    selected ? styles.pressedText : {},
  ];

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} delayLongPress={400} style={buttonStyles}>
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    width: 352,
    minHeight: 33,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pressedButton: {
    backgroundColor: '#A30046',
  },
  buttonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
  },
  pressedText: {
    color: '#FFFFFF',
  },
});

export default CustomLongButton1;
