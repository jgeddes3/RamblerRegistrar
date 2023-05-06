import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import styles from './styleComponents/PageSix.styles';
import LogoImage2 from './styleComponents/LogoImage2';
import BackgroundImage from './styleComponents/BackgroundImage';

const PageSix = () => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <BackgroundImage source={require('./assets/Backgrounds/Wallpaper2-01.png')}>
    <View style={styles.container}>
      <View style={styles.topBar}>
        <LogoImage2 source={require('./assets/Icons/Logo2-02.png')} />
      </View>
      <ScrollView>
        {weekdays.map((day, index) => (
          <View key={index} style={styles.dayContainer}>
            <Text style={styles.dayText}>{day}</Text>
            <View style={styles.separator} />
          </View>
        ))}
      </ScrollView>
    </View>
    </BackgroundImage>
  );
};

export default PageSix;
