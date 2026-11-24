import { filterProgramEntries } from '../program-search';

const E = (name, degree) => ({ program: { id: name, name, degree } });
const ENTRIES = [
  E('Computer Science', 'BS'),
  E('Philosophy', 'BA'),
  E('Political Science', 'BA'),
  E('Data Science', 'BS'),
];
const names = (list) => list.map((e) => e.program.name);

describe('filterProgramEntries', () => {
  test('matches the program name, case-insensitively', () => {
    expect(names(filterProgramEntries(ENTRIES, 'PHIL'))).toEqual(['Philosophy']);
    expect(names(filterProgramEntries(ENTRIES, 'science'))).toEqual([
      'Computer Science', 'Political Science', 'Data Science',
    ]);
  });
  test('every word must match, in any order, so "comp sci" finds Computer Science', () => {
    expect(names(filterProgramEntries(ENTRIES, 'comp sci'))).toEqual(['Computer Science']);
    expect(names(filterProgramEntries(ENTRIES, 'sci pol'))).toEqual(['Political Science']);
  });
  test('the degree counts too', () => {
    expect(names(filterProgramEntries(ENTRIES, 'science bs'))).toEqual(['Computer Science', 'Data Science']);
  });
  test('an empty search keeps everything, in order', () => {
    expect(filterProgramEntries(ENTRIES, '')).toBe(ENTRIES);
    expect(filterProgramEntries(ENTRIES, '   ')).toBe(ENTRIES);
  });
  test('tolerates missing fields and a missing list', () => {
    expect(filterProgramEntries([{ program: {} }, {}], 'x')).toEqual([]);
    expect(filterProgramEntries(null, 'x')).toEqual([]);
    expect(filterProgramEntries(null, '')).toEqual([]);
  });
});
