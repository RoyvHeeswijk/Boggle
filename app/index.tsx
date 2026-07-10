import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';

export default function HomeScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.logo, { color: accent.primary }]}>Boggle</Text>
        <Text style={[styles.logoSub, { color: palette.text }]}>Duel</Text>
        <Text style={[styles.greeting, { color: palette.textSecondary }]}>
          Hallo, {playerName}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Host Game" onPress={() => router.push('/host')} />
        <Button title="Join Game" variant="secondary" onPress={() => router.push('/join')} />
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/profile')} style={styles.footerLink}>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            Profiel & Statistieken
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} style={styles.footerLink}>
          <Text style={[styles.footerText, { color: palette.textMuted }]}>Instellingen</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
  },
  logoSub: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginTop: -8,
  },
  greeting: {
    ...typography.body,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  footerLink: {
    padding: spacing.sm,
  },
  footerText: {
    ...typography.caption,
  },
});
