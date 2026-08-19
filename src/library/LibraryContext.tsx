import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useMediaChangeEvent, type MediaChangeEvent } from '@obsidian_north/react-native-mediastore';
import { LibraryService } from './LibraryService';
import { runMigrations, VideoRepository } from '../database';
import { useSettings } from '../storage';
import type { LibraryVideo, ScanProgress, ScanResult } from './types';

export interface LibraryContextValue {
  videos: LibraryVideo[];
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scan: (rootUris: string[]) => Promise<ScanResult>;
  addUris: (uris: string[]) => Promise<LibraryVideo[]>;
  getVideo: (uri: string) => LibraryVideo | undefined;
  toggleFavorite: (uri: string) => Promise<void>;
  updateResumePosition: (uri: string, position: number) => Promise<void>;
  markPlayed: (uri: string) => Promise<void>;
  libraryService: LibraryService;
}

export const LibraryContext = createContext<LibraryContextValue>({
  videos: [],
  isScanning: false,
  scanProgress: null,
  scan: async () => ({ added: [], updated: [], removed: [], totalDuration: 0, scanDuration: 0 }),
  addUris: async () => [],
  getVideo: () => undefined,
  toggleFavorite: async () => {},
  updateResumePosition: async () => {},
  markPlayed: async () => {},
  libraryService: new LibraryService(),
});

interface LibraryProviderProps {
  children: ReactNode;
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const serviceRef = useRef(new LibraryService());
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const { settings } = useSettings();
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const rescanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didAutoScan = useRef(false);

  useEffect(() => {
    async function loadLibrary() {
      await runMigrations();
      const dbVideos = await VideoRepository.findAll();
      if (dbVideos.length > 0) {
        serviceRef.current.loadFromVideos(dbVideos);
      }
      setVideos(serviceRef.current.getAllVideos());
    }
    loadLibrary();
  }, []);

  // Auto-fetch/index videos on first launch so the library fills without a
  // manual scan. Scans the configured directories (or the whole device when
  // none are configured). Debounced via the in-flight scan guard.
  useEffect(() => {
    if (didAutoScan.current) return;
    didAutoScan.current = true;
    const timer = setTimeout(() => {
      if (!serviceRef.current.isScanning) {
        void scan(settingsRef.current.scanDirectories);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [scan]);

  const scan = useCallback(async (rootUris: string[]): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(null);

    try {
      const result = await serviceRef.current.fetchFirst(rootUris, (progress) => {
        setScanProgress(progress);
      });

      setVideos(serviceRef.current.getAllVideos());

      for (const video of result.added) {
        await VideoRepository.insert(video);
      }
      for (const uri of result.removed) {
        await VideoRepository.delete(uri);
      }

      return result;
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, []);

  const addUris = useCallback(async (uris: string[]): Promise<LibraryVideo[]> => {
    const added = await serviceRef.current.fetchAdditionalUris(uris);
    setVideos(serviceRef.current.getAllVideos());
    for (const video of added) {
      await VideoRepository.insert(video);
    }
    return added;
  }, []);

  // Re-scan when the device media library changes (video added/removed/edited).
  // Debounced so bursts of change events coalesce into a single rescan.
  const rescan = useCallback(async () => {
    if (serviceRef.current.isScanning) return;
    await scan(settingsRef.current.scanDirectories);
  }, [scan]);

  const handleMediaChange = useCallback((event: MediaChangeEvent) => {
    if (event.mediaType !== 'video') return;
    if (rescanTimer.current) clearTimeout(rescanTimer.current);
    rescanTimer.current = setTimeout(() => {
      rescanTimer.current = null;
      void rescan();
    }, 1500);
  }, [rescan]);

  useMediaChangeEvent(handleMediaChange);

  useEffect(() => {
    return () => {
      if (rescanTimer.current) clearTimeout(rescanTimer.current);
    };
  }, []);

  const getVideo = useCallback((uri: string): LibraryVideo | undefined => {
    return serviceRef.current.getVideo(uri);
  }, []);

  const toggleFavorite = useCallback(async (uri: string) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = { ...video, isFavorite: !video.isFavorite };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    await VideoRepository.toggleFavorite(uri);
  }, []);

  const updateResumePosition = useCallback(async (uri: string, position: number) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = {
      ...video,
      resumePosition: position,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    await VideoRepository.updateResumePosition(uri, position);
  }, []);

  const markPlayed = useCallback(async (uri: string) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = {
      ...video,
      playCount: video.playCount + 1,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    await VideoRepository.markPlayed(uri);
  }, []);

  const libraryService = serviceRef.current; // eslint-disable-line react-hooks/refs

  const value = useMemo(
    () => ({
      videos,
      isScanning,
      scanProgress,
      scan,
      addUris,
      getVideo,
      toggleFavorite,
      updateResumePosition,
      markPlayed,
      libraryService,
    }),
    [videos, isScanning, scanProgress, scan, addUris, getVideo, toggleFavorite, updateResumePosition, markPlayed, libraryService],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
