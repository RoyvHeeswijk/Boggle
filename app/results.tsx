import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius, shadows } from '@/src/ui/theme';
import { useGameStore } from '@/src/state/gameStore';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getAchievementById } from '@/src/core/achievements/achievements';
import { loadDictionary } from '@/src/core/dictionary/dictionary';
import { solveBoard } from '@/src/core/board/solver';

export default function ResultsScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const matchResult = useGameStore((s) => s.matchResult);
  const board = useGameStore((s) => s.board);
  const role = useGameStore((s) => s.role);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const eloChange = useGameStore((s) => s.eloChange);
  const newAchievements = useGameStore((s) => s.newAchievements);
  const rematch = useGameStore((s) => s.rematch);
  const cleanup = useGameStore((s) => s.cleanup);

  const [bestPossible, setBestPossible] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!board) return;
    loadDictionary().then((dict) => {
      const words = solveBoard(board, dict);
      const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');
      if (!cancelled) setBestPossible(longest || null);
    });
    return () => {
      cancelled = true;
    };
  }, [board]);

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

  const headline = isDraw ? 'Gelijkspel!' : localWon ? 'Gewonnen!' : 'Verloren';
  const emoji = isDraw ? '🤝' : localWon ? '🏆' : '💪';
  const headlineColor = isDraw ? palette.textSecondary : localWon ? accent.primary : palette.error;

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
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.winnerBanner}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.winnerText, { color: headlineColor }]}>{headline}</Text>
          {eloChange !== null && (
            <View style={[styles.eloPill, { backgroundColor: eloChange >= 0 ? accent.light : palette.surface }]}>
              <Text style={[styles.eloChange, { color: eloChange >= 0 ? accent.dark : palette.error }]}>
                {eloChange >= 0 ? '+' : ''}{eloChange} ELO
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={[styles.scoreboard, shadows.md, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.scoreSide}>
              <Text style={[styles.scoreName, { color: palette.textSecondary }]} numberOfLines={1}>
                {playerName}
              </Text>
              <Text style={[styles.scoreValue, { color: localWon ? accent.primary : palette.text }]}>
                {localResult.score}
              </Text>
            </View>
            <Text style={[styles.vs, { color: palette.textMuted }]}>VS</Text>
            <View style={styles.scoreSide}>
              <Text style={[styles.scoreName, { color: palette.textSecondary }]} numberOfLines={1}>
                {remotePlayerName ?? 'Tegenstander'}
              </Text>
              <Text style={[styles.scoreValue, { color: !localWon && !isDraw ? palette.error : palette.text }]}>
                {remoteResult.score}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card title="Statistieken">
            <StatRow label="Totaal woorden" value={matchResult.totalWords} />
            <StatRow label="Langste woord (gespeeld)" value={matchResult.longestWord || '-'} />
            <StatRow
              label="Hoogst scorend woord"
              value={
                matchResult.highestScoringWord.word
                  ? `${matchResult.highestScoringWord.word} (${matchResult.highestScoringWord.points})`
                  : '-'
              }
            />
            <StatRow label="Jouw unieke woorden" value={localUnique.length} highlight />
            <StatRow label="Dubbele woorden" value={matchResult.sharedWords.length} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <View style={[styles.bestCard, { backgroundColor: accent.primary }]}>
            <Text style={styles.bestLabel}>LANGST MOGELIJKE WOORD</Text>
            <Text style={styles.bestWord}>
              {bestPossible ? bestPossible.toUpperCase() : '…'}
            </Text>
            {bestPossible && (
              <Text style={styles.bestSub}>{bestPossible.length} letters op dit bord</Text>
            )}
          </View>
        </Animated.View>

        {localUnique.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450).springify()}>
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
          </Animated.View>
        )}

        {matchResult.sharedWords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(550).springify()}>
            <Card title="Dubbele woorden (0 punten)">
              <Text style={[styles.wordLine, { color: palette.textSecondary }]}>
                {matchResult.sharedWords.join(', ')}
              </Text>
            </Card>
          </Animated.View>
        )}

        {newAchievements.length > 0 && (
          <Animated.View entering={FadeInDown.delay(650).springify()}>
            <Card title="Nieuwe prestaties!">
              {newAchievements.map((id) => {
                const achievement = getAchievementById(id);
                return achievement ? (
                  <View key={id} style={styles.achievement}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.achievementText}>
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
          </Animated.View>
        )}

        <View style={styles.actions}>
          {role === 'host' && <Button title="Nog een ronde" onPress={handleRematch} />}
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
    paddingTop: spacing.sm,
  },
  winnerBanner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 64,
  },
  winnerText: {
    ...typography.hero,
  },
  eloPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  eloChange: {
    ...typography.bodyBold,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  scoreSide: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreName: {
    ...typography.caption,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '900',
  },
  vs: {
    ...typography.bodyBold,
    paddingHorizontal: spacing.md,
  },
  bestCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  bestLabel: {
    ...typography.small,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.8)',
  },
  bestWord: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  bestSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  chipRow: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
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
  achievementText: {
    flex: 1,
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
