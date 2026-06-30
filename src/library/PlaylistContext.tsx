import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StorageService } from '../storage/StorageService';
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
      const data = await StorageService.loadPlaylists();
      setPlaylists(data);
    } catch {
      // Handle loading error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
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

    setPlaylists((prev) => {
      const updated = [...prev, newPlaylist];
      StorageService.savePlaylists(updated);
      return updated;
    });

    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback(async (id: string): Promise<void> => {
    setPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const addVideoToPlaylist = useCallback(async (playlistId: string, videoUri: string): Promise<void> => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.videoIds.includes(videoUri)) return p;
        return {
          ...p,
          videoIds: [...p.videoIds, videoUri],
          updatedAt: Date.now(),
        };
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const removeVideoFromPlaylist = useCallback(async (playlistId: string, videoUri: string): Promise<void> => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          videoIds: p.videoIds.filter((id) => id !== videoUri),
          updatedAt: Date.now(),
        };
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

  const renamePlaylist = useCallback(async (playlistId: string, newName: string): Promise<void> => {
    setPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          name: newName.trim(),
          updatedAt: Date.now(),
        };
      });
      StorageService.savePlaylists(updated);
      return updated;
    });
  }, []);

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
