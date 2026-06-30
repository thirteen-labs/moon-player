import { getVideoInfoAsync, type VideoInfoResult } from 'expo-video-metadata';
import type { VideoFile, VideoMetadata, ScanProgress, ScanCallback } from './types';

function toMetadata(info: VideoInfoResult): VideoMetadata {
  const width = info.naturalOrientation === 'Portrait' ? info.height : info.width;
  const height = info.naturalOrientation === 'Portrait' ? info.width : info.height;

  return {
    duration: info.duration,
    width,
    height,
    codec: info.codec,
    bitrate: info.bitRate,
    frameRate: info.fps,
    displayAspectRatio: `${width}:${height}`,
    isHDR: info.isHDR ?? false,
    audioCodec: info.audioCodec,
    audioChannels: info.audioChannels,
    audioSampleRate: info.audioSampleRate,
  };
}

export class MetadataExtractor {
  async extract(file: VideoFile): Promise<VideoMetadata | null> {
    try {
      const info = await getVideoInfoAsync(file.uri);
      return toMetadata(info);
    } catch {
      return null;
    }
  }

  async extractBatch(
    files: VideoFile[],
    onProgress?: ScanCallback,
  ): Promise<Map<string, VideoMetadata>> {
    const results = new Map<string, VideoMetadata>();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      onProgress?.({
        totalFiles,
        scannedFiles: i + 1,
        currentPath: file.uri,
        phase: 'extracting',
      });

      const metadata = await this.extract(file);
      if (metadata) {
        results.set(file.uri, metadata);
      }
    }

    return results;
  }
}
