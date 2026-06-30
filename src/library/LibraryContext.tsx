import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { LibraryService } from './LibraryService';
import { StorageService } from '../storage/StorageService';
import type { LibraryVideo, ScanProgress, ScanResult } from './types';

export interface LibraryContextValue {
  videos: LibraryVideo[];
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scan: (rootUris: string[]) => Promise<ScanResult>;
  addUris: (uris: string[]) => Promise<LibraryVideo[]>;
  getVideo: (uri: string) => LibraryVideo | undefined;
  toggleFavorite: (uri: string) => void;
  updateResumePosition: (uri: string, position: number) => void;
  markPlayed: (uri: string) => void;
  libraryService: LibraryService;
}

export const LibraryContext = createContext<LibraryContextValue>({
  videos: [],
  isScanning: false,
  scanProgress: null,
  scan: async () => ({ added: [], updated: [], removed: [], totalDuration: 0, scanDuration: 0 }),
  addUris: async () => [],
  getVideo: () => undefined,
  toggleFavorite: () => {},
  updateResumePosition: () => {},
  markPlayed: () => {},
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

  const saveLibraryState = useCallback(async () => {
    const allVideos = serviceRef.current.getAllVideos();
    const videosMap = new Map<string, LibraryVideo>(allVideos.map((v) => [v.id, v]));
    const scannedUris = serviceRef.current.getScannedUris();
    await StorageService.saveLibrary(videosMap, scannedUris);
  }, []);

  useEffect(() => {
    async function loadLibrary() {
      const data = await StorageService.loadLibrary();
      if (data) {
        serviceRef.current.initialize(data.videos, data.scannedUris);
        setVideos(serviceRef.current.getAllVideos());
      }
    }
    loadLibrary();
  }, []);

  const scan = useCallback(async (rootUris: string[]): Promise<ScanResult> => {
    setIsScanning(true);
    setScanProgress(null);

    try {
      const result = await serviceRef.current.fetchFirst(rootUris, (progress) => {
        setScanProgress(progress);
      });

      setVideos(serviceRef.current.getAllVideos());
      await saveLibraryState();
      return result;
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, [saveLibraryState]);

  const addUris = useCallback(async (uris: string[]): Promise<LibraryVideo[]> => {
    const added = await serviceRef.current.fetchAdditionalUris(uris);
    setVideos(serviceRef.current.getAllVideos());
    await saveLibraryState();
    return added;
  }, [saveLibraryState]);

  const getVideo = useCallback((uri: string): LibraryVideo | undefined => {
    return serviceRef.current.getVideo(uri);
  }, []);

  const toggleFavorite = useCallback((uri: string) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = { ...video, isFavorite: !video.isFavorite };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    saveLibraryState();
  }, [saveLibraryState]);

  const updateResumePosition = useCallback((uri: string, position: number) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = {
      ...video,
      resumePosition: position,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    saveLibraryState();
  }, [saveLibraryState]);

  const markPlayed = useCallback((uri: string) => {
    const video = serviceRef.current.getVideo(uri);
    if (!video) return;

    const updated: LibraryVideo = {
      ...video,
      playCount: video.playCount + 1,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateVideo(uri, updated);
    setVideos(serviceRef.current.getAllVideos());
    saveLibraryState();
  }, [saveLibraryState]);

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
      libraryService: serviceRef.current,
    }),
    [videos, isScanning, scanProgress, scan, addUris, getVideo, toggleFavorite, updateResumePosition, markPlayed],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
