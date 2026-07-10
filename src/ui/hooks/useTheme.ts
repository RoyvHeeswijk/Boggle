import { useColorScheme } from 'react-native';
import { colors, getAccent, AccentColor } from '../theme';
import { useSettingsStore } from '@/src/state/settingsStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const accent = useSettingsStore((s) => s.accent);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const palette = isDark ? colors.dark : colors.light;
  const accentColors = getAccent(accent, isDark);

  return {
    isDark,
    palette,
    accent: accentColors,
    accentName: accent as AccentColor,
  };
}
