import { buildRecommendations } from '../recommend';

const rem = (code, name = '') => ({ code, name });

describe('buildRecommendations', () => {
  test('focus courses come first with isFocus flags', () => {
    const out = buildRecommendations({
      remaining: [rem('COMP 271'), rem('COMP 317'), rem('MATH 131')],
      focusCourses: ['COMP 317'],
    });
    expect(out[0]).toEqual({ code: 'COMP 317', name: '', isFocus: true });
    expect(out.map((r) => r.code)).toEqual(['COMP 317', 'COMP 271', 'MATH 131']);
  });

  test('focus courses not in remaining still surface, after requirement-backed focus', () => {
    const out = buildRecommendations({
      remaining: [rem('COMP 271'), rem('COMP 317')],
      focusCourses: ['COMP 317', 'COMP 488'],
    });
    expect(out.map((r) => r.code)).toEqual(['COMP 317', 'COMP 488', 'COMP 271']);
    expect(out[1].isFocus).toBe(true);
  });

  test('excluded and placeholder rows never appear; dedupes; case-insensitive', () => {
    const out = buildRecommendations({
      remaining: [
        rem('comp 271'), rem('COMP 271'),
        { code: 'Any PHIL elective', is_placeholder: true },
        rem('MATH 131'),
      ],
      excludeCodes: ['MATH  131'],
    });
    expect(out.map((r) => r.code)).toEqual(['comp 271']);
  });

  test('limit caps output; empty inputs are safe', () => {
    const out = buildRecommendations({
      remaining: Array.from({ length: 10 }, (_, i) => rem(`C ${i}`)),
      limit: 4,
    });
    expect(out).toHaveLength(4);
    expect(buildRecommendations({})).toEqual([]);
  });
});
