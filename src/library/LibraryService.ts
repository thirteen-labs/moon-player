import { Scanner } from './Scanner';
import { MetadataExtractor } from './MetadataExtractor';
import { Directory, File } from 'expo-file-system';
import type {
  VideoFile,
  VideoMetadata,
  LibraryVideo,
  SubtitleFile,
  ScanProgress,
  ScanResult,
  ScanCallback,
} from './types';
import { getFileNameWithoutExt, isSubtitleFile, inferLanguageFromFilename } from '../utils/fileExtensions';

export class LibraryService {
  private scanner: Scanner;
  private metadataExtractor: MetadataExtractor;
  private videos: Map<string, LibraryVideo> = new Map();
  private scannedUris: Set<string> = new Set();
  private scanInProgress = false;

  constructor() {
    this.scanner = new Scanner();
    this.metadataExtractor = new MetadataExtractor();
  }

  initialize(videos: Record<string, LibraryVideo>, scannedUris: string[]): void {
    this.videos = new Map(Object.entries(videos));
    this.scannedUris = new Set(scannedUris);
  }

  async fetchFirst(rootUris: string[], onProgress?: ScanCallback): Promise<ScanResult> {
    if (this.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    this.scanInProgress = true;
    const startTime = Date.now();

    try {
      let allFiles: VideoFile[] = [];

      for (const uri of rootUris) {
        const files = await this.scanner.scanDirectory(uri, onProgress);
        allFiles = allFiles.concat(files);
      }

      const metadataResults = await this.metadataExtractor.extractBatch(allFiles, onProgress);

      const added: LibraryVideo[] = [];
      const now = Date.now();
      const scannedUris = new Set<string>();

      for (const file of allFiles) {
        const metadata = metadataResults.get(file.uri) ?? null;
        const subtitles = await this.findSubtitles(file);
        const existing = this.videos.get(file.uri);

        const video: LibraryVideo = {
          id: file.uri,
          file,
          metadata,
          subtitles,
          thumbnailUri: null,
          addedAt: existing?.addedAt ?? now,
          lastPlayedAt: existing?.lastPlayedAt ?? null,
          playCount: existing?.playCount ?? 0,
          resumePosition: existing?.resumePosition ?? 0,
          isFavorite: existing?.isFavorite ?? false,
        };

        this.videos.set(file.uri, video);
        scannedUris.add(file.uri);

        if (!existing) {
          added.push(video);
        }
      }

      const removed: string[] = [];
      for (const uri of this.scannedUris) {
        if (!scannedUris.has(uri)) {
          this.videos.delete(uri);
          removed.push(uri);
        }
      }
      this.scannedUris = scannedUris;

      return {
        added,
        updated: [],
        removed,
        totalDuration: allFiles.reduce((sum, f) => sum + (metadataResults.get(f.uri)?.duration ?? 0), 0),
        scanDuration: Date.now() - startTime,
      };
    } finally {
      this.scanInProgress = false;
    }
  }

  async fetchAdditionalUris(uris: string[], onProgress?: ScanCallback): Promise<LibraryVideo[]> {
    const files = await this.scanner.scanUris(uris, onProgress);
    const metadataResults = await this.metadataExtractor.extractBatch(files, onProgress);
    const added: LibraryVideo[] = [];
    const now = Date.now();

    for (const file of files) {
      const metadata = metadataResults.get(file.uri) ?? null;
      const subtitles = await this.findSubtitles(file);

      const video: LibraryVideo = {
        id: file.uri,
        file,
        metadata,
        subtitles,
        thumbnailUri: null,
        addedAt: now,
        lastPlayedAt: null,
        playCount: 0,
        resumePosition: 0,
        isFavorite: false,
      };

      this.videos.set(file.uri, video);
      this.scannedUris.add(file.uri);
      added.push(video);
    }

    return added;
  }

  getVideo(uri: string): LibraryVideo | undefined {
    return this.videos.get(uri);
  }

  getAllVideos(): LibraryVideo[] {
    return Array.from(this.videos.values());
  }

  updateVideo(uri: string, video: LibraryVideo): void {
    this.videos.set(uri, video);
  }

  getScannedUris(): Set<string> {
    return this.scannedUris;
  }

  getVideoCount(): number {
    return this.videos.size;
  }

  cancelScan(): void {
    this.scanner.cancel();
  }

  get isScanning(): boolean {
    return this.scanInProgress;
  }

  private async findSubtitles(video: VideoFile): Promise<SubtitleFile[]> {
    const baseName = getFileNameWithoutExt(video.name);
    const dirPath = video.path.slice(0, video.path.lastIndexOf('/'));
    const subtitles: SubtitleFile[] = [];

    try {
      const dir = new Directory(dirPath);
      if (!dir.exists) return subtitles;

      const entries = dir.list();

      for (const entry of entries) {
        if (!(entry instanceof File)) continue;
        if (!isSubtitleFile(entry.name)) continue;

        const entryBase = getFileNameWithoutExt(entry.name);
        if (entryBase !== baseName && !entryBase.startsWith(baseName)) continue;

        subtitles.push({
          uri: entry.uri,
          path: entry.uri,
          name: entry.name,
          extension: entry.extension.toLowerCase() as any,
          language: inferLanguageFromFilename(entry.name),
        });
      }
    } catch {
      // No subtitles found
    }

    return subtitles;
  }
}
