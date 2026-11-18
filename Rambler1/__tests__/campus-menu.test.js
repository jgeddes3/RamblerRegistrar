// campus-menu.test.js — the top-bar menu is a campus menu: it no longer
// repeats the five tabs, and it lists the same campus links as More.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MenuOverlay from '../components/MenuOverlay';
import { CAMPUS_LINKS } from '../campus-links';

test('lists the campus links, not the tabs', async () => {
  await render(<MenuOverlay visible onClose={() => {}} onNavigate={() => {}} />);
  for (const tab of ['Home', 'Schedule', 'Search', 'Progress', 'More']) {
    expect(screen.queryByRole('button', { name: new RegExp(`^${tab}\\b`) })).toBeNull();
  }
  for (const link of CAMPUS_LINKS) expect(screen.getByText(link.label)).toBeTruthy();
});

test('a link opens its screen inside the More tab and closes the menu', async () => {
  const onNavigate = jest.fn();
  const onClose = jest.fn();
  await render(<MenuOverlay visible onClose={onClose} onNavigate={onNavigate} />);
  await fireEvent.press(screen.getByText('Library Hours'));
  expect(onNavigate).toHaveBeenCalledWith('More', { screen: 'Library' });
  expect(onClose).toHaveBeenCalled();
});

test('every campus link is a screen in the More stack', () => {
  const app = require('fs').readFileSync(require('path').join(__dirname, '..', 'App.js'), 'utf8');
  for (const link of CAMPUS_LINKS) expect(app).toContain(`<Stack.Screen name="${link.key}"`);
});
