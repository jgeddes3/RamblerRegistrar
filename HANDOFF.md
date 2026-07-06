# RamblerRegistrar — Session Handoff

Last updated: 2026-07-03

> 📋 **See `archive/PROJECT_PLAN.md`** (gitignored) for the full security audit,
> bug list, feature roadmap, and phased plan. Read it before major work.

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
- **`backend/scraper.js`** — Cheerio-based fallback, same parsing strategy.
  Not used by the cron — `server.js` only imports `scraper-puppeteer`.
- **`backend/db.js`** — sql.js wrapper. Tables: `sections`, `enrollment_history`,
  `programs`, `courses`, `program_courses`, `prerequisites`, `core_areas`,
  `buildings`, `riasec_recommendations`, `major_focus_areas`, `user_*`. DB
  file at `backend/locus.db` (gitignored).
- **`backend/server.js`** — Express API + cron. Cron at line ~628.
- **`Rambler1/`** — React Native (Expo) app, Firebase auth, talks to backend.

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
```

## Current state (as of 2026-05-26)

- **Cron schedule:** once daily at 10 AM CDT (`0 10 * * *`) with enrollment
  data. Was twice daily during peak enrollment week (Apr 21–23) then dropped
  back to once.
- **PM2 status:** `rambler-backend` runs as a single fork process. **No
  Windows auto-start configured** — if the laptop reboots, PM2 daemon dies
  silently and the cron stops firing until you run `pm2 resurrect` manually.
  This has burned us twice. Fixing this is a known TODO (see below).
- **DB sections:** ~2,350 sections across ~46 departments for Fall 2026
  (term code `1266`).
- **Enrollment history:** snapshots stored as `YYYY-MM-DDTHH` (UTC hour) so
  multiple daily runs each get their own row. `db.js` line ~854.
- **Retry logic:** if a scrape attempt fails, the cron retries up to 3× with
  5-min delays. `server.js:628`.
- **Incremental save:** each subject's sections are written to the DB as soon
  as that subject finishes scraping (not batched at the end). If LOCUS dies
  mid-run, partial data is preserved. `scraper-puppeteer.js:scrapeAll` accepts
  an `onSubjectComplete` callback.

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
4. **`scraper.js` (cheerio) is unused** but still compiled. It has the same
   GROUPBOX3 fix as the puppeteer version; safe to ignore unless someone
   decides to ditch puppeteer.

## Recent work history (newest first)

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
