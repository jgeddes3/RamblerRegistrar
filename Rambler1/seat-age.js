// seat-age.js — how old a section's seat count is, in words.
// enrollment_read_at (ISO 8601) is when the backend last read the numbers
// from LOCUS. The scrape runs once a day, and a failed read keeps the older
// numbers and their time, so some sections run days behind.

// Past this, a count is flagged as possibly out of date: one missed daily
// scrape, plus some slack for the scrape's own length.
export const STALE_AFTER_HOURS = 36;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Built by hand, not toLocaleTimeString: ICU versions differ on the space
// before AM/PM, and this text is read aloud and tested.
const clock = (d) => {
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// { label: 'Seats as of 10:42 AM today', stale } or null when unknown.
export function seatAge(readAt, now = new Date()) {
  if (!readAt) return null;
  const d = new Date(readAt);
  if (Number.isNaN(d.getTime())) return null;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  let when;
  if (sameDay(d, now)) when = `${clock(d)} today`;
  else if (sameDay(d, yesterday)) when = `yesterday, ${clock(d)}`;
  else when = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return { label: `Seats as of ${when}`, stale: now - d > STALE_AFTER_HOURS * 3600 * 1000 };
}

// The most recent read among a list of sections (ISO string), or null.
export function newestReadAt(sections) {
  let best = null;
  for (const s of sections || []) {
    const t = s && s.enrollment_read_at;
    if (t && !Number.isNaN(Date.parse(t)) && (!best || Date.parse(t) > Date.parse(best))) best = t;
  }
  return best;
}
