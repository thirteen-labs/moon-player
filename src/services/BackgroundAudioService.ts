import { Platform, NativeModules } from 'react-native';

type BackgroundAudioListener = (isPlaying: boolean) => void;

export class BackgroundAudioService {
  private isEnabled: boolean = false;
  private listeners: Set<BackgroundAudioListener> = new Set();

  enable(): void {
    this.isEnabled = true;
    if (Platform.OS === 'android') {
      this.setupAndroidAudioSession();
    } else if (Platform.OS === 'ios') {
      this.setupIOSAudioSession();
    }
    this.notifyListeners(true);
  }

  disable(): void {
    this.isEnabled = false;
    this.notifyListeners(false);
  }

  get isBackgroundAudioEnabled(): boolean {
    return this.isEnabled;
  }

  onStateChange(listener: BackgroundAudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setupAndroidAudioSession(): void {
    try {
      if (NativeModules?.AudioSessionModule?.enableBackgroundAudio) {
        NativeModules.AudioSessionModule.enableBackgroundAudio();
      }
    } catch {}
  }

  private setupIOSAudioSession(): void {
    try {
      const RNAudioSession = NativeModules?.RNAudioSession;
      if (RNAudioSession) {
        RNAudioSession.setCategory('Playback');
        RNAudioSession.setActive(true);
      }
    } catch {}
  }

  private notifyListeners(isPlaying: boolean): void {
    for (const listener of this.listeners) {
      try { listener(isPlaying); } catch {}
    }
  }
}

export const backgroundAudioService = new BackgroundAudioService();
