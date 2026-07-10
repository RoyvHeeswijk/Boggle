import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, typography } from '../theme';

interface TimerDisplayProps {
  secondsRemaining: number;
  totalSeconds: number;
}

export function TimerDisplay({ secondsRemaining, totalSeconds }: TimerDisplayProps) {
  const { palette, accent } = useTheme();
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const isLow = secondsRemaining <= 10;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: palette.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isLow ? palette.error : accent.primary,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.time,
          { color: isLow ? palette.error : palette.text },
        ]}
      >
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  time: {
    ...typography.heading,
    fontVariant: ['tabular-nums'],
  },
});
