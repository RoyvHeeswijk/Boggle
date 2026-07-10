import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/src/ui/components/Screen';
import { TimerDisplay } from '@/src/ui/components/TimerDisplay';
import { BoggleBoard } from '@/src/ui/components/BoggleBoard';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useGameStore } from '@/src/state/gameStore';
import { loadDictionary } from '@/src/core/dictionary/dictionary';
import { validateWordInput, liveScore } from '@/src/core/game/engine';
import type { Dictionary } from '@/src/core/dictionary/dictionary';

export default function GameScreen() {
  const { palette, accent } = useTheme();
  const board = useGameStore((s) => s.board);
  const settings = useGameStore((s) => s.settings);
  const foundWords = useGameStore((s) => s.foundWords);
  const currentPath = useGameStore((s) => s.currentPath);
  const currentInput = useGameStore((s) => s.currentInput);
  const secondsRemaining = useGameStore((s) => s.secondsRemaining);
  const phase = useGameStore((s) => s.phase);
  const setCurrentPath = useGameStore((s) => s.setCurrentPath);
  const submitWord = useGameStore((s) => s.submitWord);
  const endGame = useGameStore((s) => s.endGame);

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadDictionary().then(setDictionary);
  }, []);

  useEffect(() => {
    if (phase === 'syncing' || phase === 'results') {
      router.replace('/results');
    }
  }, [phase]);

  const handleWordComplete = useCallback(async () => {
    if (!dictionary || !board || currentInput.length < 3) return;

    const result = validateWordInput(currentInput, board, dictionary, foundWords);

    if (result.valid) {
      submitWord(result.word);
      setFeedback(`+${result.points} ${result.word}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const messages: Record<string, string> = {
        too_short: 'Minimaal 3 letters',
        not_in_dictionary: 'Woord niet gevonden',
        not_on_board: 'Niet op het bord',
        already_found: 'Al gevonden',
        invalid: 'Ongeldig woord',
      };
      setFeedback(messages[result.reason] ?? 'Ongeldig');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => setFeedback(null), 1500);
  }, [dictionary, board, currentInput, foundWords, submitWord]);

  if (!board) {
    router.replace('/');
    return null;
  }

  const score = liveScore(foundWords);

  return (
    <Screen>
      <View style={styles.header}>
        <TimerDisplay
          secondsRemaining={secondsRemaining}
          totalSeconds={settings.durationSeconds}
        />
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: accent.primary }]}>{score}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Score</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: palette.text }]}>{foundWords.length}</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Woorden</Text>
          </View>
        </View>
      </View>

      <View style={[styles.currentWord, { backgroundColor: accent.light }]}>
        <Text style={[styles.currentWordText, { color: accent.dark }]}>
          {currentInput || ' '}
        </Text>
        {feedback && (
          <Text style={[styles.feedback, { color: feedback.startsWith('+') ? accent.primary : palette.error }]}>
            {feedback}
          </Text>
        )}
      </View>

      <BoggleBoard
        board={board}
        selectedPath={currentPath}
        onPathChange={setCurrentPath}
        onWordComplete={handleWordComplete}
        disabled={phase !== 'playing'}
      />

      <View style={[styles.wordList, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.wordListTitle, { color: palette.textSecondary }]}>
          Gevonden woorden
        </Text>
        <FlatList
          data={[...foundWords].reverse()}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wordListContent}
          renderItem={({ item }) => (
            <View style={[styles.wordChip, { backgroundColor: accent.light }]}>
              <Text style={[styles.wordChipText, { color: accent.dark }]}>{item}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: palette.textMuted }]}>
              Swipe over letters om woorden te vormen
            </Text>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
  },
  statLabel: {
    ...typography.caption,
  },
  currentWord: {
    alignItems: 'center',
    minHeight: 48,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  currentWordText: {
    ...typography.heading,
    letterSpacing: 6,
    fontWeight: '800',
  },
  feedback: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  wordList: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    maxHeight: 88,
  },
  wordListTitle: {
    ...typography.small,
    marginBottom: spacing.sm,
  },
  wordListContent: {
    gap: spacing.sm,
  },
  wordChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  wordChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  empty: {
    ...typography.caption,
  },
});
