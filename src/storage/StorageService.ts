import { Directory, File } from 'expo-file-system';

const DATA_DIR = 'aura_data';

function getDataDir(): Directory {
  const dir = new Directory(DATA_DIR);
  if (!dir.exists) dir.create();
  return dir;
}

export const StorageService = {
  async clearAll(): Promise<void> {
    try {
      const dir = getDataDir();
      const files = dir.list();
      for (const file of files) {
        if (file instanceof File) file.delete();
      }
    } catch {
      // Ignore cleanup errors
    }
  },
};
