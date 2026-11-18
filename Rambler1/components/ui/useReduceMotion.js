// useReduceMotion — true while the system's Reduce Motion setting is on
// (iOS Settings > Accessibility > Motion; Android "Remove animations").
// Starts false: the setting is only readable asynchronously, so a component
// may begin an animation and must stop it when this turns true.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useReduceMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => { if (alive) setReduced(!!on); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (on) => setReduced(!!on));
    return () => {
      alive = false;
      if (sub && sub.remove) sub.remove();
    };
  }, []);
  return reduced;
}
