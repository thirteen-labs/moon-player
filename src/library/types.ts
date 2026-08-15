export type VideoExtension =
  | '.mp4' | '.mkv' | '.avi' | '.mov' | '.wmv'
  | '.flv' | '.webm' | '.m4v' | '.3gp' | '.ts'
  | '.mts' | '.m2ts' | '.ogv' | '.divx' | '.asf';

export type SubtitleExtension =
  | '.srt' | '.ass' | '.ssa' | '.vtt' | '.sub' | '.idx' | '.pgs';

export interface VideoFile {
  uri: string;
  path: string;
  name: string;
  size: number;
  extension: VideoExtension;
  modifiedAt: number;
  /** MediaStore item id (populated when sourced from @obsidian_north/react-native-mediastore). */
  mediaId?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  frameRate: number;
  displayAspectRatio: string;
  isHDR: boolean;
  audioCodec: string;
  audioChannels: number;
  audioSampleRate: number;
}

export interface SubtitleFile {
  uri: string;
  path: string;
  name: string;
  extension: SubtitleExtension;
  language: string;
}

export interface LibraryVideo {
  id: string;
  file: VideoFile;
  metadata: VideoMetadata | null;
  subtitles: SubtitleFile[];
  thumbnailUri: string | null;
  addedAt: number;
  lastPlayedAt: number | null;
  playCount: number;
  resumePosition: number;
  isFavorite: boolean;
}

export interface ScanProgress {
  totalFiles: number;
  scannedFiles: number;
  currentPath: string;
  phase: 'scanning' | 'extracting' | 'complete';
}

export interface ScanResult {
  added: LibraryVideo[];
  updated: LibraryVideo[];
  removed: string[];
  totalDuration: number;
  scanDuration: number;
}

export type ScanCallback = (progress: ScanProgress) => void;

export interface Playlist {
  id: string;
  name: string;
  videoIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VideoCollection {
  id: string;
  name: string;
  icon: string;
  filter: (videos: LibraryVideo[]) => LibraryVideo[];
}
