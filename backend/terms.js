// terms.js — which Loyola term the scraper works on by default.
//
// Loyola term codes: '1' + two-digit year + semester digit (2 = Spring,
// 6 = Fall). Fall 2026 -> '1266', Spring 2027 -> '1272'.
//
// Rambler1/term.js carries the same calendar rule for the app. Keep the two in
// step: if they disagree, the app asks for a term nobody scraped and every
// section list comes back empty.

function termCodeFor(season, year) {
  const yy = String(year % 100).padStart(2, '0');
  return `1${yy}${season === 'Spring' ? 2 : 6}`;
}

function termLabelFor(code) {
  const s = String(code);
  if (!/^1\d{3}$/.test(s)) return s;
  const year = 2000 + parseInt(s.slice(1, 3), 10);
  const sem = s[3] === '2' ? 'Spring' : s[3] === '6' ? 'Fall' : `Term ${s[3]}`;
  return `${sem} ${year}`;
}

// The term students are registering FOR on the given date.
function registrationTermFor(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let code;
  if (month >= 10) code = termCodeFor('Spring', year + 1); // Oct-Dec: next Spring
  else if (month >= 3) code = termCodeFor('Fall', year); // Mar-Sep: this Fall
  else code = termCodeFor('Spring', year); // Jan-Feb: this Spring
  return { code, label: termLabelFor(code) };
}

module.exports = { termCodeFor, termLabelFor, registrationTermFor };
