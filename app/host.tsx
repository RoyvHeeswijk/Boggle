import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { OptionGroup } from '@/src/ui/components/OptionChip';
import { Card } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { useGameStore } from '@/src/state/gameStore';
import { PRESET_DURATIONS, formatDuration, type BoardSize } from '@/src/core/game/types';

export default function HostScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const playerId = useSettingsStore((s) => s.playerId);
  const useMockTransport = useSettingsStore((s) => s.useMockTransport);

  const [boardSize, setBoardSize] = useState<BoardSize>(4);
  const [duration, setDuration] = useState<number>(120);
  const [customDuration, setCustomDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const phase = useGameStore((s) => s.phase);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const roomCode = useGameStore((s) => s.roomCode);
  const initHost = useGameStore((s) => s.initHost);
  const startGame = useGameStore((s) => s.startGame);
  const cleanup = useGameStore((s) => s.cleanup);

  const effectiveDuration =
    duration === -1 ? parseInt(customDuration, 10) || 120 : duration;

  const handleCreateLobby = async () => {
    setLoading(true);
    try {
      const id = playerId ?? Crypto.randomUUID();
      await initHost(
        playerName,
        id,
        { boardSize, durationSeconds: effectiveDuration, language: 'nl' },
        { mode: useMockTransport ? 'mock' : 'online' },
      );
    } catch (e) {
      Alert.alert('Fout', 'Kon lobby niet aanmaken. Controleer je internetverbinding en probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    await startGame();
    router.replace('/countdown');
  };

  const handleBack = async () => {
    await cleanup();
    router.back();
  };

  if (phase === 'lobby' || phase === 'waiting') {
    return (
      <Screen title="Lobby" subtitle={phase === 'waiting' ? undefined : 'Wachten op speler...'}>
        <Card title="Instellingen">
          <Text style={{ color: palette.textSecondary }}>
            Bord: {boardSize}×{boardSize} · {formatDuration(effectiveDuration)} · Nederlands
          </Text>
        </Card>

        {roomCode && phase === 'lobby' && (
          <View style={[styles.codeCard, { backgroundColor: accent.light, borderColor: accent.primary }]}>
            <Text style={[styles.codeLabel, { color: accent.dark }]}>
              Deel deze code met je tegenstander
            </Text>
            <Text style={[styles.codeValue, { color: accent.dark }]}>{roomCode}</Text>
            <Text style={[styles.codeHint, { color: accent.dark }]}>
              Zij kiezen "Join Game" en vullen deze code in.
            </Text>
          </View>
        )}

        <View style={styles.waitingArea}>
          {phase === 'waiting' ? (
            <>
              <Text style={[styles.connected, { color: accent.primary }]}>
                Player Connected
              </Text>
              <Text style={[styles.opponent, { color: palette.text }]}>
                {remotePlayerName}
              </Text>
              <Button title="Start Game" onPress={handleStart} />
            </>
          ) : (
            <Text style={[styles.waiting, { color: palette.textSecondary }]}>
              Wachten op speler...
            </Text>
          )}
        </View>

        <Button title="Annuleren" variant="ghost" onPress={handleBack} />
      </Screen>
    );
  }

  return (
    <Screen title="Host Game" subtitle="Stel de wedstrijd in">
      <View style={styles.section}>
        <Text style={[styles.label, { color: palette.text }]}>Bordgrootte</Text>
        <OptionGroup
          options={[
            { label: '4×4', value: 4 },
            { label: '5×5', value: 5 },
          ]}
          value={boardSize}
          onChange={(v) => setBoardSize(v as BoardSize)}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: palette.text }]}>Speeltijd</Text>
        <OptionGroup
          options={[
            ...PRESET_DURATIONS.map((d) => ({ label: formatDuration(d), value: d })),
            { label: 'Eigen tijd', value: -1 },
          ]}
          value={duration}
          onChange={(v) => setDuration(v as number)}
        />
        {duration === -1 && (
          <TextInput
            style={[
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
            ]}
            placeholder="Seconden"
            placeholderTextColor={palette.textMuted}
            keyboardType="number-pad"
            value={customDuration}
            onChangeText={setCustomDuration}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: palette.text }]}>Taal</Text>
        <Text style={{ color: palette.textSecondary }}>Nederlands</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Lobby aanmaken" loading={loading} onPress={handleCreateLobby} />
        <Button title="Terug" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    ...typography.subheading,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
  },
  codeCard: {
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeLabel: {
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 10,
  },
  codeHint: {
    ...typography.small,
    textAlign: 'center',
    opacity: 0.8,
  },
  waitingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  waiting: {
    ...typography.body,
  },
  connected: {
    ...typography.subheading,
    fontWeight: '700',
  },
  opponent: {
    ...typography.title,
  },
});
