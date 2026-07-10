import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const clearSelection = useGameStore((s) => s.clearSelection);

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadDictionary().then(setDictionary);
  }, []);

  useEffect(() => {
    if (phase === 'syncing' || phase === 'results') {
      router.replace('/results');
    }
  }, [phase]);

  const showFeedback = useCallback((text: string, ok: boolean) => {
    setFeedback({ text, ok });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200);
  }, []);

  const handleWordComplete = useCallback(() => {
    const input = useGameStore.getState().currentInput;

    // Too short / accidental tap: just clear, no noise.
    if (!dictionary || !board || input.length < 3) {
      clearSelection();
      return;
    }

    const result = validateWordInput(input, board, dictionary, foundWords);

    if (result.valid) {
      submitWord(result.word);
      showFeedback(`+${result.points}  ${result.word}`, true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const messages: Record<string, string> = {
        too_short: 'Minimaal 3 letters',
        not_in_dictionary: 'Bestaat niet',
        not_on_board: 'Niet op het bord',
        already_found: 'Al gevonden',
        invalid: 'Ongeldig',
      };
      showFeedback(messages[result.reason] ?? 'Ongeldig', false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      clearSelection();
    }
  }, [dictionary, board, foundWords, submitWord, clearSelection, showFeedback]);

  if (!board) {
    router.replace('/');
    return null;
  }

  const score = liveScore(foundWords);

  return (
    <Screen>
      <View style={styles.root}>
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
            <View style={[styles.divider, { backgroundColor: palette.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: palette.text }]}>{foundWords.length}</Text>
              <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Woorden</Text>
            </View>
          </View>
        </View>

        <View style={styles.wordBarWrap}>
          <View
            style={[
              styles.currentWord,
              {
                backgroundColor:
                  feedback && !feedback.ok
                    ? palette.surface
                    : feedback || currentInput
                      ? accent.light
                      : 'transparent',
                borderWidth: feedback && !feedback.ok ? 2 : 0,
                borderColor: palette.error,
              },
            ]}
          >
            <Text
              style={[
                styles.currentWordText,
                {
                  color: feedback
                    ? feedback.ok
                      ? accent.dark
                      : palette.error
                    : accent.dark,
                },
              ]}
              numberOfLines={1}
            >
              {feedback ? feedback.text : currentInput || 'Sleep over de letters'}
            </Text>
          </View>
        </View>

        <View style={styles.boardWrap}>
          <BoggleBoard
            board={board}
            selectedPath={currentPath}
            onPathChange={setCurrentPath}
            onWordComplete={handleWordComplete}
            disabled={phase !== 'playing'}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  divider: {
    width: 1,
    height: 36,
  },
  stat: {
    alignItems: 'center',
    minWidth: 72,
  },
  statValue: {
    ...typography.title,
  },
  statLabel: {
    ...typography.caption,
  },
  wordBarWrap: {
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  currentWord: {
    alignSelf: 'center',
    minHeight: 52,
    minWidth: 200,
    maxWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  currentWordText: {
    ...typography.heading,
    letterSpacing: 4,
    fontWeight: '800',
  },
  boardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
