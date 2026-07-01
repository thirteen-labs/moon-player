import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { VideoRef, TextTrack, AudioTrack } from 'react-native-video';
import type { LibraryVideo, Bookmark, SleepTimerState } from '../library/types';
import { formatDuration } from '../utils/format';

export interface PlayerContextValue {
  currentVideo: LibraryVideo | null;
  queue: LibraryVideo[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  videoRef: React.RefObject<VideoRef | null>;
  playVideo: (video: LibraryVideo, queue?: LibraryVideo[]) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (queue: LibraryVideo[]) => void;
  addToQueue: (video: LibraryVideo) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  onProgress: (progress: { currentTime: number; playableDuration: number; seekableDuration: number }) => void;
  onLoad: (data: { duration: number }) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
  sleepTimer: SleepTimerState | null;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  bookmarks: Bookmark[];
  addBookmark: (label?: string) => void;
  removeBookmark: (id: string) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  audioTracks: AudioTrack[];
  selectedAudioTrack: number;
  setSelectedAudioTrack: (index: number) => void;
  textTracks: TextTrack[];
  selectedTextTrack: number;
  setSelectedTextTrack: (index: number) => void;
  isPiPActive: boolean;
  enterPiP: () => void;
  isAudioOnly: boolean;
  setAudioOnly: (v: boolean) => void;
  aspectRatio: string;
  setAspectRatio: (r: string) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  currentVideo: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,
  videoRef: { current: null },
  playVideo: () => {},
  togglePlay: () => {},
  seekTo: () => {},
  setPlaybackSpeed: () => {},
  setVolume: () => {},
  toggleMute: () => {},
  next: () => {},
  previous: () => {},
  setQueue: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  onProgress: () => {},
  onLoad: () => {},
  onEnd: () => {},
  onError: () => {},
  sleepTimer: null,
  startSleepTimer: () => {},
  cancelSleepTimer: () => {},
  bookmarks: [],
  addBookmark: () => {},
  removeBookmark: () => {},
  setBookmarks: () => {},
  audioTracks: [],
  selectedAudioTrack: -1,
  setSelectedAudioTrack: () => {},
  textTracks: [],
  selectedTextTrack: -1,
  setSelectedTextTrack: () => {},
  isPiPActive: false,
  enterPiP: () => {},
  isAudioOnly: false,
  setAudioOnly: () => {},
  aspectRatio: 'auto',
  setAspectRatio: () => {},
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
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const videoRef = useRef<VideoRef | null>(null);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState | null>(null);
  const [bookmarks, setBookmarksState] = useState<Bookmark[]>([]);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<number>(0);
  const [isPiPActive] = useState<boolean>(false);
  const [isAudioOnly, setAudioOnlyState] = useState<boolean>(false);
  const [aspectRatio, setAspectRatioState] = useState<string>('auto');

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    const state: SleepTimerState = {
      isActive: true,
      remainingSeconds: minutes * 60,
      triggerAt: 'pause',
      startedAt: Date.now(),
    };
    setSleepTimer(state);
    sleepTimerRef.current = setInterval(() => {
      setSleepTimer((prev) => {
        if (!prev || !prev.isActive) return prev;
        const remaining = prev.remainingSeconds - 1;
        if (remaining <= 0) {
          if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
          setIsPlaying(false);
          return { ...prev, isActive: false, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: remaining };
      });
    }, 1000);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimer(null);
  }, []);

  const addBookmark = useCallback((label?: string) => {
    setBookmarksState((prev) => {
      const now = Date.now();
      const bookmark: Bookmark = {
        id: `bm_${now}_${Math.random().toString(36).substring(2, 6)}`,
        videoId: currentVideo?.id || '',
        timestamp: position,
        label: label || `Bookmark at ${formatDuration(position)}`,
        createdAt: now,
      };
      return [...prev, bookmark];
    });
  }, [currentVideo, position]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarksState((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    if (currentVideo?.id) {
      setBookmarksState([]); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [currentVideo?.id, setBookmarksState]);

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
    videoRef.current?.seek(Math.max(0, Math.min(seconds, duration)));
  }, [duration]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    videoRef.current?.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
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
      videoRef.current?.seek(video.resumePosition || 0);
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
      videoRef.current?.seek(video.resumePosition || 0);
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

  const onProgress = useCallback((progress: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
    setPosition(progress.currentTime);
  }, []);

  const onLoad = useCallback((data: { duration: number; audioTracks?: AudioTrack[]; textTracks?: TextTrack[]; currentTime?: number }) => {
    setDuration(data.duration);
    if (data.audioTracks) {
      setAudioTracks(data.audioTracks);
    }
    if (data.textTracks) {
      setTextTracks(data.textTracks);
    }
    if (data.currentTime !== undefined) {
      setPosition(data.currentTime);
    }
  }, []);

  const enterPiP = useCallback(() => {
    const ref = videoRef.current;
    if (ref && 'presentFullscreenPlayer' in ref) {
      try {
        (ref as unknown as { presentFullscreenPlayer: () => void }).presentFullscreenPlayer();
      } catch {
        // PiP not available
      }
    }
  }, []);

  const onEnd = useCallback(() => {
    next();
  }, [next]);

  const onError = useCallback((error: Error) => {
    console.warn('Video error:', error);
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
      volume,
      isMuted,
      videoRef,
      playVideo,
      togglePlay,
      seekTo,
      setPlaybackSpeed,
      setVolume,
      toggleMute,
      next,
      previous,
      setQueue,
      addToQueue,
      removeFromQueue,
      clearQueue,
      onProgress,
      onLoad,
      onEnd,
      onError,
      sleepTimer,
      startSleepTimer,
      cancelSleepTimer,
      bookmarks,
      addBookmark,
      removeBookmark,
      setBookmarks: setBookmarksState,
      audioTracks,
      selectedAudioTrack,
      setSelectedAudioTrack,
      textTracks,
      selectedTextTrack,
      setSelectedTextTrack,
      isPiPActive,
      enterPiP,
      isAudioOnly,
      setAudioOnly: setAudioOnlyState,
      aspectRatio,
      setAspectRatio: setAspectRatioState,
    }),
    [
      currentVideo,
      queue,
      currentIndex,
      isPlaying,
      position,
      duration,
      playbackSpeed,
      volume,
      isMuted,
      videoRef,
      playVideo,
      togglePlay,
      seekTo,
      setPlaybackSpeed,
      setVolume,
      toggleMute,
      next,
      previous,
      setQueue,
      addToQueue,
      removeFromQueue,
      clearQueue,
      onProgress,
      onLoad,
      onEnd,
      onError,
      sleepTimer,
      startSleepTimer,
      cancelSleepTimer,
      bookmarks,
      addBookmark,
      removeBookmark,
      audioTracks,
      selectedAudioTrack,
      setSelectedAudioTrack,
      textTracks,
      selectedTextTrack,
      setSelectedTextTrack,
      isPiPActive,
      enterPiP,
      isAudioOnly,
      aspectRatio,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
