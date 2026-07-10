import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { Card, StatRow } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
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

  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [started, setStarted] = useState(false);

  const isOnline = !useMockTransport;

  useEffect(() => {
    if (!started) return;
    if (phase === 'countdown') {
      router.replace('/countdown');
    }
  }, [phase, started]);

  const handleJoin = async () => {
    if (isOnline && code.trim().length < 4) {
      Alert.alert('Code vereist', 'Vul de code in die de host met je heeft gedeeld.');
      return;
    }
    setSearching(true);
    try {
      const id = playerId ?? Crypto.randomUUID();
      await initGuest(playerName, id, {
        mode: useMockTransport ? 'mock' : 'online',
        roomCode: code.trim().toUpperCase(),
      });
      setStarted(true);
    } catch (e) {
      Alert.alert('Fout', 'Kon niet verbinden. Controleer de code en je internetverbinding.');
      setStarted(false);
    } finally {
      setSearching(false);
    }
  };

  const handleBack = async () => {
    await cleanup();
    router.back();
  };

  const connecting = searching || (started && phase === 'lobby');

  return (
    <Screen title="Join Game" subtitle={isOnline ? 'Vul de code van de host in' : 'Zoek naar nearby hosts'}>
      {connecting ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent.primary} />
          <Text style={[styles.searchText, { color: palette.textSecondary }]}>
            {isOnline ? 'Verbinden met ' + code.toUpperCase() + '...' : 'Zoeken naar hosts...'}
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
          {isOnline ? (
            <>
              <Text style={[styles.info, { color: palette.textSecondary }]}>
                Vul de code in die de host met je heeft gedeeld om op afstand tegen elkaar te spelen.
              </Text>
              <TextInput
                style={[
                  styles.codeInput,
                  { color: palette.text, borderColor: accent.primary, backgroundColor: palette.surface },
                ]}
                placeholder="CODE"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
              />
              <Button title="Verbinden" onPress={handleJoin} />
            </>
          ) : (
            <>
              <Text style={[styles.info, { color: palette.textSecondary }]}>
                De app zoekt automatisch naar beschikbare hosts in de buurt via Multipeer Connectivity.
              </Text>
              <Button title="Zoek hosts" onPress={handleJoin} />
            </>
          )}
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
  codeInput: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
  },
});
