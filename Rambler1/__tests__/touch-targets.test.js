// touch-targets.test.js — small controls reach 44 pt with hitSlop (Apple HIG;
// WCAG 2.5.8 asks for 24 pt at minimum).
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { slopTo, MIN_TARGET } from '../components/ui/hitSlop';
import MenuOverlay from '../components/MenuOverlay';

// Effective size along one axis: the laid-out size plus the slop either side.
const reach = (el, axis) => {
  const style = StyleSheet.flatten(el.props.style) || {};
  const slop = el.props.hitSlop || {};
  return axis === 'x'
    ? (style.width || 0) + (slop.left || 0) + (slop.right || 0)
    : (style.height || 0) + (slop.top || 0) + (slop.bottom || 0);
};

test('slopTo pads a control up to the minimum, and never shrinks one', () => {
  expect(MIN_TARGET).toBe(44);
  expect(slopTo(32)).toEqual({ top: 6, bottom: 6, left: 6, right: 6 });
  expect(slopTo(24, 30)).toEqual({ top: 7, bottom: 7, left: 10, right: 10 });
  expect(slopTo(60)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
});

test("the menu's close button reaches 44 pt both ways", async () => {
  await render(<MenuOverlay visible onClose={() => {}} onNavigate={() => {}} />);
  const close = screen.getByRole('button', { name: 'Close menu' });
  expect(reach(close, 'x')).toBeGreaterThanOrEqual(44);
  expect(reach(close, 'y')).toBeGreaterThanOrEqual(44);
});
