import type { PlaybackState as ObsidianPlaybackState } from 'obsidian-media-player';

// App playback state — superset that maps from obsidian's native PlaybackState
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

// Re-export obsidian state for engine layer
export type ObsidianState = ObsidianPlaybackState;

export interface TrackInfo {
  index: number;
  title?: string;
  language?: string;
  type: 'audio' | 'video' | 'subtitle';
}

export interface PlayerEventMap {
  onLoad: { duration: number; audioTracks?: TrackInfo[]; textTracks?: TrackInfo[] };
  onProgress: { currentTime: number; playableDuration: number; seekableDuration: number };
  onEnd: void;
  onError: { errorString: string };
  onBuffer: { isBuffering: boolean };
}

export interface MediaEngineInterface {
  load(source: { uri: string; isNetwork?: boolean }): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setSelectedAudioTrack(index: number): void;
  setSelectedTextTrack(index: number): void;
  presentFullscreen(): void;
  dismissFullscreen(): void;
  enterPiP(): void;
  exitPiP(): void;
  isPiPAvailable(): boolean;
  getNativeRef(): unknown;
  destroy(): void;
}

/**
 * Map obsidian-media-player PlaybackStatus -> app PlaybackState
 */
export function mapObsidianStatus(
  status: ObsidianPlaybackState['status'],
): PlaybackState {
  switch (status) {
    case 'idle':
      return 'idle';
    case 'loading':
      return 'loading';
    case 'ready':
      return 'playing';
    case 'playing':
      return 'playing';
    case 'paused':
      return 'paused';
    case 'buffering':
      return 'buffering';
    case 'ended':
      return 'ended';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}
