// ScheduleMapModal.test.js — the day map opened from Home: fixed on today,
// with the campus events saved for the day.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockDayMap = jest.fn();
jest.mock('../components/DayMap', () => (props) => { mockDayMap(props); return null; });
jest.mock('../cta', () => ({
  transitEstimate: jest.fn(() => null),
  getTrainArrivals: jest.fn(async () => []),
}));

import ScheduleMapModal from '../components/ScheduleMapModal';

const BUILDINGS = [
  { id: 1, name: 'Damen Student Center', campus: 'LSC', latitude: 42.0, longitude: -87.66 },
  { id: 2, name: 'Cuneo Hall', campus: 'LSC', latitude: 42.001, longitude: -87.659 },
];
const SECTION = {
  subject: 'COMP', catalog_number: '271', class_number: 2841, building: 'Cuneo Hall',
  meeting_days: 'Sa', meeting_time_start: '10:00AM', meeting_time_end: '11:15AM',
};
const EVENTS = [
  { kind: 'event', key: 'event:jazz', title: 'Jazz Night', location: 'Damen Student Center, Ballroom',
    allDay: false, startMin: 19 * 60, endMin: 20 * 60 + 30, url: null },
  { kind: 'event', key: 'event:panel', title: 'Virtual Panel', location: 'Zoom',
    allDay: true, startMin: null, endMin: null, url: null },
];

beforeEach(() => mockDayMap.mockClear());

test('from the Schedule tab: the weekday chips and the usual title', async () => {
  await render(<ScheduleMapModal visible onClose={() => {}} sections={[]} buildings={BUILDINGS} home={null} />);
  expect(screen.getByText('Day Map')).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Show Mon' })).toBeTruthy();
  expect(screen.getByText('No classes this day.')).toBeTruthy();
  expect(screen.queryByText('Your events')).toBeNull();
});

test('fixed on a day: no chips, that day’s classes (a Saturday works)', async () => {
  await render(
    <ScheduleMapModal
      visible onClose={() => {}} title="Today's Map" fixedDay="Sa"
      sections={[SECTION]} buildings={BUILDINGS} home={null}
    />
  );
  expect(screen.getByText("Today's Map")).toBeTruthy();
  expect(screen.queryByRole('tab', { name: 'Show Mon' })).toBeNull();
  expect(screen.getByText('COMP 271')).toBeTruthy();
  expect(mockDayMap.mock.calls.at(-1)[0].stops).toHaveLength(1);
});

test('saved events are listed; one whose location names a building is pinned', async () => {
  await render(
    <ScheduleMapModal
      visible onClose={() => {}} fixedDay="Sa"
      sections={[SECTION]} events={EVENTS} buildings={BUILDINGS} home={null}
    />
  );
  expect(screen.getByText('Your events')).toBeTruthy();
  expect(screen.getByText('Jazz Night')).toBeTruthy();
  expect(screen.getByText('7:00 PM – 8:30 PM · Damen Student Center, Ballroom')).toBeTruthy();
  expect(screen.getByText('All day · Zoom')).toBeTruthy();
  // Only the Zoom event has no place on the map.
  expect(screen.getAllByText('Not on the map')).toHaveLength(1);

  const { stops, extras } = mockDayMap.mock.calls.at(-1)[0];
  expect(stops).toHaveLength(1); // the class: events stay out of the route
  expect(extras).toEqual([{
    latitude: 42.0, longitude: -87.66, title: 'Jazz Night',
    description: '7:00 PM – 8:30 PM · Damen Student Center',
  }]);
});

test('events on a day with no classes still get the map and the list', async () => {
  await render(
    <ScheduleMapModal
      visible onClose={() => {}} fixedDay="Su"
      sections={[SECTION]} events={EVENTS} buildings={BUILDINGS} home={null}
    />
  );
  expect(screen.getByText('No classes this day.')).toBeTruthy();
  expect(screen.getByText('Jazz Night')).toBeTruthy();
  expect(mockDayMap.mock.calls.at(-1)[0].extras).toHaveLength(1);
  // The home-address nudge is about the first class: not shown without one.
  expect(screen.queryByText(/Add your home address/)).toBeNull();
});
