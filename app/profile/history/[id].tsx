import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography } from '@/src/ui/theme';
import { getMatchById } from '@/src/data/repositories/matchRepository';
import type { Match } from '@/src/data/schema';
import { formatDuration } from '@/src/core/game/types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, accent } = useTheme();
  const [match, setMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (id) getMatchById(id).then(setMatch);
  }, [id]);

  if (!match) {
    return (
      <Screen title="Wedstrijd">
        <Text style={{ color: palette.textSecondary }}>Laden...</Text>
      </Screen>
    );
  }

  const p1Words: string[] = JSON.parse(match.player1WordsJson);
  const p2Words: string[] = JSON.parse(match.player2WordsJson);
  const sharedWords: string[] = JSON.parse(match.sharedWordsJson);
  const uniqueWords = JSON.parse(match.uniqueWordsJson) as { playerId: string; word: string; points: number }[];

  return (
    <Screen
      title="Wedstrijd details"
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Terug</Text>
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card title={`${match.player1Name} vs ${match.player2Name}`}>
          <StatRow
            label="Datum"
            value={new Date(match.playedAt).toLocaleDateString('nl-NL')}
          />
          <StatRow label="Bord" value={`${match.boardSize}×${match.boardSize}`} />
          <StatRow label="Speeltijd" value={formatDuration(match.durationSeconds)} />
          <StatRow label="Score" value={`${match.player1Score} - ${match.player2Score}`} highlight />
          <StatRow label="Langste woord" value={match.longestWord || '-'} />
        </Card>

        <Card title={`Woorden ${match.player1Name} (${p1Words.length})`}>
          <Text style={[styles.words, { color: palette.textSecondary }]}>
            {p1Words.join(', ') || 'Geen woorden'}
          </Text>
        </Card>

        <Card title={`Woorden ${match.player2Name} (${p2Words.length})`}>
          <Text style={[styles.words, { color: palette.textSecondary }]}>
            {p2Words.join(', ') || 'Geen woorden'}
          </Text>
        </Card>

        {sharedWords.length > 0 && (
          <Card title="Dubbele woorden">
            <Text style={[styles.words, { color: palette.textSecondary }]}>
              {sharedWords.join(', ')}
            </Text>
          </Card>
        )}

        {uniqueWords.length > 0 && (
          <Card title="Unieke woorden">
            <Text style={[styles.words, { color: palette.textSecondary }]}>
              {uniqueWords.map((u) => `${u.word} (+${u.points})`).join(', ')}
            </Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  words: {
    ...typography.body,
    lineHeight: 24,
  },
});
