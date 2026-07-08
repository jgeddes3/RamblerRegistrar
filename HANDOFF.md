# RamblerRegistrar — Session Handoff

Last updated: 2026-07-06 (evening)

> 📋 **See `archive/PROJECT_PLAN.md`** (gitignored) for the full security audit,
> bug list, feature roadmap, and phased plan. Read it before major work.

## ⭐ USER TODO (next time at the machine)

1. **Commit + push** — the working tree holds Phases 1→4-start (schedule builder, map,
   library/events, graduation outlook, fill warnings, priority flags, seat-alert
   poller + push infra, Firestore cost hardening, schedule generator). Huge verified
   set, zero committed. (Blaze is ACTIVE as of 2026-07-06 — the quota wall is gone
   and Phase 3.5 keeps the bill ~$0.)
2. **Device pass (Expo Go)** — full checklist in task #7 / below. Test account:
   `ui-check@rambler-test.dev` / `UiCheck!2026` (staged: Sophomore, CS 2027, schedule
   with a conflict + fast-fill courses). Highlights: campus map (device-only!),
   schedule builder + .ics share, FINC 345 red fill warning → flip athlete toggle in
   Profile → warning softens, Graduation Outlook on Home/Progress, **watch bells on
   Closed/Wait-List sections** (browser-verified; push itself needs the dev build),
   **✨ schedule generator on the Schedule tab** (pick courses + prefs → ranked
   options → preview → apply; try "keep my current classes" both ways).
   **NEW from the qualm-bug pass:** (a) pick a Focus in Profile → force-quit →
   reopen → still selected; (b) **sign up fresh → kill the app → reopen → should
   stay signed in (B11 verify)**; (c) add a Philosophy (or any) minor in Profile →
   Progress tab → tap the minor → course list with "Choose N of the following:"
   groups renders.
3. **Phase 3 push setup:** run `npx eas init` in Rambler1 (Expo account login)
   to mint the EAS projectId push notifications need, then an Expo **dev build** —
   remote push does NOT work in Expo Go. Grab the Google Maps Android key in the same
   sitting (needed for the dev build's map). Until then the poller runs fine but
   users have no tokens, so pushes are skipped (logged, not lost — retry semantics).
   The graduation-outlook push nudge is queued behind this.
4. **While testing: comb the app and note your qualms** — each one becomes a backlog
   item (task #18). Phase 5 (launch) is now written into PROJECT_PLAN: store submission
   and outreach are ON HOLD by your call (org accounts exist for both stores); the open
   Phase 5 items are the legal review (privacy policy + RMP terms) and an in-app
   feedback loop (tasks #16/#17).
5. **Each term:** after a registration cycle is captured, re-run
   `node backend/fill-stats.js <termCode> --upload` to refresh fill warnings.

This file is the running handoff between Claude Code sessions. Read it before
making changes. Update the "Current State" and "Recent Work" sections when you
finish anything material.

## What this project is

RamblerRegistrar is a class-search and recommendation app for Loyola University
Chicago students. The backend scrapes LOCUS (Loyola's PeopleSoft instance) for
section data + enrollment numbers, stores them in a local SQLite DB, and serves
them over an Express API. A React Native frontend (in `Rambler1/`) consumes the
API and adds a RIASEC personality quiz to recommend majors/focus areas.

## Architecture at a glance

- **`backend/scraper-puppeteer.js`** — Puppeteer headless browser scrapes LOCUS.
  Iterates `win0divSSR_CLSRSLT_WRK_GROUPBOX3$N` divs and finds `MTG_INSTR$N`
  spans inside each. Restarts the browser every 15 departments (5 with
  enrollment) to dodge stale PeopleSoft sessions.
- **`backend/db.js`** — sql.js wrapper. Tables: `sections`, `enrollment_history`,
  `programs`, `courses`, `program_courses`, `prerequisites`, `core_areas`,
  `buildings`, `riasec_recommendations`, `major_focus_areas`. DB file at
  `backend/locus.db` (gitignored). (`scraper.js`, the cheerio fallback, and all
  `user_*` tables were deleted in Phase 1.)
- **`backend/server.js`** — slim Express server: health + campus API proxies +
  two crons (10 AM daily scrape; watch poll every 20 min, 9:00–21:40 Chicago).
- **`backend/watch-poller.js`** — Phase 3 seat-alert poller: collectionGroup
  over `users/*/watches` → resolve section docs → dedupe subjects (cap 12,
  rotating cursor) → one fast Puppeteer pass → Closed/Wait-List→Open diffs vs
  admin-only `watchPoller/{term_class}` state docs → batched Expo pushes with
  accept-verified retry semantics. CLI: `node watch-poller.js [--term=1266]`.
- **`Rambler1/`** — React Native (Expo) app; reads Firestore directly (catalog +
  user data), backend only for campus proxies. `push.js` registers Expo push
  tokens (needs EAS projectId + dev build).

## How to operate

Working dir: `C:\Users\LeoArkos\RamblerRegistrar`

```powershell
# Check server
pm2 list
pm2 logs rambler-backend --lines 30 --nostream

# Restart (after code changes)
pm2 restart rambler-backend

# Resurrect after Windows restart (PM2 daemon dies)
pm2 resurrect

# Manual scrape (no enrollment, ~25 min)
cd backend; node scraper-puppeteer.js 1266

# Manual scrape with enrollment data (~4 hr)
cd backend; node scraper-puppeteer.js 1266 --enrollment

# Single department test (~2 min)
cd backend; node scraper-puppeteer.js 1266 COMP

# Manual Firestore sync (delta — cheap; zero reads, writes only changed docs)
cd backend; node firestore-sync.js 1266

# Firestore reconcile (READ-heavy escape hatch — only if Firestore drifted,
# e.g. docs edited by hand; re-reads every section doc id for the term)
cd backend; node firestore-sync.js 1266 --reconcile
```

## Current state (as of 2026-07-06)

- **Crons:** daily enrollment scrape at 10 AM Chicago (`0 10 * * *`, retries
  3× / 5-min); watch poll every 20 min 9:00–21:40 Chicago (`*/20 9-21 * * *`).
  The two share locks so a poll and a scrape never overlap Puppeteer sessions.
- **PM2:** `rambler-backend` fork process, self-healed by the
  `RamblerBackend-HealthMonitor` Scheduled Task (logon + every 5 min, hidden).
- **DB sections:** 2,459 live sections for Fall 2026 (`1266`) after the
  2026-07-06 ghost purge (73 cancelled/renumbered rows deleted; per-subject
  stale pruning now runs inside every scrape).
- **Firestore:** catalog + user data live there (clients read it directly);
  scraper dual-writes each run. Section docs removed from LOCUS are marked
  `status:'removed'`, never deleted (client filters them; watch poller skips them).
- **Enrollment history:** snapshots stored as `YYYY-MM-DDTHH` (UTC hour) so
  multiple daily runs each get their own row. Ghost purges keep history rows.
- **Incremental save:** each subject's sections are written to the DB as soon
  as that subject finishes scraping (`onSubjectComplete`), then stale rows for
  that subject are pruned (with a partial-scrape plausibility guard), then one
  batched atomic save.

## Known issues / open TODOs

1. ~~**PM2 doesn't auto-start on Windows boot.**~~ ✅ **RESOLVED 2026-07-03.**
   A Scheduled Task `RamblerBackend-HealthMonitor` (see `ops/`) runs at logon and
   every 5 min: it pings `/api/health` and runs `pm2 resurrect` if the API is down.
   Verified end-to-end (killed the daemon, monitor brought it back). Incidents log
   to `ops/health-monitor.log`. Re-create with `ops/setup-autostart.ps1` if needed.
   **Both ops tasks launch HIDDEN via `ops/run-hidden.vbs`** (wscript) — fixes the
   console window that used to flash every 5 min. A second task `RamblerBackend-Backup`
   runs a **daily local rotating zip backup** of `locus.db` (the full history) to
   `C:\Users\LeoArkos\RamblerRegistrar-backups` (keeps last 10), via `ops/backup-db-local.ps1`.
   Same-machine only — off-site/cloud backup deferred (Firebase Storage needs Blaze billing;
   private-GitHub-repo option was prepped then dropped for now).
2. **LOCUS is unreliable overnight** (~12 AM–9 AM CDT). The cron is at 10 AM
   because that's been the only reliable window. 4 AM, 6 AM, and even 9 AM
   variants all failed with `ERR_EMPTY_RESPONSE`.
3. **Snapshot dates are UTC-based.** A 10 AM CDT run records as `T15` UTC.
   Two runs on the same calendar day may straddle midnight UTC and look like
   different "days" if you query by date prefix.
4. **Partial subject scrapes happen silently** (discovered 2026-07-06): the
   10 AM run that day extracted 1 of ~156 CHEM sections (ACCT/ECON/PLSC were
   similarly gutted) — a live re-scrape minutes later returned all 155, so it's
   a LOCUS page-render flake, not a removal. Consequences: those subjects keep
   yesterday's enrollment numbers for a day, and that day's snapshot repeats
   stale values. The stale-prune plausibility guard (`db.deleteStaleSections`)
   refuses to delete when a scrape looks partial and logs a warning — grep PM2
   logs for `looks like a partial scrape` to see how often it fires. A real fix
   (retry the subject when count collapses vs. DB) is future work.
5. **Firestore Spark (free) quota is a real ceiling** — exhausted 2026-07-06 by
   dev usage alone. ✅ **Root causes fixed same day (Phase 3.5):** client bulk
   re-download now gated on a data fingerprint instead of the daily scrape
   timestamp (steady-state boot = 1 read, was ~3.6k/day/device), and
   firestore-sync is delta + zero-read via a local shadow manifest (steady-state
   daily sync = 2 writes, was ~3.4k writes + 2.5k reads). Remaining: **Blaze
   upgrade** (user) to remove the hard daily wall — now ~$0/mo at this scale.
   Dev habit: puppeteer UI-check scripts should pass a persistent `userDataDir`
   so fresh headless profiles don't re-download the catalog on every run
   (moot in steady state now, but it's what burned the quota).

## Recent work history (newest first)

- **2026-07-08 — B12 PHASE 2 + P1 TYPOGRAPHY SHIPPED (pause checkpoint before Phase 4.5).**
  **Subject electives:** prose requirements ("Two PHIL 300-level Elective Courses") now
  modeled — new `program_subject_electives` table + requiredCourses docs
  (requirementType 'subject_elective'); requirement-progress satisfies them with any
  unconsumed completed course matching subject/level (13 unit tests). The Philosophy
  minor now shows its true 6 units. Level parser handles "(100-, 200-, or 300-level)"
  enumerations. All minors re-applied (104 written) + **23/39 empty majors backfilled**
  (812 rows, 70 groups; degree disambiguation; never touches populated majors).
  16 ambiguous majors left for a manual pass.
  **P1 typography:** theme.js + brand font across GenerateScheduleModal (hand-restyled)
  and 143 style entries in Schedule/Progress/Library/Events/More/Home/Search;
  browser-verified. ScheduleGrid block labels stay system font on purpose.
  **Two regressions caught by the visual check:** (1) my earlier persistence guard
  broke WEB session persistence (initializeAuth with undefined persistence = MEMORY;
  web now uses getAuth's browser-local default — fixed + re-verified live);
  (2) "~13/semester" reads as "-13/semester" in the serif font → now "about 13/semester".
  **175 tests green (10 suites).**

- **2026-07-07 (later) — QUALM BUG PASS SHIPPED: B10 + B11 + B12 (paused after, per user).**
  **B10 focus save:** `selectedFocusId` added to rules (deployed) + saveUserProfile
  (clear via deleteField — optStr rejects null) + fetchFocusAreaById + AppContext boot
  hydration + ProfileScreen persists on select/clear. Live-verified through deployed
  rules as the test user (save/clear/negative all correct).
  **B11 stay-signed-in:** root cause = link-from-anonymous can leave a stale
  isAnonymous:true snapshot in persisted storage → boot treats the user as logged out.
  upgradeAnonymousAccount now reload()s after linking; AppContext self-heals
  anonymous-looking restored sessions with one reload(); firebaseConfig fails loud if RN
  persistence ever resolves undefined. **Device verify: sign up → kill → reopen.**
  **B12 requirements backfill:** choice-group data model (program_courses +
  requiredCourses docs + pure `requirement-progress.js`, 8 tests) +
  `backend/scrape-requirements.js` (CourseLeaf parser, skips sample-track tables) →
  **103/109 minors: 2,688 rows, 167 choice groups, 681 new courses** in SQLite +
  Firestore; fingerprint bumped (clients re-sync once); Philosophy minor verified
  end-to-end. Honesty layer: requirementsUnknown flag → ProgressScreen notice + outlook
  names unloaded programs; NEW minor/2nd-major detail view (was MISSING entirely —
  tapping a minor tab rendered nothing). Remaining in plan: 39 empty majors, structure
  refinements, prose-only electives. **170 tests green (10 suites); PM2 restarted.**
  Side note: today's daily scrape auto-pruned 8 more ghost sections (B3 fix working in
  production; term now 2,451 live sections).

- **2026-07-07 — QUALM SWEEP TRIAGED (planning only, per user).** User combed the app and
  delivered 12 items; all triaged into PROJECT_PLAN (see its "Qualm-sweep index"). Notable
  verified findings while grounding the plan: **B12** — ALL 109 minors and 39/121 majors
  have ZERO rows in program_courses (user saw it as "my Philosophy minor has no classes";
  it's a systemic ETL gap, and selected minors currently add 0 remaining units to the
  graduation outlook); **B10** — the users/{uid} rules validator has no focus field, so
  focus selections could never persist; **B11** — auth persistence IS configured correctly
  (initializeAuth + AsyncStorage), so the stay-signed-in bug lives in the AppContext boot
  flow, not config. New: Phase 4.5 (planner cluster F-P1..F-P4), Phase 4 gains F-Q7 map
  day view / F-Q8 study-room booking / P1 typography sweep, Phase 5 gains F-A3 SSO
  (sequenced after B11). Also same day: Localist duplicate-key fix in EventsScreen
  (recurring events share an event id; keys now per-instance — 160 tests green).

- **2026-07-06 (last) — PHASE 4 STARTED: F-HI2 schedule generator SHIPPED + all pending
  verifications closed.** Blaze upgraded by the user → reads live again → verified:
  `terms/1266/sections/4410` is `status:'removed'` (ghost pipeline end-to-end),
  `meta/catalog.catalogDataVersion` present, client synced against the fingerprint on
  first boot and SKIPPED re-download on second boot (Phase 3.5 gate live-proven), and
  the Phase 3 bell UI browser check passed (watch add flipped to "Watching" through the
  deployed rules validator, unwatch cleaned up). **F-HI2:** `Rambler1/schedule-generator.js`
  (pure, deterministic DFS: one section per course, conflict pruning, budget-capped;
  scoring = tight walk transfers + days on campus + idle time + lunch/early/late +
  non-Open picks; hard prefs with per-course exclusion notes; builds around locked
  current sections) + `components/GenerateScheduleModal.js` (course chips → prefs →
  ranked options → grid preview → apply through the existing persistIds guards) + ✨
  header button in ScheduleScreen. 25 new tests → **159 total green**; browser-verified
  with screenshots (compact TuTh candidate around locked BIOL 101). Puppeteer checks now
  use a persistent chrome profile (userDataDir) — second boots cost ~1 Firestore read.
  **Next in Phase 4:** F-HI3 waitlist-movement charts, F-HI4 prof×course recs;
  graduation push nudge still queued behind the user's `eas init` + dev build.

- **2026-07-06 (later still) — PHASE 3.5 SHIPPED: Firestore cost hardening (pre-Blaze).**
  User-directed after the quota post-mortem: fix the waste BEFORE paying for it.
  (1) **Client:** `Database.js` version gate now prefers `meta/catalog.catalogDataVersion`
  — a sha1 fingerprint of exactly the tables the client caches (courses/programs/
  program_courses/prerequisites, via new `db.getCatalogDataFingerprint()`) — over the
  legacy daily-bumped scrape timestamp. Kills the ~3.6k-read daily re-download per
  device; steady-state boot = 1 read. (2) **Backend:** `firestore-sync.js` rewritten as
  delta sync with a local shadow manifest (`firestore-sync-state.json`, gitignored):
  unchanged docs skipped, removals detected manifest-vs-SQLite with ZERO Firestore reads
  (replaces the daily 2.5k-read select prune), recentHistory excluded from the change
  hash, manifest saved only on success (failed runs self-heal), `--reconcile` CLI escape
  hatch + plain CLI (`node firestore-sync.js 1266`). **Live-proven despite the read
  quota being dead** (the new path needs none): bootstrap wrote 2459+919 → second run
  wrote 0 / skipped 2459 → fake-manifest-entry pruned 1 → junk doc deleted. Steady-state
  daily sync = 2 writes (was ~3.4k writes + 2.5k reads). (3) **Watch-poller:** state docs
  rewritten only on change / notify bookkeeping / 6h liveness (was every 20-min poll —
  ~18× fewer steady-state writes). 134 tests green; PM2 restarted on final code.
  **User next:** Blaze upgrade (now ~$0/mo), live client verify after quota reset.

- **2026-07-06 (late night) — PHASE 3 CORE SHIPPED: seat-open alerts, pipeline-proven.**
  `backend/watch-poller.js` (collectionGroup watches → section resolve → subject dedupe
  w/ 12-subject rotating cap → one fast Puppeteer pass → Closed/'Wait List'→Open diff vs
  admin-only `watchPoller/*` state → batched Expo pushes; first-sighting never notifies;
  6h cooldown; notifiedAt only after exp.host ACCEPTS, else notifyPending retries) +
  20-min poll cron in server.js (locks shared with the daily scrape) + `Rambler1/push.js`
  (graceful token registration chain) + watch bells in CourseDetailModal/ScheduleScreen
  ("Watching" list) + fetchWatches/addWatch/removeWatch in firestore-data.
  **END-TO-END PIPELINE PROOF:** seeded a watch on live class 1844 (COMP 170 001) with
  prior state Closed + fake token → poll run produced `transitions:1, pushesQueued:1`,
  real exp.host request, DeviceNotRegistered ticket handled, notifyPending retained for
  retry. Seed data cleaned up; PM2 restarted on final code.
  **Big side catch — B3 was NOT actually fixed:** firestore-sync reads SQLite, and SQLite
  never deleted rows, so sections cancelled in LOCUS (e.g. class 4410, COMP 170 004, dead
  since Apr 8) were re-uploaded as "Open" daily and the prune could never see them. Fixed
  at the root: `db.deleteStaleSections` per successful subject scrape — WITH a plausibility
  guard (same day, LOCUS returned 1 of 156 CHEM sections; live re-check confirmed all 155
  "missing" ones alive — naive pruning would have destroyed them). One-time backfill deleted
  73 true ghosts (14+ days unseen), manual re-sync marked all 73 `removed` in Firestore
  (verified by the sync's own pruned count; doc-level spot-check blocked by the quota wall,
  see Known issue 5). Poller also now skips watches on `removed` sections.
  **Blocked/remaining:** browser bell-UI visual check + doc-level Firestore verification
  (quota resets ~2 AM Chicago); graduation-outlook push nudge (needs real tokens → EAS
  dev build); F-QW1–4 sparkline/fastest-filling UI; F-QW6 RMP proxy.

- **2026-07-06 (night) — PLANNING INSIGHTS shipped: fill-speed warnings + planning-aware
  outlook.** Research (luc.edu, HIGH confidence): LUC registration is by earned hours,
  seniors Mon 2026-04-13 → freshmen Thu 04-16, athletes the Fri before, Honors = front of
  line on YOUR day only. Our enrollment history's inflection = Apr 13 (perfect match);
  vetted classification: 60 day1-2 / 139 first-week / 322 steady / 337 open (open ≈
  freshman-reserved cores that fill at June orientation — deliberately NOT warned).
  `backend/fill-stats.js` (re-run per term with --upload!) wrote 859 fillStats docs,
  4 anchor read-backs verified. `Rambler1/planning-insights.js` (fillWarning personalized
  by classYear + requirementCoverage) + ScheduleScreen pacing strip & add-modal ✓/⚡
  badges + CourseDetailModal banner + SearchScreen chips. 126 tests green.
  **Priority flags SHIPPED same night:** AccountSetup + ProfileScreen toggles →
  users/{uid}.isHonors/isAthlete (rules deployed) → AppContext → fillWarning 3rd param
  (athlete suppresses scarcity, honors gets modest within-day-priority info copy).
  saveUserProfile hardened (conditional writes — partial saves can't clobber).
  134 tests green. Browser-verified end-to-end: sophomore red warning on FINC 345 →
  athlete toggle in Profile → softened info, red gone. ui-check account: classYear
  Sophomore, isAthlete reset to false. **ALL pre-Phase-3 user requests complete.**
  Device-pass list (task #7) now also includes: outlook banner/card, pacing strip,
  fill warnings in Search/Detail/Add-modal, priority toggles in onboarding + Profile.

- **2026-07-06 (evening) — GRADUATION OUTLOOK v1 shipped (user request: "notify users
  when they are not in line to graduate").** Didn't exist before — feasibility math was
  buried in getEnrichedRecommendations (undecided-major ranking only). New pure module
  `Rambler1/graduation-outlook.js`: semesters-until-grad counting (in-progress semester
  counts; documented), remaining units = primary major + 2nd major + minors remaining +
  incomplete core areas, pace thresholds (≤4 on-track / ≤5 at-risk / >5 or 0-semesters
  off-track). Surfaced as a status banner on ProgressScreen + compact card on Home —
  disclaimer on both (heuristic; LOCUS degree audit authoritative). Side fix: Home
  "Today's Schedule" now uses the IN-SESSION term (summer state in Jun/Jul) instead of
  the registration term. 90/90 tests; visually verified off-track banner (screenshots).
  **v2 = push nudge, rides Phase 3 infra (task #10).** Device-pass list unchanged (task #7).

- **2026-07-06 (later) — Phase 2 UI COMPLETE (pending device pass).** 11-agent workflow
  + review + fix pass. New: `Rambler1/campus-api.js` (LibCal hours + Localist events
  called DIRECTLY from the device — parsers validated vs live APIs, real fixtures in
  tests; both CORS-open), `screens/MapScreen.native.js` + `MapScreen.js` web placeholder
  (platform-split keeps react-native-maps out of web bundles — a Platform.OS require
  guard is NOT enough in dev), `screens/LibraryScreen.js`, `screens/EventsScreen.js`,
  real Home dashboard (Today's Schedule + deduped live library widget), Ionicons tab
  icons, More tab → stack (hub → Map/Library/Events), drawer links live.
  **Checks: 65/65 tests; 7 findings (2 serious) all fixed; browser visual pass w/
  screenshots showing LIVE library hours + events data.**
  **USER DEVICE-TEST LIST (when back): schedule builder end-to-end (add/remove/conflict/
  .ics share), CAMPUS MAP (device-only — web can't render it), Library/Events on native,
  tab icons/More hub feel. Google Maps API key still NOT needed (Expo Go uses Expo's);
  needed only at dev-build time.** Nothing committed to git yet.

- **2026-07-06 — Phase 2 started: SCHEDULE BUILDER shipped (pending device pass).**
  Step 0: jest-expo + RNTL harness (`npm test`; RNTL v14 render() is ASYNC — always
  `await render(...)`), react-native-web/react-dom (browser checks), expo-sharing.
  Feature (15-agent workflow + review + my fix pass): `Rambler1/schedule-utils.js`
  (pure: meeting parsing incl. TBA/multi-line/noon-math, conflicts, tight walk gaps,
  ICS), `components/ScheduleGrid.js` (lane layout for overlaps, contrast-aware text,
  hitSlop), rewritten `screens/ScheduleScreen.js` (load/save vs
  `users/{uid}/schedules/{termCode}`, add-modal, warnings banner, .ics share, ghost-id
  prune, 40-cap, failed-load write guard), schedule CRUD in firestore-data.js.
  **Checks:** 52 tests green; 15 review findings all addressed; browser visual check
  via puppeteer on expo web (screenshots) — caught + fixed stacked overlapping blocks.
  Enablers: `Rambler1/metro.config.js` (wasm + COOP/COEP → expo-sqlite works on web);
  App.js boot no longer bricks if sqlite init fails. **UI-check test account:**
  ui-check@rambler-test.dev / UiCheck!2026 (uid A0Gy3cAUo1Ny71DuJgTYC51qA8l2) with a
  seeded 6-section schedule incl. a conflict pair — reusable for future UI checks.
  **NEXT:** user device pass (Expo Go), then campus map / library widget / events feed.

- **2026-07-05 (later) — Phase 1 cleanup + B5 shipped.** `server.js` slimmed ~800→~280
  lines: ONLY /api/health, library hours, events, studyrooms, schedule/analyze remain;
  every user/catalog/sections/admin/scrape endpoint deleted (dead after the Firestore
  cutover — rules are the access control now). **firebase-admin removed from server.js**
  (scraper's firestore-sync inits its own). `db.js`: user tables + user-data functions
  removed; **B5 fixed** — `save()` writes tmp + atomic rename, `insertSection` no longer
  saves per row (scraper calls `db.save()` once per subject; ~50 disk writes per full
  scrape instead of ~2,500 event-loop-blocking ones). `Rambler1/api.js` hardcoded LAN IP
  → `EXPO_PUBLIC_API_BASE` env. ecosystem.config note updated (ADMIN_UIDS gone; manual
  scrape = CLI only: `node scraper-puppeteer.js 1266 [DEPT] [--enrollment]`).
  Verified: 13 endpoint probes (kept 200 / removed 404 / bad-body 400), live COMP scrape
  smoke test (89 sections, batched save, snapshot 2,527, Firestore sync 2,527/0 pruned),
  PM2 restarted healthy, two adversarial review agents run over the diff.
  **Review findings, all fixed:** (1) HIGH — leftover user-table index CREATEs crashed
  `initDb` on any FRESH database (empirically verified + re-tested clean after fix);
  (2) `backend/locus.db.tmp` added to .gitignore (failed rename could have left a
  committable DB export); (3) scrape finalizer wrapped in try/catch (4 PM backup lock
  collision can't skip Chromium cleanup); (4) **legacy `scraper.js` deleted** (B8 partial —
  it had a new wipe-without-save crash window; `npm run scrape` now runs
  scraper-puppeteer); (5) dead `quiz_results` DDL removed; migrate script tolerates
  missing legacy user tables. Fresh-DB initDb re-verified, live server healthy on final code.

- **2026-07-05 — Phase 0.5 CLIENT CUTOVER (the big one).** Expo app fully cut over from
  the LAN backend to Firestore via an orchestrated 22-agent workflow + review pass.
  New files: `Rambler1/firestore-data.js` (adapter, legacy shapes), `Rambler1/progress.js`
  (ported degree/core/RIASEC logic), `Rambler1/.env` (regenerated from web-app config).
  Edited: firebaseConfig (adds Firestore), auth.js (`ensureAnonymousSignIn`,
  `upgradeAnonymousAccount` via linkWithCredential), App.js, AppContext (anon users ≠
  logged in; sign-out re-anons), AccountSetup (explicit context flip after link — 
  linkWithCredential does NOT fire onAuthStateChanged), Database.js (catalog cache syncs
  from Firestore, version-gated on `meta/catalog`), SearchScreen/CourseDetailModal/
  ProgressScreen/ProfileScreen/QuizResults (imports → firestore-data), api.js (trimmed to
  library/events/studyrooms/health only). Backend: firestore-sync now writes term parent
  doc + `meta/catalog` version each scrape; removed-section filter added client-side.
  Anonymous Auth provider enabled programmatically. Rules updated (+`meta/` read) and
  deployed; `terms/1266` + `meta/catalog` backfilled. All 14 changed app files parse
  (esbuild); zero residual api.js imports; PM2 restarted. **NEXT: `npm install` in
  Rambler1/ (node_modules absent here), run the app on-device, test onboarding→signup→
  search→progress; then retire `/api/user/*` + catalog endpoints from server.js.**

- **2026-07-03 (Phase 0.5 started)** — **Firestore provisioned + catalog migrated.**
  Design/process doc: `archive/PHASE_0.5_FIRESTORE.md`. Created the `(default)` Firestore
  DB (Standard, us-central1) — needed an IAM grant (Firebase Admin/Editor) on the service
  account `firebase-adminsdk-fbsvc@ramblerregistrar-9b066`. Authored + auditor-reviewed +
  deployed `firestore.rules` (owner-only `users/{uid}/**`; catalog `read: if authed`,
  `write: false` since the Admin SDK bypasses rules). Wrote `backend/migrate-to-firestore.js`
  (idempotent, batched Admin-SDK ETL) and ran it: **7,548 catalog docs** in Firestore
  (courses/programs/sections/instructors/buildings/core/RIASEC/focus), verified. User tables
  were empty so no user data migrated. New Firebase files at repo root: `firebase.json`,
  `firestore.rules`, `firestore.indexes.json`.
  **Scraper cutover done:** `backend/firestore-sync.js` dual-writes each scraped term to
  Firestore (sections + enrollment + 30-pt `recentHistory` sparkline + normalized
  `instructors`; marks missing sections `removed` = B3), hooked non-fatally into `scrape()`
  (`db.getRecentHistoryByClass` added). Server restarted so the 10 AM cron uses it; verified
  via a direct 2,527-section sync. **Still TODO (Phase 0.5):** client cutover (Firestore SDK
  + offline persistence + Anonymous Auth + RMP off-device), cache RMP into `instructors`
  (S10 follow-up), then retire migrated SQLite tables + `/api/user/*` endpoints. Nothing
  committed to git yet.
- **2026-07-03 (cont.)** — **Phase 0 security hardening shipped & live.** Backend now
  runs via `backend/ecosystem.config.js` with `NODE_ENV=production`. Changes:
  **S1** all `/api/user/:uid/*` GETs require Firebase auth + ownership (frontend
  `api.js` sends the token via a new `apiFetchAuth` helper — no caller changes).
  **S2** `/api/admin/*` gated by `requireAdmin` (Firebase custom claim `admin:true`
  or `ADMIN_UIDS` env allowlist). **S3** `/api/scrape` + snapshot admin-gated +
  a scrape-in-progress lock shared with the cron. **S4** CORS allowlist
  (`ALLOWED_ORIGINS`). **S5** `express-rate-limit` (global + strict scrape). **S7**
  404 + terminal error middleware (no stack/message leaks). **B2** scrape no longer
  closes the server's shared DB handle (only closes when run standalone). **B4** user
  course edits no longer bump the catalog version. **S8** `safeJsonParse` guards +
  lat/long + quiz validation. Verified: boot-tested 9 endpoints (public 200,
  protected 401, unknown 404), deployed, live 401 confirmed.
  ⚠️ **Manual `/api/scrape` now needs admin** — set `ADMIN_UIDS` to your Firebase UID
  in `ecosystem.config.js` (then `pm2 restart`) to re-enable it. The daily cron is
  unaffected. Changes are in the working tree, **not yet committed**.
- **2026-07-03** — Full project audit → `archive/PROJECT_PLAN.md` (security audit,
  bug list, feature roadmap, phased plan). **Incident:** found the API server DOWN —
  a reboot around July 1 killed PM2 and it didn't auto-start, so port 3001 was dead
  ~2 days with no alert (data pipeline was fine; last snapshot 6/30). Ran
  `pm2 resurrect`; verified listening on 0.0.0.0:3001 + `/api/health` 200. Then
  **fixed B1**: added a Scheduled Task (`ops/health-monitor.ps1`, `ops/setup-autostart.ps1`)
  that self-heals via `pm2 resurrect` at logon + every 5 min. Verified end-to-end.
- **2026-06-28 to 30** — Freshman surge captured: +10,262 enrolled catalog-wide in the
  week after June 22. Science gateways (CHEM 160 +588, BIOL 111, nursing GNUR) and Jesuit
  core (THEO, PHIL) exploded; B-school upper-levels (MGMT 304, FINC 345) capped with
  waitlists. Snapshots 6/23–6/26 lost to LOCUS load during peak reg week.
- **2026-05-08** — Loyola posted incoming-freshman registration week as
  **June 23–27, 2026**. Expect a major enrollment surge that week — consider
  bumping cron back to twice daily (9 AM + 3 PM) around then.
- **2026-04-27** — Manual scrape after a weekend; PM2 had survived but the
  watchlist showed enrollment had basically plateaued — most courses +1 to +5
  per day vs. the earlier +50+/day surges.
- **2026-04-23** — Dropped cron from 2×/day back to 1×/day at 10 AM since
  enrollment activity had cooled.
- **2026-04-21 to 22** — Switched cron to 9 AM + 3 PM during peak. Changed
  snapshot key from `YYYY-MM-DD` to `YYYY-MM-DDTHH` so multiple daily runs
  don't overwrite each other (`db.js` `snapshotEnrollment`).
- **2026-04-17** — Added incremental per-subject DB save via `onSubjectComplete`
  callback. Earlier morning runs had been losing the data from successfully-
  scraped subjects when LOCUS died mid-run.
- **2026-04-11 to 13** — Tried 4 AM (LOCUS down), 6 AM (LOCUS down), settled
  on 10 AM (reliable). Added 3-attempt retry logic with 5-min delays.
- **2026-04-06** — Fixed the scraper. The real bug was that LOCUS uses
  `win0divSSR_CLSRSLT_WRK_GROUPBOX3$N` divs (not `GROUPBOX2GP`) to contain
  both the course title and its `MTG_*` section spans. Previously
  `catalog_number`, `title`, `meeting_time_*`, and `building` were all
  blank for every row.
- **2026-04-05** — Pulled work-machine commits adding RIASEC quiz tables and
  seed scripts (`seed-riasec.js`, `seed-focus-areas.js`,
  `seed-riasec-batch2.js`). Ran them in order after `seed.js` to populate
  programs/courses first, then RIASEC mappings.

## Important external dates

| Date | Event | Implication |
|------|-------|-------------|
| **June 23–27, 2026** | LUC freshman registration week | ~3,000 freshmen all register at once. Bump cron to 2×/day. |
| June 12, 2026 | Placement assessment deadline | Some sections may appear/cap here |
| May 11, 2026 | Freshman academic advising begins | Advisors start nudging freshmen toward sections |

## Contacts to consider for outreach

User has been thinking about pitching the app to Loyola staff. From earlier
research:

- **Practicum professor first** — likely Dr. George K. Thiruvathukal or
  Dr. Konstantin Läufer (CS dept, run COMP 312 Open Source Practicum). A
  warm intro from them carries far more weight than cold email.
- **Greg Sikora** (gsikora@luc.edu) — Associate Director for Advising
  Operations, First & Second Year Advising. Operational decision-maker for
  advisor tooling.
- **FSY Advising** (fsyadvising@luc.edu, 773.508.7714) — direct beneficiaries
  for degree-progress + RIASEC features.
- **New Student Programs** (orientation@luc.edu, 773.508.7410) — could
  distribute the app to incoming freshmen at LUCO orientation.

## Verification quick-check (run these to confirm health)

```powershell
# 1. Server running?
pm2 list | findstr rambler-backend

# 2. Last scrape timestamp?
cd backend; node -e "const i=require('sql.js'),f=require('fs');i().then(S=>{const d=new S.Database(f.readFileSync('locus.db'));const t=d.exec('SELECT last_scraped FROM terms ORDER BY last_scraped DESC LIMIT 1');console.log('last:',t[0].values[0][0]);d.close();});"

# 3. Recent snapshots?
cd backend; node -e "const i=require('sql.js'),f=require('fs');i().then(S=>{const d=new S.Database(f.readFileSync('locus.db'));const s=d.exec(\"SELECT snapshot_date,COUNT(*) FROM enrollment_history GROUP BY snapshot_date ORDER BY snapshot_date DESC LIMIT 5\");s[0].values.forEach(r=>console.log(r.join(' | ')));d.close();});"

# 4. Cron actually firing? Check the latest scheduled run
type C:\Users\LeoArkos\.pm2\logs\rambler-backend-out.log | findstr /C:"Running scheduled" | findstr /R "20[2-9][0-9]-" 2>$null
```

If `last_scraped` is more than ~36 hours old, something broke. Most common
causes: PM2 died after a reboot, or LOCUS was down for the 10 AM window and
all 3 retries failed.

## Useful watchlist queries

Past watchlists were generated by selecting interesting `(subject, catalog_number)`
pairs and pulling `enrollment_history` snapshots over the period. The general
shape:

```javascript
// Compare two snapshot dates for a course
db.exec(`
  SELECT snapshot_date, SUM(enrollment_total), SUM(enrollment_cap)
  FROM enrollment_history
  WHERE subject = 'COMP' AND catalog_number = '170'
  GROUP BY snapshot_date
  ORDER BY snapshot_date
`);
```

Notable historical observations:
- **FNAR 120** filled in ~5 days flat once registration opened (Apr 10 → 15)
- **CHEM 240** went 45% → 100% in 2 days
- **PSYC 274** appeared mid-week already at 96% full (suggests sections are
  sometimes added late)
- During peak (Apr 14–17), busiest courses gained +50–280 students/day; by
  late April it slowed to +1–5/day per course
