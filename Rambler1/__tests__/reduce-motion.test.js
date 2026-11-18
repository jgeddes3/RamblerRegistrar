// reduce-motion.test.js — with the system's Reduce Motion on, the skeleton
// stops pulsing and the quiz switches questions without a fade.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import useReduceMotion from '../components/ui/useReduceMotion';
import Skeleton from '../components/Skeleton';

let listener = null;
beforeEach(() => {
  listener = null;
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event, fn) => {
    if (event === 'reduceMotionChanged') listener = fn;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.restoreAllMocks());

const Probe = () => <Text>{useReduceMotion() ? 'reduced' : 'full'}</Text>;

test('reads the setting and follows changes to it', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  await render(<Probe />);
  expect(await screen.findByText('reduced')).toBeTruthy();
  await act(async () => listener(false));
  expect(screen.getByText('full')).toBeTruthy();
});

// Animated.loop stubbed: the test checks the loop is started (or stopped), not the frames.
const stubLoop = () => {
  const handle = { start: jest.fn(), stop: jest.fn() };
  const loop = jest.spyOn(Animated, 'loop').mockImplementation(() => handle);
  return { loop, handle };
};

test('the skeleton pulses normally', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const { handle } = stubLoop();
  await render(<Skeleton width={40} />);
  await waitFor(() => expect(handle.start).toHaveBeenCalled());
  expect(handle.stop).not.toHaveBeenCalled();
});

test('the skeleton holds still with Reduce Motion on', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const { loop, handle } = stubLoop();
  await render(<Skeleton width={40} />);
  // The setting arrives a moment after mount: any pulse begun before it stops.
  await waitFor(() => expect(handle.stop.mock.calls.length).toBe(handle.start.mock.calls.length));
  await new Promise((r) => setTimeout(r, 20));
  expect(loop.mock.calls.length).toBeLessThanOrEqual(1);
});
