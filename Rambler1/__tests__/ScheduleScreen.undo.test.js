// ScheduleScreen.undo.test.js — a toast Undo works on the term the change was
// made in, even after the term chip was switched (it used to write the other
// term's ids into this one). RNTL v14: render() is ASYNC.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
jest.mock('../firestore-data', () => ({
  fetchSchedule: jest.fn(),
  saveSchedule: jest.fn(async () => ({ success: true })),
  getSectionsByClassNumbers: jest.fn(async (term, ids) => ids.map((id) => ({ class_number: id, subject: 'COMP', catalog_number: id, title: 't', section_number: '001' }))),
  searchCourses: jest.fn(async () => []),
  getCourseSections: jest.fn(async () => []),
  fetchBuildings: jest.fn(async () => []),
  fetchDegreeProgress: jest.fn(async () => null),
  fetchUserCoreProgress: jest.fn(async () => null),
  fetchWatches: jest.fn(async () => []),
  addWatch: jest.fn(), removeWatch: jest.fn(),
  addSectionToSchedule: jest.fn(),
  removeSectionFromSchedule: jest.fn(),
}));
jest.mock('../alert', () => jest.fn((t, m, buttons) => {
  const b = (buttons || []).find((x) => x.style === 'destructive'); if (b) b.onPress();
}));
jest.mock('../AppContext', () => {
  const ctx = { user: { uid: 'u1', isAnonymous: false }, selectedProgram: null, selectedProgram2: null, selectedMinors: [], selectedFocus: null,
    graduationYear: '2028', classYear: 'Junior', isHonors: false, isAthlete: false, userLocations: [], quizResults: null };
  return { useAppContext: () => ctx };
});
jest.mock('@react-navigation/native', () => { const React = require('react'); return { useFocusEffect: (e) => React.useEffect(e, [e]) }; });
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('../ics-export', () => ({ writeCacheFile: jest.fn() }));
jest.mock('../components/ScheduleGrid', () => () => null);
jest.mock('../components/GenerateScheduleModal', () => () => null);
jest.mock('../components/ScheduleMapModal', () => () => null);
jest.mock('../CourseDetailModal', () => () => null);
const ScheduleScreen = require('../screens/ScheduleScreen').default;
const { ToastProvider, ToastHost } = require('../components/ui/Toast');
const { fetchSchedule, saveSchedule, addSectionToSchedule, removeSectionFromSchedule } = require('../firestore-data');
const { __resetTermForTests } = require('../term');

test('Undo after switching term writes the right term', async () => {
  const NOV = new Date(2026, 10, 18);
  jest.useFakeTimers({ now: NOV, doNotFake: ['setTimeout','clearTimeout','setInterval','clearInterval','setImmediate','clearImmediate','nextTick','queueMicrotask','requestAnimationFrame','cancelAnimationFrame','requestIdleCallback','cancelIdleCallback','performance','hrtime'] });
  __resetTermForTests(NOV);
  const db = { '1272': ['111', '222'], '1266': ['900'] };
  fetchSchedule.mockImplementation(async (u, t) => ({ section_ids: [...(db[t] || [])] }));
  saveSchedule.mockImplementation(async (u, t, ids) => { db[t] = [...ids]; return { success: true }; });
  addSectionToSchedule.mockImplementation(async (u, t, id) => { db[t] = [...db[t], String(id)]; return { added: true }; });
  removeSectionFromSchedule.mockImplementation(async (u, t, id) => { db[t] = db[t].filter((x) => x !== String(id)); return { removed: true }; });
  await render(<ToastProvider><ScheduleScreen /><ToastHost /></ToastProvider>);
  await fireEvent.press(await screen.findByText('COMP 111'));
  await screen.findByText('Undo');
  await fireEvent.press(screen.getByText('Fall 2026'));
  await screen.findByText('COMP 900');
  await fireEvent.press(screen.getByText('Undo'));
  await waitFor(() => expect(addSectionToSchedule).toHaveBeenCalledWith('u1', '1272', '111'));
  expect(saveSchedule).toHaveBeenCalledTimes(1); // only the removal itself
  expect(db['1266']).toEqual(['900']); // the term on screen is untouched
  expect(db['1272'].sort()).toEqual(['111', '222']);
  jest.useRealTimers();
});
