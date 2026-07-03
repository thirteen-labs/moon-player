import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme';
import { useRouter } from 'expo-router';
import { useLibrary } from '../library';
import { MovieCard } from '../components/MovieCard';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';
import { GridSkeleton } from '../components/SkeletonLoader';
import type { LibraryVideo } from '../library/types';
import { groupVideosByFolder } from '../utils/folders';

export function FolderViewScreen({ routeFolderPath }: { routeFolderPath?: string }) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { videos } = useLibrary();
  const folders = useMemo(() => groupVideosByFolder(videos), [videos]);
  const loading = folders.length === 0 && videos.length > 0;
  const folder = useMemo(() => {
    if (routeFolderPath) return folders.find(f => f.path === routeFolderPath);
    return folders[0];
  }, [routeFolderPath, folders]);
  const folderName = folder ? folder.name : 'Movies';

  const [sortMode, setSortMode] = useState<'name' | 'date'>('name');

  const videosInFolder = useMemo(() => {
    if (folder?.videos) {
      return folder.videos;
    }
    return [];
  }, [folder]);

  const videosToShow: { id: string; title: string; year: number; duration: string; video?: LibraryVideo }[] =
    videosInFolder.length > 0
      ? videosInFolder.map((v: LibraryVideo) => ({
          id: v.id,
          title: v.file.name.replace(/\.[^/.]+$/, ''),
          year: new Date(v.file.modifiedAt).getFullYear(),
          duration: formatDuration(v.metadata?.duration ?? 0),
          video: v,
        })) : [];

  const gridColumns = 3;
  const cardWidth = (screenWidth - spacing.md * 2 - spacing.sm * (gridColumns - 1)) / gridColumns;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => { triggerHaptic('light'); router.push('/folder'); }} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
          </Pressable>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
            }}
          >
            {folderName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable hitSlop={8} accessibilityLabel="Add to folder" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 20 }}>⊞</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => router.push('/search')} accessibilityLabel="Search" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 20 }}>🔍</Text>
          </Pressable>
          <Pressable hitSlop={8} accessibilityLabel="More options" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 20 }}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter and sorting rows */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <Pressable
          onPress={() => { triggerHaptic('light'); setSortMode(sortMode === 'name' ? 'date' : 'name'); }}
          accessibilityLabel={`Sort by ${sortMode === 'name' ? 'date' : 'name'}`}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceVariant,
            paddingHorizontal: spacing.sm,
            paddingVertical: 6,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 11, marginRight: 4 }}>
            Sort by: {sortMode === 'name' ? 'Name' : 'Date'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 10 }}>▼</Text>
        </Pressable>

        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceVariant,
            paddingHorizontal: spacing.sm,
            paddingVertical: 6,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 4 }}>Filter</Text>
          <Text style={{ color: colors.text, fontSize: 11 }}>⛃</Text>
        </Pressable>
      </View>

      {loading && <GridSkeleton columns={3} count={6} />}
      {!loading && videosToShow.length === 0 && (
        <EmptyState
          icon="🎬"
          title="This folder is empty"
          message="No videos found in this folder."
        />
      )}
      <FlatList
        data={videosToShow}
        keyExtractor={(item) => item.id}
        numColumns={gridColumns}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
        }}
        columnWrapperStyle={{
          justifyContent: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <MovieCard
              title={item.title}
              year={item.year || 2024}
              duration={item.duration}
              onPress={() => item.video ? router.push(`/video-info?id=${encodeURIComponent(item.video.id)}`) : {}}
              onPlayPress={() => item.video ? router.push(`/player?id=${encodeURIComponent(item.video.id)}`) : {}}
            />
          </View>
        )}
      />
    </View>
  );
}
