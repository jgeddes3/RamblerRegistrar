// PageTwo.js
import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';
import BackgroundImage from './styleComponents/BackgroundImage';
import TitleTextP2 from './styleComponents/TitleTextP2';
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import SearchBar from './styleComponents/SearchBar';
import SubtextP3 from './styleComponents/SubtextP3';

const [db, setDb] = useState(null);

const PageTwo = ({ navigation }) => {
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  const dbAsset = Asset.fromModule(require('./assets/databases/MajorMinor'));
  const localDb = SQLite.openDatabase({ name: 'MajorMinor.db', uri: dbAsset.localUri });
  setDb(localDb);

  localDb.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM majmin WHERE type = ?',
      ['major'],
      (_, { rows: { _array } }) => {
        setMajors(_array);
      }
    );
    tx.executeSql(
      'SELECT * FROM majmin WHERE type = ?',
      ['minor'],
      (_, { rows: { _array } }) => {
        setMinors(_array);
      }
    );
  });
};



  const handleSearch = (text) => {
    setSearchText(text);
  };

  const filteredMajors = majors.filter((major) =>
    major.name.toLowerCase().startsWith(searchText.toLowerCase())
  );

  const filteredMinors = minors.filter((minor) =>
    minor.name.toLowerCase().startsWith(searchText.toLowerCase())
  );

  const handleMajorSelection = (id) => {
    setSelectedMajor(id);
  };

  const handleNextPress = () => {
    navigation.navigate('PageThree');
  };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
      <TitleTextP2>Choose Your Major/Minor</TitleTextP2>
      <SearchBar
        placeholder="Search"
        value={searchText}
        onChangeText={handleSearch}
        style={{ position: 'absolute', top: 156 }}
      />
      <ScrollView>
        <TitleTextP2>Major</TitleTextP2>
        {filteredMajors.map((major) => (
          <CustomLongButton1
            key={major.id}
            onPress={() => handleMajorSelection(major.id)}
            selected={selectedMajor === major.id}
          >
            {major.name}
          </CustomLongButton1>
        ))}
        <TitleTextP2>Minors</TitleTextP2>
        {filteredMinors.map((minor) => (
          <CustomLongButton1 key={minor.id}>{minor.name}</CustomLongButton1>
        ))}
        {filteredMajors.length === 0 && filteredMinors.length === 0 && (
          <SubtextP3>No class found</SubtextP3>
        )}
      </ScrollView>
      <View
        style={{
          alignSelf: 'center',
          position: 'absolute',
          top: 708,
        }}
      >
        <CustomLongButton1
          onPress={handleNextPress}
          disabled={selectedMajor === null}
          style={{ backgroundColor: selectedMajor === null ? '#d9d9d9' : '#A30046' }}
        >
          Next
        </CustomLongButton1>
      </View>
    </BackgroundImage>
  );
};

export default PageTwo;

