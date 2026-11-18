// profile-edits.js — what each Profile edit writes to users/{uid}. Pure.
//
// saveUserProfile merges and only includes the keys it is given, so every
// edit sends just the field it changes. Resending the whole profile from
// in-memory state is what let one switch flip blank out a saved major.

export const MAX_MINORS = 3;

// Edits are only safe once the saved profile is what's in memory.
export const canEditProfile = (profileStatus) => profileStatus === 'ready';

export const programEdit = (program) => ({ selectedProgramId: program.id });

export const priorityEdit = (flag, value) => ({ [flag]: value === true });

// -> { updated: [minor objects], payload } or null when the cap blocks an add.
export function minorToggleEdit(currentMinors, minor) {
  const current = currentMinors || [];
  let updated;
  if (current.some((m) => m.id === minor.id)) {
    updated = current.filter((m) => m.id !== minor.id);
  } else {
    if (current.length >= MAX_MINORS) return null;
    updated = [...current, minor];
  }
  return { updated, payload: { selectedMinors: updated.map((m) => m.id) } };
}
