import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PlaylistRepository } from '../database';
import type { Playlist } from './types';

export interface PlaylistContextValue {
  playlists: Playlist[];
  isLoading: boolean;
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addVideoToPlaylist: (playlistId: string, videoUri: string) => Promise<void>;
  removeVideoFromPlaylist: (playlistId: string, videoUri: string) => Promise<void>;
  renamePlaylist: (playlistId: string, newName: string) => Promise<void>;
  loadPlaylists: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextValue>({
  playlists: [],
  isLoading: false,
  createPlaylist: async () => ({ id: '', name: '', videoIds: [], createdAt: 0, updatedAt: 0 }),
  deletePlaylist: async () => {},
  addVideoToPlaylist: async () => {},
  removeVideoFromPlaylist: async () => {},
  renamePlaylist: async () => {},
  loadPlaylists: async () => {},
});

export function usePlaylists() {
  return useContext(PlaylistContext);
}

interface PlaylistProviderProps {
  children: ReactNode;
}

export function PlaylistProvider({ children }: PlaylistProviderProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await PlaylistRepository.findAll();
      setPlaylists(data);
    } catch {
      // Handle loading error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadPlaylists]);

  const createPlaylist = useCallback(async (name: string): Promise<Playlist> => {
    const now = Date.now();
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      videoIds: [],
      createdAt: now,
      updatedAt: now,
    };

    await PlaylistRepository.insert(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback(async (id: string): Promise<void> => {
    await PlaylistRepository.delete(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addVideoToPlaylist = useCallback(async (playlistId: string, videoUri: string): Promise<void> => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.videoIds.includes(videoUri)) return;

    const updated: Playlist = {
      ...playlist,
      videoIds: [...playlist.videoIds, videoUri],
      updatedAt: Date.now(),
    };

    await PlaylistRepository.update(playlistId, { videoIds: updated.videoIds });
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  }, [playlists]);

  const removeVideoFromPlaylist = useCallback(async (playlistId: string, videoUri: string): Promise<void> => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated: Playlist = {
      ...playlist,
      videoIds: playlist.videoIds.filter((id) => id !== videoUri),
      updatedAt: Date.now(),
    };

    await PlaylistRepository.update(playlistId, { videoIds: updated.videoIds });
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  }, [playlists]);

  const renamePlaylist = useCallback(async (playlistId: string, newName: string): Promise<void> => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated: Playlist = { ...playlist, name: newName.trim(), updatedAt: Date.now() };
    await PlaylistRepository.update(playlistId, { name: updated.name });
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  }, [playlists]);

  const value = useMemo(
    () => ({
      playlists,
      isLoading,
      createPlaylist,
      deletePlaylist,
      addVideoToPlaylist,
      removeVideoFromPlaylist,
      renamePlaylist,
      loadPlaylists,
    }),
    [playlists, isLoading, createPlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist, renamePlaylist, loadPlaylists]
  );

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}
