import type { Playlist } from '../library/types';
import { getDatabase } from './DatabaseService';

interface PlaylistRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

interface PlaylistVideoRow {
  playlist_id: string;
  video_uri: string;
  position: number;
  added_at: number;
}

function rowToPlaylist(row: PlaylistRow, videoIds: string[]): Playlist {
  return {
    id: row.id,
    name: row.name,
    videoIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const PlaylistRepository = {
  async insert(playlist: Playlist): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      playlist.id, playlist.name, playlist.createdAt, playlist.updatedAt,
    );

    for (let i = 0; i < playlist.videoIds.length; i++) {
      await db.runAsync(
        'INSERT OR REPLACE INTO playlist_videos (playlist_id, video_uri, position, added_at) VALUES (?, ?, ?, ?)',
        playlist.id, playlist.videoIds[i], i, playlist.createdAt,
      );
    }
  },

  async findAll(): Promise<Playlist[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PlaylistRow>('SELECT * FROM playlists ORDER BY updated_at DESC');

    const result: Playlist[] = [];
    for (const row of rows) {
      const videoRows = await db.getAllAsync<PlaylistVideoRow>(
        'SELECT * FROM playlist_videos WHERE playlist_id = ? ORDER BY position',
        row.id,
      );
      result.push(rowToPlaylist(row, videoRows.map((v) => v.video_uri)));
    }
    return result;
  },

  async findById(id: string): Promise<Playlist | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PlaylistRow>('SELECT * FROM playlists WHERE id = ?', id);
    if (!row) return null;

    const videoRows = await db.getAllAsync<PlaylistVideoRow>(
      'SELECT * FROM playlist_videos WHERE playlist_id = ? ORDER BY position',
      id,
    );
    return rowToPlaylist(row, videoRows.map((v) => v.video_uri));
  },

  async update(id: string, updates: Partial<Pick<Playlist, 'name' | 'videoIds'>>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return;

    const name = updates.name ?? existing.name;
    const videoIds = updates.videoIds ?? existing.videoIds;

    await db.runAsync(
      'UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?',
      name, Date.now(), id,
    );

    if (updates.videoIds) {
      await db.runAsync('DELETE FROM playlist_videos WHERE playlist_id = ?', id);
      for (let i = 0; i < videoIds.length; i++) {
        await db.runAsync(
          'INSERT INTO playlist_videos (playlist_id, video_uri, position, added_at) VALUES (?, ?, ?, ?)',
          id, videoIds[i], i, Date.now(),
        );
      }
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM playlist_videos WHERE playlist_id = ?', id);
    await db.runAsync('DELETE FROM playlists WHERE id = ?', id);
  },
};
