import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getUnlockedAchievements } from '@/src/data/repositories/matchRepository';
import { ACHIEVEMENTS } from '@/src/core/achievements/achievements';

export default function AchievementsScreen() {
  const { palette, accent } = useTheme();
  const playerId = useSettingsStore((s) => s.playerId);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (playerId) {
      getUnlockedAchievements(playerId).then((ids) => setUnlocked(new Set(ids)));
    }
  }, [playerId]);

  return (
    <Screen
      title="Prestaties"
      subtitle={`${unlocked.size}/${ACHIEVEMENTS.length} vrijgespeeld`}
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Terug</Text>
        </Pressable>
      }
    >
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isUnlocked = unlocked.has(item.id);
          return (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isUnlocked ? accent.light : palette.surface,
                  borderColor: isUnlocked ? accent.primary : palette.border,
                  opacity: isUnlocked ? 1 : 0.5,
                },
              ]}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.badgeText}>
                <Text style={[styles.title, { color: palette.text }]}>{item.title}</Text>
                <Text style={[styles.desc, { color: palette.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              {isUnlocked && (
                <Text style={[styles.unlocked, { color: accent.primary }]}>✓</Text>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  badgeText: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
  },
  desc: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  unlocked: {
    fontSize: 20,
    fontWeight: '700',
  },
});
