// Tappable — a TouchableOpacity that always tells screen readers what it is
// and what state it's in. Before this, 2 of 152 touchables had a role and
// none had a state, so a selected tab or a picked option sounded the same as
// any other button.
//
// role:     'button' (default) | 'tab' | 'radio' | 'checkbox' | 'switch' | 'link'
// selected: tabs and toggle chips (which one is on)
// checked:  radio, checkbox and switch options
// disabled: announced, and presses are ignored
// busy:     an action in flight
import React, { forwardRef } from 'react';
import { TouchableOpacity } from 'react-native';

const Tappable = forwardRef(({ role = 'button', selected, checked, disabled, busy, accessibilityState, ...rest }, ref) => {
  const state = { ...accessibilityState };
  if (selected !== undefined) state.selected = !!selected;
  if (checked !== undefined) state.checked = !!checked;
  if (disabled !== undefined) state.disabled = !!disabled;
  if (busy !== undefined) state.busy = !!busy;
  return (
    <TouchableOpacity
      ref={ref}
      accessibilityRole={role}
      accessibilityState={state}
      disabled={!!disabled}
      {...rest}
    />
  );
});

export default Tappable;
