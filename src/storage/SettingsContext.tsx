import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { runMigrations, SettingsRepository } from '../database';

export interface SettingsData {
  defaultSort: 'name' | 'date' | 'duration';
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  scanDirectories: string[];
  playbackSpeed: number;
  subtitleOffset: number;
  autoResume: boolean;
  theme: string;
  accent: string | null;
  gestureBrightness: boolean;
  gestureVolume: boolean;
  gestureSeek: boolean;
  gestureDoubleTap: boolean;
  gestureLongPress: boolean;
  gesturePinch: boolean;
  autoHideControls: boolean;
  autoHideDelay: number;
  subtitleFontSize: number;
  subtitleFontColor: string;
  subtitleBackgroundColor: string;
  subtitleFontFamily: string;
  subtitleShadow: boolean;
  subtitleOutline: boolean;
  subtitlePosition: 'bottom' | 'top' | 'middle';
  audioEqualizer: number[];
  bassBoost: number;
  dialogueBoost: boolean;
  audioNormalization: boolean;
  volumeBoost: number;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  temperature: number;
  skipDuration: number;
  recentSearches: string[];
  updatedAt: number;
}

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
  temperature: 0,
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
      await runMigrations();
      const raw = await SettingsRepository.get('aura_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
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
      const merged = { ...settings, ...updates, updatedAt: Date.now() };
      await SettingsRepository.set('aura_settings', JSON.stringify(merged));
      setSettings(merged);
    } catch {
      // Handle save error
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      await SettingsRepository.set('aura_settings', JSON.stringify(DEFAULT_SETTINGS));
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
