/**
 * ThumbnailService — mediastore-backed video thumbnail extraction.
 *
 * Uses the latest `@obsidian_north/react-native-mediastore` thumbnail APIs:
 *   - `getVideoThumbnail(videoId, width?, height?)` (native MediaStore + Photos Framework)
 *   - `getByUri(uri)` for id resolution when `mediaId` is not cached
 *
 * Thumbnails are cached in MMKV (string URI) to avoid repeated native I/O.
 * Batch generation uses bounded concurrency to saturate the native thumbnail
 * service without overwhelming the JS thread.
 */

import {
  getVideoThumbnail,
  getByUri,
  type VideoItem,
} from '@obsidian_north/react-native-mediastore';
import { MmkvService } from '../storage/MmkvService';
import type { VideoFile } from './types';

const THUMBNAIL_CACHE_PREFIX = 'thumb_';

// Default sizes — tuned for Moon Player UI
// List tiles: 320x180 (16:9), detail/hero: 640x360
export const THUMBNAIL_SIZE = {
  list: { width: 320, height: 180 },
  detail: { width: 640, height: 360 },
} as const;

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  /** Bypass MMKV cache and force regeneration */
  forceRefresh?: boolean;
}

const DEFAULT_BATCH_CONCURRENCY = 4;

export class ThumbnailService {
  /**
   * Generate (or return cached) thumbnail for a single video using mediastore.
   * Delegates directly to `getVideoThumbnail` with optional dimensions.
   */
  async generateThumbnail(
    video: VideoFile,
    options: ThumbnailOptions = {},
  ): Promise<string | null> {
    const { width = THUMBNAIL_SIZE.list.width, height = THUMBNAIL_SIZE.list.height, forceRefresh = false } = options;

    try {
      const cacheKey = this.cacheKey(video.uri, width, height);
      if (!forceRefresh) {
        const cached = MmkvService.getString(cacheKey);
        if (cached) return cached;
        // Back-compat: check legacy key without dimensions
        const legacy = MmkvService.getString(`${THUMBNAIL_CACHE_PREFIX}${video.uri}`);
        if (legacy) return legacy;
      }

      const id = await this.resolveId(video);
      if (!id) return null;

      // Latest mediastore API: (videoId, width, height) -> thumbnail file uri
      const thumb = await getVideoThumbnail(id, width, height);
      if (thumb) {
        MmkvService.setString(cacheKey, thumb);
        // Also store under legacy key for readers that don't specify size
        MmkvService.setString(`${THUMBNAIL_CACHE_PREFIX}${video.uri}`, thumb);
        return thumb;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve mediastore id for a VideoFile.
   * Prefers `mediaId` already present from Scanner, falls back to native `getByUri`.
   */
  private async resolveId(video: VideoFile): Promise<string | null> {
    if (video.mediaId) return video.mediaId;
    try {
      const item = (await getByUri(video.uri)) as VideoItem | null;
      return item?.id ?? null;
    } catch {
      return null;
    }
  }

  private cacheKey(uri: string, width: number, height: number): string {
    return `${THUMBNAIL_CACHE_PREFIX}${uri}_${width}x${height}`;
  }

  /**
   * Batch thumbnail generation using mediastore.
   * Runs with bounded concurrency (default 4) to avoid serial bottleneck
   * while not flooding the native thread pool.
   */
  async generateBatch(
    videos: VideoFile[],
    onProgress?: (current: number, total: number) => void,
    options: ThumbnailOptions & { concurrency?: number } = {},
  ): Promise<Map<string, string>> {
    const { concurrency = DEFAULT_BATCH_CONCURRENCY, ...thumbOpts } = options;
    const results = new Map<string, string>();
    const total = videos.length;
    if (total === 0) return results;

    let completed = 0;

    // Bounded concurrency via chunked Promise.all
    for (let i = 0; i < total; i += concurrency) {
      const chunk = videos.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(async (video) => {
          const thumb = await this.generateThumbnail(video, thumbOpts);
          return { uri: video.uri, thumb };
        }),
      );

      for (const { uri, thumb } of chunkResults) {
        completed++;
        if (thumb) results.set(uri, thumb);
        onProgress?.(completed, total);
      }
    }

    return results;
  }

  /**
   * Prefetch thumbnails for given videos without blocking caller.
   * Useful for warming cache after a scan.
   */
  prefetch(videos: VideoFile[], options: ThumbnailOptions = {}): void {
    void this.generateBatch(videos, undefined, { ...options, concurrency: 6 });
  }

  clearCache(): void {
    const keys = MmkvService.getAllKeys();
    for (const key of keys) {
      if (key.startsWith(THUMBNAIL_CACHE_PREFIX)) {
        MmkvService.remove(key);
      }
    }
  }

  getCachedThumbnail(
    videoUri: string,
    size: keyof typeof THUMBNAIL_SIZE | ThumbnailOptions = 'list',
  ): string | undefined {
    const opts = typeof size === 'string' ? THUMBNAIL_SIZE[size] : size;
    const width = (opts as ThumbnailOptions).width ?? THUMBNAIL_SIZE.list.width;
    const height = (opts as ThumbnailOptions).height ?? THUMBNAIL_SIZE.list.height;
    return (
      MmkvService.getString(this.cacheKey(videoUri, width, height)) ??
      MmkvService.getString(`${THUMBNAIL_CACHE_PREFIX}${videoUri}`) ??
      undefined
    );
  }

  /**
   * Invalidate a single video's cached thumbnails (all sizes).
   */
  invalidate(videoUri: string): void {
    const keys = MmkvService.getAllKeys();
    for (const key of keys) {
      if (key === `${THUMBNAIL_CACHE_PREFIX}${videoUri}` || key.startsWith(`${THUMBNAIL_CACHE_PREFIX}${videoUri}_`)) {
        MmkvService.remove(key);
      }
    }
  }
}
