// ErrorState — a read failed: say what, say what to do, offer Try again.
//
// variant:
//   'block'  (default) stands in for content that didn't load at all.
//   'banner' sits above content that partly loaded.
//   'inline' one line inside a card or list row. It is not announced, since
//            a list that fails offline would otherwise announce every row.
// retryLabel: the button's spoken name when a screen can show more than one
// Try again at once ("Try again loading library hours").
import React, { useEffect } from 'react';
import { AccessibilityInfo, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONT, FONT_MED, MAROON, INK, STONE, WARN } from '../theme';

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

export default function ErrorState({ title, message, onRetry, retryLabel, variant = 'block', style }) {
  useEffect(() => {
    if (variant !== 'inline' && title) AccessibilityInfo.announceForAccessibility?.(title);
  }, [variant, title]);

  const retry = onRetry ? (
    <TouchableOpacity
      onPress={onRetry}
      style={variant === 'block' ? s.button : s.link}
      hitSlop={variant === 'block' ? undefined : HIT}
      accessibilityRole="button"
      accessibilityLabel={retryLabel || 'Try again'}
    >
      <Text style={variant === 'block' ? s.buttonText : s.linkText}>Try again</Text>
    </TouchableOpacity>
  ) : null;

  if (variant === 'inline') {
    return (
      <View style={[s.inline, style]}>
        <Text style={s.inlineText}>{title}</Text>
        {retry}
      </View>
    );
  }
  if (variant === 'banner') {
    return (
      <View style={[s.banner, style]} accessibilityLiveRegion="polite">
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>{title}</Text>
          {message ? <Text style={s.bannerMessage}>{message}</Text> : null}
        </View>
        {retry}
      </View>
    );
  }
  return (
    <View style={[s.block, style]} accessibilityLiveRegion="polite">
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.message}>{message}</Text> : null}
      {retry}
    </View>
  );
}

const s = StyleSheet.create({
  block: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  title: { fontFamily: FONT_MED, fontSize: 20, color: INK, textAlign: 'center' },
  message: { fontFamily: FONT, fontSize: 16, color: STONE, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  button: {
    marginTop: 16, minHeight: 44, minWidth: 140, paddingHorizontal: 20,
    borderRadius: 8, borderWidth: 1, borderColor: MAROON,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { fontFamily: FONT_MED, fontSize: 17, color: MAROON },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WARN.bg, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 16, marginTop: 10,
  },
  bannerTitle: { fontFamily: FONT_MED, fontSize: 16, color: WARN.fg },
  bannerMessage: { fontFamily: FONT, fontSize: 14, color: WARN.fg, marginTop: 2 },

  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  inlineText: { fontFamily: FONT, fontSize: 15, color: STONE, flex: 1 },

  // Text-style button for banner and inline; hitSlop brings it to 44 pt.
  link: { paddingVertical: 4, paddingLeft: 8 },
  linkText: { fontSize: 15, fontWeight: '600', color: MAROON },
});
