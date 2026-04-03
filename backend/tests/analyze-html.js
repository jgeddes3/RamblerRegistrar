const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('tests/samples/locus-init.html', 'utf-8');
const $ = cheerio.load(html);

// Find term (STRM) options
console.log('=== Available Terms ===');
$('select').each((i, el) => {
  const id = $(el).attr('id') || '';
  const name = $(el).attr('name') || '';
  if (id.includes('STRM') || name.includes('STRM')) {
    console.log('Select: ' + id);
    $(el).find('option').each((j, opt) => {
      const val = $(opt).attr('value');
      const text = $(opt).text().trim();
      if (val) console.log('  ' + val + ' = ' + text);
    });
  }
});

// Find institution options
console.log('\n=== Institutions ===');
$('select').each((i, el) => {
  const id = $(el).attr('id') || '';
  if (id.includes('INSTITUTION')) {
    $(el).find('option').each((j, opt) => {
      const val = $(opt).attr('value');
      const text = $(opt).text().trim();
      if (val) console.log('  ' + val + ' = ' + text);
    });
  }
});

// Find subject options
console.log('\n=== Subjects (first 10) ===');
$('select').each((i, el) => {
  const id = $(el).attr('id') || '';
  if (id.includes('SUBJECT')) {
    let count = 0;
    $(el).find('option').each((j, opt) => {
      if (count >= 10) return;
      const val = $(opt).attr('value');
      const text = $(opt).text().trim();
      if (val) { console.log('  ' + val + ' = ' + text); count++; }
    });
    console.log('  ... total options: ' + $(el).find('option').length);
  }
});

// Find hidden fields
console.log('\n=== Key Hidden Fields ===');
$('input[type="hidden"]').each((i, el) => {
  const name = $(el).attr('name') || '';
  const val = $(el).attr('value') || '';
  if (name === 'ICSID' || name === 'ICType' || name === 'ICElementNum' ||
      name === 'ICStateNum' || name === 'ICAction' || name.includes('INSTITUTION') ||
      name.includes('STRM')) {
    console.log('  ' + name + ' = ' + val);
  }
});
