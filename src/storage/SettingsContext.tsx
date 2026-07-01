import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StorageService } from './StorageService';
import type { SettingsData } from './StorageService';

export interface SettingsContextValue {
  settings: SettingsData;
  isLoading: boolean;
  updateSettings: (updates: Partial<SettingsData>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: SettingsData = {
  defaultSort: 'name',
  defaultLayout: 'grid',
  gridColumns: 3,
  scanDirectories: [],
  playbackSpeed: 1,
  subtitleOffset: 0,
  autoResume: true,
  theme: 'dark',
  accent: null,
  gestureBrightness: true,
  gestureVolume: true,
  gestureSeek: true,
  gestureDoubleTap: true,
  gestureLongPress: true,
  gesturePinch: true,
  autoHideControls: true,
  autoHideDelay: 4000,
  subtitleFontSize: 16,
  subtitleFontColor: '#ffffff',
  subtitleBackgroundColor: 'rgba(0,0,0,0.5)',
  subtitleFontFamily: 'System',
  subtitleShadow: true,
  subtitleOutline: false,
  subtitlePosition: 'bottom',
  audioEqualizer: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: 0,
  dialogueBoost: false,
  audioNormalization: false,
  volumeBoost: 1.0,
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  gamma: 1.0,
  skipDuration: 10,
  recentSearches: [],
  updatedAt: 0,
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  updateSettings: async () => {},
  resetSettings: async () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await StorageService.loadSettings();
      setSettings(data);
    } catch {
      // Handle loading error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates: Partial<SettingsData>) => {
    try {
      await StorageService.saveSettings(updates);
      setSettings((prev) => ({
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      }));
    } catch {
      // Handle save error
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      await StorageService.saveSettings(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
    } catch {
      // Handle reset error
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      updateSettings,
      resetSettings,
    }),
    [settings, isLoading, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
