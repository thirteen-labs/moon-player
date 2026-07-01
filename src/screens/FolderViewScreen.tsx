import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme';
import { useNavigation } from '../navigation';
import { MovieCard } from '../components/MovieCard';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import type { LibraryVideo } from '../library/types';
import type { FolderGroup } from '../utils/folders';

export function FolderViewScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { navigate, params } = useNavigation();
  const { width: screenWidth } = useWindowDimensions();

  const folder = params?.folder as FolderGroup | undefined;
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
          <Pressable onPress={() => navigate('folders')} hitSlop={8}>
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
          <Pressable hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 20 }}>⊞</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => navigate('search')}>
            <Text style={{ color: colors.text, fontSize: 20 }}>🔍</Text>
          </Pressable>
          <Pressable hitSlop={8}>
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
          onPress={() => setSortMode(sortMode === 'name' ? 'date' : 'name')}
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

      {/* Videos Grid */}
      {videosToShow.length === 0 && (
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
              onPress={() => item.video ? navigate('videoInfo', { video: item.video }) : {}}
              onPlayPress={() => item.video ? navigate('player', { video: item.video }) : {}}
            />
          </View>
        )}
      />
    </View>
  );
}
