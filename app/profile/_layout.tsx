import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="history/[id]" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="head-to-head" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
