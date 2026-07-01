import { getThumbnailAsync } from 'expo-video-thumbnails';
import { MmkvService } from '../storage/MmkvService';

const THUMBNAIL_CACHE_PREFIX = 'thumb_';

export class ThumbnailService {
  private cacheDir: string;

  constructor(cacheDir: string = '') {
    this.cacheDir = cacheDir;
  }

  async generateThumbnail(videoUri: string, time: number = 0): Promise<string | null> {
    try {
      const cached = MmkvService.getString(`${THUMBNAIL_CACHE_PREFIX}${videoUri}`);
      if (cached) return cached;

      const result = await getThumbnailAsync(videoUri, {
        time,
        quality: 0.5,
      });

      if (result?.uri) {
        MmkvService.setString(`${THUMBNAIL_CACHE_PREFIX}${videoUri}`, result.uri);
        return result.uri;
      }

      return null;
    } catch {
      return null;
    }
  }

  async generateBatch(
    uris: string[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const total = uris.length;

    for (let i = 0; i < total; i++) {
      const thumb = await this.generateThumbnail(uris[i]);
      if (thumb) {
        results.set(uris[i], thumb);
      }
      onProgress?.(i + 1, total);
    }

    return results;
  }

  clearCache(): void {
    const keys = MmkvService.getAllKeys();
    for (const key of keys) {
      if (key.startsWith(THUMBNAIL_CACHE_PREFIX)) {
        MmkvService.remove(key);
      }
    }
  }

  getCachedThumbnail(videoUri: string): string | undefined {
    return MmkvService.getString(`${THUMBNAIL_CACHE_PREFIX}${videoUri}`);
  }
}
