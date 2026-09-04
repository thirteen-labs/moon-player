import { Scanner } from './Scanner';
import { MetadataExtractor } from './MetadataExtractor';
import { ThumbnailService, THUMBNAIL_SIZE } from './ThumbnailService';
import {
  requestPermissions,
  readDirectory,
  getPathByUri,
} from '@obsidian_north/react-native-mediastore';
import type {
  VideoFile,
  LibraryVideo,
  SubtitleFile,
  ScanResult,
  ScanCallback,
} from './types';
import { getFileNameWithoutExt, isSubtitleFile, inferLanguageFromFilename } from '../utils/fileExtensions';

export class LibraryService {
  private scanner: Scanner;
  private metadataExtractor: MetadataExtractor;
  private thumbnailService: ThumbnailService;
  private videos: Map<string, LibraryVideo> = new Map();
  private scannedUris: Set<string> = new Set();
  private scanInProgress = false;

  constructor() {
    this.scanner = new Scanner();
    this.metadataExtractor = new MetadataExtractor();
    this.thumbnailService = new ThumbnailService();
  }

  initialize(videos: Record<string, LibraryVideo>, scannedUris: string[]): void {
    this.videos = new Map(Object.entries(videos));
    this.scannedUris = new Set(scannedUris);
  }

  loadFromVideos(videos: LibraryVideo[]): void {
    this.videos = new Map(videos.map((v) => [v.id, v]));
    this.scannedUris = new Set(videos.map((v) => v.file.uri));
  }

  async fetchFirst(rootUris: string[], onProgress?: ScanCallback): Promise<ScanResult> {
    if (this.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    this.scanInProgress = true;
    const startTime = Date.now();

    try {
      await requestPermissions();

      const allFiles = await this.scanner.scan(rootUris, onProgress);

      // Metadata/thumbnail generation are best-effort: a failure in either must
      // not abort the whole scan and leave the library empty. Fall back to
      // empty results so videos are still indexed.
      let metadataResults = new Map<string, LibraryVideo['metadata']>();
      try {
        metadataResults = await this.metadataExtractor.extractBatch(allFiles, onProgress);
      } catch (e) {
        console.warn('[LibraryService] metadata extraction failed, continuing without it:', e);
      }

      let thumbnails = new Map<string, string>();
      try {
        // Use mediastore `getVideoThumbnail(id, width, height)` via ThumbnailService
        // Bounded concurrency keeps scan responsive while native generates thumbnails.
        thumbnails = await this.thumbnailService.generateBatch(
          allFiles,
          (current, total) => {
            onProgress?.({
              totalFiles: total,
              scannedFiles: current,
              currentPath: 'Generating thumbnails...',
              phase: 'extracting',
            });
          },
          { width: THUMBNAIL_SIZE.list.width, height: THUMBNAIL_SIZE.list.height },
        );
      } catch (e) {
        console.warn('[LibraryService] mediastore thumbnail generation failed, continuing without it:', e);
      }

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
          thumbnailUri: thumbnails.get(file.uri) ?? null,
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
    await requestPermissions();
    const files = await this.scanner.scanUris(uris, onProgress);
    const [metadataResults, thumbnailMap] = await Promise.all([
      this.metadataExtractor.extractBatch(files, onProgress),
      this.thumbnailService
        .generateBatch(files, undefined, {
          width: THUMBNAIL_SIZE.list.width,
          height: THUMBNAIL_SIZE.list.height,
        })
        .catch(() => new Map<string, string>()),
    ]);
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
        thumbnailUri: thumbnailMap.get(file.uri) ?? null,
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

  /**
   * Find subtitle files alongside the video using the latest mediastore file
   * APIs: `getPathByUri` + `readDirectory`. This replaces the previous
   * `expo-file-system` Directory walk and works with both content:// and
   * file:// URIs via the native MediaStore file table.
   */
  private async findSubtitles(video: VideoFile): Promise<SubtitleFile[]> {
    const baseName = getFileNameWithoutExt(video.name);
    const subtitles: SubtitleFile[] = [];

    // Resolve the real filesystem parent directory for the video.
    let dirPath: string | null = null;
    try {
      // Try to resolve content:// URI to a filesystem path first.
      const resolved = await getPathByUri(video.uri);
      if (resolved) {
        dirPath = resolved.slice(0, resolved.lastIndexOf('/'));
      }
    } catch {
      // Ignore resolution failure — fall back to path parsing.
    }
    if (!dirPath) {
      // Fallback: derive directory from video.path / uri.
      const src = video.path || video.uri;
      const idx = src.lastIndexOf('/');
      if (idx > 0) dirPath = src.slice(0, idx);
    }
    if (!dirPath) return subtitles;

    try {
      const entries = await readDirectory(dirPath);

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        if (!isSubtitleFile(entry.name)) continue;

        const entryBase = getFileNameWithoutExt(entry.name);
        if (entryBase !== baseName && !entryBase.startsWith(baseName)) continue;

        const ext = `.${entry.name.split('.').pop()?.toLowerCase() ?? ''}` as SubtitleFile['extension'];
        subtitles.push({
          uri: entry.path,
          path: entry.path,
          name: entry.name,
          extension: ext,
          language: inferLanguageFromFilename(entry.name),
        });
      }
    } catch {
      // No subtitles found or directory unreadable (permissions, scoped storage).
    }

    return subtitles;
  }
}
