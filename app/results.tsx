import React from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography } from '@/src/ui/theme';
import { useGameStore } from '@/src/state/gameStore';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getAchievementById } from '@/src/core/achievements/achievements';

export default function ResultsScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const matchResult = useGameStore((s) => s.matchResult);
  const role = useGameStore((s) => s.role);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const eloChange = useGameStore((s) => s.eloChange);
  const newAchievements = useGameStore((s) => s.newAchievements);
  const rematch = useGameStore((s) => s.rematch);
  const cleanup = useGameStore((s) => s.cleanup);

  if (!matchResult) {
    return (
      <Screen title="Resultaten">
        <Text style={{ color: palette.textSecondary }}>Resultaten laden...</Text>
      </Screen>
    );
  }

  const isPlayer1Local = role === 'host';
  const localResult = isPlayer1Local ? matchResult.player1 : matchResult.player2;
  const remoteResult = isPlayer1Local ? matchResult.player2 : matchResult.player1;

  const localWon = matchResult.winnerId === localResult.playerId;
  const isDraw = matchResult.isDraw;

  const localUnique = matchResult.uniqueWords.filter(
    (u) => u.playerId === localResult.playerId,
  );

  const handleRematch = async () => {
    if (role === 'host') {
      await rematch();
      router.replace('/countdown');
    }
  };

  const handleMenu = async () => {
    await cleanup();
    router.replace('/');
  };

  return (
    <Screen title="Resultaten">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.winnerBanner}>
          <Text style={[styles.winnerText, { color: isDraw ? palette.textSecondary : accent.primary }]}>
            {isDraw ? 'Gelijkspel!' : localWon ? 'Gewonnen!' : 'Verloren'}
          </Text>
          {eloChange !== null && (
            <Text style={[styles.eloChange, { color: eloChange >= 0 ? accent.primary : palette.error }]}>
              ELO {eloChange >= 0 ? '+' : ''}{eloChange}
            </Text>
          )}
        </View>

        <Card title="Score">
          <StatRow label={playerName} value={localResult.score} highlight />
          <StatRow label={remotePlayerName ?? 'Tegenstander'} value={remoteResult.score} />
        </Card>

        <Card title="Statistieken">
          <StatRow label="Totaal woorden" value={matchResult.totalWords} />
          <StatRow label="Langste woord" value={matchResult.longestWord || '-'} />
          <StatRow
            label="Hoogste scorend woord"
            value={
              matchResult.highestScoringWord.word
                ? `${matchResult.highestScoringWord.word} (${matchResult.highestScoringWord.points})`
                : '-'
            }
          />
          <StatRow label="Unieke woorden" value={localUnique.length} />
          <StatRow label="Dubbele woorden" value={matchResult.sharedWords.length} />
        </Card>

        {localUnique.length > 0 && (
          <Card title="Jouw unieke woorden">
            <FlatList
              data={localUnique}
              horizontal
              keyExtractor={(item) => item.word}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <View style={[styles.chip, { backgroundColor: accent.light }]}>
                  <Text style={[styles.chipText, { color: accent.dark }]}>
                    {item.word} +{item.points}
                  </Text>
                </View>
              )}
            />
          </Card>
        )}

        {matchResult.sharedWords.length > 0 && (
          <Card title="Dubbele woorden (0 punten)">
            <Text style={[styles.wordLine, { color: palette.textSecondary }]}>
              {matchResult.sharedWords.join(', ')}
            </Text>
          </Card>
        )}

        {newAchievements.length > 0 && (
          <Card title="Nieuwe prestaties!">
            {newAchievements.map((id) => {
              const achievement = getAchievementById(id);
              return achievement ? (
                <View key={id} style={styles.achievement}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View>
                    <Text style={[styles.achievementTitle, { color: palette.text }]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDesc, { color: palette.textSecondary }]}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
              ) : null;
            })}
          </Card>
        )}

        <View style={styles.actions}>
          {role === 'host' && (
            <Button title="Nog een ronde" onPress={handleRematch} />
          )}
          <Button title="Terug naar menu" variant="secondary" onPress={handleMenu} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  winnerBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  winnerText: {
    ...typography.title,
  },
  eloChange: {
    ...typography.subheading,
  },
  chipRow: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  wordLine: {
    ...typography.body,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    ...typography.bodyBold,
  },
  achievementDesc: {
    ...typography.caption,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
