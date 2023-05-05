// PageTwo.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';
import BackgroundImage from './styleComponents/BackgroundImage';
import TitleText2 from './styleComponents/TitleTextP2';
import CustomButton2 from './styleComponents/customButton2'; 
import CustomLongButton1 from './styleComponents/CustomLongButton1';
import SearchBar from './styleComponents/SearchBar';
import SubtextP3 from './styleComponents/SubtextP3';
import setupDatabase from './dbSetup';

const PageTwo = ({ navigation }) => {
  const [majorsAndMinors, setMajorsAndMinors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredMajorsAndMinors, setFilteredMajorsAndMinors] = useState([]);

  useEffect(() => {
    setupDatabase().then((db) => {
      db.transaction((tx) => {
        tx.executeSql('SELECT * FROM majmin', [], (_, { rows }) => {
          setMajorsAndMinors(rows._array);
        });
      });
    });
  }, []);

  useEffect(() => {
    const filteredList = majorsAndMinors.filter((item) =>
      item.name.toLowerCase().startsWith(searchText.toLowerCase())
    );
    setFilteredMajorsAndMinors(filteredList);
  }, [searchText, majorsAndMinors]);

  return (
    <View>
      <TitleText2>Choose Your Major/Minor</TitleText2>
      <SearchBar
        onChangeText={(text) => setSearchText(text)}
        value={searchText}
        placeholder="Search majors and minors"
      />
      <ScrollView>
        <TitleText2>Major</TitleText2>
        {filteredMajorsAndMinors
          .filter((item) => item.type === 'major')
          .map((major, index) => (
            <CustomLongButton1 key={index}>
              {major.name}
            </CustomLongButton1>
          ))}
        <TitleText2>Minor</TitleText2>
        {filteredMajorsAndMinors
          .filter((item) => item.type === 'minor')
          .map((minor, index) => (
            <CustomLongButton1 key={index}>
              {minor.name}
            </CustomLongButton1>
          ))}
        {filteredMajorsAndMinors.length === 0 && (
          <SubtextP3>No class found</SubtextP3>
        )}
      </ScrollView>
      <CustomButton2 onPress={() => navigation.navigate('PageThree')}>
        Continue
      </CustomButton2>
    </View>
  );
};

export default PageTwo;