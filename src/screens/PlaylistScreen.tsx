import { useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useTheme } from '../theme';
import { useRouter } from 'expo-router';
import { usePlaylists, useLibrary } from '../library';
import type { LibraryVideo } from '../library/types';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';

export function PlaylistScreen({ routePlaylistId }: { routePlaylistId?: string }) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const router = useRouter();
  const { playlists } = usePlaylists();
  const { videos, getVideo } = useLibrary();

  const playlist = useMemo(() => {
    if (routePlaylistId) return playlists.find(p => p.id === routePlaylistId) || null;
    return playlists.length > 0 ? playlists[0] : null;
  }, [routePlaylistId, playlists]);

  const playlistVideos = useMemo(() => {
    if (!playlist) return [];
    const videoMap = new Map(videos.map((v) => [v.id, v]));
    return (playlist.videoIds || [])
      .map((id: string) => videoMap.get(id) || getVideo(id))
      .filter((v): v is LibraryVideo => v != null);
  }, [playlist, videos, getVideo]);

  if (!playlist) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Pressable onPress={() => { triggerHaptic('light'); router.push('/'); }} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
              <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
            </Pressable>
            <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>Playlist</Text>
          </View>
        </View>
        <EmptyState icon="📋" title="No playlist selected" message="Select a playlist from the Library screen to view its contents." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
<Pressable onPress={() => { triggerHaptic('light'); router.push('/'); }} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
              <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
            </Pressable>
            <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>{playlist.name}</Text>
        </View>
        <Pressable hitSlop={8} accessibilityLabel="Playlist options" accessibilityRole="button">
          <Text style={{ color: colors.text, fontSize: 22 }}>⋮</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', padding: spacing.md, marginHorizontal: spacing.md, backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.xl, marginBottom: spacing.lg, gap: spacing.md }}>
        <View style={{ width: 80, height: 80, borderRadius: borderRadius.lg, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36 }}>📋</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>{playlist.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: 2, marginBottom: spacing.sm }}>
            {playlistVideos.length} videos
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              onPress={() => {
                if (playlistVideos.length > 0) {
                  triggerHaptic('medium');
                  router.push(`/player?id=${encodeURIComponent(playlistVideos[0].id)}`);
                }
              }}
              accessibilityLabel="Play all videos in playlist"
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full }}
            >
              <Text style={{ color: colors.background, fontSize: 11, marginRight: 4 }}>▶</Text>
              <Text style={{ color: colors.background, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>Play All</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {playlistVideos.length === 0 ? (
        <EmptyState icon="🎬" title="Playlist is empty" message="Add videos to this playlist from the Library screen." />
      ) : (
        <FlatList
          data={playlistVideos}
          keyExtractor={(item: LibraryVideo) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          renderItem={({ item, index }: { item: LibraryVideo; index: number }) => (
            <Pressable
              onPress={() => { triggerHaptic('light'); router.push(`/video-info?id=${encodeURIComponent(item.id)}`); }}
              accessibilityLabel={`View details for ${item.file?.name?.replace(/\.[^/.]+$/, '') || 'video'}`}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md }}
            >
              <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, width: 20, textAlign: 'center' }}>
                {index + 1}
              </Text>
              <View style={{ width: 80, height: 50, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceVariant }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }} numberOfLines={1}>
                  {item.file?.name?.replace(/\.[^/.]+$/, '') || 'Unknown'}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginTop: 4 }}>
                  {formatDuration(item.metadata?.duration || 0)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
