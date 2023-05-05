import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomLongButton1 = ({ onPress, children }) => {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    setPressed(!pressed);
    if (onPress) {
      onPress();
    }
  };

  const buttonStyles = [
    styles.button,
    pressed ? styles.pressedButton : {},
  ];

  const textStyles = [
    styles.buttonText,
    pressed ? styles.pressedText : {},
  ];

  return (
    <TouchableOpacity onPress={handlePress} style={buttonStyles}>
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
    height: 33,
  },
  pressedButton: {
    backgroundColor: '#A30046',
  },
  buttonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: '#000000',
  },
  pressedText: {
    color: '#FFFFFF',
  },
});

export default CustomLongButton1;
