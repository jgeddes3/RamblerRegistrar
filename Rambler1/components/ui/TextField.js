// TextField — a text input with a visible label, an optional hint, and an
// error that screen readers hear. A placeholder is not a label: it vanishes
// as soon as someone types.
// Pass the autofill props through (autoComplete, textContentType) so the OS
// can offer saved emails and passwords.
import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FONT, INK, STONE, DANGER } from '../../theme';

const TextField = forwardRef(({ label, hint, error, style, inputStyle, ...input }, ref) => (
  <View style={[s.wrap, style]}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      ref={ref}
      {...input}
      accessibilityLabel={label}
      accessibilityHint={error || hint}
      placeholderTextColor={STONE}
      style={[s.input, error && s.inputError, inputStyle]}
    />
    {error ? (
      <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>
    ) : hint ? (
      <Text style={s.hint}>{hint}</Text>
    ) : null}
  </View>
));

const s = StyleSheet.create({
  wrap: { width: 275 },
  label: { fontFamily: FONT, fontSize: 17, color: INK, marginBottom: 4 },
  input: {
    fontSize: 17,
    color: INK,
    backgroundColor: '#F2EFEA',
    borderWidth: 1,
    borderColor: STONE,
    borderRadius: 6,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  inputError: { borderColor: DANGER.fg, borderWidth: 2 },
  hint: { fontSize: 13, color: STONE, marginTop: 4 },
  error: { fontSize: 14, color: DANGER.fg, marginTop: 4 },
});

export default TextField;
