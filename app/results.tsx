import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { CountUp } from '@/src/ui/components/CountUp';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius, shadows } from '@/src/ui/theme';
import { useGameStore } from '@/src/state/gameStore';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getAchievementById } from '@/src/core/achievements/achievements';
import { buildWordRows, buildPlayerSummary, type WordRow } from '@/src/core/game/results';

const STAGE_DELAYS = [0, 500, 1100, 1900, 2500, 3100];
const STAGE = { WINNER: 1, SUMMARY: 2, WORDS: 3, RECORDS: 4, ACHIEVEMENTS: 5, DONE: 6 };

function useReveal(skipped: boolean) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (skipped) {
      setStage(STAGE.DONE);
      return;
    }
    const timers = STAGE_DELAYS.map((delay, i) =>
      setTimeout(() => setStage(i + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [skipped]);

  return stage;
}

export default function ResultsScreen() {
  const { palette, accent, isDark } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const matchResult = useGameStore((s) => s.matchResult);
  const role = useGameStore((s) => s.role);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const eloChange = useGameStore((s) => s.eloChange);
  const newAchievements = useGameStore((s) => s.newAchievements);
  const newRecords = useGameStore((s) => s.newRecords);
  const phase = useGameStore((s) => s.phase);
  const rematch = useGameStore((s) => s.rematch);
  const returnToLobby = useGameStore((s) => s.returnToLobby);
  const cleanup = useGameStore((s) => s.cleanup);

  useEffect(() => {
    if (phase === 'waiting') {
      router.replace(role === 'host' ? '/host' : '/join');
    }
  }, [phase, role]);

  const [skipped, setSkipped] = useState(false);
  const stage = useReveal(skipped);
  const skip = stage >= STAGE.DONE;

  const [tab, setTab] = useState<'local' | 'remote'>('local');

  const localName = playerName;
  const remoteName = remotePlayerName ?? 'Tegenstander';

  const view = useMemo(() => {
    if (!matchResult) return null;
    const isPlayer1Local = role === 'host';
    const localResult = isPlayer1Local ? matchResult.player1 : matchResult.player2;
    const remoteResult = isPlayer1Local ? matchResult.player2 : matchResult.player1;

    const localRaw = localResult.rawWords;
    const remoteRaw = remoteResult.rawWords;

    return {
      localScore: localResult.score,
      remoteScore: remoteResult.score,
      localWon: matchResult.winnerId === localResult.playerId,
      isDraw: matchResult.isDraw,
      localSummary: buildPlayerSummary(localRaw, remoteRaw),
      remoteSummary: buildPlayerSummary(remoteRaw, localRaw),
      localRows: buildWordRows(localRaw, remoteRaw),
      remoteRows: buildWordRows(remoteRaw, localRaw),
    };
  }, [matchResult, role]);

  if (!matchResult || !view) {
    return (
      <Screen title="Resultaten">
        <Text style={{ color: palette.textSecondary }}>Resultaten laden...</Text>
      </Screen>
    );
  }

  const headline = view.isDraw
    ? 'Gelijkspel'
    : view.localWon
      ? `${localName} wint!`
      : `${remoteName} wint!`;
  const emoji = view.isDraw ? '🤝' : '🏆';

  const handleRematch = async () => {
    if (role === 'host') {
      await rematch();
      router.replace('/countdown');
    }
  };

  const handleReturnLobby = async () => {
    await returnToLobby();
  };

  const handleMenu = async () => {
    await cleanup();
    router.replace('/');
  };

  const activeRows = tab === 'local' ? view.localRows : view.remoteRows;

  return (
    <Screen>
      <Pressable style={styles.flex} onPress={() => setSkipped(true)}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Kaart 1 - Winnaar */}
          {stage >= STAGE.WINNER && (
            <Animated.View
              entering={ZoomIn.springify().damping(13)}
              style={[styles.winnerCard, shadows.md, { backgroundColor: accent.primary }]}
            >
              <Text style={styles.winnerEmoji}>{emoji}</Text>
              <Text style={styles.winnerText}>{headline}</Text>
              <View style={styles.winnerScoreRow}>
                <CountUp value={view.localScore} skip={skip} style={styles.winnerScore} />
                <Text style={styles.winnerScoreDash}>–</Text>
                <CountUp value={view.remoteScore} skip={skip} style={styles.winnerScore} />
              </View>
              {eloChange !== null && (
                <View style={styles.eloPill}>
                  <Text style={[styles.eloText, { color: accent.dark }]}>
                    {eloChange >= 0 ? '+' : ''}{eloChange} ELO
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Kaart 2 - Samenvatting */}
          {stage >= STAGE.SUMMARY && (
            <Animated.View entering={FadeInDown.springify()} style={styles.summaryRow}>
              <SummaryColumn
                name={localName}
                highlight
                accentColor={accent.primary}
                palette={palette}
                summary={view.localSummary}
                skip={skip}
              />
              <SummaryColumn
                name={remoteName}
                accentColor={palette.text}
                palette={palette}
                summary={view.remoteSummary}
                skip={skip}
              />
            </Animated.View>
          )}

          {/* Kaart 3 - Woorden */}
          {stage >= STAGE.WORDS && (
            <Animated.View
              entering={FadeInDown.springify()}
              style={[styles.card, shadows.sm, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <View style={[styles.tabs, { backgroundColor: palette.background }]}>
                <TabButton
                  label={localName}
                  active={tab === 'local'}
                  onPress={() => setTab('local')}
                  accent={accent.primary}
                  palette={palette}
                />
                <TabButton
                  label={remoteName}
                  active={tab === 'remote'}
                  onPress={() => setTab('remote')}
                  accent={accent.primary}
                  palette={palette}
                />
              </View>

              <View style={styles.wordList}>
                {activeRows.length === 0 ? (
                  <Text style={[styles.emptyWords, { color: palette.textMuted }]}>
                    Geen woorden gevonden
                  </Text>
                ) : (
                  activeRows.map((row, index) => (
                    <WordRowItem
                      key={`${tab}-${row.word}`}
                      row={row}
                      index={index}
                      skip={skip}
                      palette={palette}
                      isDark={isDark}
                    />
                  ))
                )}
              </View>
            </Animated.View>
          )}

          {/* Kaart 4 - Nieuwe records */}
          {stage >= STAGE.RECORDS && newRecords.length > 0 && (
            <Animated.View
              entering={FadeInDown.springify()}
              style={[styles.card, shadows.sm, { backgroundColor: palette.surface, borderColor: accent.primary, borderWidth: 2 }]}
            >
              <Text style={[styles.cardTitle, { color: palette.text }]}>⭐ Nieuw persoonlijk record</Text>
              {newRecords.map((rec) => (
                <View key={rec.id} style={styles.recordRow}>
                  <Text style={styles.recordIcon}>{rec.icon}</Text>
                  <View style={styles.recordText}>
                    <Text style={[styles.recordTitle, { color: palette.text }]}>{rec.title}</Text>
                    <Text style={[styles.recordValue, { color: accent.primary }]}>{rec.value}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Kaart 5 - Achievements */}
          {stage >= STAGE.ACHIEVEMENTS && newAchievements.length > 0 && (
            <Animated.View
              entering={FadeInDown.springify()}
              style={[styles.card, shadows.sm, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.cardTitle, { color: palette.text }]}>Nieuwe prestaties</Text>
              {newAchievements.map((id, i) => {
                const achievement = getAchievementById(id);
                if (!achievement) return null;
                return (
                  <Animated.View
                    key={id}
                    entering={FadeInDown.delay(i * 120).springify()}
                    style={styles.recordRow}
                  >
                    <Text style={styles.recordIcon}>🏅</Text>
                    <View style={styles.recordText}>
                      <Text style={[styles.recordTitle, { color: palette.text }]}>{achievement.title}</Text>
                      <Text style={[styles.recordValue, { color: palette.textSecondary }]}>
                        {achievement.description}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {!skip && (
            <Animated.Text entering={FadeIn} style={[styles.skipHint, { color: palette.textMuted }]}>
              Tik om over te slaan
            </Animated.Text>
          )}
        </ScrollView>

        {/* Kaart 6 - Acties (sticky, duimbereik) */}
        <View style={styles.footer}>
          {role === 'host' && <Button title="Nog een ronde" onPress={handleRematch} />}
          {role === 'host' && (
            <Button title="Terug naar lobby" variant="secondary" onPress={handleReturnLobby} />
          )}
          <Button
            title="Terug naar hoofdmenu"
            variant={role === 'host' ? 'ghost' : 'secondary'}
            onPress={handleMenu}
          />
        </View>
      </Pressable>
    </Screen>
  );
}

function SummaryColumn({
  name,
  summary,
  highlight,
  accentColor,
  palette,
  skip,
}: {
  name: string;
  summary: ReturnType<typeof buildPlayerSummary>;
  highlight?: boolean;
  accentColor: string;
  palette: ReturnType<typeof useTheme>['palette'];
  skip: boolean;
}) {
  return (
    <View style={[styles.summaryCol, shadows.sm, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.summaryName, { color: accentColor }]} numberOfLines={1}>
        {name}
      </Text>
      <CountUp value={summary.score} skip={skip} style={[styles.summaryScore, { color: palette.text }]} />
      <Text style={[styles.summaryScoreLabel, { color: palette.textMuted }]}>punten</Text>

      <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />

      <SummaryStat label="Woorden" value={String(summary.totalWords)} palette={palette} />
      <SummaryStat label="Uniek" value={String(summary.uniqueWords)} palette={palette} />
      <SummaryStat label="Dubbel" value={String(summary.duplicateWords)} palette={palette} />
      <SummaryStat label="Langste" value={summary.longestWord ? summary.longestWord.toUpperCase() : '-'} palette={palette} />
      <SummaryStat
        label="Beste"
        value={summary.highestScoringWord.word ? `${summary.highestScoringWord.word.toUpperCase()} +${summary.highestScoringWord.points}` : '-'}
        palette={palette}
      />
    </View>
  );
}

function SummaryStat({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryStatLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryStatValue, { color: palette.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
  accent,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && { backgroundColor: palette.surface, ...shadows.sm }]}
    >
      <Text
        style={[styles.tabText, { color: active ? accent : palette.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WordRowItem({
  row,
  index,
  skip,
  palette,
  isDark,
}: {
  row: WordRow;
  index: number;
  skip: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  isDark: boolean;
}) {
  const isUnique = row.status === 'unique';
  const uniqueColor = palette.success;
  const dupBg = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.18)';

  return (
    <Animated.View
      entering={skip ? undefined : FadeIn.delay(Math.min(index * 40, 800))}
      style={styles.wordRow}
    >
      <Text style={[styles.word, { color: isUnique ? palette.text : palette.textMuted }]} numberOfLines={1}>
        {row.word.toUpperCase()}
      </Text>
      <Text style={[styles.wordPoints, { color: isUnique ? uniqueColor : palette.textMuted }]}>
        {isUnique ? `+${row.points}` : '0'}
      </Text>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: isUnique ? (isDark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.15)') : dupBg },
        ]}
      >
        <Text style={[styles.statusText, { color: isUnique ? uniqueColor : palette.textSecondary }]}>
          {isUnique ? '🟢 Uniek' : '⚪ Dubbel'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  // Winner
  winnerCard: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  winnerEmoji: {
    fontSize: 56,
  },
  winnerText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  winnerScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  winnerScore: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  winnerScoreDash: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  eloPill: {
    marginTop: spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  eloText: {
    ...typography.bodyBold,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCol: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  summaryName: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  summaryScore: {
    fontSize: 36,
    fontWeight: '900',
  },
  summaryScoreLabel: {
    ...typography.small,
    marginTop: -2,
  },
  summaryDivider: {
    height: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
  },
  summaryStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 3,
    gap: spacing.sm,
  },
  summaryStatLabel: {
    ...typography.caption,
  },
  summaryStatValue: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  // Generic card
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.subheading,
    marginBottom: spacing.xs,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabText: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  // Words
  wordList: {
    gap: spacing.xs,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: spacing.sm,
  },
  word: {
    flex: 1,
    ...typography.bodyBold,
    letterSpacing: 1,
  },
  wordPoints: {
    ...typography.bodyBold,
    minWidth: 36,
    textAlign: 'right',
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    minWidth: 84,
    alignItems: 'center',
  },
  statusText: {
    ...typography.small,
    fontWeight: '700',
  },
  emptyWords: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  // Records / achievements
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  recordIcon: {
    fontSize: 30,
  },
  recordText: {
    flex: 1,
  },
  recordTitle: {
    ...typography.bodyBold,
  },
  recordValue: {
    ...typography.caption,
    fontWeight: '600',
  },
  skipHint: {
    ...typography.small,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  // Footer
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
