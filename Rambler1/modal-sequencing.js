// modal-sequencing.js — don't stack a native presentation on a dismissing one.
//
// On iOS a <Modal> is a presented view controller. If, in the same tick it
// starts dismissing, the app presents an Alert or another Modal, or unmounts
// the screen that owns it (sign-out, navigation pop), UIKit can drop the new
// presentation or leave the old one as an invisible overlay that swallows
// every touch. That is the "can't close the page" freeze WhatIfModal's
// asScreen mode was added for.
//
// Usage: close the modal, then put whatever comes next inside
// afterModalDismiss(...):
//
//   setDetailSection(null);
//   afterModalDismiss(() => confirmRemove(section));
//
// A fixed wait rather than Modal's onDismiss: onDismiss is iOS-only and has
// not fired reliably across React Native versions, and a follow-up that never
// runs is worse than one that runs a beat late.

import { Platform } from 'react-native';

// Covers the slide/fade-out of a dismissing iOS modal. Android dialogs and web
// have no such race, so nothing waits there.
export const MODAL_DISMISS_MS = Platform.OS === 'ios' ? 450 : 0;

export function afterModalDismiss(next) {
  if (MODAL_DISMISS_MS === 0) {
    next();
    return;
  }
  setTimeout(next, MODAL_DISMISS_MS);
}
