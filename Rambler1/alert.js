// alert.js — cross-platform Alert (small fix from the qualm-sweep polish list).
// React Native's Alert.alert is a NO-OP on react-native-web, which silently
// broke confirm flows (e.g. removing a planned course) in the browser. Native
// keeps the real Alert; web maps to window.confirm / window.alert.

import { Alert, Platform } from 'react-native';

export default function showAlert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    return Alert.alert(title, message, buttons);
  }
  const text = [title, message].filter(Boolean).join('\n\n');
  if (!Array.isArray(buttons) || buttons.length <= 1) {
    // eslint-disable-next-line no-alert
    window.alert(text);
    const only = buttons && buttons[0];
    if (only && typeof only.onPress === 'function') only.onPress();
    return;
  }
  const confirmBtn = buttons.find((b) => b && b.style !== 'cancel') || buttons[buttons.length - 1];
  const cancelBtn = buttons.find((b) => b && b.style === 'cancel');
  // eslint-disable-next-line no-alert
  const ok = window.confirm(text);
  if (ok) {
    if (confirmBtn && typeof confirmBtn.onPress === 'function') confirmBtn.onPress();
  } else if (cancelBtn && typeof cancelBtn.onPress === 'function') {
    cancelBtn.onPress();
  }
}
