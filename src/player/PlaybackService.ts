import type { PlaybackState } from './types';
import type { LibraryVideo, Bookmark } from '../library/types';

export interface PlaybackStateSnapshot {
  state: PlaybackState;
  currentVideo: LibraryVideo | null;
  queue: LibraryVideo[];
  currentIndex: number;
  position: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  sleepTimer: SleepTimerState | null;
  bookmarks: Bookmark[];
  playCount: number;
}

export interface SleepTimerState {
  isActive: boolean;
  remainingSeconds: number;
  startedAt: number;
}

type PlaybackListener = (snapshot: PlaybackStateSnapshot) => void;

export class PlaybackService {
  private _state: PlaybackState = 'idle';
  private _currentVideo: LibraryVideo | null = null;
  private _queue: LibraryVideo[] = [];
  private _currentIndex: number = -1;
  private _position: number = 0;
  private _duration: number = 0;
  private _playbackSpeed: number = 1.0;
  private _volume: number = 1.0;
  private _isMuted: boolean = false;
  private _sleepTimer: SleepTimerState | null = null;
  private _bookmarks: Bookmark[] = [];
  private _playCount: number = 0;
  private listeners: Set<PlaybackListener> = new Set();
  private sleepTimerInterval: ReturnType<typeof setInterval> | null = null;
  private positionSaveInterval: ReturnType<typeof setInterval> | null = null;
  private onPositionSave: ((uri: string, position: number) => void) | null = null;

  setOnPositionSave(callback: (uri: string, position: number) => void): void {
    this.onPositionSave = callback;
  }

  get snapshot(): PlaybackStateSnapshot {
    return {
      state: this._state,
      currentVideo: this._currentVideo,
      queue: this._queue,
      currentIndex: this._currentIndex,
      position: this._position,
      duration: this._duration,
      playbackSpeed: this._playbackSpeed,
      volume: this._volume,
      isMuted: this._isMuted,
      sleepTimer: this._sleepTimer,
      bookmarks: this._bookmarks,
      playCount: this._playCount,
    };
  }

  playVideo(video: LibraryVideo, customQueue?: LibraryVideo[]): void {
    this._currentVideo = video;
    this._state = 'loading';
    this._position = video.resumePosition || 0;
    this._duration = video.metadata?.duration || 0;

    if (customQueue) {
      this._queue = customQueue;
      this._currentIndex = customQueue.findIndex((v) => v.id === video.id);
    } else {
      const idx = this._queue.findIndex((v) => v.id === video.id);
      if (idx !== -1) {
        this._currentIndex = idx;
      } else {
        this._queue = [...this._queue, video];
        this._currentIndex = this._queue.length - 1;
      }
    }

    this.startPositionSaveInterval();
    this.notify();
  }

  togglePlay(): void {
    if (this._state === 'playing') {
      this._state = 'paused';
      this.stopPositionSaveInterval();
    } else if (this._state === 'paused') {
      this._state = 'playing';
      this.startPositionSaveInterval();
    }
    this.notify();
  }

  setPlaying(playing: boolean): void {
    if (playing && this._state !== 'playing') {
      this._state = 'playing';
      this.startPositionSaveInterval();
    } else if (!playing && this._state === 'playing') {
      this._state = 'paused';
      this.stopPositionSaveInterval();
    }
    this.notify();
  }

  seekTo(seconds: number): void {
    this._position = Math.max(0, Math.min(seconds, this._duration));
    this.notify();
  }

  setPosition(position: number): void {
    this._position = position;
  }

  setDuration(duration: number): void {
    this._duration = duration;
  }

  setPlaybackSpeed(speed: number): void {
    this._playbackSpeed = speed;
    this.notify();
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    this.notify();
  }

  toggleMute(): void {
    this._isMuted = !this._isMuted;
    this.notify();
  }

  setMuted(muted: boolean): void {
    this._isMuted = muted;
    this.notify();
  }

  next(): boolean {
    if (this._queue.length === 0 || this._currentIndex === -1) return false;
    const nextIndex = this._currentIndex + 1;
    if (nextIndex < this._queue.length) {
      this._currentIndex = nextIndex;
      this._currentVideo = this._queue[nextIndex];
      this._position = this._currentVideo.resumePosition || 0;
      this._duration = this._currentVideo.metadata?.duration || 0;
      this._state = 'loading';
      this._bookmarks = [];
      this.notify();
      return true;
    }
    this._state = 'ended';
    this.notify();
    return false;
  }

  previous(): boolean {
    if (this._queue.length === 0 || this._currentIndex === -1) return false;
    const prevIndex = this._currentIndex - 1;
    if (prevIndex >= 0) {
      this._currentIndex = prevIndex;
      this._currentVideo = this._queue[prevIndex];
      this._position = this._currentVideo.resumePosition || 0;
      this._duration = this._currentVideo.metadata?.duration || 0;
      this._state = 'loading';
      this._bookmarks = [];
      this.notify();
      return true;
    }
    return false;
  }

  setQueue(queue: LibraryVideo[]): void {
    this._queue = queue;
    if (this._currentVideo) {
      this._currentIndex = queue.findIndex((v) => v.id === this._currentVideo!.id);
    }
    this.notify();
  }

  addToQueue(video: LibraryVideo): boolean {
    if (this._queue.some((v) => v.id === video.id)) return false;
    this._queue = [...this._queue, video];
    this.notify();
    return true;
  }

  removeFromQueue(id: string): boolean {
    const idx = this._queue.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this._queue = this._queue.filter((v) => v.id !== id);
    if (this._currentVideo?.id === id) {
      this._currentVideo = null;
      this._currentIndex = -1;
      this._state = 'idle';
      this._position = 0;
      this._duration = 0;
    } else if (this._currentVideo) {
      this._currentIndex = this._queue.findIndex((v) => v.id === this._currentVideo!.id);
    }
    this.notify();
    return true;
  }

  moveQueueItem(id: string, direction: 'up' | 'down'): boolean {
    const idx = this._queue.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= this._queue.length) return false;
    const newQueue = [...this._queue];
    [newQueue[idx], newQueue[newIdx]] = [newQueue[newIdx], newQueue[idx]];
    this._queue = newQueue;
    if (this._currentVideo) {
      this._currentIndex = this._queue.findIndex((v) => v.id === this._currentVideo!.id);
    }
    this.notify();
    return true;
  }

  clearQueue(): void {
    this._queue = [];
    this._currentVideo = null;
    this._currentIndex = -1;
    this._state = 'idle';
    this._position = 0;
    this._duration = 0;
    this._bookmarks = [];
    this.stopPositionSaveInterval();
    this.notify();
  }

  setState(state: PlaybackState): void {
    this._state = state;
    this.notify();
  }

  setBuffering(isBuffering: boolean): void {
    if (isBuffering && this._state === 'playing') {
      this._state = 'buffering';
      this.notify();
    } else if (!isBuffering && this._state === 'buffering') {
      this._state = 'playing';
      this.notify();
    }
  }

  setError(): void {
    this._state = 'error';
    this.notify();
  }

  addBookmark(label?: string): Bookmark {
    const now = Date.now();
    const bookmark: Bookmark = {
      id: `bm_${now}_${Math.random().toString(36).substring(2, 6)}`,
      videoId: this._currentVideo?.id || '',
      timestamp: this._position,
      label: label || `Bookmark at ${this.formatTime(this._position)}`,
      createdAt: now,
    };
    this._bookmarks = [...this._bookmarks, bookmark];
    this.notify();
    return bookmark;
  }

  removeBookmark(id: string): void {
    this._bookmarks = this._bookmarks.filter((b) => b.id !== id);
    this.notify();
  }

  setBookmarks(bookmarks: Bookmark[]): void {
    this._bookmarks = bookmarks;
  }

  clearBookmarks(): void {
    this._bookmarks = [];
  }

  startSleepTimer(minutes: number): void {
    this.cancelSleepTimer();
    this._sleepTimer = {
      isActive: true,
      remainingSeconds: minutes * 60,
      startedAt: Date.now(),
    };
    this.sleepTimerInterval = setInterval(() => {
      if (this._sleepTimer) {
        this._sleepTimer = {
          ...this._sleepTimer,
          remainingSeconds: this._sleepTimer.remainingSeconds - 1,
        };
        if (this._sleepTimer.remainingSeconds <= 0) {
          this.cancelSleepTimer();
          this.setPlaying(false);
        }
        this.notify();
      }
    }, 1000);
    this.notify();
  }

  cancelSleepTimer(): void {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this._sleepTimer = null;
    this.notify();
  }

  onLoad(duration: number): void {
    this._duration = duration;
    this._state = 'playing';
    this.notify();
  }

  onEnd(): void {
    this.stopPositionSaveInterval();
    this.savePosition();
    this.next();
    this.notify();
  }

  onError(): void {
    this._state = 'error';
    this.notify();
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private startPositionSaveInterval(): void {
    this.stopPositionSaveInterval();
    if (!this.onPositionSave || !this._currentVideo) return;
    this.positionSaveInterval = setInterval(() => {
      if (this._currentVideo && this.onPositionSave) {
        this.onPositionSave(this._currentVideo.file.uri, this._position);
      }
    }, 15000);
  }

  private stopPositionSaveInterval(): void {
    if (this.positionSaveInterval) {
      clearInterval(this.positionSaveInterval);
      this.positionSaveInterval = null;
    }
  }

  private savePosition(): void {
    if (this.onPositionSave && this._currentVideo && this._position > 0) {
      this.onPositionSave(this._currentVideo.file.uri, this._position);
    }
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private notify(): void {
    const snapshot = this.snapshot;
    for (const listener of this.listeners) {
      try { listener(snapshot); } catch {}
    }
  }

  destroy(): void {
    this.stopPositionSaveInterval();
    this.cancelSleepTimer();
    this.listeners.clear();
  }
}
