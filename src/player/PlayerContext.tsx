import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { VideoRef, TextTrack, AudioTrack } from 'react-native-video';
import type { LibraryVideo, Bookmark, SleepTimerState } from '../library/types';
import { LibraryContext } from '../library/LibraryContext';
import { PlaybackService } from './PlaybackService';
import { backgroundAudioService } from '../services/BackgroundAudioService';
import { pipService } from '../services/PiPService';
import type { PlaybackState } from './types';

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
  moveQueueItem: (id: string, direction: 'up' | 'down') => void;
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
  exitPiP: () => void;
  isAudioOnly: boolean;
  setAudioOnly: (v: boolean) => void;
  aspectRatio: string;
  setAspectRatio: (r: string) => void;
  playbackState: PlaybackState;
  isBackgroundAudioEnabled: boolean;
  toggleBackgroundAudio: () => void;
}

const defaultContext: PlayerContextValue = {
  currentVideo: null, queue: [], currentIndex: -1, isPlaying: false,
  position: 0, duration: 0, playbackSpeed: 1.0, volume: 1.0, isMuted: false,
  videoRef: { current: null },
  playVideo: () => {}, togglePlay: () => {}, seekTo: () => {},
  setPlaybackSpeed: () => {}, setVolume: () => {}, toggleMute: () => {},
  next: () => {}, previous: () => {}, setQueue: () => {}, addToQueue: () => {},
  removeFromQueue: () => {}, moveQueueItem: () => {}, clearQueue: () => {},
  onProgress: () => {}, onLoad: () => {}, onEnd: () => {}, onError: () => {},
  sleepTimer: null, startSleepTimer: () => {}, cancelSleepTimer: () => {},
  bookmarks: [], addBookmark: () => {}, removeBookmark: () => {}, setBookmarks: () => {},
  audioTracks: [], selectedAudioTrack: -1, setSelectedAudioTrack: () => {},
  textTracks: [], selectedTextTrack: -1, setSelectedTextTrack: () => {},
  isPiPActive: false, enterPiP: () => {}, exitPiP: () => {},
  isAudioOnly: false, setAudioOnly: () => {}, aspectRatio: 'auto', setAspectRatio: () => {},
  playbackState: 'idle', isBackgroundAudioEnabled: false, toggleBackgroundAudio: () => {},
};

const PlayerContext = createContext<PlayerContextValue>(defaultContext);

export function usePlayer() {
  return useContext(PlayerContext);
}

interface PlayerProviderProps {
  children: ReactNode;
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const playbackServiceRef = useRef<PlaybackService>(new PlaybackService());
  const [currentVideo, setCurrentVideo] = useState<LibraryVideo | null>(null);
  const [queue, setQueueState] = useState<LibraryVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState | null>(null);
  const [bookmarks, setBookmarksState] = useState<Bookmark[]>([]);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [isAudioOnly, setAudioOnlyState] = useState<boolean>(false);
  const [aspectRatio, setAspectRatioState] = useState<string>('auto');
  const [isBackgroundAudioEnabled, setIsBackgroundAudioEnabled] = useState<boolean>(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<number>(0);
  const videoRef = useRef<VideoRef | null>(null);

  const { updateResumePosition } = useContext(LibraryContext);
  const positionRef = useRef(position);
  const currentVideoRef = useRef(currentVideo);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { currentVideoRef.current = currentVideo; }, [currentVideo]);

  useEffect(() => {
    const service = playbackServiceRef.current;
    service.setOnPositionSave((uri, pos) => {
      updateResumePosition(uri, pos);
    });

    const unsubscribe = service.subscribe((snapshot) => {
      setCurrentVideo(snapshot.currentVideo);
      setQueueState(snapshot.queue);
      setCurrentIndex(snapshot.currentIndex);
      setIsPlaying(snapshot.state === 'playing' || snapshot.state === 'loading');
      setPosition(snapshot.position);
      setDuration(snapshot.duration);
      setPlaybackSpeedState(snapshot.playbackSpeed);
      setVolumeState(snapshot.volume);
      setIsMuted(snapshot.isMuted);
      setPlaybackState(snapshot.state);
      setSleepTimer(snapshot.sleepTimer as SleepTimerState | null);
      setBookmarksState(snapshot.bookmarks);
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [updateResumePosition]);

  useEffect(() => {
    const unsubPiP = pipService.onStateChange((active) => setIsPiPActive(active));
    const unsubBg = backgroundAudioService.onStateChange((enabled) => setIsBackgroundAudioEnabled(enabled));
    return () => { unsubPiP(); unsubBg(); };
  }, []);

  const playVideo = useCallback((video: LibraryVideo, customQueue?: LibraryVideo[]) => {
    playbackServiceRef.current.playVideo(video, customQueue);
  }, []);

  const togglePlay = useCallback(() => {
    playbackServiceRef.current.togglePlay();
    if (videoRef.current) {
      if (playbackServiceRef.current.snapshot.state === 'playing') {
        (videoRef.current as { resume?: () => void })?.resume?.();
      } else {
        (videoRef.current as { pause?: () => void })?.pause?.();
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    playbackServiceRef.current.seekTo(clamped);
    videoRef.current?.seek(clamped);
  }, [duration]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    playbackServiceRef.current.setPlaybackSpeed(speed);
  }, []);

  const setVolume = useCallback((v: number) => {
    playbackServiceRef.current.setVolume(v);
    videoRef.current?.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    playbackServiceRef.current.toggleMute();
  }, []);

  const next = useCallback(() => {
    playbackServiceRef.current.next();
  }, []);

  const previous = useCallback(() => {
    playbackServiceRef.current.previous();
  }, []);

  const setQueue = useCallback((newQueue: LibraryVideo[]) => {
    playbackServiceRef.current.setQueue(newQueue);
  }, []);

  const addToQueue = useCallback((video: LibraryVideo) => {
    playbackServiceRef.current.addToQueue(video);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    playbackServiceRef.current.removeFromQueue(id);
  }, []);

  const moveQueueItem = useCallback((id: string, direction: 'up' | 'down') => {
    playbackServiceRef.current.moveQueueItem(id, direction);
  }, []);

  const clearQueue = useCallback(() => {
    playbackServiceRef.current.clearQueue();
    (videoRef.current as { stop?: () => void })?.stop?.();
  }, []);

  const onProgress = useCallback((progress: { currentTime: number }) => {
    setPosition(progress.currentTime);
    playbackServiceRef.current.setPosition(progress.currentTime);
  }, []);

  const onLoad = useCallback((data: { duration: number; audioTracks?: AudioTrack[]; textTracks?: TextTrack[]; currentTime?: number }) => {
    setDuration(data.duration);
    playbackServiceRef.current.setDuration(data.duration);
    playbackServiceRef.current.setState('playing');
    if (data.audioTracks) setAudioTracks(data.audioTracks);
    if (data.textTracks) setTextTracks(data.textTracks);
    if (data.currentTime !== undefined) setPosition(data.currentTime);
  }, []);

  const onEnd = useCallback(() => {
    playbackServiceRef.current.onEnd();
  }, []);

  const onError = useCallback((error: Error) => {
    playbackServiceRef.current.onError();
    console.warn('Video error:', error);
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    playbackServiceRef.current.startSleepTimer(minutes);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    playbackServiceRef.current.cancelSleepTimer();
  }, []);

  const addBookmark = useCallback((label?: string) => {
    playbackServiceRef.current.addBookmark(label);
  }, []);

  const removeBookmark = useCallback((id: string) => {
    playbackServiceRef.current.removeBookmark(id);
  }, []);

  const enterPiP = useCallback(() => {
    pipService.enterPiP(videoRef.current);
  }, []);

  const exitPiP = useCallback(() => {
    pipService.exitPiP();
  }, []);

  const toggleBackgroundAudio = useCallback(() => {
    if (backgroundAudioService.isBackgroundAudioEnabled) {
      backgroundAudioService.disable();
    } else {
      backgroundAudioService.enable();
    }
  }, []);

  const value = useMemo(
    () => ({
      currentVideo, queue, currentIndex, isPlaying, position, duration,
      playbackSpeed, volume, isMuted, videoRef,
      playVideo, togglePlay, seekTo, setPlaybackSpeed, setVolume, toggleMute,
      next, previous, setQueue, addToQueue, removeFromQueue, moveQueueItem, clearQueue,
      onProgress, onLoad, onEnd, onError,
      sleepTimer, startSleepTimer, cancelSleepTimer,
      bookmarks, addBookmark, removeBookmark, setBookmarks: setBookmarksState,
      audioTracks, selectedAudioTrack, setSelectedAudioTrack,
      textTracks, selectedTextTrack, setSelectedTextTrack,
      isPiPActive, enterPiP, exitPiP,
      isAudioOnly, setAudioOnly: setAudioOnlyState,
      aspectRatio, setAspectRatio: setAspectRatioState,
      playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
    }),
    [
      currentVideo, queue, currentIndex, isPlaying, position, duration,
      playbackSpeed, volume, isMuted, videoRef,
      playVideo, togglePlay, seekTo, setPlaybackSpeed, setVolume, toggleMute,
      next, previous, setQueue, addToQueue, removeFromQueue, moveQueueItem, clearQueue,
      onProgress, onLoad, onEnd, onError,
      sleepTimer, startSleepTimer, cancelSleepTimer,
      bookmarks, addBookmark, removeBookmark,
      audioTracks, selectedAudioTrack, setSelectedAudioTrack,
      textTracks, selectedTextTrack, setSelectedTextTrack,
      isPiPActive, enterPiP, exitPiP,
      isAudioOnly, aspectRatio,
      playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
