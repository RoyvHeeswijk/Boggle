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
import { PRESET_DURATIONS, formatDuration, type BoardSize, type GameSettings } from '@/src/core/game/types';

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
  const settings = useGameStore((s) => s.settings);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const roomCode = useGameStore((s) => s.roomCode);
  const initHost = useGameStore((s) => s.initHost);
  const startGame = useGameStore((s) => s.startGame);
  const updateSettings = useGameStore((s) => s.updateSettings);
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

  // --- In-lobby editable settings (host can tweak while connected) ---
  const durationIsPreset = (PRESET_DURATIONS as readonly number[]).includes(settings.durationSeconds);
  const [lobbyCustomMode, setLobbyCustomMode] = useState(false);
  const [lobbyCustom, setLobbyCustom] = useState('');

  const applySettings = (patch: Partial<GameSettings>) => {
    updateSettings({ ...settings, ...patch });
  };

  const handleLobbyDuration = (raw: string | number) => {
    const value = Number(raw);
    if (value === -1) {
      setLobbyCustomMode(true);
      setLobbyCustom(String(settings.durationSeconds));
    } else {
      setLobbyCustomMode(false);
      applySettings({ durationSeconds: value });
    }
  };

  const handleLobbyCustom = (text: string) => {
    setLobbyCustom(text);
    const parsed = parseInt(text, 10);
    if (parsed && parsed > 0) {
      applySettings({ durationSeconds: parsed });
    }
  };

  if (phase === 'lobby' || phase === 'waiting') {
    const connected = phase === 'waiting';
    const durationValue = lobbyCustomMode || !durationIsPreset ? -1 : settings.durationSeconds;

    return (
      <Screen title="Lobby" subtitle={connected ? 'Speler verbonden' : 'Wachten op speler...'}>
        {roomCode && (
          <View style={[styles.codeCard, { backgroundColor: accent.light, borderColor: accent.primary }]}>
            <Text style={[styles.codeLabel, { color: accent.dark }]}>Code om te joinen</Text>
            <Text style={[styles.codeValue, { color: accent.dark }]}>{roomCode}</Text>
          </View>
        )}

        <View
          style={[
            styles.statusRow,
            { backgroundColor: connected ? accent.light : palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: connected ? accent.primary : palette.textMuted }]} />
          <Text style={[styles.statusText, { color: connected ? accent.dark : palette.textSecondary }]}>
            {connected ? `${remotePlayerName} is verbonden` : 'Wachten op tweede speler...'}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>Instellingen</Text>
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          Jij bepaalt de instellingen. Wijzigingen worden meteen gedeeld.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Bordgrootte</Text>
          <OptionGroup
            options={[
              { label: '4×4', value: 4 },
              { label: '5×5', value: 5 },
            ]}
            value={settings.boardSize}
            onChange={(v) => applySettings({ boardSize: v as BoardSize })}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Speeltijd</Text>
          <OptionGroup
            options={[
              ...PRESET_DURATIONS.map((d) => ({ label: formatDuration(d), value: d })),
              { label: 'Eigen tijd', value: -1 },
            ]}
            value={durationValue}
            onChange={handleLobbyDuration}
          />
          {(lobbyCustomMode || !durationIsPreset) && (
            <TextInput
              style={[
                styles.input,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
              ]}
              placeholder="Seconden"
              placeholderTextColor={palette.textMuted}
              keyboardType="number-pad"
              value={lobbyCustomMode ? lobbyCustom : String(settings.durationSeconds)}
              onChangeText={handleLobbyCustom}
            />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title={connected ? 'Start Game' : 'Wachten op speler...'}
            onPress={handleStart}
            disabled={!connected}
          />
          <Button title="Lobby verlaten" variant="ghost" onPress={handleBack} />
        </View>
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
  sectionTitle: {
    ...typography.subheading,
    marginTop: spacing.md,
  },
  hint: {
    ...typography.small,
    marginBottom: spacing.sm,
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
    padding: spacing.lg,
    borderRadius: radius.xxl,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  codeLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  codeValue: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...typography.bodyBold,
    flex: 1,
  },
});
