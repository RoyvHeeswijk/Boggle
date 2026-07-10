import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { typography } from '../theme';

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];

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
    const delays = [0, 1000, 2000, 3000];
    const timers: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((delay, index) => {
      timers.push(
        setTimeout(() => {
          setDisplay(COUNTDOWN_STEPS[index]!);
          scale.value = 0.5;
          opacity.value = 0;
          scale.value = withSequence(
            withSpring(1.2, { damping: 8 }),
            withTiming(1, { duration: 200 }),
          );
          opacity.value = withTiming(1, { duration: 150 });

          if (index === COUNTDOWN_STEPS.length - 1 && !completedRef.current) {
            completedRef.current = true;
            setTimeout(onComplete, 800);
          }
        }, Math.max(0, startTimestamp - Date.now()) + delay),
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
