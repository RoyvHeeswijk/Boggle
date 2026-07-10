import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getDatabase } from '@/src/data/db';
import { getOrCreateProfile } from '@/src/data/repositories/matchRepository';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark, palette } = useTheme();
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const playerName = useSettingsStore((s) => s.playerName);
  const setPlayerId = useSettingsStore((s) => s.setPlayerId);

  useEffect(() => {
    async function init() {
      getDatabase();
      await hydrate();
      SplashScreen.hideAsync();
    }
    init();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && playerName) {
      getOrCreateProfile(playerName).then((profile) => {
        setPlayerId(profile.id);
      });
    }
  }, [hydrated, playerName, setPlayerId]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="host" />
        <Stack.Screen name="join" />
        <Stack.Screen name="countdown" />
        <Stack.Screen name="game" />
        <Stack.Screen name="results" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </GestureHandlerRootView>
  );
}
