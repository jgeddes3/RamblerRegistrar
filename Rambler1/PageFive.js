import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import SearchBar from './styleComponents/SearchBar';
import styles from './styleComponents/PageFive.styles';
import BackgroundImage from './styleComponents/BackgroundImage';

const PageFive = () => {
    const [year, setYear] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
  
    const navigation = useNavigation();
    const handleNextButtonPress = () => {
      console.log('Selected year:', year);
      console.log('Username:', username);
      console.log('Password:', password);
      navigation.navigate('Home');
    };

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper-01.jpg')}>
     <View style={styles.container}>
      <View>
        <Text style={styles.label}>Expected Graduation Date</Text>
        <Picker
          selectedValue={year}
          style={styles.picker}
          onValueChange={(itemValue) => setYear(itemValue)}
        >
          {Array.from({ length: 8 }, (_, i) => 2023 + i).map((year) => (
            <Picker.Item key={year} label={`${year}`} value={year} />
          ))}
        </Picker>
        <Text style={styles.label}>Pick a username and password</Text>
        <SearchBar value={username} onChangeText={setUsername} placeholder="Username" />
        <SearchBar value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      </View>
      {year && username && password && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNextButtonPress}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
    </BackgroundImage>
  );
};

export default PageFive;

