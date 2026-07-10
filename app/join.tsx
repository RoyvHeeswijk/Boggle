import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { useGameStore } from '@/src/state/gameStore';
import { formatDuration } from '@/src/core/game/types';

export default function JoinScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const playerId = useSettingsStore((s) => s.playerId);
  const useMockTransport = useSettingsStore((s) => s.useMockTransport);

  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);
  const remotePlayerName = useGameStore((s) => s.remotePlayerName);
  const initGuest = useGameStore((s) => s.initGuest);
  const cleanup = useGameStore((s) => s.cleanup);

  const [searching, setSearching] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;

    if (phase === 'countdown') {
      router.replace('/countdown');
    }
  }, [phase, started]);

  const handleJoin = async () => {
    setSearching(true);
    try {
      const id = playerId ?? Crypto.randomUUID();
      await initGuest(playerName, id, useMockTransport);
      setStarted(true);
    } catch (e) {
      Alert.alert('Fout', 'Kon niet verbinden. Zorg dat de host een lobby heeft aangemaakt.');
    } finally {
      setSearching(false);
    }
  };

  const handleBack = async () => {
    await cleanup();
    router.back();
  };

  return (
    <Screen title="Join Game" subtitle="Zoek naar nearby hosts">
      {searching || (started && phase === 'lobby') ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent.primary} />
          <Text style={[styles.searchText, { color: palette.textSecondary }]}>
            Zoeken naar hosts...
          </Text>
        </View>
      ) : phase === 'waiting' ? (
        <View style={styles.center}>
          <Text style={[styles.connected, { color: accent.primary }]}>Verbonden!</Text>
          <Card title={`Host: ${remotePlayerName}`}>
            <StatRow label="Bordgrootte" value={`${settings.boardSize}×${settings.boardSize}`} />
            <StatRow label="Speeltijd" value={formatDuration(settings.durationSeconds)} />
            <StatRow label="Taal" value="Nederlands" />
          </Card>
          <Text style={[styles.waitText, { color: palette.textSecondary }]}>
            Wachten tot de host start...
          </Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.info, { color: palette.textSecondary }]}>
            De app zoekt automatisch naar beschikbare hosts in de buurt via Multipeer Connectivity.
          </Text>
          <Button title="Zoek hosts" onPress={handleJoin} />
        </View>
      )}

      <Button title="Terug" variant="ghost" onPress={handleBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  searchText: {
    ...typography.body,
    textAlign: 'center',
  },
  connected: {
    ...typography.heading,
    textAlign: 'center',
  },
  waitText: {
    ...typography.body,
    textAlign: 'center',
  },
  info: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
