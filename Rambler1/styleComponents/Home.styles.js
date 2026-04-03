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
  sectionHeader: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#A30046',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  infoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  classItem: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    marginHorizontal: 24,
    marginBottom: 2,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#D9D9D9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
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
  emptyText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default styles;
