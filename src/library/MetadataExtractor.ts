import {
  getDetailedMetadataByUri,
  type DetailedMetadata,
} from '@obsidian_north/react-native-mediastore';
import type { VideoFile, VideoMetadata, ScanCallback } from './types';

const HDR_TOKENS = ['HDR', 'HLG', 'DOLBY', 'PQ', 'BT.2020'];

function isHdr(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toUpperCase();
  return HDR_TOKENS.some((token) => v.includes(token));
}

function toMetadata(det: DetailedMetadata): VideoMetadata {
  const width = det.video?.width ?? 0;
  const height = det.video?.height ?? 0;
  const durationMs = det.durationMs ?? det.video?.durationMs ?? 0;

  return {
    // DetailedMetadata durations are in milliseconds; the app expects seconds.
    duration: durationMs / 1000,
    width,
    height,
    codec: det.video?.codec ?? det.video?.codecMime ?? '',
    bitrate: det.video?.bitrate ?? 0,
    frameRate: det.video?.frameRate ?? 0,
    displayAspectRatio: width && height ? `${width}:${height}` : '',
    isHDR:
      isHdr(det.video?.colorTransfer) || isHdr(det.video?.colorStandard),
    audioCodec: det.audio?.codec ?? det.audio?.codecMime ?? '',
    audioChannels: det.audio?.channels ?? 0,
    audioSampleRate: det.audio?.sampleRate ?? 0,
  };
}

export class MetadataExtractor {
  async extract(file: VideoFile): Promise<VideoMetadata | null> {
    try {
      const det = await getDetailedMetadataByUri(file.uri);
      if (!det) return null;
      return toMetadata(det);
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
