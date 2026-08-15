import {
  getVideos,
  type VideoItem,
} from '@obsidian_north/react-native-mediastore';
import type { VideoFile, VideoExtension, ScanCallback } from './types';

// Common storage roots stripped from user-provided absolute paths so they can be
// matched against MediaStore relative paths (e.g. "Movies/", "DCIM/Camera").
const STORAGE_ROOTS = [
  '/storage/emulated/0/',
  '/storage/emulated/legacy/',
  '/mnt/sdcard/',
  '/sdcard/',
  '/storage/',
];

function stripStorageRoot(path: string): string {
  let p = path.replace(/\\/g, '/');
  for (const root of STORAGE_ROOTS) {
    if (p.startsWith(root)) {
      p = p.slice(root.length);
      break;
    }
  }
  return p.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
}

function isInFolders(item: VideoItem, folders: string[]): boolean {
  if (folders.length === 0) return true;

  const rel = (item.relativePath || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  const uri = item.uri.toLowerCase();

  return folders.some((folder) => {
    const target = stripStorageRoot(folder);
    // Empty target (e.g. root "/" ) means include everything.
    if (!target) return true;
    return (
      rel.startsWith(target) ||
      target.startsWith(rel) ||
      uri.includes(target)
    );
  });
}

function extensionFromName(name: string): VideoExtension {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  const ext = match ? match[1].toLowerCase() : '';
  return (`.${ext}` || '.') as VideoExtension;
}

function toVideoFile(item: VideoItem): VideoFile {
  const name =
    item.displayName || item.title || item.uri.split('/').pop() || 'Unknown';
  return {
    uri: item.uri,
    path: item.uri,
    name,
    size: item.size,
    extension: extensionFromName(name),
    // MediaStore timestamps are in milliseconds.
    modifiedAt: item.dateModified || item.dateAdded || 0,
    mediaId: item.id,
  };
}

export class Scanner {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Query the device-wide MediaStore for all videos, then filter by the
   * configured folders (best-effort relative-path matching).
   * The MediaStore index makes this far faster than recursive filesystem scans.
   */
  async scan(folders: string[], onProgress?: ScanCallback): Promise<VideoFile[]> {
    this.cancelled = false;
    try {
      const items = await getVideos();
      const filtered = folders.length
        ? items.filter((item) => isInFolders(item, folders))
        : items;

      const results: VideoFile[] = [];
      const total = filtered.length;

      for (let i = 0; i < total; i++) {
        if (this.cancelled) break;
        const item = filtered[i];
        onProgress?.({
          totalFiles: total,
          scannedFiles: i + 1,
          currentPath: item.displayName || item.uri,
          phase: 'scanning',
        });
        results.push(toVideoFile(item));
      }

      return results;
    } catch {
      // Permission denied or query failure — return no videos.
      return [];
    }
  }

  async scanDirectory(
    rootUri: string,
    onProgress?: ScanCallback,
  ): Promise<VideoFile[]> {
    return this.scan([rootUri], onProgress);
  }

  async scanUris(uris: string[], onProgress?: ScanCallback): Promise<VideoFile[]> {
    this.cancelled = false;
    if (uris.length === 0) return [];

    const wanted = new Set(uris.map((u) => u.toLowerCase()));
    try {
      const items = await getVideos();
      const matched = items.filter((item) => wanted.has(item.uri.toLowerCase()));

      const results: VideoFile[] = [];
      const total = matched.length;

      for (let i = 0; i < total; i++) {
        if (this.cancelled) break;
        const item = matched[i];
        onProgress?.({
          totalFiles: total,
          scannedFiles: i + 1,
          currentPath: item.displayName || item.uri,
          phase: 'scanning',
        });
        results.push(toVideoFile(item));
      }

      return results;
    } catch {
      return [];
    }
  }
}
