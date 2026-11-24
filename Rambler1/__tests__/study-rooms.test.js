import { STUDY_ROOM_LOCATIONS, bookingUrl, bookableFor } from '../study-rooms';

test('bookingUrl deep-links into the LibCal picker for a location', () => {
  expect(bookingUrl(10019)).toBe('https://libcal.luc.edu/spaces?lid=10019');
});

describe('bookableFor', () => {
  test('matches when either name contains the other, case-insensitively', () => {
    expect(bookableFor('Information Commons').lid).toBe(10019);
    expect(bookableFor('cudahy').lid).toBe(10022); // hours feed says "Cudahy"
    expect(bookableFor('Lewis Library (WTC)').lid).toBe(10020);
  });
  test('locations without study rooms, and blanks, are not bookable', () => {
    expect(bookableFor('Research Help Desk Hours')).toBeNull();
    expect(bookableFor('')).toBeNull();
    expect(bookableFor(null)).toBeNull();
  });
  test('every listed location is found by its own name', () => {
    for (const loc of STUDY_ROOM_LOCATIONS) expect(bookableFor(loc.name)).toBe(loc);
  });
});
