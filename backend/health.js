// Health report for GET /api/health. The scrape and poll locks in server.js
// are plain booleans; if a browser close or LOCUS call hangs they stay set
// forever and every later run is skipped. Reporting how long each lock has been
// held lets ops/health-monitor.ps1 tell "busy" from "wedged".

// A normal daily scrape takes ~3.5h; a poll takes a few minutes. Generous
// limits so a slow-but-healthy run is never restarted mid-flight.
const MAX_SCRAPE_MS = 6 * 60 * 60 * 1000;
const MAX_POLL_MS = 45 * 60 * 1000;

// state: { scrapeStartedAt, pollStartedAt, lastScrapeOkAt, lastPollDoneAt }
// (epoch ms or null).
function buildHealth(state, now = Date.now()) {
  const lock = (startedAt) => ({
    inProgress: startedAt != null,
    startedAt: startedAt != null ? new Date(startedAt).toISOString() : null,
    runningMinutes: startedAt != null ? Math.floor((now - startedAt) / 60000) : 0,
  });
  const iso = (t) => (t != null ? new Date(t).toISOString() : null);

  const wedgedReasons = [];
  if (state.scrapeStartedAt != null && now - state.scrapeStartedAt > MAX_SCRAPE_MS) {
    wedgedReasons.push(`scrape lock held ${Math.floor((now - state.scrapeStartedAt) / 60000)} min (limit ${MAX_SCRAPE_MS / 60000})`);
  }
  if (state.pollStartedAt != null && now - state.pollStartedAt > MAX_POLL_MS) {
    wedgedReasons.push(`poll lock held ${Math.floor((now - state.pollStartedAt) / 60000)} min (limit ${MAX_POLL_MS / 60000})`);
  }
  const wedged = wedgedReasons.length > 0;

  return {
    status: wedged ? 'wedged' : 'ok',
    wedged,
    wedgedReasons,
    timestamp: new Date(now).toISOString(),
    scrape: lock(state.scrapeStartedAt),
    poll: lock(state.pollStartedAt),
    lastScrapeOkAt: iso(state.lastScrapeOkAt),
    lastPollDoneAt: iso(state.lastPollDoneAt),
  };
}

module.exports = { buildHealth, MAX_SCRAPE_MS, MAX_POLL_MS };
