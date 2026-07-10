import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getAllHeadToHead } from '@/src/data/repositories/matchRepository';
import type { HeadToHead } from '@/src/data/schema';

export default function HeadToHeadScreen() {
  const { palette, accent } = useTheme();
  const playerId = useSettingsStore((s) => s.playerId);
  const [records, setRecords] = useState<HeadToHead[]>([]);

  useEffect(() => {
    if (playerId) getAllHeadToHead(playerId).then(setRecords);
  }, [playerId]);

  return (
    <Screen
      title="Head-to-head"
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Terug</Text>
        </Pressable>
      }
    >
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.textSecondary }]}>
            Nog geen head-to-head statistieken
          </Text>
        }
        renderItem={({ item }) => {
          const isP1 = item.player1Id === playerId;
          const opponent = isP1 ? item.player2Name : item.player1Name;
          const myWins = isP1 ? item.player1Wins : item.player2Wins;
          const theirWins = isP1 ? item.player2Wins : item.player1Wins;
          const myScore = isP1 ? item.player1TotalScore : item.player2TotalScore;
          const myStreak = isP1 ? item.player1CurrentStreak : item.player2CurrentStreak;
          const myLongestStreak = isP1 ? item.player1LongestStreak : item.player2LongestStreak;

          return (
            <Card title={`vs ${opponent}`}>
              <StatRow label="Gespeeld" value={item.totalMatches} />
              <StatRow label="Winst" value={myWins} highlight />
              <StatRow label="Verlies" value={theirWins} />
              <StatRow label="Gelijkspel" value={item.draws} />
              <StatRow label="Totale score" value={myScore} />
              <StatRow
                label="Gem. score"
                value={item.totalMatches > 0 ? (myScore / item.totalMatches).toFixed(1) : '0'}
              />
              <StatRow label="Huidige winreeks" value={myStreak} />
              <StatRow label="Langste winreeks" value={myLongestStreak} />
              <StatRow label="Grootste overwinning" value={item.biggestWinMargin} />
              <StatRow label="Hoogste gezamenlijke score" value={item.highestCombinedScore} />
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
