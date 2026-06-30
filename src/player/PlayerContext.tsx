import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LibraryVideo } from '../library/types';

export interface PlayerContextValue {
  currentVideo: LibraryVideo | null;
  queue: LibraryVideo[];
  currentIndex: number;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  playbackSpeed: number;
  playVideo: (video: LibraryVideo, queue?: LibraryVideo[]) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  next: () => void;
  previous: () => void;
  setQueue: (queue: LibraryVideo[]) => void;
  addToQueue: (video: LibraryVideo) => void;
  removeFromQueue: (uri: string) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  currentVideo: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  playbackSpeed: 1.0,
  playVideo: () => {},
  togglePlay: () => {},
  seekTo: () => {},
  setPlaybackSpeed: () => {},
  next: () => {},
  previous: () => {},
  setQueue: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
});

export function usePlayer() {
  return useContext(PlayerContext);
}

interface PlayerProviderProps {
  children: ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [currentVideo, setCurrentVideo] = useState<LibraryVideo | null>(null);
  const [queue, setQueueState] = useState<LibraryVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);

  const playVideo = useCallback((video: LibraryVideo, customQueue?: LibraryVideo[]) => {
    setCurrentVideo(video);
    setIsPlaying(true);
    setPosition(video.resumePosition || 0);
    setDuration(video.metadata?.duration || 0);

    if (customQueue) {
      setQueueState(customQueue);
      const index = customQueue.findIndex((v) => v.id === video.id);
      setCurrentIndex(index);
    } else {
      // If no custom queue provided, check if video is already in existing queue
      setQueueState((prevQueue) => {
        const index = prevQueue.findIndex((v) => v.id === video.id);
        if (index !== -1) {
          setCurrentIndex(index);
          return prevQueue;
        } else {
          const newQueue = [...prevQueue, video];
          setCurrentIndex(newQueue.length - 1);
          return newQueue;
        }
      });
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    setPosition(Math.max(0, Math.min(seconds, duration)));
  }, [duration]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0 || currentIndex === -1) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
      const video = queue[nextIndex];
      setCurrentVideo(video);
      setPosition(video.resumePosition || 0);
      setDuration(video.metadata?.duration || 0);
      setIsPlaying(true);
    }
  }, [queue, currentIndex]);

  const previous = useCallback(() => {
    if (queue.length === 0 || currentIndex === -1) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      const video = queue[prevIndex];
      setCurrentVideo(video);
      setPosition(video.resumePosition || 0);
      setDuration(video.metadata?.duration || 0);
      setIsPlaying(true);
    }
  }, [queue, currentIndex]);

  const setQueue = useCallback((newQueue: LibraryVideo[]) => {
    setQueueState(newQueue);
    if (currentVideo) {
      const idx = newQueue.findIndex((v) => v.id === currentVideo.id);
      setCurrentIndex(idx);
    } else {
      setCurrentIndex(-1);
    }
  }, [currentVideo]);

  const addToQueue = useCallback((video: LibraryVideo) => {
    setQueueState((prev) => {
      if (prev.some((v) => v.id === video.id)) return prev;
      return [...prev, video];
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueueState((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      if (currentVideo?.id === id) {
        // If current video is removed, stop playing or move to next
        setCurrentVideo(null);
        setCurrentIndex(-1);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      } else if (currentVideo) {
        const idx = filtered.findIndex((v) => v.id === currentVideo.id);
        setCurrentIndex(idx);
      }
      return filtered;
    });
  }, [currentVideo]);

  const clearQueue = useCallback(() => {
    setQueueState([]);
    setCurrentVideo(null);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }, []);

  const value = useMemo(
    () => ({
      currentVideo,
      queue,
      currentIndex,
      isPlaying,
      position,
      duration,
      playbackSpeed,
      playVideo,
      togglePlay,
      seekTo,
      setPlaybackSpeed,
      next,
      previous,
      setQueue,
      addToQueue,
      removeFromQueue,
      clearQueue,
    }),
    [
      currentVideo,
      queue,
      currentIndex,
      isPlaying,
      position,
      duration,
      playbackSpeed,
      playVideo,
      togglePlay,
      seekTo,
      setPlaybackSpeed,
      next,
      previous,
      setQueue,
      addToQueue,
      removeFromQueue,
      clearQueue,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
