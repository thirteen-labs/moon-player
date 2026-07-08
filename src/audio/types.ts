export type AudioExtension =
  | '.mp3' | '.flac' | '.wav' | '.aac' | '.ogg'
  | '.m4a' | '.wma' | '.opus' | '.alac' | '.aiff'
  | '.dsf' | '.ape';

export interface AudioFile {
  uri: string;
  path: string;
  name: string;
  size: number;
  extension: AudioExtension;
  modifiedAt: number;
}

export interface AudioMetadata {
  duration: number;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  year: number;
  trackNumber: number;
  trackTotal: number;
  discNumber: number;
  discTotal: number;
  bitrate: number;
  sampleRate: number;
  audioCodec: string;
  channels: number;
  composer: string;
}

export interface LibraryAudio {
  id: string;
  file: AudioFile;
  metadata: AudioMetadata | null;
  artworkUri: string | null;
  addedAt: number;
  lastPlayedAt: number | null;
  playCount: number;
  resumePosition: number;
  isFavorite: boolean;
}

export interface AudioScanProgress {
  totalFiles: number;
  scannedFiles: number;
  currentPath: string;
  phase: 'scanning' | 'extracting' | 'artwork' | 'complete';
}

export interface AudioScanResult {
  added: LibraryAudio[];
  updated: LibraryAudio[];
  removed: string[];
  totalDuration: number;
  scanDuration: number;
}

export type AudioScanCallback = (progress: AudioScanProgress) => void;
