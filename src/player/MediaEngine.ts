import type { MediaEngineInterface } from './types';

export type { MediaEngineInterface } from './types';

export function createMediaEngine(videoRef: React.RefObject<unknown>): MediaEngineInterface {
  return {
    load(src) {
      source = src;
    },

    play() {
      const ref = getRef(videoRef);
      if (ref?.resume) ref.resume();
    },

    pause() {
      const ref = getRef(videoRef);
      if (ref?.pause) ref.pause();
    },

    stop() {
      const ref = getRef(videoRef);
      if (ref?.stop) ref.stop();
    },

    seek(seconds: number) {
      const ref = getRef(videoRef);
      if (ref?.seek) ref.seek(seconds);
    },

    setRate(rate: number) {
      const ref = getRef(videoRef);
      if (ref?.setRate) ref.setRate(rate);
    },

    setVolume(volume: number) {
      const ref = getRef(videoRef);
      if (ref?.setVolume) ref.setVolume(volume);
    },

    setMuted(muted: boolean) {
      const ref = getRef(videoRef);
      if (ref?.setMuted) ref.setMuted(muted);
    },

    setSelectedAudioTrack(index: number) {
      const ref = getRef(videoRef);
      if (ref?.setSelectedAudioTrack) {
        ref.setSelectedAudioTrack({ type: 'index', value: index } as never);
      }
    },

    setSelectedTextTrack(index: number) {
      const ref = getRef(videoRef);
      if (ref?.setSelectedTextTrack) {
        ref.setSelectedTextTrack(index >= 0 ? { type: 'index', value: index } : { type: 'disabled' } as never);
      }
    },

    presentFullscreen() {
      const ref = getRef(videoRef);
      if (ref?.presentFullscreenPlayer) ref.presentFullscreenPlayer();
    },

    dismissFullscreen() {
      const ref = getRef(videoRef);
      if (ref?.dismissFullscreenPlayer) ref.dismissFullscreenPlayer();
    },

    enterPiP() {
      const ref = getRef(videoRef);
      if (ref?.presentFullscreenPlayer) ref.presentFullscreenPlayer();
    },

    exitPiP() {
      const ref = getRef(videoRef);
      if (ref?.dismissFullscreenPlayer) ref.dismissFullscreenPlayer();
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

function getRef(videoRef: React.RefObject<unknown>): Record<string, unknown> | null {
  const ref = videoRef.current;
  if (ref && typeof ref === 'object') return ref as Record<string, unknown>;
  return null;
}
