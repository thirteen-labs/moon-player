import { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, useWindowDimensions, Modal, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary, usePlaylists } from '../library';
import { useNavigation } from '../navigation';
import { useSettings } from '../storage';
import { MovieCard } from '../components/MovieCard';
import { BottomTabBar } from '../components/BottomTabBar';
import { formatDuration } from '../utils/format';

type Category = 'all' | 'movies' | 'tvshows' | 'anime' | 'others' | 'favorites';
type SortMode = 'name' | 'date' | 'duration';
type ViewMode = 'grid' | 'collections';

import type { LibraryVideo } from '../library/types';

const COLLECTIONS = [
  { id: 'movies', name: 'Movies', icon: '🎬', filter: (v: LibraryVideo[]) => v },
  { id: 'tvshows', name: 'TV Shows', icon: '📺', filter: (v: LibraryVideo[]) => v.filter((x) => x.file.name.toLowerCase().includes('s0') || x.file.name.toLowerCase().includes('season')) },
  { id: 'anime', name: 'Anime', icon: '🎌', filter: (v: LibraryVideo[]) => v.filter((x) => x.file.name.toLowerCase().includes('anime') || x.file.name.toLowerCase().includes('sub')) },
  { id: 'others', name: 'Others', icon: '📁', filter: (v: LibraryVideo[]) => v.filter((x) => !x.file.name.toLowerCase().includes('s0') && !x.file.name.toLowerCase().includes('season') && !x.file.name.toLowerCase().includes('anime')) },
  { id: 'favorites', name: 'Favorites', icon: '⭐', filter: (v: LibraryVideo[]) => v.filter((x) => x.isFavorite) },
];

export function LibraryScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos, toggleFavorite, isScanning, scan } = useLibrary();
  const { playlists } = usePlaylists();
  const { settings } = useSettings();
  const { navigate } = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (settings.scanDirectories.length > 0 && !isScanning) {
      setRefreshing(true);
      await scan(settings.scanDirectories);
      setRefreshing(false);
    }
  }, [settings.scanDirectories, scan, isScanning]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [sortAsc] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenuVideo, setContextMenuVideo] = useState<LibraryVideo | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { createPlaylist, addVideoToPlaylist } = usePlaylists();

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'tvshows', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'others', label: 'Others' },
    { id: 'favorites', label: '⭐ Favorites' },
  ];

  const filteredVideos = useMemo(() => {
    const col = COLLECTIONS.find((c) => c.id === selectedCategory);
    const list = col ? col.filter([...videos]) : [...videos];

    switch (sortMode) {
      case 'name':
        list.sort((a, b) => a.file.name.localeCompare(b.file.name));
        break;
      case 'date':
        list.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case 'duration':
        list.sort((a, b) => (b.metadata?.duration ?? 0) - (a.metadata?.duration ?? 0));
        break;
    }
    if (sortAsc) list.reverse();
    return list;
  }, [videos, selectedCategory, sortMode, sortAsc]);

  const collectionItems = useMemo(() =>
    COLLECTIONS.filter((c) => c.id !== 'favorites').map((c) => ({
      ...c,
      count: c.filter([...videos]).length,
    })),
    [videos]
  );

  const toggleSort = () => {
    const modes: SortMode[] = ['date', 'name', 'duration'];
    setSortMode(modes[(modes.indexOf(sortMode) + 1) % modes.length]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const gridColumns = 3;
  const cardWidth = (screenWidth - spacing.md * 2 - spacing.sm * (gridColumns - 1)) / gridColumns;

  const handleContextMenu = useCallback((video: LibraryVideo | null) => {
    if (batchMode) return;
    setContextMenuVideo(video);
  }, [batchMode]);

  const renderItem = (item: LibraryVideo) => (
    <View style={{ width: cardWidth }}>
      <Pressable
        onPress={() => batchMode ? toggleSelect(item.id) : navigate('videoInfo', { video: item })}
        onLongPress={() => {
          if (!batchMode) { setBatchMode(true); setSelectedIds(new Set([item.id])); }
        }}
      >
        {batchMode && (
          <View style={{
            position: 'absolute', top: 4, right: 4, zIndex: 20,
            width: 22, height: 22, borderRadius: 11, borderWidth: 2,
            borderColor: selectedIds.has(item.id) ? colors.primary : '#fff',
            backgroundColor: selectedIds.has(item.id) ? colors.primary : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {selectedIds.has(item.id) && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
          </View>
        )}
        <MovieCard
          title={item.file.name.replace(/\.[^/.]+$/, '')}
          year={new Date(item.file.modifiedAt).getFullYear()}
          duration={formatDuration(item.metadata?.duration ?? 0)}
          onPress={() => {
            if (!batchMode) navigate('videoInfo', { video: item });
          }}
          onPlayPress={() => !batchMode && navigate('player', { video: item })}
          onMenuPress={() => handleContextMenu(item)}
        />
      </Pressable>
    </View>
  );

  const renderCollectionsView = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.md }}>
      {collectionItems.map((col) => (
        <Pressable
          key={col.id}
          onPress={() => { setViewMode('grid'); setSelectedCategory(col.id as Category); }}
          style={{
            width: (screenWidth - spacing.md * 2 - spacing.md) / 2,
            padding: spacing.lg,
            borderRadius: borderRadius.xl,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>{col.icon}</Text>
          <Text style={{ color: colors.text, fontWeight: typography.weights.semibold, fontSize: typography.sizes.md }}>{col.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 4 }}>{col.count} videos</Text>
        </Pressable>
      ))}
      {playlists.map((pl) => (
        <Pressable
          key={pl.id}
          onPress={() => navigate('playlist', { playlistId: pl.id })}
          style={{
            width: (screenWidth - spacing.md * 2 - spacing.md) / 2,
            padding: spacing.lg,
            borderRadius: borderRadius.xl,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>📋</Text>
          <Text style={{ color: colors.text, fontWeight: typography.weights.semibold, fontSize: typography.sizes.md }}>{pl.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 4 }}>{pl.videoIds.length} videos</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>Library</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable hitSlop={8} onPress={() => setViewMode(viewMode === 'grid' ? 'collections' : 'grid')}>
              <Text style={{ color: colors.text, fontSize: 20 }}>{viewMode === 'grid' ? '⊞' : '⊟'}</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => navigate('search')}>
              <Text style={{ color: colors.text, fontSize: 20 }}>🔍</Text>
            </Pressable>
            <Pressable hitSlop={8}><Text style={{ color: colors.text, fontSize: 20 }}>⋮</Text></Pressable>
          </View>
        </View>

        {viewMode === 'grid' && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{
                      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                      backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? colors.background : colors.textSecondary,
                      fontSize: typography.sizes.sm,
                      fontWeight: isSelected ? typography.weights.semibold : typography.weights.medium,
                    }}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Pressable onPress={toggleSort} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.sm }}>
                <Text style={{ color: colors.text, fontSize: 11, marginRight: 4 }}>
                  {sortMode === 'date' ? 'Date' : sortMode === 'name' ? 'Name' : 'Length'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{sortAsc ? '▲' : '▼'}</Text>
              </Pressable>

              {batchMode ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable onPress={() => setShowPlaylistModal(true)} style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.sm }}>
                    <Text style={{ color: colors.background, fontSize: 11, fontWeight: '600' }}>Add to</Text>
                  </Pressable>
                  <Pressable onPress={() => { setBatchMode(false); setSelectedIds(new Set()); }} style={{ backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.sm }}>
                    <Text style={{ color: colors.text, fontSize: 11 }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setShowFilterSheet(!showFilterSheet)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.sm }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 4 }}>Filter</Text>
                  <Text style={{ color: colors.text, fontSize: 11 }}>⛃</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      {isScanning && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, backgroundColor: colors.primaryContainer }}>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>Scanning library...</Text>
        </View>
      )}

      {viewMode === 'collections' ? renderCollectionsView() : (
        filteredVideos.length > 0 ? (
          <FlatList
            data={filteredVideos}
            keyExtractor={(item) => item.id}
            numColumns={gridColumns}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }}
            renderItem={({ item }) => renderItem(item)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          />
        ) : (
          !isScanning && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.lg, textAlign: 'center' }}>
                No videos found{'\n'}
                <Text style={{ fontSize: typography.sizes.sm, color: colors.textTertiary }}>
                  Pull down to scan or add scan directories in Settings
                </Text>
              </Text>
            </View>
          )
        )
      )}

      {/* Context Menu Modal */}
      <Modal visible={!!contextMenuVideo} transparent animationType="fade" onRequestClose={() => setContextMenuVideo(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setContextMenuVideo(null)}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginBottom: spacing.md }}>
              {contextMenuVideo?.file?.name?.replace(/\.[^/.]+$/, '') || ''}
            </Text>
            {[
              { icon: '▶', label: 'Play', action: () => { navigate('player', { video: contextMenuVideo }); setContextMenuVideo(null); } },
              { icon: '⭐', label: contextMenuVideo?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', action: () => { if (contextMenuVideo) toggleFavorite(contextMenuVideo.file?.uri || contextMenuVideo.id); setContextMenuVideo(null); } },
              { icon: '📋', label: 'Add to Playlist', action: () => { setContextMenuVideo(contextMenuVideo); setShowPlaylistModal(true); } },
              { icon: '📄', label: 'Video Info', action: () => { navigate('videoInfo', { video: contextMenuVideo }); setContextMenuVideo(null); } },
            ].map((item) => (
              <Pressable key={item.label} onPress={() => item.action()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, marginRight: spacing.md }}>{item.icon}</Text>
                <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setContextMenuVideo(null)} style={{ alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Add to Playlist Modal */}
      <Modal visible={showPlaylistModal} transparent animationType="fade" onRequestClose={() => setShowPlaylistModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowPlaylistModal(false)}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '60%' }}>
            <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginBottom: spacing.md }}>Add to Playlist</Text>
            {playlists.length === 0 && (
              <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>No playlists yet. Create one below.</Text>
            )}
            {playlists.map((pl) => (
              <Pressable key={pl.id} onPress={() => {
                const items = batchMode ? Array.from(selectedIds) : [contextMenuVideo?.file?.uri || contextMenuVideo?.id].filter(Boolean) as string[];
                items.forEach((uri) => addVideoToPlaylist(pl.id, uri));
                setShowPlaylistModal(false);
                setContextMenuVideo(null);
              }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, marginRight: spacing.md }}>📋</Text>
                <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>{pl.name}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginLeft: spacing.sm }}>({pl.videoIds.length})</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowNewPlaylistInput(true)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
              <Text style={{ fontSize: 18, marginRight: spacing.md }}>➕</Text>
              <Text style={{ color: colors.primary, fontSize: typography.sizes.md, fontWeight: '600' }}>New Playlist</Text>
            </Pressable>
            <Pressable onPress={() => setShowPlaylistModal(false)} style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* New Playlist Input Modal */}
      <Modal visible={showNewPlaylistInput} transparent animationType="fade" onRequestClose={() => setShowNewPlaylistInput(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, width: '80%' }}>
            <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginBottom: spacing.md }}>New Playlist</Text>
            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Playlist name"
              placeholderTextColor={colors.textTertiary}
              style={{ backgroundColor: colors.surfaceVariant, color: colors.text, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.sizes.md, marginBottom: spacing.md }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md }}>
              <Pressable onPress={() => { setShowNewPlaylistInput(false); setNewPlaylistName(''); }} style={{ padding: spacing.sm }}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={async () => {
                if (newPlaylistName.trim()) {
                  const pl = await createPlaylist(newPlaylistName.trim());
                  if (contextMenuVideo || batchMode) {
                    const items = batchMode ? Array.from(selectedIds) : [contextMenuVideo?.file?.uri || contextMenuVideo?.id].filter(Boolean) as string[];
                    items.forEach((uri) => addVideoToPlaylist(pl.id, uri));
                  }
                  setShowNewPlaylistInput(false);
                  setNewPlaylistName('');
                  setShowPlaylistModal(false);
                  setContextMenuVideo(null);
                }
              }} style={{ padding: spacing.sm }}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomTabBar activeTab="library" onTabPress={navigate} />
    </View>
  );
}
