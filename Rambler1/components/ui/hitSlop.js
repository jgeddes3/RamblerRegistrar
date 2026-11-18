// hitSlop — grow a small control's touch area to the 44 pt minimum (Apple
// HIG; WCAG 2.5.8 asks for at least 24) without changing how it looks.
// slopTo(width, height = width) -> the hitSlop that pads it out to 44.
export const MIN_TARGET = 44;

const pad = (size) => Math.max(0, Math.ceil((MIN_TARGET - size) / 2));

export function slopTo(width, height = width) {
  const x = pad(width);
  const y = pad(height);
  return { top: y, bottom: y, left: x, right: x };
}
