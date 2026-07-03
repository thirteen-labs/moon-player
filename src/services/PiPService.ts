import { Platform } from 'react-native';

type PiPStateListener = (isActive: boolean) => void;

export class PiPService {
  private _isActive: boolean = false;
  private listeners: Set<PiPStateListener> = new Set();

  async enterPiP(videoRef: unknown): Promise<boolean> {
    if (!this.isPiPAvailable()) return false;

    try {
      if (Platform.OS === 'android') {
        return await this.enterAndroidPiP(videoRef);
      } else if (Platform.OS === 'ios') {
        return await this.enterIOSPiP(videoRef);
      }
    } catch {
      return false;
    }
    return false;
  }

  exitPiP(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this.notifyListeners(false);
  }

  isPiPAvailable(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  get isActive(): boolean {
    return this._isActive;
  }

  onStateChange(listener: PiPStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async enterAndroidPiP(videoRef: unknown): Promise<boolean> {
    try {
      const ref = videoRef as { presentFullscreenPlayer?: () => void; dismissFullscreenPlayer?: () => void } | null;
      if (ref?.presentFullscreenPlayer) {
        ref.presentFullscreenPlayer();
        this._isActive = true;
        this.notifyListeners(true);
        return true;
      }
    } catch {}
    return false;
  }

  private async enterIOSPiP(videoRef: unknown): Promise<boolean> {
    try {
      const ref = videoRef as { presentFullscreenPlayer?: () => void; dismissFullscreenPlayer?: () => void } | null;
      if (ref?.presentFullscreenPlayer) {
        ref.presentFullscreenPlayer();
        this._isActive = true;
        this.notifyListeners(true);
        return true;
      }
    } catch {}
    return false;
  }

  private notifyListeners(isActive: boolean): void {
    for (const listener of this.listeners) {
      try { listener(isActive); } catch {}
    }
  }
}

export const pipService = new PiPService();
