# RamblerRegistrar — Progress & To-Do

**Repo:** `RamblerRegistrar` (app + backend; the marketing site lives in the
separate `RamblerRegistrarWeb` repo — its open items are listed at the bottom
because several of ours hand off to it).
**Covers:** Claude Code sessions 2026-08-17 → 2026-08-24.
**State when written:** `main` = `ea1791d7`, everything below is committed,
pushed, and the Firestore rules are deployed to `ramblerregistrar-9b066`.
All 290 tests green (19 suites) as of the opt-out commit.

---

## DONE

### 1. Vibecode audit + design de-slop (2026-08-17)

Audited the app UI against the "30 reasons your site looks vibecoded" TikTok
rubric. Full scorecard with file evidence: **`VIBECODE_AUDIT.md`**.
Result: 23 pass/N-A, 7 hits, all 7 now closed.

- Emoji UI glyphs (⚡🕐📍🔔✨🎉…) → Ionicons everywhere, incl. the ✨
  generate-schedule button (→ wand). *(Later superseded — the TestFlight
  branch had independently removed them; its versions won the merge.)*
- Em dashes stripped from ALL user-facing copy (fill warnings, outlook,
  quiz labels, generator notes…), tests updated in lockstep.
- Pure-white screens → off-white background. *(Superseded by main's own
  `PARCHMENT` token system in the merge.)*
- **`components/Skeleton.js`** — pulsing skeleton loaders on Home's two cards
  and Search results (replacing spinners for content loads).
- **`COURSE_COLORS` re-palette** — the 7 stock Tailwind-600 hues replaced
  with a brand-anchored 8-color categorical palette, validated for CVD-safe
  adjacent pairs / chroma / 3:1 contrast (`schedule-utils.js`).

### 2. Legal consent v1 (2026-08-18) — superseded

Built link-based Terms+Privacy consent (`legal.js`, `LegalConsentModal`)
against the old code base. Deleted during the merge in favor of main's
shipped embedded-text consent architecture; its *requirements* (both docs,
versioned, stored) all survived into item 3.

### 3. The big merge (2026-08-20) — `main` ← TestFlight drop + our branch

Discovered `origin/main` had jumped ~7,500 lines (the other machine's
TestFlight build: Planning, Fills Fast, Book a Ride, feedback, trend charts,
EAS config, its own privacy-only consent gate). Merged it into
`vibecode-legal-consent`, resolved all 20 conflicts (their versions won;
our still-relevant work re-applied on top), fast-forwarded `main`, pushed.

- **Consent unified — every account must now accept BOTH documents:**
  - New **`Rambler1/terms-content.js`** — full Terms of Service converted
    from the site's canonical `/terms/` page, `TERMS_VERSION = 2026-08-20`.
  - `PrivacyPolicyModal` generalized to render either document.
  - `LegalConsentGate` (App.js): blocking, Terms first then Privacy; each
    stamped separately (`termsVersion`/`termsAcceptedAt` beside the live
    `privacyPolicyVersion`/`privacyPolicyAcceptedAt`). Missing stamp = gated.
  - Signup (AccountSetup) requires both checkboxes; Login + More screen link
    both documents as in-app readers.
- **Compliance contradiction fixed** (per
  `RamblerRegistrarWeb/docs/legal/app-compliance-todo.md` §1–2):
  the in-app policy's "we never sell your data" claims replaced with the
  site's data-sharing/sale disclosure + email opt-out; new "Data sharing and
  sale" section; `POLICY_VERSION` bumped → **every existing account
  (incl. TestFlight users) re-consents to the corrected text on next
  launch**. `PRIVACY_POLICY.md` matches; its store-mapping appendix is
  flagged **DO-NOT-FILE** pending counsel.
- Em-dash sweep extended over main's new copy; skeletons re-ported onto the
  rewritten Home/Search; `firestore.rules` validator updated + deployed.
- New test suite `__tests__/legal-consent.test.js` guards version stamps,
  the sale disclosure, and that the "never sell" claim can't come back.

### 4. Data-sale opt-out toggle (2026-08-20) — compliance handoff §3

- **`users/{uid}.dataSaleOptOut`** boolean + server-stamped
  `dataSaleOptOutUpdatedAt` (rules deployed; both ON and OFF recorded).
- **"Do not sell or share my personal information"** Switch in a new Privacy
  block on ProfileScreen (Settings).
- **`backend/export-sale-data.js`** — the ONLY sanctioned export path.
  Excludes: opted-out users; users who only accepted the pre-sale
  "we never sell" policy (< 2026-08-20 — they never consented to any sale);
  users without Terms acceptance; anonymous accounts. Never exports home
  addresses (scope undecided), push tokens, or feedback. Dry-run by default;
  `--write=out.json` to export.
- Policy/Terms/`PRIVACY_POLICY.md` opt-out language flipped to present tense
  (no version bump — additive user right, not a material change).

### 5. Ops

- Firestore rules deployed twice (consent fields, then opt-out fields) —
  production accepts every field the app writes today.
- All work committed with reviewable history and pushed; `main`,
  `origin/main`, and `vibecode-legal-consent` were left in sync at
  `2efa222c` (main has since moved on with feature work: `ea1791d7`).

---

## STILL TO DO — this repo (`RamblerRegistrar`)

1. **Device/browser visual pass** on everything above — skeletons, parchment
   consistency on MapScreens, the dual consent flow (fresh signup AND an
   existing account hitting Terms-then-Privacy re-consent), the Privacy
   switch. Test account: `ui-check@rambler-test.dev` / `UiCheck!2026`.
2. **Email opt-out procedure**: when someone opts out by email, set
   `dataSaleOptOut: true` on their `users/{uid}` doc (Firebase console) so
   `export-sale-data.js` counts and excludes them.
3. **Home-address sale scope** (compliance handoff §4): decide whether the
   optional home address is inside or outside the sale. Whatever the answer,
   write it into the Privacy Policy AND keep/change the exclusion in
   `backend/export-sale-data.js` to match. Currently excluded (conservative).
4. **Store submission mappings**: redo the Google Play Data Safety and Apple
   App Privacy declarations **with counsel** — the drafts in
   `PRIVACY_POLICY.md`'s appendix are flagged DO-NOT-FILE (sale must be
   declared under "Data shared"; Apple's tracking definition likely applies).
5. **Counsel review** of both legal documents before launch (they ship
   in-app with effective dates but the site still banners them as drafts).
6. **Loyola affiliation stance** (compliance handoff §4): the in-app policy
   asserts "not affiliated…" while the site is under instruction to make no
   claim in either direction. Pick one stance, align both artifacts.
7. **Audit follow-ups** (nice-to-have, from `VIBECODE_AUDIT.md`):
   consolidate the ~25 ad-hoc grays into theme tokens; extend Skeleton to
   ScheduleScreen initial load / Progress / CourseDetailModal; several
   duplicated `fontFamily` keys to clean on next touch.
8. **In-app account deletion** — the policy says "planned"; email is the
   only route today.

## STILL TO DO — the site repo (`RamblerRegistrarWeb`)

1. **Deploy the site.** No hosting exists (no Pages, no domain). Easiest:
   `firebase deploy --only hosting` of its `dist/` on this same project
   (`ramblerregistrar-9b066.web.app`).
2. **Flip the site's opt-out copy to present tense** on `/privacy/`,
   `/terms/`, `/trust/` — per the handoff, only once the build containing
   the switch actually reaches users (next TestFlight build).
3. **Reconcile the stale legal drafts** (`docs/legal/*.draft.md`,
   `REVIEW.md`) with the corrected pages + the app's now-matching policy,
   and add the app policy to REVIEW.md's scope, before counsel review.
4. **Waitlist emails**: no app account behind them → the switch can't reach
   them; the email remedy is their only route. Honor it manually.
5. Tick off the completed items in `docs/legal/app-compliance-todo.md`
   (§1, §2, and §3 are now done in the app repo; §4's two decisions remain).
