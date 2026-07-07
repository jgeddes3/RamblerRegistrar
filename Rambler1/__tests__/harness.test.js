// Harness smoke test — proves jest-expo + RNTL render RN components.
// NOTE: @testing-library/react-native v14 render() is ASYNC (React 19) —
// always `await render(...)`; `screen` works after the awaited render.
import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';

test('jest-expo renders a react-native component', async () => {
  await render(<View><Text>harness-ok</Text></View>);
  expect(screen.getByText('harness-ok')).toBeTruthy();
});
