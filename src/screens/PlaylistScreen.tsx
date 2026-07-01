import { useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useTheme } from '../theme';
import { useNavigation } from '../navigation';
import { usePlaylists, useLibrary } from '../library';
import type { LibraryVideo, Playlist } from '../library/types';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';

export function PlaylistScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { navigate, params } = useNavigation();
  const { playlists } = usePlaylists();
  const { videos, getVideo } = useLibrary();

  const playlist = (params?.playlist as Playlist | undefined) || (playlists.length > 0 ? playlists[0] : null);

  const playlistVideos = useMemo(() => {
    if (!playlist) return [];
    const videoMap = new Map(videos.map((v) => [v.id, v]));
    return (playlist.videoIds || [])
      .map((id: string) => videoMap.get(id) || getVideo(id))
      .filter(Boolean);
  }, [playlist, videos, getVideo]);

  if (!playlist) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Pressable onPress={() => navigate('home')} hitSlop={8}>
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
          <Pressable onPress={() => navigate('home')} hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>{playlist.name}</Text>
        </View>
        <Pressable hitSlop={8}>
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
                  navigate('player', { video: playlistVideos[0], queue: playlistVideos });
                }
              }}
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
              onPress={() => navigate('videoInfo', { video: item })}
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
