import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

export const openDatabase = async () => {
  const localDbUri = FileSystem.documentDirectory + 'MajorMinor.db';
  const dbAsset = Asset.fromModule(require('./assets/databases/MajorMinor.db'));

  await FileSystem.downloadAsync(dbAsset.uri, localDbUri);

  return SQLite.openDatabase({ name: 'MajorMinor.db', uri: localDbUri });
};
