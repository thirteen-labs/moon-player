export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL,
    applied_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    uri TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    extension TEXT NOT NULL DEFAULT '',
    modified_at INTEGER NOT NULL DEFAULT 0,
    duration REAL NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    codec TEXT NOT NULL DEFAULT '',
    bitrate INTEGER NOT NULL DEFAULT 0,
    frame_rate REAL NOT NULL DEFAULT 0,
    display_aspect_ratio TEXT NOT NULL DEFAULT '',
    is_hdr INTEGER NOT NULL DEFAULT 0,
    audio_codec TEXT NOT NULL DEFAULT '',
    audio_channels INTEGER NOT NULL DEFAULT 0,
    audio_sample_rate INTEGER NOT NULL DEFAULT 0,
    thumbnail_uri TEXT,
    added_at INTEGER NOT NULL,
    last_played_at INTEGER,
    play_count INTEGER NOT NULL DEFAULT 0,
    resume_position REAL NOT NULL DEFAULT 0,
    is_favorite INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS subtitles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_uri TEXT NOT NULL,
    uri TEXT NOT NULL,
    name TEXT NOT NULL,
    extension TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'Unknown',
    FOREIGN KEY (video_uri) REFERENCES videos(uri) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_videos (
    playlist_id TEXT NOT NULL,
    video_uri TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, video_uri),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (video_uri) REFERENCES videos(uri) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_videos_added_at ON videos(added_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_videos_last_played_at ON videos(last_played_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_videos_is_favorite ON videos(is_favorite)`,
  `CREATE INDEX IF NOT EXISTS idx_subtitles_video_uri ON subtitles(video_uri)`,
  `CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id)`,
];
