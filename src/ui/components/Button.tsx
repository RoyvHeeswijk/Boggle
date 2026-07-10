import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { palette, accent } = useTheme();

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: accent.primary },
    secondary: { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: palette.error },
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: palette.text,
    ghost: accent.primary,
    danger: '#FFFFFF',
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, { color: textColors[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    ...typography.bodyBold,
  },
});
