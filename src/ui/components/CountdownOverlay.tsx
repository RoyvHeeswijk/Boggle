import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { typography } from '../theme';

const COUNTDOWN_STEPS = [
  { text: '3', offsetMs: -3000 },
  { text: '2', offsetMs: -2000 },
  { text: '1', offsetMs: -1000 },
  { text: 'GO!', offsetMs: 0 },
];

interface CountdownOverlayProps {
  startTimestamp: number;
  onComplete: () => void;
}

export function CountdownOverlay({ startTimestamp, onComplete }: CountdownOverlayProps) {
  const { palette, accent } = useTheme();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const [display, setDisplay] = React.useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    COUNTDOWN_STEPS.forEach((step) => {
      const fireAt = startTimestamp + step.offsetMs;
      const delay = Math.max(0, fireAt - Date.now());

      timers.push(
        setTimeout(() => {
          setDisplay(step.text);
          scale.value = 0.5;
          opacity.value = 0;
          scale.value = withSequence(
            withSpring(1.2, { damping: 8 }),
            withTiming(1, { duration: 200 }),
          );
          opacity.value = withTiming(1, { duration: 150 });

          if (step.offsetMs === 0 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
        }, delay),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [startTimestamp, onComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
      <Animated.Text
        style={[
          styles.text,
          { color: display === 'GO!' ? accent.primary : palette.text },
          animatedStyle,
        ]}
      >
        {display}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    ...typography.countdown,
  },
});
