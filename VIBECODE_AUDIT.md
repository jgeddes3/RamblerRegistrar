# Vibecode Audit — "30 reasons your site looks vibecoded"

Date: 2026-08-17
Source: TikTok reel by aj.on.ai ("30 reasons your site looks vibecoded — give this
to claude/chatgpt"), audited against the Rambler1 app UI (native + Expo web).
The reel targets marketing websites; several items only apply to a landing page,
which this project does not have yet. Those are marked N/A with a note so the
checklist can be re-run if/when a marketing site is built.

**Result: 23 pass or N/A · 7 hits — all 7 now fixed.** 5 fixed in the
2026-08-17 pass; the remaining two (Terms of Service + Privacy Policy, items
26/27) were closed 2026-08-18 with linked canonical documents plus a mandatory,
database-persisted consent flow (see HANDOFF "Recent work").

## The 30 items

| # | Item | Verdict | Notes |
|---|------|---------|-------|
| 1 | Harsh gradients | PASS | No gradients anywhere in the app. |
| 2 | Lucide icons | PASS | Icon system is Ionicons (`@expo/vector-icons`); no lucide. |
| 3 | Pure white background | **HIT → FIXED** | Every screen container was `#FFFFFF`. Now `BG = #FAF9F7` (theme.js); cards/inputs stay white so they read as raised surfaces. |
| 4 | Rainbow coloring | **HIT (partial) → FIXED** | `COURSE_COLORS` was 7 stock Tailwind-600 hues + maroon (blue-600, emerald-600, amber-600, violet-600, red-600, cyan-600, fuchsia-600) — the AI fingerprint, and a rainbow on the schedule grid. Replaced with a validated brand-anchored categorical palette (see below). |
| 5 | Drop shadows on everything | PASS | Shadows only in 3 files, opacity 0.05–0.25 (menu overlay, map controls, More cards). Restrained. |
| 6 | 3 feature cards in a row | PASS | No marketing feature grid; Home is stacked functional cards. |
| 7 | Emojis | **HIT → FIXED** | ⚡🕐📍👥🔔🔕🎉⛔ used as UI icons in Home, CourseDetailModal, ScheduleScreen, SearchScreen. All replaced with Ionicons (matching the newer screens' existing convention). |
| 8 | Liquid glass | PASS | Only standard `rgba(0,0,0,0.4)` modal scrims and iOS-convention frosted map controls. |
| 9 | Em dashes | **HIT → FIXED** | " — " ran through nearly all user-facing copy: fill warnings, graduation outlook, quiz labels (~40), scheduling prefs, Progress/Profile hints, generator notes. All reworded (periods/colons/commas); `·` for code–name separators. Tests updated in lockstep. Code comments untouched (not user-visible). |
| 10 | Inter / Geist / Space Grotesk | PASS | Brand font is Cormorant Garamond (serif); newer screens use the system font. |
| 11 | Colored left stripe | PASS (semantic) | Left stripes exist on the outlook card and Library cards but encode status (on-track color, open/closed) — data, not decoration. Kept deliberately. |
| 12 | Fake testimonials | N/A | No marketing pages; nothing fabricated. Keep it that way on a future landing page. |
| 13 | Bento grids | PASS | None. |
| 14 | Terminal window | PASS | None. |
| 15 | "It's not x, it's y" | PASS | No such copy anywhere. |
| 16 | Checkmark bullets | PASS (semantic) | ✓/○ in Progress are completion state on a tracker, not marketing bullets. Search's "Counts toward your degree" now uses an Ionicons checkmark for polish. |
| 17 | 3 pricing tiers | N/A | Free student app; no pricing. |
| 18 | No real product demos | N/A | The app is the product; no landing page yet. When one exists, show the real schedule grid, not mockups. |
| 19 | Soft corner radius | PASS | Radii run 2–22, mostly 4–12. No 24px+ pillowing. |
| 20 | Purple and black | PASS | Loyola maroon `#A30046` + white. (The two stray Tailwind purples in Progress were re-anchored to plum `#6B4E8E` in the re-palette.) |
| 21 | No skeleton loaders | **HIT → FIXED** | 15+ `ActivityIndicator` spinners, zero skeletons. New `components/Skeleton.js` (pulsing placeholder) now covers Home's Today's Schedule + Library Hours cards and Search results. Spinners remain for in-button/action feedback, which is correct UX. |
| 22 | Radial orbs | PASS | None. |
| 23 | Dot grids | PASS | None. |
| 24 | Sparkle icons | **HIT → FIXED** | ✨ was the schedule-generator header button — the canonical AI-feature tell. Now `color-wand-outline`; the ⤴ export glyph became `share-outline` and + became the `add` icon. |
| 25 | Animated arrows | PASS | None. (A static `→` inside gap-warning text is informational, kept.) |
| 26 | No TOS | **HIT → FIXED (2026-08-20)** | Full Terms of Service embedded in-app (`Rambler1/terms-content.js`, converted from the marketing site's canonical `/terms/` page) and readable from Login, More, and signup. Every account must accept them: required checkbox at signup + the blocking version-stamped re-consent gate in App.js, persisted as `termsVersion`/`termsAcceptedAt` on `users/{uid}`. |
| 27 | No privacy policy | **HIT → FIXED (pre-existing + corrected 2026-08-20)** | The app already shipped an embedded, consent-gated Privacy Policy (`privacy-policy-content.js`). This pass corrected its false "we never sell your data" claims to match the site's data-sharing/sale disclosure and bumped `POLICY_VERSION` so every account re-consents to the corrected text. |
| 28 | Hover animations for everything | PASS | None (RN press feedback only). |
| 29 | Neon colors | PASS | None. |
| 30 | Basic pastel colors | PASS (borderline) | The Tailwind-100 tints (`#fef3c7`/`#d1fae5`/`#fee2e2`) are pastel but used strictly as status-badge backgrounds. Acceptable; optionally re-tint toward brand later. |

## The new course palette

`schedule-utils.js` `COURSE_COLORS`, validated with a categorical-palette checker
(lightness band, chroma floor, CVD adjacent-pair separation, normal-vision floor,
≥3:1 contrast on the white grid) — all six checks pass:

```
#217A46 green · #2E5E9E steel blue · #B07A21 ochre · #A30046 maroon
#0A87A8 teal  · #B5542B rust       · #6B4E8E plum  · #6E7C1F olive
```

Greens never sit adjacent to warm hues (red-green CVD), and every schedule block
is direct-labeled with its course code, so identity never rides on color alone.
Related singletons were re-anchored: Progress ring/tab colors and the map's
HOME_BLUE now use the palette's blue/green/plum instead of Tailwind values.

## Files changed in this pass

- `theme.js` — new `BG` token (#FAF9F7)
- `components/Skeleton.js` — NEW pulsing placeholder component
- `schedule-utils.js` — validated COURSE_COLORS
- `App.js`, `Home.js`, `screens/{Search,Schedule,Progress,More,Library,Events,Map,Map.native}Screen.js`, `components/GenerateScheduleModal.js` — BG rollout
- `CourseDetailModal.js`, `screens/ScheduleScreen.js`, `screens/SearchScreen.js`, `Home.js` — emoji → Ionicons
- `planning-insights.js`, `graduation-outlook.js`, `schedule-generator.js`, `PreferenceQuiz.js`, `screens/SchedulingPrefs.js`, `screens/{Progress,Profile}Screen.js`, `Home.js`, `AccountSetup.js`, `CourseSelect.js` — em-dash copy sweep
- `__tests__/planning-insights.test.js`, `__tests__/graduation-outlook.test.js` — copy assertions updated

All 175 tests green (10 suites).

## Recommended follow-ups (not done this pass)

1. ~~**Privacy policy + Terms of Service**~~ — DONE 2026-08-20 (both documents
   embedded in-app with mandatory version-stamped consent stored in Firestore;
   policy text corrected to disclose the data sharing/sale). Remaining launch
   work: deploy the marketing site, counsel review of the drafts, redo the
   store Data-Safety/App-Privacy mappings (see PRIVACY_POLICY.md appendix
   note), and the data-sale opt-out toggle from the compliance handoff.
2. **Gray consolidation** — ~25 ad-hoc grays (#333/#555/#666/#888/#999/#ccc/#ddd…)
   across the app. Define a 5-step gray scale in theme.js and sweep. Not a video
   item, but the same genre of tell.
3. **Skeleton rollout** — extend the Skeleton pattern to ScheduleScreen initial
   load, Progress, and CourseDetailModal sections.
4. **Minor cleanup** — several styles have a duplicated `fontFamily` key from the
   P1 typography sweep (harmless, last-wins); remove on next touch.
