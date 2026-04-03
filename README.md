# Rambler Registrar

A course scheduling app built for Loyola University Chicago students. If you've ever struggled with LOCUS, juggled RateMyProfessor tabs while building your schedule, or wondered if you can actually make it from Cuneo Hall to Crown Center in 10 minutes — this is for you.

## What it does

**Pick your classes smarter.** Browse real Loyola courses with professor ratings from RateMyProfessor, see live seat availability from LOCUS, and get walk time estimates between buildings so you're not sprinting across campus.

**Track your degree.** Select your major and see which requirements you've knocked out and what's left. Supports all 230 Loyola programs — every major, minor, and degree type in the catalog.

**Know your campus.** Library hours, campus events, building locations, and dorm-to-class walk times — all in one place.

## How it works

The app pulls live data from several sources:
- **LOCUS** — Loyola's registration system. A Puppeteer scraper grabs course sections, times, rooms, and instructors.
- **RateMyProfessor** — Professor ratings matched to Loyola courses so you can see who's teaching what and how they're rated.
- **LibCal** — Real-time library hours for IC, Cudahy, and Lewis.
- **Localist** — Loyola's campus events feed.

Everything syncs to a backend server and caches locally on your phone so it works offline too.

## Tech

- **Mobile:** React Native + Expo
- **Backend:** Express.js + SQLite
- **Auth:** Firebase
- **Scraping:** Puppeteer (headless Chrome)

## Status

Backend infrastructure is built and working. UI is next.

## Project structure

```
Rambler1/       — Mobile app (React Native / Expo)
backend/        — Express server, LOCUS scraper, database
```
