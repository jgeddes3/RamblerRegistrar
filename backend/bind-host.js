// Which interface the HTTP API listens on. Loopback unless BIND_HOST says
// otherwise: the only callers are on this machine (ops/health-monitor.ps1,
// cli-guard.js); the mobile app reads Firestore and never calls this server.
function bindHost(env) {
  const host = typeof env.BIND_HOST === 'string' ? env.BIND_HOST.trim() : '';
  return host || '127.0.0.1';
}

module.exports = { bindHost };
