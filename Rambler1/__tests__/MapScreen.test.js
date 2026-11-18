// MapScreen.test.js — the campus map must not rebuild every pin while the user
// types in the route search box.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

let mockMarkerRenders = 0;
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef(({ children }, ref) => React.createElement(View, null, children));
  const Marker = ({ children }) => {
    mockMarkerRenders += 1;
    return React.createElement(View, null, children);
  };
  const Passthrough = ({ children }) => React.createElement(View, null, children);
  return { __esModule: true, default: MapView, Marker, Callout: Passthrough, Polyline: Passthrough };
});
jest.mock('../firestore-data', () => ({
  fetchBuildings: jest.fn(),
  fetchSchedule: jest.fn(async () => null),
  getSectionsByClassNumbers: jest.fn(async () => []),
  fetchUserPrimaryLocation: jest.fn(async () => null),
}));
jest.mock('../AppContext', () => {
  const ctx = { user: { uid: 'u1', isAnonymous: false } };
  return { useAppContext: () => ctx };
});

import MapScreen from '../screens/MapScreen.native';
import { fetchBuildings } from '../firestore-data';

const BUILDINGS = Array.from({ length: 60 }, (_, i) => ({
  id: `B${i}`,
  name: `Building ${i}`,
  address: `${i} W Sheridan Rd`,
  latitude: 42 + i / 10000,
  longitude: -87.66,
  campus: 'LSC',
}));

beforeEach(() => {
  mockMarkerRenders = 0;
  fetchBuildings.mockReset().mockResolvedValue(BUILDINGS);
});

test('typing in the route search does not re-render the building pins', async () => {
  await render(<MapScreen />);
  await waitFor(() => expect(mockMarkerRenders).toBeGreaterThanOrEqual(BUILDINGS.length));

  await fireEvent.press(screen.getByLabelText('Build a walking route between buildings'));
  const before = mockMarkerRenders;

  const box = screen.getByPlaceholderText('Add a starting building...');
  await fireEvent.changeText(box, 'B');
  await fireEvent.changeText(box, 'Bu');
  await fireEvent.changeText(box, 'Bui');

  expect(mockMarkerRenders).toBe(before);
});
