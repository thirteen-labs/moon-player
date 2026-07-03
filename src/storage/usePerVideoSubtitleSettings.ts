import { useCallback, useState } from 'react';
import { usePlayer } from '../player';
import { useSettings } from './SettingsContext';
import { MmkvService, mmkvStorage } from './MmkvService';

interface PerVideoSubtitleSettings {
  subtitleFontSize: number;
  subtitleFontColor: string;
  subtitleBackgroundColor: string;
  subtitleFontFamily: string;
  subtitleShadow: boolean;
  subtitleOutline: boolean;
  subtitlePosition: 'bottom' | 'top' | 'middle';
  subtitleOffset: number;
}

const STORAGE_KEY = 'per_video_subtitles';

const OVERRIDE_KEYS: (keyof PerVideoSubtitleSettings)[] = [
  'subtitleFontSize', 'subtitleFontColor', 'subtitleBackgroundColor',
  'subtitleFontFamily', 'subtitleShadow', 'subtitleOutline',
  'subtitlePosition', 'subtitleOffset',
];

function loadAll(): Record<string, Record<string, unknown>> {
  return MmkvService.getObject<Record<string, Record<string, unknown>>>(STORAGE_KEY) ?? {};
}

function saveAll(data: Record<string, Record<string, unknown>>): void {
  mmkvStorage.set(STORAGE_KEY, JSON.stringify(data));
}

export function usePerVideoSubtitleSettings() {
  const { currentVideo } = usePlayer();
  const { settings, updateSettings } = useSettings();
  const [perVideo, setPerVideo] = useState<Record<string, Record<string, unknown>>>(loadAll);

  const videoId = currentVideo?.id;

  const getMergedSettings = useCallback((): PerVideoSubtitleSettings => {
    const base: PerVideoSubtitleSettings = {
      subtitleFontSize: settings.subtitleFontSize,
      subtitleFontColor: settings.subtitleFontColor,
      subtitleBackgroundColor: settings.subtitleBackgroundColor,
      subtitleFontFamily: settings.subtitleFontFamily,
      subtitleShadow: settings.subtitleShadow,
      subtitleOutline: settings.subtitleOutline,
      subtitlePosition: settings.subtitlePosition,
      subtitleOffset: settings.subtitleOffset,
    };
    if (!videoId || !perVideo[videoId]) return base;
    const overrides = perVideo[videoId] as Record<string, unknown>;
    for (const key of OVERRIDE_KEYS) {
      if (overrides[key] !== undefined) {
        (base as unknown as Record<string, unknown>)[key] = overrides[key];
      }
    }
    return base;
  }, [settings, videoId, perVideo]);

  const updatePerVideo = useCallback(async (updates: Partial<PerVideoSubtitleSettings>) => {
    if (!videoId) {
      await updateSettings(updates);
      return;
    }
    const current = loadAll();
    current[videoId] = { ...current[videoId], ...updates };
    saveAll(current);
    setPerVideo(current);
  }, [videoId, updateSettings]);

  const deletePerVideo = useCallback(async () => {
    if (!videoId) return;
    const current = loadAll();
    delete current[videoId];
    saveAll(current);
    setPerVideo(current);
  }, [videoId]);

  return {
    mergedSubtitleSettings: getMergedSettings(),
    hasPerVideoSettings: !!videoId && !!perVideo[videoId],
    updatePerVideo,
    deletePerVideo,
  };
}
