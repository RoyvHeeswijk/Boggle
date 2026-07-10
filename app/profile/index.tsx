import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Card, StatRow } from '@/src/ui/components/Card';
import { Button } from '@/src/ui/components/Button';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import {
  getPlayerStats,
  getAllHeadToHead,
  getUnlockedAchievements,
  getProfile,
} from '@/src/data/repositories/matchRepository';
import type { PlayerStats, HeadToHead } from '@/src/data/schema';
import { getEloTier } from '@/src/core/elo/elo';
import { ACHIEVEMENTS } from '@/src/core/achievements/achievements';

export default function ProfileScreen() {
  const { palette, accent } = useTheme();
  const playerId = useSettingsStore((s) => s.playerId);
  const playerName = useSettingsStore((s) => s.playerName);

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [elo, setElo] = useState(1200);
  const [h2hList, setH2hList] = useState<HeadToHead[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    if (!playerId) return;
    Promise.all([
      getPlayerStats(playerId),
      getProfile(playerId),
      getAllHeadToHead(playerId),
      getUnlockedAchievements(playerId),
    ]).then(([s, p, h2h, achievements]) => {
      setStats(s);
      setElo(p?.elo ?? 1200);
      setH2hList(h2h);
      setUnlockedCount(achievements.length);
    });
  }, [playerId]);

  const winRate = stats && stats.totalMatches > 0
    ? Math.round((stats.wins / stats.totalMatches) * 100)
    : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        title="Profiel"
        subtitle={playerName}
        headerRight={
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: accent.primary, ...typography.body }}>Sluiten</Text>
          </Pressable>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Card title={`ELO: ${elo}`} subtitle={getEloTier(elo)}>
            <StatRow label="Rang" value={getEloTier(elo)} highlight />
          </Card>

          <Card title="Algemene statistieken">
            <StatRow label="Gespeelde wedstrijden" value={stats?.totalMatches ?? 0} />
            <StatRow label="Gewonnen" value={stats?.wins ?? 0} />
            <StatRow label="Verloren" value={stats?.losses ?? 0} />
            <StatRow label="Gelijkspel" value={stats?.draws ?? 0} />
            <StatRow label="Winpercentage" value={`${winRate}%`} highlight />
            <StatRow label="Totale score" value={stats?.totalScore ?? 0} />
            <StatRow label="Totaal woorden" value={stats?.totalWords ?? 0} />
            <StatRow
              label="Gem. woorden"
              value={
                stats && stats.totalMatches > 0
                  ? (stats.totalWords / stats.totalMatches).toFixed(1)
                  : '0'
              }
            />
            <StatRow
              label="Gem. score"
              value={
                stats && stats.totalMatches > 0
                  ? (stats.totalScore / stats.totalMatches).toFixed(1)
                  : '0'
              }
            />
          </Card>

          <Card title="Records">
            <StatRow label="Hoogste score" value={stats?.highestScore ?? 0} highlight />
            <StatRow label="Meeste woorden" value={stats?.mostWords ?? 0} />
            <StatRow label="Langste woord" value={stats?.longestWord || '-'} />
            <StatRow label="Langste winreeks" value={stats?.longestWinStreak ?? 0} />
            <StatRow label="Grootste overwinning" value={stats?.biggestWin ?? 0} />
            <StatRow label="Meeste unieke woorden" value={stats?.mostUniqueWords ?? 0} />
          </Card>

          {h2hList.length > 0 && (
            <Card title="Head-to-head">
              {h2hList.slice(0, 3).map((h2h) => {
                const isP1 = h2h.player1Id === playerId;
                const opponentName = isP1 ? h2h.player2Name : h2h.player1Name;
                const myWins = isP1 ? h2h.player1Wins : h2h.player2Wins;
                const theirWins = isP1 ? h2h.player2Wins : h2h.player1Wins;
                return (
                  <View key={h2h.id} style={styles.h2hRow}>
                    <Text style={[styles.h2hName, { color: palette.text }]}>
                      vs {opponentName}
                    </Text>
                    <Text style={[styles.h2hScore, { color: palette.textSecondary }]}>
                      {myWins}W - {theirWins}L · {h2h.totalMatches} gespeeld
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}

          <View style={styles.nav}>
            <NavButton
              label="Geschiedenis"
              onPress={() => router.push('/profile/history')}
            />
            <NavButton
              label="Head-to-head"
              onPress={() => router.push('/profile/head-to-head')}
            />
            <NavButton
              label={`Prestaties (${unlockedCount}/${ACHIEVEMENTS.length})`}
              onPress={() => router.push('/profile/achievements')}
            />
            <NavButton
              label="Periode stats"
              onPress={() => router.push('/profile/stats')}
            />
          </View>

          <Button title="Terug" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </Screen>
    </>
  );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette, accent } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
    >
      <Text style={[styles.navLabel, { color: accent.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  h2hRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  h2hName: {
    ...typography.bodyBold,
  },
  h2hScore: {
    ...typography.caption,
  },
  nav: {
    gap: spacing.sm,
  },
  navButton: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  navLabel: {
    ...typography.bodyBold,
  },
});
