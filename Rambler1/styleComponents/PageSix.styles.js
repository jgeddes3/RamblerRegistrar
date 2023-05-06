import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 110,
    backgroundColor: '#A30046',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond-Regular',
    textAlign: 'center',
  },
  separator: {
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 1,
    alignSelf: 'stretch',
    marginVertical: 10,
    width: '100%',
  },
});

export default styles;
