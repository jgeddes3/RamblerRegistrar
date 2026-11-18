// Guard for write-capable CLI scripts (seeds, scraper CLI, scrape-requirements
// --apply). db.js loads the whole locus.db image into memory and save() writes
// the whole image back, so a script that saves while the server is running makes
// whichever saves last win and silently erases the other's changes. Refuse to
// run while the server answers on its port; --force overrides.

const http = require('http');

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

// Resolves true if anything answers /api/health on localhost:port.
function isServerUp(port = DEFAULT_PORT, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

function shouldRefuse(serverUp, argv = process.argv) {
  return serverUp && !argv.includes('--force');
}

// Call at the top of a write-capable script's entry point, before db.initDb().
async function requireServerStopped(scriptName) {
  const up = await isServerUp();
  if (!shouldRefuse(up)) return;
  console.error(
    `\n${scriptName} refused to run: the backend server is answering on port ${DEFAULT_PORT}.\n` +
    `It holds locus.db in memory and saves the whole file, so whichever of you saves last\n` +
    `would silently overwrite the other's changes. Stop the server first (pm2 stop rambler-backend),\n` +
    `or pass --force if you are sure no scrape/poll will save in the meantime.\n`
  );
  process.exit(1);
}

module.exports = { isServerUp, shouldRefuse, requireServerStopped };
