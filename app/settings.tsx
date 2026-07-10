import React from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import { OptionGroup } from '@/src/ui/components/OptionChip';
import { Card } from '@/src/ui/components/Card';
import { useTheme } from '@/src/ui/hooks/useTheme';
import { spacing, typography, radius } from '@/src/ui/theme';
import { useSettingsStore } from '@/src/state/settingsStore';
import { updateProfileName, getOrCreateProfile } from '@/src/data/repositories/matchRepository';
import type { AccentColor } from '@/src/ui/theme';

export default function SettingsScreen() {
  const { palette, accent } = useTheme();
  const playerName = useSettingsStore((s) => s.playerName);
  const playerId = useSettingsStore((s) => s.playerId);
  const accentColor = useSettingsStore((s) => s.accent);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const useMockTransport = useSettingsStore((s) => s.useMockTransport);

  const setPlayerName = useSettingsStore((s) => s.setPlayerName);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const setUseMockTransport = useSettingsStore((s) => s.setUseMockTransport);

  const [name, setName] = React.useState(playerName);

  const handleSave = async () => {
    setPlayerName(name);
    if (playerId) {
      await updateProfileName(playerId, name);
    } else {
      await getOrCreateProfile(name);
    }
    router.back();
  };

  return (
    <Screen
      title="Instellingen"
      headerRight={
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent.primary }}>Sluiten</Text>
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Spelersnaam</Text>
          <TextInput
            style={[
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Jouw naam"
            placeholderTextColor={palette.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Accentkleur</Text>
          <OptionGroup
            options={[
              { label: 'Groen', value: 'green' },
              { label: 'Blauw', value: 'blue' },
            ]}
            value={accentColor}
            onChange={(v) => setAccent(v as AccentColor)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Thema</Text>
          <OptionGroup
            options={[
              { label: 'Systeem', value: 'system' },
              { label: 'Licht', value: 'light' },
              { label: 'Donker', value: 'dark' },
            ]}
            value={themeMode}
            onChange={(v) => setThemeMode(v as 'system' | 'light' | 'dark')}
          />
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: palette.text }]}>Dev: Mock transport</Text>
            <OptionGroup
              options={[
                { label: 'Aan', value: 'true' },
                { label: 'Uit', value: 'false' },
              ]}
              value={useMockTransport ? 'true' : 'false'}
              onChange={(v) => setUseMockTransport(v === 'true')}
            />
          </View>
        )}

        <Card title="Woordenlijst">
          <Text style={[styles.attribution, { color: palette.textSecondary }]}>
            De Nederlandse woordenlijst is afkomstig van Stichting OpenTaal (opentaal.org).
            {'\n\n'}
            Gebruikt onder de Revised BSD License en/of Creative Commons Attribution 3.0 (CC BY 3.0).
            {'\n\n'}
            Bron: github.com/OpenTaal/opentaal-wordlist
          </Text>
        </Card>

        <Button title="Opslaan" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
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
  },
  attribution: {
    ...typography.caption,
    lineHeight: 20,
  },
});
