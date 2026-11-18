import { filterCourses, buildCourseRows } from '../course-list';

const C = (id, code, name) => ({ id, code, name });
const COURSES = [
  C(1, 'COMP 170', 'Intro to Object-Oriented Programming'),
  C(2, 'COMP 271', 'Data Structures'),
  C(3, 'MATH 161', 'Calculus I'),
  C(4, 'ENGL 100', 'Developmental Writing'),
];

describe('filterCourses', () => {
  test('matches code or name, case-insensitively', () => {
    expect(filterCourses(COURSES, 'comp').map((c) => c.code)).toEqual(['COMP 170', 'COMP 271']);
    expect(filterCourses(COURSES, 'CALC').map((c) => c.code)).toEqual(['MATH 161']);
  });
  test('an empty search keeps everything, in order', () => {
    expect(filterCourses(COURSES, '')).toEqual(COURSES);
    expect(filterCourses(COURSES, '   ')).toEqual(COURSES);
  });
  test('tolerates missing fields and a missing list', () => {
    expect(filterCourses([{ id: 9 }], 'x')).toEqual([]);
    expect(filterCourses(null, 'x')).toEqual([]);
  });
});

describe('buildCourseRows', () => {
  test('without a major, one flat list of course rows', () => {
    const rows = buildCourseRows(COURSES, '', null);
    expect(rows.map((r) => r.type)).toEqual(['course', 'course', 'course', 'course']);
    expect(rows[0]).toEqual({ type: 'course', key: 'c-1', course: COURSES[0] });
  });

  test('major courses come first under a label, the rest under another', () => {
    const rows = buildCourseRows(COURSES, '', new Set([2, 3]));
    expect(rows.map((r) => (r.type === 'label' ? r.title : r.course.code))).toEqual([
      'From your major', 'COMP 271', 'MATH 161',
      'Other courses', 'COMP 170', 'ENGL 100',
    ]);
  });

  test('labels only appear for groups that have rows', () => {
    const onlyMajor = buildCourseRows(COURSES, 'data', new Set([2]));
    expect(onlyMajor.map((r) => (r.type === 'label' ? r.title : r.course.code))).toEqual(['From your major', 'COMP 271']);

    const noMajorHits = buildCourseRows(COURSES, 'engl', new Set([2]));
    expect(noMajorHits.map((r) => r.type)).toEqual(['course']);
  });

  test('row keys are unique', () => {
    const rows = buildCourseRows(COURSES, '', new Set([2]));
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
  });
});

describe('setCourseSelected', () => {
  const { setCourseSelected } = require('../course-list');
  const A = { id: 1, code: 'COMP 170' };
  const B = { id: 'MATH 161', code: 'MATH 161' };

  test('adds a course that is not there', () => {
    expect(setCourseSelected([A], B, true)).toEqual([A, B]);
  });
  test('removes by code, whatever the id looks like', () => {
    expect(setCourseSelected([A, B], { id: 99, code: 'COMP 170' }, false)).toEqual([B]);
  });
  test('is a no-op when already in the wanted state', () => {
    const list = [A];
    expect(setCourseSelected(list, A, true)).toBe(list);
    expect(setCourseSelected(list, B, false)).toBe(list);
  });
  test('treats a missing list as empty', () => {
    expect(setCourseSelected(null, A, true)).toEqual([A]);
  });
});
