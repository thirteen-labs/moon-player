import type { MediaEngineInterface } from './types';
import { Platform } from 'react-native';
import type { VideoHandle } from 'obsidian-media-player';

export type { MediaEngineInterface } from './types';

type ObsidianVideoHandle = VideoHandle;

/**
 * Single imperative command surface over the obsidian-media-player <Video> ref.
 *
 * obsidian-media-player exposes VideoHandle with:
 *   play / pause / stop / seek(seconds) / setRate / setVolume / setMuted / setResizeMode / getState
 *
 * Legacy react-native-video methods (presentFullscreenPlayer etc.) are not supported;
 * those callers fall back to no-ops. PiP is not yet implemented in obsidian 0.1
 * and is also a no-op (returns false for isPiPAvailable).
 */
export function createMediaEngine(videoRef: React.RefObject<ObsidianVideoHandle | null>): MediaEngineInterface {
  return {
    load(_src: { uri: string; isNetwork?: boolean }) {
      // Loading is driven by the <Video source={...}> prop in obsidian-media-player.
    },

    play() {
      getRef(videoRef)?.play();
    },

    pause() {
      getRef(videoRef)?.pause();
    },

    stop() {
      getRef(videoRef)?.stop();
    },

    seek(seconds: number) {
      getRef(videoRef)?.seek(seconds);
    },

    setRate(rate: number) {
      getRef(videoRef)?.setRate(rate);
    },

    setVolume(volume: number) {
      getRef(videoRef)?.setVolume(volume);
    },

    setMuted(muted: boolean) {
      getRef(videoRef)?.setMuted(muted);
    },

    setSelectedAudioTrack(_index: number) {
      // obsidian-media-player 0.1 does not expose audio track selection; track metadata
      // is handled at the queue level. No-op for compatibility.
    },

    setSelectedTextTrack(_index: number) {
      // External subtitles are rendered via SubtitleOverlay, not native text tracks.
    },

    presentFullscreen() {
      // Not supported in obsidian 0.1 — handled via app fullscreen state + orientation lock.
    },

    dismissFullscreen() {
      // No-op
    },

    enterPiP() {
      // PiP not yet implemented in obsidian-media-player 0.1 (roadmap: Cast/Background).
    },

    exitPiP() {
      // No-op
    },

    isPiPAvailable() {
      // obsidian-media-player 0.1 does not yet wire PiP; report false.
      // Keep platform check for future when ExoPlayer PiP + AVPlayerLayer PiP lands.
      void Platform.OS;
      return false;
    },

    getNativeRef() {
      return videoRef.current;
    },

    destroy() {
      // <Video> unmount handles teardown; nothing to release.
    },
  };
}

function getRef(videoRef: React.RefObject<ObsidianVideoHandle | null>): ObsidianVideoHandle | null {
  return videoRef.current ?? null;
}
