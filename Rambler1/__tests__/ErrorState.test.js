// ErrorState.test.js — the shared "this failed, try again" block.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorState from '../components/ErrorState';

test('says what failed, what to do, and retries on press', async () => {
  const onRetry = jest.fn();
  await render(
    <ErrorState title="Couldn't load sections" message="Check your connection, then try again." onRetry={onRetry} />
  );
  expect(screen.getByText("Couldn't load sections")).toBeTruthy();
  expect(screen.getByText('Check your connection, then try again.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('the block and banner forms announce the failure to screen readers', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  await render(<ErrorState title="Couldn't load your progress" onRetry={() => {}} />);
  expect(announce).toHaveBeenCalledWith("Couldn't load your progress");
  announce.mockRestore();
});

test('the inline form stays quiet (a list can hold many of them)', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  await render(<ErrorState variant="inline" title="Couldn't load sections." onRetry={() => {}} />);
  expect(announce).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  announce.mockRestore();
});
