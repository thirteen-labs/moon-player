import { AudioScanner } from './AudioScanner';
import { AudioMetadataArtworkExtractor } from './AudioMetadataArtwork';
import type {
  AudioFile,
  LibraryAudio,
  AudioScanResult,
  AudioScanCallback,
} from './types';

export class AudioLibrary {
  private scanner: AudioScanner;
  private extractor: AudioMetadataArtworkExtractor;
  private tracks: Map<string, LibraryAudio> = new Map();
  private scannedUris: Set<string> = new Set();
  private scanInProgress = false;

  constructor() {
    this.scanner = new AudioScanner();
    this.extractor = new AudioMetadataArtworkExtractor();
  }

  initialize(tracks: Record<string, LibraryAudio>, scannedUris: string[]): void {
    this.tracks = new Map(Object.entries(tracks));
    this.scannedUris = new Set(scannedUris);
  }

  loadFromTracks(tracks: LibraryAudio[]): void {
    this.tracks = new Map(tracks.map((t) => [t.id, t]));
    this.scannedUris = new Set(tracks.map((t) => t.file.uri));
  }

  async scanDirectories(
    rootUris: string[],
    onProgress?: AudioScanCallback,
  ): Promise<AudioScanResult> {
    if (this.scanInProgress) {
      throw new Error('Audio scan already in progress');
    }

    this.scanInProgress = true;
    const startTime = Date.now();

    try {
      let allFiles: AudioFile[] = [];

      for (const uri of rootUris) {
        const files = await this.scanner.scanDirectory(uri, onProgress);
        allFiles = allFiles.concat(files);
      }

      const extracted = await this.extractor.extractBatch(allFiles, onProgress);

      const added: LibraryAudio[] = [];
      const now = Date.now();
      const scannedUris = new Set<string>();

      for (const file of allFiles) {
        const result = extracted.get(file.uri);
        const existing = this.tracks.get(file.uri);

        const track: LibraryAudio = {
          id: file.uri,
          file,
          metadata: result?.metadata ?? null,
          artworkUri: result?.artworkUri ?? null,
          addedAt: existing?.addedAt ?? now,
          lastPlayedAt: existing?.lastPlayedAt ?? null,
          playCount: existing?.playCount ?? 0,
          resumePosition: existing?.resumePosition ?? 0,
          isFavorite: existing?.isFavorite ?? false,
        };

        this.tracks.set(file.uri, track);
        scannedUris.add(file.uri);

        if (!existing) {
          added.push(track);
        }
      }

      const removed: string[] = [];
      for (const uri of this.scannedUris) {
        if (!scannedUris.has(uri)) {
          this.tracks.delete(uri);
          removed.push(uri);
        }
      }
      this.scannedUris = scannedUris;

      return {
        added,
        updated: [],
        removed,
        totalDuration: allFiles.reduce(
          (sum, f) => sum + (extracted.get(f.uri)?.metadata?.duration ?? 0), 0,
        ),
        scanDuration: Date.now() - startTime,
      };
    } finally {
      this.scanInProgress = false;
    }
  }

  async scanUris(
    uris: string[],
    onProgress?: AudioScanCallback,
  ): Promise<LibraryAudio[]> {
    const files = await this.scanner.scanUris(uris, onProgress);
    const extracted = await this.extractor.extractBatch(files, onProgress);
    const added: LibraryAudio[] = [];
    const now = Date.now();

    for (const file of files) {
      const result = extracted.get(file.uri);

      const track: LibraryAudio = {
        id: file.uri,
        file,
        metadata: result?.metadata ?? null,
        artworkUri: result?.artworkUri ?? null,
        addedAt: now,
        lastPlayedAt: null,
        playCount: 0,
        resumePosition: 0,
        isFavorite: false,
      };

      this.tracks.set(file.uri, track);
      this.scannedUris.add(file.uri);
      added.push(track);
    }

    return added;
  }

  getTrack(uri: string): LibraryAudio | undefined {
    return this.tracks.get(uri);
  }

  getAllTracks(): LibraryAudio[] {
    return Array.from(this.tracks.values());
  }

  updateTrack(uri: string, track: LibraryAudio): void {
    this.tracks.set(uri, track);
  }

  getScannedUris(): Set<string> {
    return this.scannedUris;
  }

  getTrackCount(): number {
    return this.tracks.size;
  }

  cancelScan(): void {
    this.scanner.cancel();
  }

  get isScanning(): boolean {
    return this.scanInProgress;
  }
}
