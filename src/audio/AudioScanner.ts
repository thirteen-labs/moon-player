import { Directory, File } from 'expo-file-system';
import type { AudioFile, AudioExtension, AudioScanCallback } from './types';
import { isAudioFile } from '../utils/fileExtensions';

export class AudioScanner {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  async scanDirectory(
    rootUri: string,
    onProgress?: AudioScanCallback,
  ): Promise<AudioFile[]> {
    this.cancelled = false;
    const results: AudioFile[] = [];

    const walk = async (dir: Directory): Promise<void> => {
      if (this.cancelled) return;

      try {
        const entries = dir.list();

        for (const entry of entries) {
          if (this.cancelled) return;

          if (entry instanceof Directory) {
            await walk(entry);
          } else if (entry instanceof File && entry.exists) {
            if (isAudioFile(entry.name)) {
              results.push({
                uri: entry.uri,
                path: entry.uri,
                name: entry.name,
                size: entry.size,
                extension: entry.extension.toLowerCase() as AudioExtension,
                modifiedAt: entry.lastModified ?? 0,
              });
            }
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    const rootDir = new Directory(rootUri);
    if (!rootDir.exists) return results;

    await walk(rootDir);

    const totalFiles = results.length;
    for (let i = 0; i < totalFiles; i++) {
      onProgress?.({
        totalFiles,
        scannedFiles: i + 1,
        currentPath: results[i].uri,
        phase: 'scanning',
      });
    }

    return results;
  }

  async scanUris(uris: string[], onProgress?: AudioScanCallback): Promise<AudioFile[]> {
    this.cancelled = false;
    const results: AudioFile[] = [];
    const totalFiles = uris.length;

    for (let i = 0; i < totalFiles; i++) {
      if (this.cancelled) break;

      const fileUri = uris[i];
      onProgress?.({
        totalFiles,
        scannedFiles: i + 1,
        currentPath: fileUri,
        phase: 'scanning',
      });

      try {
        const file = new File(fileUri);
        if (file.exists && isAudioFile(file.name)) {
          results.push({
            uri: file.uri,
            path: file.uri,
            name: file.name,
            size: file.size,
            extension: file.extension.toLowerCase() as AudioExtension,
            modifiedAt: file.lastModified ?? 0,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }

    return results;
  }
}
