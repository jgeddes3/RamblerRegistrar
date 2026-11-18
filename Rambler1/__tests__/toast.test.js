// toast.test.js — one shared toast: a short message, an optional Undo, read
// out to screen readers, gone after a few seconds. Replaces the success
// alerts that blocked the screen.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { AccessibilityInfo, Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ToastProvider, ToastHost, useToast, TOAST_MS } from '../components/ui/Toast';

const Trigger = ({ message, onUndo }) => {
  const toast = useToast();
  return (
    <TouchableOpacity onPress={() => toast.show({ message, actionLabel: onUndo ? 'Undo' : undefined, onAction: onUndo })}>
      <Text>go</Text>
    </TouchableOpacity>
  );
};
const App = (props) => (
  <ToastProvider>
    <Trigger {...props} />
    <ToastHost />
  </ToastProvider>
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('shows the message, reads it out, and goes away on its own', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  await render(<App message="COMP 170 added to Spring 2027." />);
  await fireEvent.press(screen.getByText('go'));
  expect(screen.getByText('COMP 170 added to Spring 2027.')).toBeTruthy();
  expect(announce).toHaveBeenCalledWith('COMP 170 added to Spring 2027.');
  await act(async () => { jest.advanceTimersByTime(TOAST_MS + 100); });
  expect(screen.queryByText('COMP 170 added to Spring 2027.')).toBeNull();
  announce.mockRestore();
});

test('Undo runs the action once and closes the toast', async () => {
  const onUndo = jest.fn();
  await render(<App message="Added." onUndo={onUndo} />);
  await fireEvent.press(screen.getByText('go'));
  await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Added.')).toBeNull();
});

test('without a provider, show() still tells the user (as an alert)', async () => {
  const alert = require('../alert');
  const spy = jest.spyOn(alert, 'default').mockImplementation(() => {});
  await render(<Trigger message="Saved." />);
  await fireEvent.press(screen.getByText('go'));
  expect(spy).toHaveBeenCalledWith('Saved.');
  spy.mockRestore();
});
