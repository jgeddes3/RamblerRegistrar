// course-list.js — row data for the virtualized course pickers. Pure.

// Courses whose code or name contains the search text (case-insensitive).
export function filterCourses(courses, search) {
  const list = courses || [];
  const needle = String(search || '').trim().toLowerCase();
  if (!needle) return list;
  return list.filter(
    (c) =>
      String(c.name || '').toLowerCase().includes(needle) ||
      String(c.code || '').toLowerCase().includes(needle)
  );
}

// Flat row list for a FlatList: courses matching `search`, with the user's
// major courses (ids in `majorCourseIds`, or null for none) first under a
// label. Rows: { type: 'label', key, title } | { type: 'course', key, course }.
export function buildCourseRows(courses, search, majorCourseIds) {
  const filtered = filterCourses(courses, search);
  const row = (course) => ({ type: 'course', key: `c-${course.id}`, course });
  if (!majorCourseIds) return filtered.map(row);

  const major = filtered.filter((c) => majorCourseIds.has(c.id));
  const other = filtered.filter((c) => !majorCourseIds.has(c.id));
  const rows = [];
  if (major.length > 0) rows.push({ type: 'label', key: 'label-major', title: 'From your major' });
  rows.push(...major.map(row));
  if (major.length > 0 && other.length > 0) {
    rows.push({ type: 'label', key: 'label-other', title: 'Other courses' });
  }
  rows.push(...other.map(row));
  return rows;
}

// The list with `course` present (selected) or absent, matched by code: local
// sqlite rows carry integer ids while Firestore rows use the code as id.
// Returns the same array when nothing changes.
export function setCourseSelected(list, course, selected) {
  const current = list || [];
  const has = current.some((c) => c.code === course.code);
  if (selected) return has ? current : [...current, course];
  return has ? current.filter((c) => c.code !== course.code) : current;
}
