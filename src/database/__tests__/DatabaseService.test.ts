import { runMigrations, getDatabase, closeDatabase } from '../DatabaseService';
import { VideoRepository } from '../VideoRepository';
import { PlaylistRepository } from '../PlaylistRepository';
import type { LibraryVideo, Playlist } from '../../library/types';

const mockVideo: LibraryVideo = {
  id: 'test-1',
  file: {
    uri: '/test/video.mp4',
    path: '/test/video.mp4',
    name: 'video.mp4',
    size: 1024000,
    extension: '.mp4',
    modifiedAt: Date.now(),
  },
  metadata: {
    duration: 120,
    width: 1920,
    height: 1080,
    codec: 'h264',
    bitrate: 5000000,
    frameRate: 24,
    displayAspectRatio: '16:9',
    isHDR: false,
    audioCodec: 'aac',
    audioChannels: 2,
    audioSampleRate: 48000,
  },
  subtitles: [],
  thumbnailUri: null,
  addedAt: Date.now(),
  lastPlayedAt: null,
  playCount: 0,
  resumePosition: 0,
  isFavorite: false,
};

describe('DatabaseService', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM playlist_videos');
    await db.execAsync('DELETE FROM subtitles');
    await db.execAsync('DELETE FROM videos');
    await db.execAsync('DELETE FROM playlists');
  });

  it('should run migrations and create tables', async () => {
    const db = await getDatabase();
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('videos');
    expect(tableNames).toContain('subtitles');
    expect(tableNames).toContain('playlists');
    expect(tableNames).toContain('playlist_videos');
    expect(tableNames).toContain('schema_version');
  });

  it('should insert and retrieve a video', async () => {
    await VideoRepository.insert(mockVideo);
    const retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(mockVideo.id);
    expect(retrieved!.file.name).toBe('video.mp4');
    expect(retrieved!.metadata!.codec).toBe('h264');
  });

  it('should update resume position', async () => {
    await VideoRepository.insert(mockVideo);
    await VideoRepository.updateResumePosition(mockVideo.file.uri, 60);
    const retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved!.resumePosition).toBe(60);
    expect(retrieved!.lastPlayedAt).not.toBeNull();
  });

  it('should mark video as played', async () => {
    await VideoRepository.insert(mockVideo);
    await VideoRepository.markPlayed(mockVideo.file.uri);
    await VideoRepository.markPlayed(mockVideo.file.uri);
    const retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved!.playCount).toBe(2);
  });

  it('should toggle favorite', async () => {
    await VideoRepository.insert(mockVideo);
    await VideoRepository.toggleFavorite(mockVideo.file.uri);
    let retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved!.isFavorite).toBe(true);
    await VideoRepository.toggleFavorite(mockVideo.file.uri);
    retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved!.isFavorite).toBe(false);
  });

  it('should find recent videos', async () => {
    await VideoRepository.insert(mockVideo);
    const recent = await VideoRepository.findRecent(5);
    expect(recent.length).toBe(1);
  });

  it('should insert and retrieve a playlist', async () => {
    const playlist: Playlist = {
      id: 'pl-1',
      name: 'Favorites',
      videoIds: ['test-1'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await VideoRepository.insert(mockVideo);
    await PlaylistRepository.insert(playlist);

    const retrieved = await PlaylistRepository.findById('pl-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('Favorites');
    expect(retrieved!.videoIds).toContain('test-1');
  });

  it('should delete a playlist', async () => {
    const playlist: Playlist = {
      id: 'pl-2',
      name: 'Temp',
      videoIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await PlaylistRepository.insert(playlist);
    await PlaylistRepository.delete('pl-2');

    const retrieved = await PlaylistRepository.findById('pl-2');
    expect(retrieved).toBeNull();
  });

  it('should update video thumbnail', async () => {
    await VideoRepository.insert(mockVideo);
    await VideoRepository.updateThumbnail(mockVideo.file.uri, '/thumbnails/video.jpg');
    const retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved!.thumbnailUri).toBe('/thumbnails/video.jpg');
  });

  it('should count videos', async () => {
    await VideoRepository.insert(mockVideo);
    const count = await VideoRepository.count();
    expect(count).toBe(1);
  });

  it('should delete a video and its subtitles', async () => {
    await VideoRepository.insert(mockVideo);
    await VideoRepository.delete(mockVideo.file.uri);
    const retrieved = await VideoRepository.findByUri(mockVideo.file.uri);
    expect(retrieved).toBeNull();
    const count = await VideoRepository.count();
    expect(count).toBe(0);
  });
});
