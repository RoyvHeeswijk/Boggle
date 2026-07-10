import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Card, StatRow } from '@/src/ui/components/Card';
import { OptionGroup } from '@/src/ui/components/OptionChip';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { getPeriodStatsForProfile } from '@/src/data/repositories/matchRepository';
import type { PeriodStat } from '@/src/data/schema';

type Period = 'day' | 'week' | 'month';

export default function PeriodStatsScreen() {
  const { palette, accent } = useTheme();
  const playerId = useSettingsStore((s) => s.playerId);
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<PeriodStat[]>([]);

  useEffect(() => {
    if (playerId) {
      getPeriodStatsForProfile(playerId, period).then(setStats);
    }
  }, [playerId, period]);

  const current = stats[0];

  return (
    <Screen
      title="Periode statistieken"
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Terug</Text>
        </Pressable>
      }
    >
      <OptionGroup
        options={[
          { label: 'Dag', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Maand', value: 'month' },
        ]}
        value={period}
        onChange={(v) => setPeriod(v as Period)}
      />

      {current ? (
        <Card title={current.periodKey} style={styles.card}>
          <StatRow label="Wedstrijden" value={current.matches} />
          <StatRow label="Winst" value={current.wins} highlight />
          <StatRow label="Verlies" value={current.losses} />
          <StatRow label="Gelijkspel" value={current.draws} />
          <StatRow label="Score" value={current.totalScore} />
          <StatRow label="Woorden" value={current.totalWords} />
        </Card>
      ) : (
        <Text style={[styles.empty, { color: palette.textSecondary }]}>
          Geen statistieken voor deze periode
        </Text>
      )}

      {stats.length > 1 && (
        <Card title="Eerdere periodes">
          {stats.slice(1, 6).map((s) => (
            <View key={s.id} style={styles.historyRow}>
              <Text style={[styles.historyKey, { color: palette.text }]}>{s.periodKey}</Text>
              <Text style={[styles.historyVal, { color: palette.textSecondary }]}>
                {s.matches}W · {s.wins} winst · {s.totalScore} pts
              </Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  historyRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  historyKey: {
    ...typography.bodyBold,
  },
  historyVal: {
    ...typography.caption,
  },
});
