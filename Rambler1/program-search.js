// program-search.js — the What If search. Pure.

// What-if entries ({ program, ... }) whose program name or degree contains
// every word of the search text (case-insensitive), so "comp sci" finds
// Computer Science. An empty search keeps everything, in order.
export function filterProgramEntries(entries, search) {
  const list = entries || [];
  const words = String(search || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list.filter((e) => {
    const hay = `${e?.program?.name || ''} ${e?.program?.degree || ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
