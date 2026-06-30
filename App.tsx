import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './src/theme';
import { LibraryProvider } from './src/library';
import { NavigationProvider, useNavigation } from './src/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';

function AppContent() {
  const { screen } = useNavigation();

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'library' && <LibraryScreen />}
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
