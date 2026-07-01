import type { LibraryVideo, VideoFile, VideoMetadata, SubtitleFile } from '../library/types';
import { getDatabase } from './DatabaseService';

interface VideoRow {
  id: string;
  uri: string;
  name: string;
  path: string;
  size: number;
  extension: string;
  modified_at: number;
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  frame_rate: number;
  display_aspect_ratio: string;
  is_hdr: number;
  audio_codec: string;
  audio_channels: number;
  audio_sample_rate: number;
  thumbnail_uri: string | null;
  added_at: number;
  last_played_at: number | null;
  play_count: number;
  resume_position: number;
  is_favorite: number;
}

interface SubtitleRow {
  id: number;
  video_uri: string;
  uri: string;
  name: string;
  extension: string;
  language: string;
}

function rowToLibraryVideo(row: VideoRow, subtitles: SubtitleFile[]): LibraryVideo {
  const file: VideoFile = {
    uri: row.uri,
    path: row.path,
    name: row.name,
    size: row.size,
    extension: row.extension as VideoFile['extension'],
    modifiedAt: row.modified_at,
  };

  const metadata: VideoMetadata = {
    duration: row.duration,
    width: row.width,
    height: row.height,
    codec: row.codec,
    bitrate: row.bitrate,
    frameRate: row.frame_rate,
    displayAspectRatio: row.display_aspect_ratio,
    isHDR: row.is_hdr === 1,
    audioCodec: row.audio_codec,
    audioChannels: row.audio_channels,
    audioSampleRate: row.audio_sample_rate,
  };

  return {
    id: row.id,
    file,
    metadata: row.duration > 0 ? metadata : null,
    subtitles,
    thumbnailUri: row.thumbnail_uri,
    addedAt: row.added_at,
    lastPlayedAt: row.last_played_at,
    playCount: row.play_count,
    resumePosition: row.resume_position,
    isFavorite: row.is_favorite === 1,
  };
}

export const VideoRepository = {
  async insert(video: LibraryVideo): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO videos
       (id, uri, name, path, size, extension, modified_at,
        duration, width, height, codec, bitrate, frame_rate,
        display_aspect_ratio, is_hdr, audio_codec, audio_channels,
        audio_sample_rate, thumbnail_uri, added_at, last_played_at,
        play_count, resume_position, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      video.id,
      video.file.uri,
      video.file.name,
      video.file.path,
      video.file.size,
      video.file.extension,
      video.file.modifiedAt,
      video.metadata?.duration ?? 0,
      video.metadata?.width ?? 0,
      video.metadata?.height ?? 0,
      video.metadata?.codec ?? '',
      video.metadata?.bitrate ?? 0,
      video.metadata?.frameRate ?? 0,
      video.metadata?.displayAspectRatio ?? '',
      video.metadata?.isHDR ? 1 : 0,
      video.metadata?.audioCodec ?? '',
      video.metadata?.audioChannels ?? 0,
      video.metadata?.audioSampleRate ?? 0,
      video.thumbnailUri,
      video.addedAt,
      video.lastPlayedAt,
      video.playCount,
      video.resumePosition,
      video.isFavorite ? 1 : 0,
    );

    for (const sub of video.subtitles) {
      await db.runAsync(
        `INSERT OR REPLACE INTO subtitles (video_uri, uri, name, extension, language)
         VALUES (?, ?, ?, ?, ?)`,
        video.file.uri, sub.uri, sub.name, sub.extension, sub.language,
      );
    }
  },

  async updateThumbnail(uri: string, thumbnailUri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE videos SET thumbnail_uri = ? WHERE uri = ?', thumbnailUri, uri);
  },

  async updateResumePosition(uri: string, position: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE videos SET resume_position = ?, last_played_at = ? WHERE uri = ?',
      position, Date.now(), uri,
    );
  },

  async markPlayed(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE videos SET play_count = play_count + 1, last_played_at = ? WHERE uri = ?',
      Date.now(), uri,
    );
  },

  async toggleFavorite(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE videos SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE uri = ?',
      uri,
    );
  },

  async findByUri(uri: string): Promise<LibraryVideo | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<VideoRow>('SELECT * FROM videos WHERE uri = ?', uri);
    if (!row) return null;

    const subs = await db.getAllAsync<SubtitleRow>(
      'SELECT * FROM subtitles WHERE video_uri = ?', uri,
    );

    const subtitles: SubtitleFile[] = subs.map((s) => ({
      uri: s.uri,
      path: s.uri,
      name: s.name,
      extension: s.extension as SubtitleFile['extension'],
      language: s.language,
    }));

    return rowToLibraryVideo(row, subtitles);
  },

  async findAll(): Promise<LibraryVideo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<VideoRow>('SELECT * FROM videos ORDER BY added_at DESC');

    if (rows.length === 0) return [];

    const uris = rows.map((r) => r.uri);
    const placeholders = uris.map(() => '?').join(', ');
    const subRows = await db.getAllAsync<SubtitleRow>(
      `SELECT * FROM subtitles WHERE video_uri IN (${placeholders})`, ...uris,
    );

    const subMap = new Map<string, SubtitleFile[]>();
    for (const s of subRows) {
      if (!subMap.has(s.video_uri)) subMap.set(s.video_uri, []);
      subMap.get(s.video_uri)!.push({
        uri: s.uri,
        path: s.uri,
        name: s.name,
        extension: s.extension as SubtitleFile['extension'],
        language: s.language,
      });
    }

    return rows.map((r) => rowToLibraryVideo(r, subMap.get(r.uri) ?? []));
  },

  async findRecent(limit: number = 10): Promise<LibraryVideo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<VideoRow>(
      'SELECT * FROM videos ORDER BY added_at DESC LIMIT ?', limit,
    );
    return Promise.all(rows.map((r) => this.findByUri(r.uri))) as Promise<LibraryVideo[]>;
  },

  async findContinueWatching(limit: number = 10): Promise<LibraryVideo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<VideoRow>(
      'SELECT * FROM videos WHERE resume_position > 0 AND last_played_at IS NOT NULL ORDER BY last_played_at DESC LIMIT ?',
      limit,
    );
    return Promise.all(rows.map((r) => this.findByUri(r.uri))) as Promise<LibraryVideo[]>;
  },

  async delete(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM subtitles WHERE video_uri = ?', uri);
    await db.runAsync('DELETE FROM videos WHERE uri = ?', uri);
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM videos');
    return row?.count ?? 0;
  },
};
