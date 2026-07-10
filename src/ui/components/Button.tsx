import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
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
    secondary: {
      backgroundColor: palette.surfaceElevated,
      borderWidth: 2,
      borderColor: palette.border,
    },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: palette.error },
  };

  const shadowColors: Record<ButtonVariant, string> = {
    primary: accent.dark,
    secondary: palette.border,
    ghost: 'transparent',
    danger: '#B91C1C',
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: palette.text,
    ghost: accent.primary,
    danger: '#FFFFFF',
  };

  const isChunky = variant === 'primary' || variant === 'danger';

  return (
    <View style={[fullWidth && styles.wrapper, fullWidth && styles.fullWidth]}>
      {isChunky && !disabled && !loading && (
        <View
          style={[
            styles.shadow,
            { backgroundColor: shadowColors[variant] },
            fullWidth && styles.fullWidth,
          ]}
        />
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          variantStyles[variant],
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabled,
          isChunky && pressed && styles.pressedChunky,
          !isChunky && pressed && styles.pressedFlat,
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: radius.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
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
  pressedChunky: {
    transform: [{ translateY: 3 }],
  },
  pressedFlat: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    ...typography.bodyBold,
    fontSize: 17,
  },
});
