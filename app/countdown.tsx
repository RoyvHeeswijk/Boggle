import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { CountdownOverlay } from '@/src/ui/components/CountdownOverlay';
import { useGameStore, startGameTimer } from '@/src/state/gameStore';

export default function CountdownScreen() {
  const startTimestamp = useGameStore((s) => s.startTimestamp);
  const board = useGameStore((s) => s.board);

  const handleComplete = useCallback(() => {
    startGameTimer();
    router.replace('/game');
  }, []);

  if (!board || !startTimestamp) {
    router.replace('/');
    return null;
  }

  return (
    <Screen>
      <View style={styles.container}>
        <CountdownOverlay startTimestamp={startTimestamp} onComplete={handleComplete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
