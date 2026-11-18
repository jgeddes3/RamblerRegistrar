// progress-summary.js — bar/badge numbers for a second major or a minor. Pure.
//
// `loaded` is the Progress tab's degree-progress list for those programs
// (entries may be null when a load failed). Returns { percent, completed,
// total } for `program`, falling back to 0 of the program's minimum credits
// (or `fallbackTotal`) when there is nothing loaded for it.
export function programProgressSummary(loaded, program, fallbackTotal) {
  const total = (program && program.min_credits) || fallbackTotal;
  const entry = (loaded || []).find(
    (p) => p && p.program && String(p.program.id) === String(program && program.id)
  );
  if (!entry) return { percent: 0, completed: 0, total };
  return {
    percent: entry.percentComplete || 0,
    completed: entry.creditsCompleted || 0,
    total: entry.totalCreditsRequired || total,
  };
}
