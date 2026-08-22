// PhoenixScreen.test.js — render tests with campus-api mocked.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockGetPhoenixHeadlines = jest.fn();
jest.mock(
  '../campus-api',
  () => ({
    getPhoenixHeadlines: (...args) => mockGetPhoenixHeadlines(...args),
  }),
  { virtual: true }
);

import PhoenixScreen from '../screens/PhoenixScreen';

const HEADLINES_FIXTURE = [
  {
    title: 'Rowers Win Big at Lake Michigan Regatta',
    link: 'https://loyolaphoenix.com/2026/08/rowers-win-big/',
    creator: 'Jane Reporter',
    categories: ['Sports', 'Rowing'],
    pubDate: 'Tue, 18 Aug 2026 14:30:00 +0000',
    publishedAt: '2026-08-18T14:30:00.000Z',
  },
  {
    title: 'Tuition & Fees Rise 4% — Students React',
    link: 'https://loyolaphoenix.com/2026/08/tuition-fees-rise/',
    creator: null,
    categories: ['News'],
    pubDate: 'Mon, 17 Aug 2026 09:00:00 +0000',
    publishedAt: '2026-08-17T09:00:00.000Z',
  },
];

beforeEach(() => {
  mockGetPhoenixHeadlines.mockReset();
});

describe('PhoenixScreen', () => {
  test('renders headline cards and opens the article on tap', async () => {
    mockGetPhoenixHeadlines.mockResolvedValue(HEADLINES_FIXTURE);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await render(<PhoenixScreen />);

    expect(await screen.findByText('Rowers Win Big at Lake Michigan Regatta')).toBeTruthy();
    expect(screen.getByText('Tuition & Fees Rise 4% — Students React')).toBeTruthy();
    // Section + author meta line for the first story; section only for the second.
    expect(screen.getByText('Sports — Jane Reporter')).toBeTruthy();
    expect(screen.getByText('News')).toBeTruthy();

    await fireEvent.press(screen.getByText('Rowers Win Big at Lake Michigan Regatta'));
    expect(openSpy).toHaveBeenCalledWith('https://loyolaphoenix.com/2026/08/rowers-win-big/');

    openSpy.mockRestore();
  });

  test('shows the unavailable state when the feed resolves empty', async () => {
    // campus-api's contract: [] on any failure (network, CORS) — and the paper
    // always has articles, so an empty list IS the failure state here.
    mockGetPhoenixHeadlines.mockResolvedValue([]);
    await render(<PhoenixScreen />);
    expect(await screen.findByText('Headlines unavailable right now')).toBeTruthy();
    expect(screen.getByText('Pull down to try again.')).toBeTruthy();
  });
});
