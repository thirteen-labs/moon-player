import { Directory, File } from 'expo-file-system';
import type { LibraryVideo, Playlist } from '../library/types';

const DATA_DIR = 'aura_data';
const LIBRARY_FILE = 'library.json';
const PLAYLISTS_FILE = 'playlists.json';
const SETTINGS_FILE = 'settings.json';

function getDataDir(): Directory {
  const dir = new Directory(DATA_DIR);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function getFilePath(filename: string): string {
  const dir = getDataDir();
  return `${dir.uri}${filename}`;
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    const path = getFilePath(filename);
    const file = new File(path);
    if (!file.exists) return fallback;

    const content = await file.text();
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filename: string, data: T): Promise<void> {
  const path = getFilePath(filename);
  const file = new File(path);
  await file.write(JSON.stringify(data, null, 2), EncodingType.UTF8);
}

export interface LibraryData {
  videos: Record<string, LibraryVideo>;
  scannedUris: string[];
  savedAt: number;
}

export interface SettingsData {
  defaultSort: 'name' | 'date' | 'duration';
  defaultLayout: 'grid' | 'list';
  gridColumns: number;
  scanDirectories: string[];
  playbackSpeed: number;
  subtitleOffset: number;
  autoResume: boolean;
  theme: string;
  updatedAt: number;
}

const DEFAULT_SETTINGS: SettingsData = {
  defaultSort: 'name',
  defaultLayout: 'grid',
  gridColumns: 3,
  scanDirectories: [],
  playbackSpeed: 1,
  subtitleOffset: 0,
  autoResume: true,
  theme: 'dark',
  updatedAt: 0,
};

export const StorageService = {
  async saveLibrary(videos: Map<string, LibraryVideo>, scannedUris: Set<string>): Promise<void> {
    const data: LibraryData = {
      videos: Object.fromEntries(videos),
      scannedUris: Array.from(scannedUris),
      savedAt: Date.now(),
    };
    await writeJson(LIBRARY_FILE, data);
  },

  async loadLibrary(): Promise<LibraryData | null> {
    return readJson<LibraryData | null>(LIBRARY_FILE, null);
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    await writeJson(PLAYLISTS_FILE, playlists);
  },

  async loadPlaylists(): Promise<Playlist[]> {
    return readJson<Playlist[]>(PLAYLISTS_FILE, []);
  },

  async saveSettings(settings: Partial<SettingsData>): Promise<void> {
    const current = await this.loadSettings();
    const updated = { ...current, ...settings, updatedAt: Date.now() };
    await writeJson(SETTINGS_FILE, updated);
  },

  async loadSettings(): Promise<SettingsData> {
    return readJson<SettingsData>(SETTINGS_FILE, DEFAULT_SETTINGS);
  },

  async clearAll(): Promise<void> {
    try {
      const dir = getDataDir();
      const files = dir.list();
      for (const file of files) {
        if (file instanceof File) {
          file.delete();
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  },
};
