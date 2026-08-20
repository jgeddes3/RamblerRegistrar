import {
  dayTransitions, homeCommute, campusOf, walkMinutesFromMeters,
  INTERCAMPUS_MINUTES, HOME_BUFFER_MINUTES, PREP_MINUTES,
} from '../commute-utils';

// LSC pair ~250m apart; WTC building ~13km south.
const BUILDINGS = [
  { id: 'cuneo', name: 'Cuneo Hall', latitude: 41.9990, longitude: -87.6570, campus: 'LSC' },
  { id: 'mundelein', name: 'Mundelein Center', latitude: 41.9994, longitude: -87.6600, campus: 'LSC' },
  { id: 'corboy', name: 'Corboy Law Center', latitude: 41.8970, longitude: -87.6260, campus: 'WTC' },
];

const block = (building, startMin, endMin) => ({
  day: 'Mo', startMin, endMin, section: { building },
});

describe('dayTransitions', () => {
  test('same-campus short walk with enough gap is ok', () => {
    const t = dayTransitions([block('Cuneo Hall', 540, 590), block('Mundelein Center', 605, 655)], BUILDINGS);
    expect(t).toHaveLength(1);
    expect(t[0].mode).toBe('walk');
    expect(t[0].status).toBe('ok');
    expect(t[0].gapMin).toBe(15);
    expect(t[0].neededMin).toBeLessThan(15);
  });

  test('cross-campus with a 15-minute gap is IMPOSSIBLE, not tight', () => {
    const t = dayTransitions([block('Cuneo Hall', 540, 590), block('Corboy Law Center', 605, 655)], BUILDINGS);
    expect(t[0].mode).toBe('shuttle');
    expect(t[0].neededMin).toBe(INTERCAMPUS_MINUTES);
    expect(t[0].status).toBe('impossible');
  });

  test('cross-campus with a big enough gap is ok', () => {
    const t = dayTransitions([block('Cuneo Hall', 540, 590), block('Corboy Law Center', 590 + 70, 720)], BUILDINGS);
    expect(t[0].status).toBe('ok');
  });

  test('same-campus with too-short gap is tight (hustle-able)', () => {
    // back-to-back different buildings, zero gap
    const t = dayTransitions([block('Cuneo Hall', 540, 590), block('Mundelein Center', 590, 640)], BUILDINGS);
    expect(t[0].mode).toBe('walk');
    expect(t[0].status).toBe('tight');
  });

  test('unknown building -> unknown status, no invented numbers', () => {
    const t = dayTransitions([block('Mystery Hall', 540, 590), block('Cuneo Hall', 600, 650)], BUILDINGS);
    expect(t[0].status).toBe('unknown');
    expect(t[0].neededMin).toBeNull();
  });

  test('same building back-to-back needs zero minutes', () => {
    const t = dayTransitions([block('Cuneo Hall', 540, 590), block('Cuneo Hall - Room 2', 590, 640)], BUILDINGS);
    expect(t[0].neededMin).toBe(0);
    expect(t[0].status).toBe('ok');
  });
});

describe('homeCommute', () => {
  const nearHome = { latitude: 41.9970, longitude: -87.6590 }; // few hundred meters from Cuneo

  test('walkable home gives leave-by and wake-by times', () => {
    const hc = homeCommute(nearHome, [block('Cuneo Hall', 540, 590)], BUILDINGS);
    expect(hc.mode).toBe('walk');
    expect(hc.minutes).toBeGreaterThan(0);
    expect(hc.leaveByMin).toBe(540 - hc.minutes - HOME_BUFFER_MINUTES);
    expect(hc.wakeByMin).toBe(hc.leaveByMin - PREP_MINUTES);
  });

  test('far home reports distance without inventing a time', () => {
    const farHome = { latitude: 41.8800, longitude: -87.6300 }; // downtown-ish
    const hc = homeCommute(farHome, [block('Cuneo Hall', 540, 590)], BUILDINGS);
    expect(hc.mode).toBe('far');
    expect(hc.minutes).toBeNull();
    expect(hc.leaveByMin).toBeNull();
    expect(hc.meters).toBeGreaterThan(2500);
  });

  test('uses the FIRST class of the day', () => {
    const hc = homeCommute(nearHome, [block('Mundelein Center', 700, 750), block('Cuneo Hall', 540, 590)], BUILDINGS);
    expect(hc.firstBlock.startMin).toBe(540);
  });

  test('no home / no classes -> null', () => {
    expect(homeCommute(null, [block('Cuneo Hall', 540, 590)], BUILDINGS)).toBeNull();
    expect(homeCommute(nearHome, [], BUILDINGS)).toBeNull();
  });
});

describe('campusOf / walkMinutesFromMeters', () => {
  test('partial building strings resolve to a campus', () => {
    expect(campusOf('Corboy Law Center - Room 522', BUILDINGS)).toBe('WTC');
    expect(campusOf('Cuneo Hall', BUILDINGS)).toBe('LSC');
    expect(campusOf('Nowhere', BUILDINGS)).toBeNull();
  });
  test('walk minutes model matches the app-wide constants', () => {
    expect(walkMinutesFromMeters(800)).toBe(13); // 800m * 1.3 / 80
  });
});
