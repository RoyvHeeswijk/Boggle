import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, typography } from '../theme';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
}

export function Card({ title, subtitle, children, style, ...props }: CardProps) {
  const { palette } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}
      {...props}
    >
      {title && <Text style={[styles.title, { color: palette.text }]}>{title}</Text>}
      {subtitle && (
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
      )}
      {children}
    </View>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function StatRow({ label, value, highlight }: StatRowProps) {
  const { palette, accent } = useTheme();

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { color: highlight ? accent.primary : palette.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.subheading,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.body,
  },
  statValue: {
    ...typography.bodyBold,
  },
});
