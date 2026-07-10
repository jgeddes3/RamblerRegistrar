import { buildTrendBars, shortDate } from '../components/TrendChart';

const pt = (total, cap, waitlist, date = '2026-07-01T15') => ({ date, total, cap, waitlist });

describe('buildTrendBars', () => {
  test('scales enrollment against each point cap', () => {
    const bars = buildTrendBars([pt(10, 20, 0), pt(20, 20, 0)]);
    expect(bars).toHaveLength(2);
    expect(bars[0].enroll).toBe(0.5);
    expect(bars[1].enroll).toBe(1);
    expect(bars[1].over).toBe(true);
  });

  test('waitlist scales against the same denominator', () => {
    const bars = buildTrendBars([pt(20, 20, 5), pt(20, 20, 10)]);
    expect(bars[0].waitlist).toBe(0.25);
    expect(bars[1].waitlist).toBe(0.5);
  });

  test('missing waitlist (older points) is treated as zero', () => {
    const bars = buildTrendBars([
      { date: '2026-06-01T15', total: 5, cap: 10 },
      { date: '2026-06-02T15', total: 6, cap: 10 },
    ]);
    expect(bars[0].waitlist).toBe(0);
  });

  test('cap-less data falls back to max total seen', () => {
    const bars = buildTrendBars([pt(5, 0, 0), pt(10, 0, 0)]);
    expect(bars[1].enroll).toBe(1);
    expect(bars[0].enroll).toBe(0.5);
  });

  test('fewer than 2 usable points -> [] (chart hides)', () => {
    expect(buildTrendBars([pt(5, 10, 0)])).toEqual([]);
    expect(buildTrendBars([])).toEqual([]);
    expect(buildTrendBars(null)).toEqual([]);
    expect(buildTrendBars([{ date: 'x' }, { date: 'y' }])).toEqual([]);
  });

  test('caps at maxBars, keeping the most recent', () => {
    const history = Array.from({ length: 40 }, (_, i) => pt(i, 40, 0, `2026-06-${String(i % 28 + 1).padStart(2, '0')}T15`));
    const bars = buildTrendBars(history, 30);
    expect(bars).toHaveLength(30);
    expect(bars[bars.length - 1].enroll).toBe(39 / 40);
  });

  test('over-cap enrollment clamps to 1 and flags over', () => {
    const bars = buildTrendBars([pt(25, 20, 0), pt(30, 20, 0)]);
    expect(bars[1].enroll).toBe(1);
    expect(bars[1].over).toBe(true);
  });
});

describe('shortDate', () => {
  test('formats snapshot dates', () => {
    expect(shortDate('2026-07-01T15')).toBe('Jul 1');
    expect(shortDate('2026-12-25')).toBe('Dec 25');
    expect(shortDate('junk')).toBe('');
  });
});
