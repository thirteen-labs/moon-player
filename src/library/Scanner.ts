import {
  getVideos,
  getByUri,
  SortField,
  SortOrder,
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
  return p.replace(/^\/+/, '').replace(/\/+$/, '');
}

// Native sort — most recent first, matches MediaStore index order.
const DEFAULT_SORT = { field: SortField.DateAdded, order: SortOrder.Descending };

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
   * Query MediaStore for videos using native folder filters.
   * When `folders` is empty the whole device is scanned.
   * Uses the latest mediastore API: `getVideos(sort, filter, pagination)` with
   * server-side `filter.folder` so filtering happens in the native DB, not JS.
   */
  async scan(folders: string[], onProgress?: ScanCallback): Promise<VideoFile[]> {
    this.cancelled = false;

    try {
      const items = await this.fetchVideosWithNativeFilter(folders);

      const results: VideoFile[] = [];
      const total = items.length;

      for (let i = 0; i < total; i++) {
        if (this.cancelled) break;
        const item = items[i];
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

  /**
   * Fetch videos for each configured folder in parallel using native filter.
   * Falls back to a single unfiltered query if folder filters yield nothing.
   */
  private async fetchVideosWithNativeFilter(folders: string[]): Promise<VideoItem[]> {
    if (folders.length === 0) {
      return getVideos(DEFAULT_SORT);
    }

    // Strip roots and deduplicate folder targets.
    const targets = Array.from(
      new Set(folders.map(stripStorageRoot).filter((t) => t.length > 0)),
    );

    // Empty after stripping means root "/" — include everything.
    if (targets.length === 0) {
      return getVideos(DEFAULT_SORT);
    }

    const perFolder = await Promise.all(
      targets.map(async (folder) => {
        try {
          // Native folder filter: deep path prefix match on relativePath.
          return await getVideos(DEFAULT_SORT, { folder });
        } catch {
          return [] as VideoItem[];
        }
      }),
    );

    // Merge and dedupe by id (videos may appear in overlapping folder queries).
    const seen = new Set<string>();
    const merged: VideoItem[] = [];
    for (const list of perFolder) {
      for (const item of list) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }

    // If native folder filtering returned nothing (e.g. folder not indexed as
    // relativePath), fall back to full scan + client-side URI check for robustness.
    if (merged.length === 0) {
      const all = await getVideos(DEFAULT_SORT);
      const lowered = targets.map((t) => t.toLowerCase());
      return all.filter((item) => {
        const rel = (item.relativePath || '').replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
        const uri = item.uri.toLowerCase();
        return lowered.some((target) => rel.startsWith(target) || uri.includes(target));
      });
    }

    return merged;
  }

  async scanDirectory(
    rootUri: string,
    onProgress?: ScanCallback,
  ): Promise<VideoFile[]> {
    return this.scan([rootUri], onProgress);
  }

  /**
   * Resolve specific URIs using the latest `getByUri` lookup.
   * Uses parallel `getByUri` calls — far cheaper than scanning the whole MediaStore
   * when only a handful of URIs are needed (e.g. SAF picks).
   */
  async scanUris(uris: string[], onProgress?: ScanCallback): Promise<VideoFile[]> {
    this.cancelled = false;
    if (uris.length === 0) return [];

    try {
      // Deduplicate input URIs case-insensitively.
      const unique = Array.from(new Set(uris.map((u) => u.toLowerCase())));
      // Map lower -> original for result lookup (preserve original casing).
      const lowerToOriginal = new Map(uris.map((u) => [u.toLowerCase(), u] as const));

      const results: VideoFile[] = [];
      // Resolve each URI individually via native lookup (uses ContentResolver directly).
      const resolved = await Promise.all(
        unique.map(async (lower) => {
          try {
            const original = lowerToOriginal.get(lower) ?? lower;
            const item = await getByUri(original);
            // Fallback: try lowercased variant if original failed.
            if (!item && original !== lower) {
              return (await getByUri(lower)) as VideoItem | null;
            }
            return item as VideoItem | null;
          } catch {
            return null;
          }
        }),
      );

      const matched = resolved.filter((v): v is VideoItem => v !== null);
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

      // Fallback for URIs not found via getByUri (e.g. file:// paths not yet indexed):
      // attempt to synthesize a minimal VideoFile from the URI itself if it has a video extension.
      if (results.length < unique.length) {
        const foundLower = new Set(matched.map((m) => m.uri.toLowerCase()));
        const { isVideoFile } = await import('../utils/fileExtensions');
        for (const lower of unique) {
          if (foundLower.has(lower)) continue;
          const original = lowerToOriginal.get(lower) ?? lower;
          const name = original.split('/').pop() ?? 'Unknown';
          if (isVideoFile(name)) {
            results.push({
              uri: original,
              path: original,
              name,
              size: 0,
              extension: extensionFromName(name),
              modifiedAt: Date.now(),
            });
          }
        }
      }

      return results;
    } catch {
      return [];
    }
  }
}
