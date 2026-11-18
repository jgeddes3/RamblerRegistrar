// Toast — one short, self-dismissing message with an optional action
// ("Added to your schedule. Undo"). It replaces success alerts, which
// stopped everything until tapped away (and became window.alert on web).
//
// <ToastProvider> once near the app root holds the current toast.
// <ToastHost> draws it. A React Native Modal is its own native window and
// covers everything under it, so a modal that shows toasts puts a ToastHost
// inside itself too. Every host shows the same toast.
// useToast().show({ message, actionLabel?, onAction?, duration? })
// Without a provider (tests, a stray tree), show() falls back to an alert so
// the message is never lost.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import showAlert from '../../alert';
import { INK } from '../../theme';
import { slopTo } from './hitSlop';

export const TOAST_MS = 5000;
const WITH_ACTION_MS = TOAST_MS + 2000; // a little longer to reach Undo

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(({ message, actionLabel, onAction, duration } = {}) => {
    if (!message) return;
    clearTimeout(timer.current);
    const next = { id: `${Date.now()}-${Math.random()}`, message, actionLabel, onAction };
    setToast(next);
    AccessibilityInfo.announceForAccessibility?.(actionLabel ? `${message} ${actionLabel} is available.` : message);
    timer.current = setTimeout(
      () => setToast((cur) => (cur && cur.id === next.id ? null : cur)),
      duration || (actionLabel ? WITH_ACTION_MS : TOAST_MS),
    );
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => ({ toast, show, hide }), [toast, show, hide]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

const FALLBACK = { toast: null, show: ({ message } = {}) => { if (message) showAlert(message); }, hide: () => {} };

export function useToast() {
  return useContext(ToastContext) || FALLBACK;
}

// bottom: distance from the bottom of whatever contains it (the root view
// sits above the tab bar; inside a modal, near the panel's bottom edge).
export function ToastHost({ bottom = 104 }) {
  const ctx = useContext(ToastContext);
  const toast = ctx && ctx.toast;
  if (!toast) return null;
  const act = () => {
    ctx.hide();
    if (toast.onAction) toast.onAction();
  };
  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom }]}>
      <View style={s.toast} accessibilityLiveRegion="polite">
        <Text style={s.message}>{toast.message}</Text>
        {toast.actionLabel ? (
          <TouchableOpacity onPress={act} hitSlop={slopTo(56, 28)} accessibilityRole="button" accessibilityLabel={toast.actionLabel}>
            <Text style={s.action}>{toast.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    maxWidth: 520,
    alignSelf: 'stretch',
    backgroundColor: INK,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  message: { flex: 1, color: '#FFFFFF', fontSize: 15, lineHeight: 20 },
  // Light pink on ink: 11:1.
  action: { color: '#FFD6E7', fontSize: 15, fontWeight: '700' },
});
