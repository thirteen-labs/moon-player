import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Screen =
  | 'home'
  | 'library'
  | 'player'
  | 'search'
  | 'settings'
  | 'playlist'
  | 'folders'
  | 'folderView'
  | 'videoInfo'
  | 'queue'
  | 'networkStreaming'
  | 'backupRestore'
  | 'pluginSystem'
  | 'aiOrganization'
  | 'layouts'
  | 'chromecast'
  | 'crossSync';

type NavParams = Record<string, unknown> | null;

interface NavigationContextValue {
  screen: Screen;
  params: NavParams;
  navigate: (screen: Screen, params?: NavParams) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  screen: 'home',
  params: null,
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
  const [params, setParams] = useState<NavParams>(null);

  const navigate = useCallback((newScreen: Screen, newParams: NavParams = null) => {
    setScreen(newScreen);
    setParams(newParams);
  }, []);

  const value = useMemo(() => ({ screen, params, navigate }), [screen, params, navigate]);

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}
