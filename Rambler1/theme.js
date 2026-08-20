// theme.js — the app's visual token system (UI polish pass 2026-07-09).
//
// Direction: "university bulletin" — the login page's collegiate identity
// (maroon + Cormorant Garamond + crest) carried into the working screens.
// Two type roles on purpose:
//   - SERIF (Cormorant, real Medium/SemiBold weights loaded in App.js):
//     greetings, section titles, course names — the voice of the page.
//   - system sans (omit fontFamily): times, badges, labels, meta — Cormorant
//     under ~14px is genuinely hard to read; data belongs in a utility face.
// Page background is warm parchment with white cards and warm hairlines; the
// crest's gold appears exactly once (the Home masthead rule).

export const FONT = 'CormorantGaramond-Regular';
export const FONT_MED = 'CormorantGaramond-Medium';
export const FONT_SEMI = 'CormorantGaramond-SemiBold';
export const FONT_ITALIC = 'CormorantGaramond-Italic';

export const MAROON = '#A30046';
export const MAROON_DEEP = '#71002F';
export const PARCHMENT = '#FBF9F4'; // page background
export const SURFACE = '#FFFFFF';   // cards
export const INK = '#26191E';       // primary text (warm near-black)
export const STONE = '#7A7069';     // secondary text
export const HAIRLINE = '#E9E2D8';  // warm borders
export const GOLD = '#A57C1B';      // crest gold — masthead rule ONLY
export const MAROON_WASH = '#FBF0F5'; // tinted chips/fills (existing)

// Status tones (already in use across badges/banners — single source now)
export const OK = { fg: '#065f46', bg: '#d1fae5' };
export const WARN = { fg: '#92400e', bg: '#fef3c7' };
export const DANGER = { fg: '#b91c1c', bg: '#fee2e2' };
export const NEUTRAL = { fg: '#6b7280', bg: '#f3f4f6' };

// Shared building blocks (spread into StyleSheet entries)
export const CARD = {
  backgroundColor: SURFACE,
  borderWidth: 1,
  borderColor: HAIRLINE,
  borderRadius: 10,
};

// Section label: tracked SERIF capitals — the university-catalog section head.
// (Sans caps here read as generic app template; the serif carries the brand.
// Cormorant runs small, so caps at 13 with wide tracking stays legible.)
// Rule of thumb app-wide: WORDS in Cormorant; only numbers/times/tabular data
// in the system sans.
export const EYEBROW = {
  fontFamily: FONT_MED,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: MAROON,
};
