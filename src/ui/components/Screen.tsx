import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

export function Screen({ children, title, subtitle, headerRight }: ScreenProps) {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={[styles.title, { color: palette.text }]}>{title}</Text>}
            {subtitle && (
              <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
            )}
          </View>
          {headerRight}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
