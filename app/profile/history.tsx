import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { getMatchHistory } from '@/src/data/repositories/matchRepository';
import type { Match } from '@/src/data/schema';
import { formatDuration } from '@/src/core/game/types';

export default function HistoryScreen() {
  const { palette, accent } = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    getMatchHistory().then(setMatches);
  }, []);

  return (
    <Screen
      title="Geschiedenis"
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Terug</Text>
        </Pressable>
      }
    >
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.textSecondary }]}>
            Nog geen wedstrijden gespeeld
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/profile/history/${item.id}`)}
            style={[styles.item, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <View>
              <Text style={[styles.date, { color: palette.textSecondary }]}>
                {new Date(item.playedAt).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={[styles.players, { color: palette.text }]}>
                {item.player1Name} vs {item.player2Name}
              </Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {item.boardSize}×{item.boardSize} · {formatDuration(item.durationSeconds)}
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.score, { color: accent.primary }]}>
                {item.player1Score} - {item.player2Score}
              </Text>
              {item.winnerId && (
                <Text style={[styles.winner, { color: palette.textSecondary }]}>
                  {item.winnerId === item.player1Id ? item.player1Name : item.player2Name}
                </Text>
              )}
              {item.isDraw && (
                <Text style={[styles.winner, { color: palette.textSecondary }]}>Gelijk</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  date: {
    ...typography.small,
  },
  players: {
    ...typography.bodyBold,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  score: {
    ...typography.subheading,
  },
  winner: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
