import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('/.assets/database/MajorMinor.db');

export const setupDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS majmin (id INTEGER PRIMARY KEY, name TEXT, type TEXT, classesNeeded TEXT);',
        [],
        () => resolve(db),
        (_, error) => reject(error)
      );
    });
  });
};

export const fetchMajorsAndMinors = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM majmin',
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};
