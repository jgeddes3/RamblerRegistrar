// app.config.js — dynamic layer over app.json (which stays the source of
// truth for everything static).
//
// Why this exists: google-services.json is gitignored (public repo), but EAS
// Build only uploads git-tracked files. The file lives in EAS as the secret
// file variable GOOGLE_SERVICES_JSON; on build servers that env var holds a
// temp-file PATH, which we point the Android config at. Locally (expo start /
// prebuild) it falls back to the real file on disk.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
