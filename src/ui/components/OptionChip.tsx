import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, typography } from '../theme';

interface OptionChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const { palette, accent } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent.light : palette.surfaceElevated,
          borderColor: selected ? accent.primary : palette.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? accent.dark : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface OptionGroupProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
}

export function OptionGroup({ options, value, onChange }: OptionGroupProps) {
  return (
    <View style={styles.group}>
      {options.map((opt) => (
        <OptionChip
          key={String(opt.value)}
          label={opt.label}
          selected={opt.value === value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
});
