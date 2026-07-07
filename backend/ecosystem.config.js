// PM2 process definition for the Rambler backend.
//
// Start (or re-point) the managed process with:
//   pm2 start ecosystem.config.js && pm2 save
//
// `pm2 save` persists this so the health-monitor's `pm2 resurrect` restores it
// with NODE_ENV=production intact after a reboot.
module.exports = {
  apps: [
    {
      name: 'rambler-backend',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        // Optional knobs (safe defaults if unset):
        //   ALLOWED_ORIGINS - comma-separated browser origins for CORS (mobile app needs none)
        //   RATE_LIMIT_MAX  - per-15-min global request cap (default 1000)
        // (ADMIN_UIDS removed with the /api/admin/* + /api/scrape endpoints in
        //  the Phase 1 cleanup — manual scrapes run via CLI: node scraper-puppeteer.js)
      },
      autorestart: true,
      max_memory_restart: '600M',
    },
  ],
};
