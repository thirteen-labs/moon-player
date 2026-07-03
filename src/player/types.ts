export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

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
