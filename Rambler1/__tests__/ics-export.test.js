// writeCacheFile: where the Schedule tab's calendar (.ics) export writes.
//
// expo-file-system 19 (the version Expo SDK 54 ships) moved cacheDirectory and
// writeAsStringAsync to 'expo-file-system/legacy'; on the main entry
// cacheDirectory is gone and writeAsStringAsync throws. The export has to use
// the legacy entry (or it always fails with "Export failed").

const mockWrite = jest.fn(async () => {});
let mockCacheDir = 'file:///cache/';
jest.mock('expo-file-system/legacy', () => ({
  get cacheDirectory() { return mockCacheDir; },
  writeAsStringAsync: (...args) => mockWrite(...args),
}));

import { writeCacheFile } from '../ics-export';

beforeEach(() => {
  mockWrite.mockClear();
  mockCacheDir = 'file:///cache/';
});

test('writes the file into the cache directory and returns its uri', async () => {
  const uri = await writeCacheFile('schedule-1272.ics', 'BEGIN:VCALENDAR');
  expect(uri).toBe('file:///cache/schedule-1272.ics');
  expect(mockWrite).toHaveBeenCalledWith('file:///cache/schedule-1272.ics', 'BEGIN:VCALENDAR');
});

test('returns null when the device has no cache directory, without writing', async () => {
  mockCacheDir = null;
  expect(await writeCacheFile('schedule-1272.ics', 'x')).toBeNull();
  expect(mockWrite).not.toHaveBeenCalled();
});

test('a failed write rejects so the caller can say the export failed', async () => {
  mockWrite.mockRejectedValueOnce(new Error('disk full'));
  await expect(writeCacheFile('a.ics', 'x')).rejects.toThrow('disk full');
});
