import { saveCoursesConcurrently } from '../course-sync';

// Signup and the Progress tab used to save taken courses one at a time,
// awaiting each. With a save that takes (or times out after) 10 s, thirty
// courses meant a five-minute frozen "..." button.

test('starts every save before waiting on any of them', async () => {
  const started = [];
  const release = [];
  const saveOne = (code) => {
    started.push(code);
    return new Promise((resolve) => release.push(() => resolve({ success: true })));
  };

  const done = saveCoursesConcurrently(['COMP 170', 'MATH 161', 'ENGL 100'], saveOne);
  await Promise.resolve();
  expect(started).toEqual(['COMP 170', 'MATH 161', 'ENGL 100']);

  release.forEach((r) => r());
  expect(await done).toEqual({ saved: 3, failed: [] });
});

test('reports the courses that failed (null result or a throw) without rejecting', async () => {
  const saveOne = async (code) => {
    if (code === 'MATH 161') return null; // the data layer's "save failed"
    if (code === 'ENGL 100') throw new Error('boom');
    return { success: true };
  };
  expect(await saveCoursesConcurrently(['COMP 170', 'MATH 161', 'ENGL 100'], saveOne))
    .toEqual({ saved: 1, failed: ['MATH 161', 'ENGL 100'] });
});

test('skips blanks and duplicate codes', async () => {
  const saveOne = jest.fn(async () => ({ success: true }));
  expect(await saveCoursesConcurrently(['COMP 170', '', null, 'COMP 170'], saveOne))
    .toEqual({ saved: 1, failed: [] });
  expect(saveOne).toHaveBeenCalledTimes(1);
});

test('an empty list resolves immediately', async () => {
  expect(await saveCoursesConcurrently([], jest.fn())).toEqual({ saved: 0, failed: [] });
});
