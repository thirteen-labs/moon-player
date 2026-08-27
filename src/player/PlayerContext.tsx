import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { VideoRef, TextTrack, AudioTrack } from 'react-native-video';
import type { LibraryVideo } from '../library/types';
import { LibraryContext } from '../library/LibraryContext';
import { PlaybackService } from './PlaybackService';
import { createMediaEngine } from './MediaEngine';
import { pipService } from '../services/PiPService';
import type { PlaybackState } from './types';

export interface PlayerContextValue {
  currentVideo: LibraryVideo | null;
  queue: LibraryVideo[];
  currentIndex: number;
  isPlaying: boolean;
  buffering: boolean;
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
  onLoad: (data: { duration: number; audioTracks?: AudioTrack[]; textTracks?: TextTrack[]; currentTime?: number }) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
  onBuffer: (data: { isBuffering: boolean }) => void;
  onPlaybackStateChanged: (data: { isPlaying: boolean; isSeeking: boolean }) => void;
  onPictureInPictureStatusChanged: (data: { isActive: boolean }) => void;
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
  playbackState: PlaybackState;
  isBackgroundAudioEnabled: boolean;
  toggleBackgroundAudio: () => void;
}

const defaultContext: PlayerContextValue = {
  currentVideo: null, queue: [], currentIndex: -1, isPlaying: false, buffering: false,
  position: 0, duration: 0, playbackSpeed: 1.0, volume: 1.0, isMuted: false,
  videoRef: { current: null },
  playVideo: () => {}, togglePlay: () => {}, seekTo: () => {},
  setPlaybackSpeed: () => {}, setVolume: () => {}, toggleMute: () => {},
  next: () => {}, previous: () => {}, setQueue: () => {}, addToQueue: () => {},
  removeFromQueue: () => {}, moveQueueItem: () => {}, clearQueue: () => {},
  onProgress: () => {}, onLoad: () => {}, onEnd: () => {}, onError: () => {},
  onBuffer: () => {}, onPlaybackStateChanged: () => {}, onPictureInPictureStatusChanged: () => {},
  audioTracks: [], selectedAudioTrack: -1, setSelectedAudioTrack: () => {},
  textTracks: [], selectedTextTrack: -1, setSelectedTextTrack: () => {},
  isPiPActive: false, enterPiP: () => {}, exitPiP: () => {},
  isAudioOnly: false, setAudioOnly: () => {},
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
  // Single imperative command surface over the native <Video> (see MediaEngine).
  const mediaEngineRef = useRef(createMediaEngine({ current: null }));
  const [currentVideo, setCurrentVideo] = useState<LibraryVideo | null>(null);
  const [queue, setQueueState] = useState<LibraryVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [buffering, setBuffering] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [isAudioOnly, setAudioOnlyState] = useState<boolean>(false);
  const [isBackgroundAudioEnabled, setIsBackgroundAudioEnabled] = useState<boolean>(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<number>(-1);
  const videoRef = useRef<VideoRef | null>(null);

  // Keep the engine pointing at the live ref.
  useEffect(() => {
    mediaEngineRef.current = createMediaEngine(videoRef);
  }, []);

  const { updateResumePosition, markPlayed } = useContext(LibraryContext);
  const positionRef = useRef(position);
  const currentVideoRef = useRef(currentVideo);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { currentVideoRef.current = currentVideo; }, [currentVideo]);

  useEffect(() => {
    const service = playbackServiceRef.current;
    service.setOnPositionSave((uri, pos) => {
      updateResumePosition(uri, pos);
    });
    service.setOnComplete((uri) => {
      // Mark the video as played and clear its resume position so it does not
      // appear in "Continue Watching" after finishing.
      markPlayed(uri);
      updateResumePosition(uri, 0);
    });

    const unsubscribe = service.subscribe((snapshot) => {
      setCurrentVideo(snapshot.currentVideo);
      setQueueState(snapshot.queue);
      setCurrentIndex(snapshot.currentIndex);
      // Treat 'loading' as playing for the `paused` prop so the video autoplays
      // once prepared; buffering is tracked separately and does not pause.
      setIsPlaying(snapshot.state === 'playing' || snapshot.state === 'loading');
      setBuffering(snapshot.buffering);
      setPosition(snapshot.position);
      setDuration(snapshot.duration);
      setPlaybackSpeedState(snapshot.playbackSpeed);
      setVolumeState(snapshot.volume);
      setIsMuted(snapshot.isMuted);
      setPlaybackState(snapshot.state);
    });

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, [updateResumePosition, markPlayed]);

  useEffect(() => {
    const unsubPiP = pipService.onStateChange((active) => setIsPiPActive(active));
    return () => { unsubPiP(); };
  }, []);

  const playVideo = useCallback((video: LibraryVideo, customQueue?: LibraryVideo[]) => {
    playbackServiceRef.current.playVideo(video, customQueue);
  }, []);

  const togglePlay = useCallback(() => {
    playbackServiceRef.current.togglePlay();
    // Reflect the new intended state on the native player immediately.
    if (playbackServiceRef.current.snapshot.state === 'playing') {
      mediaEngineRef.current.play();
    } else {
      mediaEngineRef.current.pause();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    playbackServiceRef.current.seekTo(clamped);
    mediaEngineRef.current.seek(clamped);
  }, [duration]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    playbackServiceRef.current.setPlaybackSpeed(speed);
  }, []);

  const setVolume = useCallback((v: number) => {
    playbackServiceRef.current.setVolume(v);
    mediaEngineRef.current.setVolume(v);
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
    mediaEngineRef.current.stop();
  }, []);

  const onProgress = useCallback((progress: { currentTime: number }) => {
    setPosition(progress.currentTime);
    playbackServiceRef.current.setPosition(progress.currentTime);
  }, []);

  const onLoad = useCallback((data: { duration: number; audioTracks?: AudioTrack[]; textTracks?: TextTrack[]; currentTime?: number }) => {
    setDuration(data.duration);
    playbackServiceRef.current.setDuration(data.duration);
    playbackServiceRef.current.setBuffering(false);
    playbackServiceRef.current.setState('playing');
    if (data.audioTracks) setAudioTracks(data.audioTracks);
    if (data.textTracks) setTextTracks(data.textTracks);
    if (data.currentTime !== undefined) setPosition(data.currentTime);
  }, []);

  const onEnd = useCallback(() => {
    playbackServiceRef.current.onEnd();
  }, []);

  const onError = useCallback((error: Error) => {
    playbackServiceRef.current.setError();
    console.warn('Video error:', error);
  }, []);

  const onBuffer = useCallback((data: { isBuffering: boolean }) => {
    playbackServiceRef.current.setBuffering(data.isBuffering);
  }, []);

  const onPlaybackStateChanged = useCallback((data: { isPlaying: boolean; isSeeking: boolean }) => {
    // Native truth about play/pause; reconcile the service state machine.
    playbackServiceRef.current.setPlaying(data.isPlaying);
  }, []);

  const onPictureInPictureStatusChanged = useCallback((data: { isActive: boolean }) => {
    pipService.setActive(data.isActive);
    setIsPiPActive(data.isActive);
  }, []);

  const enterPiP = useCallback(() => {
    try {
      videoRef.current?.enterPictureInPicture?.();
    } catch {
      // PiP may be unavailable on this device/OS; ignore.
    }
  }, []);

  const exitPiP = useCallback(() => {
    try {
      videoRef.current?.exitPictureInPicture?.();
    } catch {
      // ignore
    }
  }, []);

  const toggleBackgroundAudio = useCallback(() => {
    setIsBackgroundAudioEnabled((enabled) => {
      const nextEnabled = !enabled;
      return nextEnabled;
    });
  }, []);

  const value = useMemo(
    () => ({
      currentVideo, queue, currentIndex, isPlaying, buffering, position, duration,
      playbackSpeed, volume, isMuted, videoRef,
      playVideo, togglePlay, seekTo, setPlaybackSpeed, setVolume, toggleMute,
      next, previous, setQueue, addToQueue, removeFromQueue, moveQueueItem, clearQueue,
      onProgress, onLoad, onEnd, onError, onBuffer, onPlaybackStateChanged, onPictureInPictureStatusChanged,
      audioTracks, selectedAudioTrack, setSelectedAudioTrack,
      textTracks, selectedTextTrack, setSelectedTextTrack,
      isPiPActive, enterPiP, exitPiP,
      isAudioOnly, setAudioOnly: setAudioOnlyState,
      playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
    }),
    [
      currentVideo, queue, currentIndex, isPlaying, buffering, position, duration,
      playbackSpeed, volume, isMuted, videoRef,
      playVideo, togglePlay, seekTo, setPlaybackSpeed, setVolume, toggleMute,
      next, previous, setQueue, addToQueue, removeFromQueue, moveQueueItem, clearQueue,
      onProgress, onLoad, onEnd, onError, onBuffer, onPlaybackStateChanged, onPictureInPictureStatusChanged,
      audioTracks, selectedAudioTrack, setSelectedAudioTrack,
      textTracks, selectedTextTrack, setSelectedTextTrack,
      isPiPActive, enterPiP, exitPiP,
      isAudioOnly,
      playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
