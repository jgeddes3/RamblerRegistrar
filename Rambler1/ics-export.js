// ics-export.js — write an export file into the app's cache directory.
//
// Imports the LEGACY entry of expo-file-system on purpose: from v19 (Expo SDK
// 54) the main entry no longer has cacheDirectory and its writeAsStringAsync
// throws at runtime. 'expo-file-system/legacy' keeps both.
import * as FileSystem from 'expo-file-system/legacy';

// Writes `contents` to <cache>/<filename>. Resolves the file uri, or null when
// the device exposes no cache directory. Rejects if the write fails.
export async function writeCacheFile(filename, contents) {
  const dir = FileSystem.cacheDirectory;
  if (!dir) return null;
  const uri = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents);
  return uri;
}
