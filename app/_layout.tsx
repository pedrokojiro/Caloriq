import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
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
