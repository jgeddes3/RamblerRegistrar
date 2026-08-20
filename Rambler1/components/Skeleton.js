// components/Skeleton.js — pulsing placeholder block for loading states.
// Use on screens whose loaded layout is known (rows, cards) so content fades
// in where it will appear instead of popping in after a spinner. Spinners stay
// correct for in-button/action feedback; this is for content areas.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const Skeleton = ({ width, height = 12, radius = 4, style }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#ECE8E4', opacity },
        style,
      ]}
    />
  );
};

export default Skeleton;
