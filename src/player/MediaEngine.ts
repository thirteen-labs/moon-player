import type { MediaEngineInterface } from './types';

export type { MediaEngineInterface } from './types';

interface VideoRefMethods {
  resume?: () => void;
  pause?: () => void;
  stop?: () => void;
  seek?: (seconds: number) => void;
  setRate?: (rate: number) => void;
  setVolume?: (volume: number) => void;
  setMuted?: (muted: boolean) => void;
  setSelectedAudioTrack?: (track: { type: string; value: number }) => void;
  setSelectedTextTrack?: (track: { type: string; value: number } | { type: 'disabled' }) => void;
  presentFullscreenPlayer?: () => void;
  dismissFullscreenPlayer?: () => void;
}

export function createMediaEngine(videoRef: React.RefObject<unknown>): MediaEngineInterface {
  return {
    load(_src: { uri: string; isNetwork?: boolean }) {
    },

    play() {
      getRef(videoRef)?.resume?.();
    },

    pause() {
      getRef(videoRef)?.pause?.();
    },

    stop() {
      getRef(videoRef)?.stop?.();
    },

    seek(seconds: number) {
      getRef(videoRef)?.seek?.(seconds);
    },

    setRate(rate: number) {
      getRef(videoRef)?.setRate?.(rate);
    },

    setVolume(volume: number) {
      getRef(videoRef)?.setVolume?.(volume);
    },

    setMuted(muted: boolean) {
      getRef(videoRef)?.setMuted?.(muted);
    },

    setSelectedAudioTrack(index: number) {
      getRef(videoRef)?.setSelectedAudioTrack?.({ type: 'index', value: index });
    },

    setSelectedTextTrack(index: number) {
      getRef(videoRef)?.setSelectedTextTrack?.(index >= 0 ? { type: 'index', value: index } : { type: 'disabled' });
    },

    presentFullscreen() {
      getRef(videoRef)?.presentFullscreenPlayer?.();
    },

    dismissFullscreen() {
      getRef(videoRef)?.dismissFullscreenPlayer?.();
    },

    enterPiP() {
      getRef(videoRef)?.presentFullscreenPlayer?.();
    },

    exitPiP() {
      getRef(videoRef)?.dismissFullscreenPlayer?.();
    },

    isPiPAvailable() {
      return true;
    },

    getNativeRef() {
      return videoRef.current;
    },

    destroy() {
    },
  };
}

function getRef(videoRef: React.RefObject<unknown>): VideoRefMethods | null {
  const ref = videoRef.current;
  if (ref && typeof ref === 'object') return ref as VideoRefMethods;
  return null;
}