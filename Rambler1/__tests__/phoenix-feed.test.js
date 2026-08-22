import { parsePhoenixFeed } from '../campus-api';

// Realistic slice of the Loyola Phoenix WordPress RSS 2.0 feed.
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>The Loyola Phoenix</title>
  <link>https://loyolaphoenix.com</link>
  <item>
    <title><![CDATA[Rowers Win Big at Lake Michigan Regatta]]></title>
    <link>https://loyolaphoenix.com/2026/08/rowers-win-big/</link>
    <dc:creator><![CDATA[Jane Reporter]]></dc:creator>
    <pubDate>Tue, 18 Aug 2026 14:30:00 +0000</pubDate>
    <category><![CDATA[Sports]]></category>
    <category><![CDATA[Rowing]]></category>
    <description><![CDATA[The team took first place.]]></description>
  </item>
  <item>
    <title>Tuition &amp; Fees Rise 4% &#8212; Students React</title>
    <link>https://loyolaphoenix.com/2026/08/tuition-fees-rise/</link>
    <pubDate>Mon, 17 Aug 2026 09:00:00 +0000</pubDate>
    <category>News</category>
  </item>
</channel>
</rss>`;

describe('parsePhoenixFeed', () => {
  test('parses items: title, link, creator, categories, pubDate', () => {
    const items = parsePhoenixFeed(FEED);
    expect(items).toHaveLength(2);

    expect(items[0].title).toBe('Rowers Win Big at Lake Michigan Regatta');
    expect(items[0].link).toBe('https://loyolaphoenix.com/2026/08/rowers-win-big/');
    expect(items[0].creator).toBe('Jane Reporter');
    expect(items[0].categories).toEqual(['Sports', 'Rowing']);
    expect(items[0].pubDate).toBe('Tue, 18 Aug 2026 14:30:00 +0000');
  });

  test('publishedAt is an ISO string derived from pubDate', () => {
    const items = parsePhoenixFeed(FEED);
    expect(items[0].publishedAt).toBe('2026-08-18T14:30:00.000Z');
  });

  test('decodes entities in non-CDATA titles (named and numeric)', () => {
    const items = parsePhoenixFeed(FEED);
    expect(items[1].title).toBe('Tuition & Fees Rise 4% — Students React');
    expect(items[1].categories).toEqual(['News']);
    expect(items[1].creator).toBeNull();
  });

  test('skips items missing a title or link', () => {
    const feed = `<rss><channel>
      <item><title>Orphan</title></item>
      <item><link>https://loyolaphoenix.com/x/</link></item>
      <item><title>Kept</title><link>https://loyolaphoenix.com/kept/</link></item>
    </channel></rss>`;
    const items = parsePhoenixFeed(feed);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Kept');
  });

  test('invalid pubDate yields null publishedAt, item still kept', () => {
    const feed = `<rss><channel><item>
      <title>No date</title>
      <link>https://loyolaphoenix.com/no-date/</link>
      <pubDate>not a date</pubDate>
    </item></channel></rss>`;
    const items = parsePhoenixFeed(feed);
    expect(items).toHaveLength(1);
    expect(items[0].publishedAt).toBeNull();
  });

  test('empty, null, or garbage input resolves to []', () => {
    expect(parsePhoenixFeed('')).toEqual([]);
    expect(parsePhoenixFeed(null)).toEqual([]);
    expect(parsePhoenixFeed(undefined)).toEqual([]);
    expect(parsePhoenixFeed('<html>not rss</html>')).toEqual([]);
    expect(parsePhoenixFeed(12345)).toEqual([]);
  });
});
