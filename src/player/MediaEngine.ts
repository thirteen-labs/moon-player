import type { MediaEngineInterface } from './types';
import { Platform } from 'react-native';

export type { MediaEngineInterface } from './types';

interface VideoRefMethods {
  resume?: () => void;
  pause?: () => void;
  seek?: (seconds: number, tolerance?: number) => void;
  setVolume?: (volume: number) => void;
  presentFullscreenPlayer?: () => void;
  dismissFullscreenPlayer?: () => void;
  setFullScreen?: (fullScreen: boolean) => void;
  enterPictureInPicture?: () => void;
  exitPictureInPicture?: () => void;
  getCurrentPosition?: () => Promise<number>;
}

/**
 * Single imperative command surface over the native <Video> ref.
 *
 * NOTE: react-native-video v6 exposes only a subset of controls imperatively.
 * The following are PROP-driven on the <Video> element and therefore handled by
 * the player component, NOT this engine:
 *   - playback rate (prop `rate`)
 *   - muted (prop `muted`)
 *   - audio/text track selection (props `selectedAudioTrack` / `selectedTextTrack`)
 * Those methods below are intentionally no-ops so callers can route every command
 * through the engine without special-casing; the prop-driven state still applies.
 */
export function createMediaEngine(videoRef: React.RefObject<unknown>): MediaEngineInterface {
  return {
    load(_src: { uri: string; isNetwork?: boolean }) {
      // Loading is driven by the <Video source={...}> prop in the player screen,
      // which is the supported path in react-native-video v6 (no imperative load).
    },

    play() {
      getRef(videoRef)?.resume?.();
    },

    pause() {
      getRef(videoRef)?.pause?.();
    },

    stop() {
      // react-native-video v6 has no imperative stop(); releasing the player is
      // achieved by unmounting the <Video>. Pause defensively as a best effort.
      getRef(videoRef)?.pause?.();
    },

    seek(seconds: number) {
      getRef(videoRef)?.seek?.(seconds);
    },

    // Rate is applied via the `rate` prop (see player.tsx).
    setRate(_rate: number) {},

    setVolume(volume: number) {
      getRef(videoRef)?.setVolume?.(volume);
    },

    // Muted is applied via the `muted` prop (see player.tsx).
    setMuted(_muted: boolean) {},

    // Audio/text track selection is applied via props (see player.tsx).
    setSelectedAudioTrack(_index: number) {},
    setSelectedTextTrack(_index: number) {},

    presentFullscreen() {
      getRef(videoRef)?.presentFullscreenPlayer?.();
    },

    dismissFullscreen() {
      getRef(videoRef)?.dismissFullscreenPlayer?.();
    },

    enterPiP() {
      getRef(videoRef)?.enterPictureInPicture?.();
    },

    exitPiP() {
      getRef(videoRef)?.exitPictureInPicture?.();
    },

    isPiPAvailable() {
      // PiP requires OS support; on Android the activity must opt-in via the
      // Expo config plugin, on iOS via AVKit. We cannot introspect at runtime
      // reliably, so we report platform capability as a best-effort gate.
      return Platform.OS === 'android' || Platform.OS === 'ios';
    },

    getNativeRef() {
      return videoRef.current;
    },

    destroy() {
      // Nothing to release here; the <Video> unmount handles native teardown.
    },
  };
}

function getRef(videoRef: React.RefObject<unknown>): VideoRefMethods | null {
  const ref = videoRef.current;
  if (ref && typeof ref === 'object') return ref as VideoRefMethods;
  return null;
}
