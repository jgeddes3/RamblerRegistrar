// tappable.test.js — the shared pressable says what it is and what state
// it's in, so tabs, chips, options and toggles read right to screen readers.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Tappable from '../components/ui/Tappable';

test('a plain Tappable is a button', async () => {
  const onPress = jest.fn();
  await render(<Tappable onPress={onPress}><Text>Save</Text></Tappable>);
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(onPress).toHaveBeenCalled();
});

test('role and state go through: a selected tab, a checked radio', async () => {
  await render(
    <>
      <Tappable role="tab" selected onPress={() => {}}><Text>Major</Text></Tappable>
      <Tappable role="radio" checked={false} onPress={() => {}}><Text>Bug</Text></Tappable>
    </>
  );
  expect(screen.getByRole('tab', { name: 'Major' }).props.accessibilityState).toMatchObject({ selected: true });
  expect(screen.getByRole('radio', { name: 'Bug' }).props.accessibilityState).toMatchObject({ checked: false });
});

test('disabled is both announced and enforced', async () => {
  const onPress = jest.fn();
  await render(<Tappable disabled onPress={onPress}><Text>Next</Text></Tappable>);
  const btn = screen.getByRole('button', { name: 'Next' });
  expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.press(btn);
  expect(onPress).not.toHaveBeenCalled();
});
