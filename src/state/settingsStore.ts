import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccentColor } from '../ui/theme';

const STORAGE_KEY = 'boggle-duel-settings';

interface SettingsState {
  playerName: string;
  playerId: string | null;
  accent: AccentColor;
  themeMode: 'system' | 'light' | 'dark';
  useMockTransport: boolean;
  hydrated: boolean;

  setPlayerName: (name: string) => void;
  setPlayerId: (id: string) => void;
  setAccent: (accent: AccentColor) => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  setUseMockTransport: (value: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  playerName: 'Speler',
  playerId: null,
  accent: 'blue',
  themeMode: 'system',
  useMockTransport: __DEV__,
  hydrated: false,

  setPlayerName: (name) => {
    set({ playerName: name });
    persistSettings(get());
  },
  setPlayerId: (id) => {
    set({ playerId: id });
    persistSettings(get());
  },
  setAccent: (accent) => {
    set({ accent });
    persistSettings(get());
  },
  setThemeMode: (themeMode) => {
    set({ themeMode });
    persistSettings(get());
  },
  setUseMockTransport: (useMockTransport) => {
    set({ useMockTransport });
    persistSettings(get());
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          playerName: data.playerName ?? 'Speler',
          playerId: data.playerId ?? null,
          accent: data.accent ?? 'blue',
          themeMode: data.themeMode ?? 'system',
          useMockTransport: data.useMockTransport ?? __DEV__,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));

async function persistSettings(state: SettingsState) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      playerName: state.playerName,
      playerId: state.playerId,
      accent: state.accent,
      themeMode: state.themeMode,
      useMockTransport: state.useMockTransport,
    }),
  );
}
