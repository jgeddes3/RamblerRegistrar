// styleComponents/SearchBar.js
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const SearchBar = (props) => {
  return (
    <TextInput
      {...props}
      placeholder="Search"
      style={styles.searchInput}
    />
  );
};

const styles = StyleSheet.create({
  searchInput: {
    fontSize: 19,
    color: '#000000',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 2,
    paddingHorizontal: 8,
    width: 275,
    height: 36,
  },
});

export default SearchBar;
