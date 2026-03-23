// app/_layout.tsx
// Layout raiz do app — configura navegação, fontes e StatusBar

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tela de login — sem bottom nav */}
        <Stack.Screen name="index" />

        {/* Telas com bottom nav (tabs) */}
        <Stack.Screen name="(tabs)" />

        {/* Telas imersivas — sem bottom nav */}
        <Stack.Screen
          name="camera/index"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="camera/analyzing"
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name="result/index"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
