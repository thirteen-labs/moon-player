import {
  getVideoThumbnail,
  getByUri,
  type VideoItem,
} from '@obsidian_north/react-native-mediastore';
import { MmkvService } from '../storage/MmkvService';
import type { VideoFile } from './types';

const THUMBNAIL_CACHE_PREFIX = 'thumb_';

export class ThumbnailService {
  async generateThumbnail(video: VideoFile): Promise<string | null> {
    try {
      const cacheKey = `${THUMBNAIL_CACHE_PREFIX}${video.uri}`;
      const cached = MmkvService.getString(cacheKey);
      if (cached) return cached;

      const id = await this.resolveId(video);
      if (!id) return null;

      const thumb = await getVideoThumbnail(id);
      if (thumb) {
        MmkvService.setString(cacheKey, thumb);
        return thumb;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async resolveId(video: VideoFile): Promise<string | null> {
    if (video.mediaId) return video.mediaId;
    try {
      const item = (await getByUri(video.uri)) as VideoItem | null;
      return item?.id ?? null;
    } catch {
      return null;
    }
  }

  async generateBatch(
    videos: VideoFile[],
    onProgress?: (current: number, total: number) => void,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const total = videos.length;

    for (let i = 0; i < total; i++) {
      const thumb = await this.generateThumbnail(videos[i]);
      if (thumb) {
        results.set(videos[i].uri, thumb);
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
