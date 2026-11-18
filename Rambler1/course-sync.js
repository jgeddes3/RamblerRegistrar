// course-sync.js — save a batch of taken courses without serializing them.
//
// `saveOne(code)` is the data layer's addUserCourse bound to a user: resolves
// truthy on success, null on failure (it times out on its own, see
// firestore-guards.js). All saves start together, so the batch takes as long
// as the slowest one instead of the sum of them all.
//
// Resolves { saved, failed: [codes] }. Never rejects.
export async function saveCoursesConcurrently(codes, saveOne) {
  const unique = [...new Set((codes || []).filter(Boolean))];
  const results = await Promise.allSettled(unique.map((code) => saveOne(code)));
  const failed = unique.filter((_, i) => results[i].status !== 'fulfilled' || !results[i].value);
  return { saved: unique.length - failed.length, failed };
}
