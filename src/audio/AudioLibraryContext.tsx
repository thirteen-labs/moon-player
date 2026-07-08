import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AudioLibrary } from './AudioLibrary';
import { AudioRepository } from './AudioRepository';
import { runMigrations } from '../database';
import type { LibraryAudio, AudioScanProgress, AudioScanResult } from './types';

export interface AudioLibraryContextValue {
  tracks: LibraryAudio[];
  isScanning: boolean;
  scanProgress: AudioScanProgress | null;
  scan: (rootUris: string[]) => Promise<AudioScanResult>;
  addUris: (uris: string[]) => Promise<LibraryAudio[]>;
  getTrack: (uri: string) => LibraryAudio | undefined;
  toggleFavorite: (uri: string) => Promise<void>;
  updateResumePosition: (uri: string, position: number) => Promise<void>;
  markPlayed: (uri: string) => Promise<void>;
  audioLibrary: AudioLibrary;
}

export const AudioLibraryContext = createContext<AudioLibraryContextValue>({
  tracks: [],
  isScanning: false,
  scanProgress: null,
  scan: async () => ({ added: [], updated: [], removed: [], totalDuration: 0, scanDuration: 0 }),
  addUris: async () => [],
  getTrack: () => undefined,
  toggleFavorite: async () => {},
  updateResumePosition: async () => {},
  markPlayed: async () => {},
  audioLibrary: new AudioLibrary(),
});

interface AudioLibraryProviderProps {
  children: ReactNode;
}

export function AudioLibraryProvider({ children }: AudioLibraryProviderProps) {
  const serviceRef = useRef(new AudioLibrary());
  const [tracks, setTracks] = useState<LibraryAudio[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<AudioScanProgress | null>(null);

  useEffect(() => {
    async function loadLibrary() {
      await runMigrations();
      const dbTracks = await AudioRepository.findAll();
      if (dbTracks.length > 0) {
        serviceRef.current.loadFromTracks(dbTracks);
      }
      setTracks(serviceRef.current.getAllTracks());
    }
    loadLibrary();
  }, []);

  const scan = useCallback(async (rootUris: string[]): Promise<AudioScanResult> => {
    setIsScanning(true);
    setScanProgress(null);

    try {
      const result = await serviceRef.current.scanDirectories(rootUris, (progress) => {
        setScanProgress(progress);
      });

      setTracks(serviceRef.current.getAllTracks());

      for (const track of result.added) {
        await AudioRepository.insert(track);
      }
      for (const uri of result.removed) {
        await AudioRepository.delete(uri);
      }

      return result;
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, []);

  const addUris = useCallback(async (uris: string[]): Promise<LibraryAudio[]> => {
    const added = await serviceRef.current.scanUris(uris);
    setTracks(serviceRef.current.getAllTracks());
    for (const track of added) {
      await AudioRepository.insert(track);
    }
    return added;
  }, []);

  const getTrack = useCallback((uri: string): LibraryAudio | undefined => {
    return serviceRef.current.getTrack(uri);
  }, []);

  const toggleFavorite = useCallback(async (uri: string) => {
    const track = serviceRef.current.getTrack(uri);
    if (!track) return;

    const updated: LibraryAudio = { ...track, isFavorite: !track.isFavorite };
    serviceRef.current.updateTrack(uri, updated);
    setTracks(serviceRef.current.getAllTracks());
    await AudioRepository.toggleFavorite(uri);
  }, []);

  const updateResumePosition = useCallback(async (uri: string, position: number) => {
    const track = serviceRef.current.getTrack(uri);
    if (!track) return;

    const updated: LibraryAudio = {
      ...track,
      resumePosition: position,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateTrack(uri, updated);
    setTracks(serviceRef.current.getAllTracks());
    await AudioRepository.updateResumePosition(uri, position);
  }, []);

  const markPlayed = useCallback(async (uri: string) => {
    const track = serviceRef.current.getTrack(uri);
    if (!track) return;

    const updated: LibraryAudio = {
      ...track,
      playCount: track.playCount + 1,
      lastPlayedAt: Date.now(),
    };
    serviceRef.current.updateTrack(uri, updated);
    setTracks(serviceRef.current.getAllTracks());
    await AudioRepository.markPlayed(uri);
  }, []);

  const audioLibrary = serviceRef.current; // eslint-disable-line react-hooks/refs

  const value = useMemo(
    () => ({
      tracks,
      isScanning,
      scanProgress,
      scan,
      addUris,
      getTrack,
      toggleFavorite,
      updateResumePosition,
      markPlayed,
      audioLibrary,
    }),
    [tracks, isScanning, scanProgress, scan, addUris, getTrack, toggleFavorite, updateResumePosition, markPlayed, audioLibrary],
  );

  return <AudioLibraryContext.Provider value={value}>{children}</AudioLibraryContext.Provider>;
}
