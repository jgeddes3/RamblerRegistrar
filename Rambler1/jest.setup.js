// jest.setup.js — runs before every test file.
// AsyncStorage is a native module: under jest it needs its official mock.
// A test file's own jest.mock of it still takes precedence.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
