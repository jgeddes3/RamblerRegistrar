// theme-colors.test.js — the lint rule for colours (the app has no ESLint;
// this runs with `npm test`).
// 1. A hex that IS a theme colour must be written as the token (MAROON,
//    WARN.fg, ...), so a brand or status change happens in theme.js only.
// 2. Other hex literals (greys, one-off tints) may only go DOWN: the count
//    is capped at what's left after the 2026-11-18 sweep. When you replace
//    some with tokens, lower HEX_CEILING to the new count. Never raise it:
//    add a token to theme.js instead.
import fs from 'fs';
import path from 'path';
import * as theme from '../theme';

const HEX_CEILING = 538;

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '__tests__', '.expo', 'assets', 'data', 'coverage']);
const SKIP_FILES = new Set(['theme.js', 'jest.setup.js', 'babel.config.js', 'metro.config.js', 'app.config.js']);

function sourceFiles(dir = ROOT, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (e.name.endsWith('.js') && !SKIP_FILES.has(e.name)) out.push(p);
  }
  return out;
}

// Every colour the theme names, lower-cased hex -> token name.
const themeHexes = {};
for (const [name, value] of Object.entries(theme)) {
  if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) themeHexes[value.toLowerCase()] = name;
  if (value && typeof value === 'object' && value.fg && value.bg) {
    themeHexes[value.fg.toLowerCase()] = `${name}.fg`;
    themeHexes[value.bg.toLowerCase()] = `${name}.bg`;
  }
}
// GOLD is the masthead's alone, not something to swap in elsewhere. White
// is SURFACE (cards) but also text on maroon, so it isn't forced to the
// token; it counts toward the ceiling below like any other literal.
delete themeHexes[theme.GOLD.toLowerCase()];
delete themeHexes[theme.SURFACE.toLowerCase()];

const HEX = /['"](#[0-9a-fA-F]{3,8})['"]/g;
const hits = sourceFiles().flatMap((file) => {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  return lines.flatMap((line, i) =>
    [...line.matchAll(HEX)].map((m) => ({ file: path.relative(ROOT, file), line: i + 1, hex: m[1].toLowerCase() })));
});

test('theme colours are written as theme tokens, not hex', () => {
  const offenders = hits.filter((h) => themeHexes[h.hex])
    .map((h) => `${h.file}:${h.line} ${h.hex} -> use ${themeHexes[h.hex]}`);
  expect(offenders).toEqual([]);
});

test(`other hex literals don't grow (ceiling ${HEX_CEILING})`, () => {
  const count = hits.filter((h) => !themeHexes[h.hex]).length;
  expect(count).toBeLessThanOrEqual(HEX_CEILING);
});
