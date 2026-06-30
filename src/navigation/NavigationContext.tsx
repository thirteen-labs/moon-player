import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Screen = 'home' | 'library' | 'player' | 'search' | 'settings';

interface NavigationContextValue {
  screen: Screen;
  navigate: (screen: Screen) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  screen: 'home',
  navigate: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [screen, setScreen] = useState<Screen>('home');

  const navigate = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
  }, []);

  const value = useMemo(() => ({ screen, navigate }), [screen, navigate]);

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}
