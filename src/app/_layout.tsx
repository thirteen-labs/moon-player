import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import { SettingsProvider } from '@/storage';
import { ThemeProvider, useTheme } from '@/theme';
import { LibraryProvider } from '@/library';
import { PlayerProvider } from '@/player';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="player" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // Keep the app portrait by default; the player unlocks landscape in fullscreen.
  useEffect(() => {
    lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <LibraryProvider>
            <PlayerProvider>
              <AppContent />
            </PlayerProvider>
          </LibraryProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
