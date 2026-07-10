export type AccentColor = 'green' | 'blue';

export const colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    green: '#10B981',
    greenDark: '#059669',
    greenLight: '#D1FAE5',
    blue: '#3B82F6',
    blueDark: '#2563EB',
    blueLight: '#DBEAFE',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    tile: '#FFFFFF',
    tileSelected: '#ECFDF5',
    tileBorder: '#E2E8F0',
    overlay: 'rgba(15, 23, 42, 0.6)',
  },
  dark: {
    background: '#0A1628',
    surface: '#111827',
    surfaceElevated: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    green: '#34D399',
    greenDark: '#10B981',
    greenLight: '#064E3B',
    blue: '#60A5FA',
    blueDark: '#3B82F6',
    blueLight: '#1E3A5F',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    tile: '#1E293B',
    tileSelected: '#064E3B',
    tileBorder: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  hero: { fontSize: 48, fontWeight: '700' as const, letterSpacing: -1 },
  title: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 24, fontWeight: '600' as const },
  subheading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  tile: { fontSize: 28, fontWeight: '700' as const },
  countdown: { fontSize: 96, fontWeight: '800' as const },
} as const;

export function getAccent(accent: AccentColor, isDark: boolean) {
  const palette = isDark ? colors.dark : colors.light;
  return accent === 'green'
    ? { primary: palette.green, dark: palette.greenDark, light: palette.greenLight }
    : { primary: palette.blue, dark: palette.blueDark, light: palette.blueLight };
}
