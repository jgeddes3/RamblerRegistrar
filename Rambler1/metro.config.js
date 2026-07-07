// Metro config — required for expo-sqlite on web:
//  1. bundle .wasm as an asset (wa-sqlite.wasm),
//  2. serve COOP/COEP headers so the SQLite web worker can use SharedArrayBuffer.
// Native builds are unaffected.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    middleware(req, res, next);
  },
};

module.exports = config;
