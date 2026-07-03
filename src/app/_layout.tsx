import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../theme';
import { LibraryProvider, PlaylistProvider } from '../library';
import { PlayerProvider } from '../player';
import { SettingsProvider, useSettings } from '../storage';
import { ErrorBoundary } from '../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading } = useSettings();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="player" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="queue" options={{ presentation: 'modal' }} />
      <Stack.Screen name="video-info" options={{ presentation: 'modal' }} />
      <Stack.Screen name="folder/index" />
      <Stack.Screen name="folder/view" />
      <Stack.Screen name="playlist/[id]" />
      <Stack.Screen name="playlist/new" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <ThemeProvider>
          <LibraryProvider>
            <PlaylistProvider>
              <PlayerProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </PlayerProvider>
            </PlaylistProvider>
          </LibraryProvider>
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
