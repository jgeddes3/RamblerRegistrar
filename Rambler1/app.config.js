// app.config.js — dynamic layer over app.json (which stays the source of
// truth for everything static).
//
// Why this exists: google-services.json is gitignored (public repo), but EAS
// Build only uploads git-tracked files. The file lives in EAS as the secret
// file variable GOOGLE_SERVICES_JSON; on build servers that env var holds a
// temp-file PATH, which we point the Android config at. Locally (expo start /
// prebuild) it falls back to the real file on disk.
//
// Android Google Maps key: read from GOOGLE_MAPS_ANDROID_API_KEY (an EAS
// environment variable for builds, or your local environment for prebuild)
// rather than committed to app.json. Without it the config is left out and
// Android maps render gray; iOS uses Apple Maps and needs no key.
export default ({ config }) => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      ...(mapsKey
        ? {
            config: {
              ...(config.android && config.android.config),
              googleMaps: { apiKey: mapsKey },
            },
          }
        : {}),
    },
  };
};
