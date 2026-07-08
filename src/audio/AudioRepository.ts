import type { LibraryAudio, AudioFile, AudioMetadata } from './types';
import { getDatabase } from '../database/DatabaseService';

interface AudioRow {
  id: string;
  uri: string;
  name: string;
  path: string;
  size: number;
  extension: string;
  modified_at: number;
  duration: number;
  title: string;
  artist: string;
  album: string;
  album_artist: string;
  genre: string;
  year: number;
  track_number: number;
  track_total: number;
  disc_number: number;
  disc_total: number;
  bitrate: number;
  sample_rate: number;
  audio_codec: string;
  channels: number;
  composer: string;
  artwork_uri: string | null;
  added_at: number;
  last_played_at: number | null;
  play_count: number;
  resume_position: number;
  is_favorite: number;
}

function rowToLibraryAudio(row: AudioRow): LibraryAudio {
  const file: AudioFile = {
    uri: row.uri,
    path: row.path,
    name: row.name,
    size: row.size,
    extension: row.extension as AudioFile['extension'],
    modifiedAt: row.modified_at,
  };

  const metadata: AudioMetadata = {
    duration: row.duration,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumArtist: row.album_artist,
    genre: row.genre,
    year: row.year,
    trackNumber: row.track_number,
    trackTotal: row.track_total,
    discNumber: row.disc_number,
    discTotal: row.disc_total,
    bitrate: row.bitrate,
    sampleRate: row.sample_rate,
    audioCodec: row.audio_codec,
    channels: row.channels,
    composer: row.composer,
  };

  return {
    id: row.id,
    file,
    metadata: row.duration > 0 ? metadata : null,
    artworkUri: row.artwork_uri,
    addedAt: row.added_at,
    lastPlayedAt: row.last_played_at,
    playCount: row.play_count,
    resumePosition: row.resume_position,
    isFavorite: row.is_favorite === 1,
  };
}

export const AudioRepository = {
  async insert(audio: LibraryAudio): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO audio_tracks
       (id, uri, name, path, size, extension, modified_at,
        duration, title, artist, album, album_artist, genre, year,
        track_number, track_total, disc_number, disc_total,
        bitrate, sample_rate, audio_codec, channels, composer,
        artwork_uri, added_at, last_played_at, play_count, resume_position, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      audio.id,
      audio.file.uri,
      audio.file.name,
      audio.file.path,
      audio.file.size,
      audio.file.extension,
      audio.file.modifiedAt,
      audio.metadata?.duration ?? 0,
      audio.metadata?.title ?? '',
      audio.metadata?.artist ?? '',
      audio.metadata?.album ?? '',
      audio.metadata?.albumArtist ?? '',
      audio.metadata?.genre ?? '',
      audio.metadata?.year ?? 0,
      audio.metadata?.trackNumber ?? 0,
      audio.metadata?.trackTotal ?? 0,
      audio.metadata?.discNumber ?? 0,
      audio.metadata?.discTotal ?? 0,
      audio.metadata?.bitrate ?? 0,
      audio.metadata?.sampleRate ?? 0,
      audio.metadata?.audioCodec ?? '',
      audio.metadata?.channels ?? 0,
      audio.metadata?.composer ?? '',
      audio.artworkUri,
      audio.addedAt,
      audio.lastPlayedAt,
      audio.playCount,
      audio.resumePosition,
      audio.isFavorite ? 1 : 0,
    );
  },

  async updateArtwork(uri: string, artworkUri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE audio_tracks SET artwork_uri = ? WHERE uri = ?', artworkUri, uri);
  },

  async updateResumePosition(uri: string, position: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE audio_tracks SET resume_position = ?, last_played_at = ? WHERE uri = ?',
      position, Date.now(), uri,
    );
  },

  async markPlayed(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE audio_tracks SET play_count = play_count + 1, last_played_at = ? WHERE uri = ?',
      Date.now(), uri,
    );
  },

  async toggleFavorite(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE audio_tracks SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE uri = ?',
      uri,
    );
  },

  async findByUri(uri: string): Promise<LibraryAudio | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AudioRow>(
      'SELECT * FROM audio_tracks WHERE uri = ?', uri,
    );
    return row ? rowToLibraryAudio(row) : null;
  },

  async findAll(): Promise<LibraryAudio[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AudioRow>(
      'SELECT * FROM audio_tracks ORDER BY added_at DESC',
    );
    return rows.map(rowToLibraryAudio);
  },

  async findRecent(limit: number = 10): Promise<LibraryAudio[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AudioRow>(
      'SELECT * FROM audio_tracks ORDER BY added_at DESC LIMIT ?', limit,
    );
    return rows.map(rowToLibraryAudio);
  },

  async delete(uri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM audio_tracks WHERE uri = ?', uri);
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM audio_tracks',
    );
    return row?.count ?? 0;
  },
};
