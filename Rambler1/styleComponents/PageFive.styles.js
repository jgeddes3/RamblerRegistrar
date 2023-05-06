import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 36,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 20,
  },
  nextButton: {
    alignSelf: 'center',
    backgroundColor: '#A30046',
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  nextButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 19,
    color: 'white',
  },
});
