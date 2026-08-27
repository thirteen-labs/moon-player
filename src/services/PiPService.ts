import { Platform } from 'react-native';

type PiPStateListener = (isActive: boolean) => void;

/**
 * Holds the native picture-in-picture state. The actual enter/exit commands are
 * issued on the <Video> ref (`enterPictureInPicture` / `exitPictureInPicture`);
 * this service only mirrors the truth reported by the native
 * `onPictureInPictureStatusChanged` event so the UI stays in sync.
 */
export class PiPService {
  private _isActive: boolean = false;
  private listeners: Set<PiPStateListener> = new Set();

  setActive(active: boolean): void {
    if (this._isActive === active) return;
    this._isActive = active;
    this.notifyListeners(active);
  }

  isPiPAvailable(): boolean {
    // PiP is supported on Android (with the Expo Android PiP config plugin) and
    // iOS (AVKit). We cannot introspect device capability at runtime reliably.
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  get isActive(): boolean {
    return this._isActive;
  }

  onStateChange(listener: PiPStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(isActive: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(isActive);
      } catch {
        // ignore listener errors
      }
    }
  }
}

export const pipService = new PiPService();
