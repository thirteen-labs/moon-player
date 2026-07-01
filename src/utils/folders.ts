import type { LibraryVideo } from '../library/types';

export interface FolderGroup {
  id: string;
  name: string;
  path: string;
  videos: LibraryVideo[];
}

export function groupVideosByFolder(videos: LibraryVideo[]): FolderGroup[] {
  const folderMap = new Map<string, LibraryVideo[]>();

  for (const video of videos) {
    const path = video.file.path;
    const lastSlash = path.lastIndexOf('/');
    const folderPath = lastSlash > 0 ? path.slice(0, lastSlash) : '/';
    const existing = folderMap.get(folderPath);
    if (existing) {
      existing.push(video);
    } else {
      folderMap.set(folderPath, [video]);
    }
  }

  const groups: FolderGroup[] = [];
  for (const [path, vids] of folderMap) {
    const name = path.split('/').pop() ?? 'Unknown';
    groups.push({
      id: path,
      name,
      path,
      videos: vids,
    });
  }

  groups.sort((a, b) => a.name.localeCompare(b.name));
  return groups;
}
