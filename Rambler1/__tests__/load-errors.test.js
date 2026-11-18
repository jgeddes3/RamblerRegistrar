// load-errors.test.js — a failed read shows what failed and a Try again
// button, instead of passing for "nothing here" (course detail) or an empty
// screen (Progress, Home).
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockData = {
  getCourseSections: jest.fn(),
  fetchCourseDetail: jest.fn(async () => null),
  fetchWatches: jest.fn(async () => []),
  fetchDegreeProgress: jest.fn(),
  fetchUserCoreProgress: jest.fn(),
  fetchPrerequisites: jest.fn(async () => []),
  fetchUserCourses: jest.fn(async () => []),
  addUserCourse: jest.fn(async () => ({})),
  fetchSchedule: jest.fn(),
  getSectionsByClassNumbers: jest.fn(async () => []),
  fetchUserPrimaryLocation: jest.fn(async () => null),
};
jest.mock('../firestore-data', () => ({
  // Lazy wrappers: this factory runs before mockData is initialised.
  getCourseSections: (...a) => mockData.getCourseSections(...a),
  fetchCourseDetail: (...a) => mockData.fetchCourseDetail(...a),
  fetchWatches: (...a) => mockData.fetchWatches(...a),
  fetchDegreeProgress: (...a) => mockData.fetchDegreeProgress(...a),
  fetchUserCoreProgress: (...a) => mockData.fetchUserCoreProgress(...a),
  fetchPrerequisites: (...a) => mockData.fetchPrerequisites(...a),
  fetchUserCourses: (...a) => mockData.fetchUserCourses(...a),
  addUserCourse: (...a) => mockData.addUserCourse(...a),
  fetchSchedule: (...a) => mockData.fetchSchedule(...a),
  getSectionsByClassNumbers: (...a) => mockData.getSectionsByClassNumbers(...a),
  fetchUserPrimaryLocation: (...a) => mockData.fetchUserPrimaryLocation(...a),
  addWatch: jest.fn(), removeWatch: jest.fn(), addCourseToPlan: jest.fn(), addSectionToSchedule: jest.fn(),
  PLAN_TERM_CAP: 15,
}));
const mockContext = { current: {} };
jest.mock('../AppContext', () => ({ useAppContext: () => mockContext.current }));
jest.mock('../ratings', () => ({
  getInstructorRating: jest.fn(async () => null), noRatingCopy: () => '', ratingsAttribution: () => '',
}));
jest.mock('../components/TrendChart', () => () => null);
jest.mock('../components/FeedbackModal', () => () => null);
jest.mock('../auth', () => ({ getIdToken: jest.fn(async () => 'token') }));
const mockLibrary = jest.fn();
jest.mock('../campus-api', () => ({
  getLibraryHours: (...a) => mockLibrary(...a),
  getEventsToday: jest.fn(async () => []),
  getPhoenixHeadlines: jest.fn(async () => []),
}));
jest.mock('../cta', () => ({
  nearestStation: () => ({}), getTrainArrivals: jest.fn(async () => []), groupArrivalsBothWays: () => [],
}));
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb) => React.useEffect(cb, [cb]),
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});
jest.mock('../term', () => {
  const actual = jest.requireActual('../term');
  return { ...actual, inSessionTermFor: () => ({ code: '1266', label: 'Fall 2026' }) };
});

import CourseDetailModal from '../CourseDetailModal';
import ProgressScreen from '../screens/ProgressScreen';
import Home from '../Home';

const USER = { uid: 'u1', isAnonymous: false, displayName: 'Sam Lee' };
const COURSE = { code: 'COMP 170', name: 'Intro to Object-Oriented Programming', credits: 3 };
const PROGRAM = { id: 'p1', name: 'Computer Science', degree: 'BS', school: 'CAS' };
const DEGREE = { creditsCompleted: 12, totalCreditsRequired: 48, percentComplete: 25, completed: [], remaining: [] };
const CORE = { completedCredits: 9, totalCredits: 45, percentComplete: 20, areas: [] };

beforeEach(() => {
  for (const fn of Object.values(mockData)) fn.mockClear();
  mockData.getCourseSections.mockReset();
  mockData.fetchDegreeProgress.mockReset();
  mockData.fetchUserCoreProgress.mockReset();
  mockData.fetchSchedule.mockReset();
  mockLibrary.mockReset().mockResolvedValue({ locations: [] });
  mockContext.current = { user: USER };
});

describe('course detail', () => {
  test('a failed sections read offers Try again, not "No sections found"', async () => {
    mockData.getCourseSections.mockResolvedValueOnce(null).mockResolvedValueOnce([]);
    await render(<CourseDetailModal visible course={COURSE} onClose={() => {}} />);
    expect(await screen.findByText("Couldn't load sections")).toBeTruthy();
    expect(screen.queryByText('No sections found')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No sections found')).toBeTruthy();
    expect(mockData.getCourseSections).toHaveBeenCalledTimes(2);
  });
});

describe('progress', () => {
  beforeEach(() => {
    mockContext.current = { user: USER, selectedProgram: PROGRAM, selectedMinors: [], selectedCourses: [] };
  });

  test('nothing loaded: a full error with Try again instead of 0 credits', async () => {
    mockData.fetchDegreeProgress.mockResolvedValueOnce(null).mockResolvedValue(DEGREE);
    mockData.fetchUserCoreProgress.mockResolvedValueOnce(null).mockResolvedValue(CORE);
    await render(<ProgressScreen />);
    expect(await screen.findByText("Couldn't load your progress")).toBeTruthy();
    expect(screen.queryByText('Degree Overview')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Degree Overview')).toBeTruthy();
    expect(screen.queryByText("Couldn't load your progress")).toBeNull();
  });

  test('part loaded: the screen shows with a banner to retry the rest', async () => {
    mockData.fetchDegreeProgress.mockResolvedValue(DEGREE);
    mockData.fetchUserCoreProgress.mockResolvedValueOnce(null).mockResolvedValue(CORE);
    await render(<ProgressScreen />);
    expect(await screen.findByText('Degree Overview')).toBeTruthy();
    expect(screen.getByText("Some of your progress didn't load.")).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByText("Some of your progress didn't load.")).toBeNull());
  });
});

describe('home', () => {
  // Stable arrays, as AppContext provides: Home's focus effect depends on them.
  const NONE = [];
  beforeEach(() => { mockContext.current = { user: USER, selectedMinors: NONE, selectedCourses: NONE }; });

  test("a failed schedule read offers Try again", async () => {
    mockData.fetchSchedule.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ section_ids: [] });
    await render(<Home />);
    expect(await screen.findByText("Couldn't load your schedule")).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again loading your schedule' }));
    expect(await screen.findByText('Build your schedule')).toBeTruthy();
  });

  test('failed library hours say so and retry; an empty list still reads "Hours unavailable"', async () => {
    mockLibrary.mockResolvedValueOnce(null).mockResolvedValue({ locations: [] });
    await render(<Home />);
    expect(await screen.findByText("Couldn't load library hours")).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again loading library hours' }));
    expect(await screen.findByText('Hours unavailable')).toBeTruthy();
  });
});

describe('seat-count age on course detail', () => {
  const { seatAge } = require('../seat-age');
  const section = (n, readAt) => ({
    id: n, class_number: n, section_number: n, enrollment_cap: 30, enrollment_total: 20, enrollment_read_at: readAt,
  });

  test('says when seats were read and to confirm in LOCUS; flags a row read days earlier', async () => {
    const now = new Date().toISOString();
    const old = new Date(Date.now() - 4 * 86400000).toISOString();
    mockData.getCourseSections.mockResolvedValueOnce([section('001', now), section('002', old)]);
    await render(<CourseDetailModal visible course={COURSE} onClose={() => {}} />);
    expect(await screen.findByText(`${seatAge(now).label}. Confirm in LOCUS before you register.`)).toBeTruthy();
    expect(screen.getByText(`${seatAge(old).label}, may have changed`)).toBeTruthy();
  });

  test('without a read time it still says to confirm in LOCUS', async () => {
    mockData.getCourseSections.mockResolvedValueOnce([section('001', null)]);
    await render(<CourseDetailModal visible course={COURSE} onClose={() => {}} />);
    expect(await screen.findByText('Confirm in LOCUS before you register.')).toBeTruthy();
  });
});
