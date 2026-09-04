import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { VideoHandle, PlaybackState as ObsidianPlaybackState } from 'obsidian-media-player';
import type { LibraryVideo } from '../library/types';
import { LibraryContext } from '../library/LibraryContext';
import { PlaybackService } from './PlaybackService';
import { createMediaEngine } from './MediaEngine';
import { pipService } from '../services/PiPService';
import type { PlaybackState } from './types';
import { mapObsidianStatus } from './types';

// Legacy track types kept for UI compatibility — obsidian 0.1 does not emit them
export interface AudioTrack { language?: string; title?: string }
export interface TextTrack { language?: string; title?: string }

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
  videoRef: React.RefObject<VideoHandle | null>;
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
  // obsidian-media-player unified handlers
  onProgress: (position: number, duration: number) => void;
  onStateChange: (state: ObsidianPlaybackState) => void;
  onError: (error: Error) => void;
  // Legacy compatibility shims (mapped from onStateChange)
  onLoad: (data: { duration: number; audioTracks?: AudioTrack[]; textTracks?: TextTrack[]; currentTime?: number }) => void;
  onEnd: () => void;
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
  onProgress: () => {}, onStateChange: () => {}, onLoad: () => {}, onEnd: () => {}, onError: () => {},
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
  // Single imperative command surface over the native <Video> (obsidian-media-player).
  const mediaEngineRef = useRef(createMediaEngine({ current: null } as React.RefObject<VideoHandle | null>));
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
  const videoRef = useRef<VideoHandle | null>(null);

  // Keep the engine pointing at the live ref.
  useEffect(() => {
    mediaEngineRef.current = createMediaEngine(videoRef as React.RefObject<VideoHandle | null>);
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
      markPlayed(uri);
      updateResumePosition(uri, 0);
    });

    const unsubscribe = service.subscribe((snapshot) => {
      setCurrentVideo(snapshot.currentVideo);
      setQueueState(snapshot.queue);
      setCurrentIndex(snapshot.currentIndex);
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
    mediaEngineRef.current.setRate(speed);
  }, []);

  const setVolume = useCallback((v: number) => {
    playbackServiceRef.current.setVolume(v);
    mediaEngineRef.current.setVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    playbackServiceRef.current.toggleMute();
    mediaEngineRef.current.setMuted(!playbackServiceRef.current.snapshot.isMuted ? false : true);
    // Sync with actual snapshot
    const muted = playbackServiceRef.current.snapshot.isMuted;
    mediaEngineRef.current.setMuted(muted);
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

  // Unified obsidian handler — single source of truth for state + buffering + ended/error
  const onStateChange = useCallback((state: ObsidianPlaybackState) => {
    const mapped = mapObsidianStatus(state.status);
    // Drive PlaybackService state machine from native truth
    if (state.status === 'error') {
      playbackServiceRef.current.setError();
      if (state.error) console.warn('Video error:', state.error);
    } else if (state.status === 'ended') {
      playbackServiceRef.current.onEnd();
    } else if (state.status === 'buffering') {
      playbackServiceRef.current.setBuffering(true);
    } else {
      playbackServiceRef.current.setBuffering(false);
      if (state.status === 'playing' || state.status === 'ready') {
        playbackServiceRef.current.setPlaying(true);
      } else if (state.status === 'paused') {
        playbackServiceRef.current.setPlaying(false);
      } else if (state.status === 'loading') {
        playbackServiceRef.current.setState('loading');
      }
    }

    // Sync duration / position from obsidian state
    if (state.duration > 0 && state.duration !== duration) {
      setDuration(state.duration);
      playbackServiceRef.current.setDuration(state.duration);
    }
    if (state.status === 'ready' && state.duration > 0) {
      // Initial load — emit legacy onLoad equivalent
      setAudioTracks([]);
      setTextTracks([]);
    }
    // Keep React state in sync for UI (buffering covers loading/buffering)
    setPlaybackState(mapped);
    setBuffering(state.status === 'buffering' || state.status === 'loading');
  }, [duration]);

  const onProgress = useCallback((pos: number, dur: number) => {
    setPosition(pos);
    if (dur > 0) {
      setDuration(dur);
      playbackServiceRef.current.setDuration(dur);
    }
    playbackServiceRef.current.setPosition(pos);
  }, []);

  // Legacy shims — map from onStateChange
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
    playbackServiceRef.current.setPlaying(data.isPlaying);
  }, []);

  const onPictureInPictureStatusChanged = useCallback((data: { isActive: boolean }) => {
    pipService.setActive(data.isActive);
    setIsPiPActive(data.isActive);
  }, []);

  const enterPiP = useCallback(() => {
    // obsidian-media-player 0.1 has no PiP command yet — keep as no-op but update UI optimistically
    try {
      // Future: (videoRef.current as any)?.enterPiP?.()
      pipService.setActive(true);
      setIsPiPActive(true);
    } catch {
      // ignore
    }
  }, []);

  const exitPiP = useCallback(() => {
    try {
      pipService.setActive(false);
      setIsPiPActive(false);
    } catch {
      // ignore
    }
  }, []);

  const toggleBackgroundAudio = useCallback(() => {
    setIsBackgroundAudioEnabled((enabled) => !enabled);
  }, []);

  const value = useMemo(
    () => ({
      currentVideo, queue, currentIndex, isPlaying, buffering, position, duration,
      playbackSpeed, volume, isMuted, videoRef,
      playVideo, togglePlay, seekTo, setPlaybackSpeed, setVolume, toggleMute,
      next, previous, setQueue, addToQueue, removeFromQueue, moveQueueItem, clearQueue,
      onProgress, onStateChange, onLoad, onEnd, onError, onBuffer, onPlaybackStateChanged, onPictureInPictureStatusChanged,
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
      onProgress, onStateChange, onLoad, onEnd, onError, onBuffer, onPlaybackStateChanged, onPictureInPictureStatusChanged,
      audioTracks, selectedAudioTrack, setSelectedAudioTrack,
      textTracks, selectedTextTrack, setSelectedTextTrack,
      isPiPActive, enterPiP, exitPiP,
      isAudioOnly,
      playbackState, isBackgroundAudioEnabled, toggleBackgroundAudio,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
