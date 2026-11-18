import { StyleSheet } from 'react-native';
import { STONE, FONT } from '../theme';

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
    fontFamily: FONT,
    fontSize: 24,
    color: '#A30046',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  infoText: {
    fontFamily: FONT,
    fontSize: 18,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  classItem: {
    fontFamily: FONT,
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
    fontFamily: FONT,
    fontSize: 14,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 20,
    fontFamily: FONT,
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
    fontFamily: FONT,
    fontSize: 16,
    color: STONE,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default styles;
