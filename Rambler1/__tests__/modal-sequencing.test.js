// afterModalDismiss: do something only once a just-closed native Modal has
// finished going away.
//
// On iOS, presenting an Alert or a second Modal, or unmounting the screen, in
// the same tick a Modal starts dismissing can leave a dead overlay that eats
// every touch (the "can't close the page" freeze fixed once already in
// WhatIfModal). Android dialogs don't have that race.

const load = (os) => {
  jest.resetModules();
  jest.doMock('react-native', () => ({ Platform: { OS: os } }));
  return require('../modal-sequencing');
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.dontMock('react-native');
});

test('on iOS the follow-up waits for the dismissal instead of running in the same tick', () => {
  const { afterModalDismiss, MODAL_DISMISS_MS } = load('ios');
  const next = jest.fn();
  afterModalDismiss(next);
  expect(next).not.toHaveBeenCalled();
  jest.advanceTimersByTime(MODAL_DISMISS_MS - 1);
  expect(next).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(next).toHaveBeenCalledTimes(1);
});

test('the iOS wait covers the modal slide-out animation', () => {
  expect(load('ios').MODAL_DISMISS_MS).toBeGreaterThanOrEqual(400);
});

test('on Android and web the follow-up runs at once', () => {
  for (const os of ['android', 'web']) {
    const next = jest.fn();
    load(os).afterModalDismiss(next);
    expect(next).toHaveBeenCalledTimes(1);
  }
});
