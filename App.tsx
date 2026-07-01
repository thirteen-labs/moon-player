import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme';
import { LibraryProvider, PlaylistProvider } from './src/library';
import { PlayerProvider } from './src/player';
import { SettingsProvider } from './src/storage';
import { NavigationProvider, useNavigation } from './src/navigation';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { PlaylistScreen } from './src/screens/PlaylistScreen';
import { FoldersScreen } from './src/screens/FoldersScreen';
import { FolderViewScreen } from './src/screens/FolderViewScreen';
import { VideoInfoScreen } from './src/screens/VideoInfoScreen';
import { QueueScreen } from './src/screens/QueueScreen';

SplashScreen.preventAutoHideAsync();

const SCREENS: Record<string, () => React.JSX.Element> = {
  home: HomeScreen,
  library: LibraryScreen,
  player: PlayerScreen,
  settings: SettingsScreen,
  search: SearchScreen,
  playlist: PlaylistScreen,
  folders: FoldersScreen,
  folderView: FolderViewScreen,
  videoInfo: VideoInfoScreen,
  queue: QueueScreen,
};

function AppContent() {
  const { screen } = useNavigation();
  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const prevScreen = useRef(screen);

  useEffect(() => {
    setAppReady(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    if (screen !== prevScreen.current) {
      prevScreen.current = screen;
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [screen, fadeAnim]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      fadeAnim.setValue(1);
      await SplashScreen.hideAsync();
    }
  }, [appReady, fadeAnim]);

  useEffect(() => {
    if (appReady) {
      onLayoutRootView();
    }
  }, [appReady, onLayoutRootView]);

  if (!appReady) return null;

  const ScreenComponent = SCREENS[screen] || HomeScreen;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScreenComponent />
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SettingsProvider>
          <LibraryProvider>
            <PlaylistProvider>
              <PlayerProvider>
              <NavigationProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </NavigationProvider>
              </PlayerProvider>
            </PlaylistProvider>
          </LibraryProvider>
        </SettingsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}