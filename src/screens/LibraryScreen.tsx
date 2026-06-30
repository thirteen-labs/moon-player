import { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary } from '../library';
import { useNavigation } from '../navigation';
import { VideoGridCard } from '../components/VideoGridCard';
import { VideoListCard } from '../components/VideoListCard';
import { BottomTabBar } from '../components/BottomTabBar';
import { formatDuration } from '../utils/format';

type LayoutMode = 'grid' | 'list';
type SortMode = 'name' | 'date' | 'duration';

export function LibraryScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos } = useLibrary();
  const { navigate } = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const sortedVideos = useMemo(() => {
    const sorted = [...videos];
    switch (sortMode) {
      case 'name':
        sorted.sort((a, b) => a.file.name.localeCompare(b.file.name));
        break;
      case 'date':
        sorted.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case 'duration':
        sorted.sort((a, b) => (b.metadata?.duration ?? 0) - (a.metadata?.duration ?? 0));
        break;
    }
    if (sortMode !== 'date' && !sortAsc) {
      sorted.reverse();
    }
    return sorted;
  }, [videos, sortMode, sortAsc]);

  const toggleSort = (mode: SortMode) => {
    if (sortMode === mode) {
      setSortAsc(!sortAsc);
    } else {
      setSortMode(mode);
      setSortAsc(true);
    }
  };

  const gridColumns = 3;
  const gridItemWidth = (screenWidth - spacing.md * 2 - spacing.xs * gridColumns * 2) / gridColumns;

  const renderGridItem = ({ item }: { item: typeof sortedVideos[0] }) => (
    <View style={{ width: gridItemWidth }}>
      <VideoGridCard
        title={item.file.name.replace(/\.[^/.]+$/, '')}
        duration={formatDuration(item.metadata?.duration ?? 0)}
      />
    </View>
  );

  const renderListItem = ({ item }: { item: typeof sortedVideos[0] }) => (
    <VideoListCard
      title={item.file.name.replace(/\.[^/.]+$/, '')}
      duration={formatDuration(item.metadata?.duration ?? 0)}
      fileSize={formatFileSize(item.file.size)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
            }}
          >
            Library
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizes.sm,
            }}
          >
            {sortedVideos.length} videos
          </Text>
        </View>

        {/* Sort & Layout Controls */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Sort Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['name', 'date', 'duration'] as SortMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => toggleSort(mode)}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.sm,
                  backgroundColor: sortMode === mode ? colors.primaryContainer : colors.surfaceVariant,
                }}
              >
                <Text
                  style={{
                    color: sortMode === mode ? colors.primary : colors.textSecondary,
                    fontSize: typography.sizes.xs,
                    fontWeight: sortMode === mode ? typography.weights.semibold : typography.weights.regular,
                    textTransform: 'capitalize',
                  }}
                >
                  {mode === 'duration' ? 'Length' : mode}
                  {sortMode === mode ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Layout Toggle */}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Pressable
              onPress={() => setLayoutMode('grid')}
              style={{
                width: 32,
                height: 32,
                borderRadius: borderRadius.sm,
                backgroundColor: layoutMode === 'grid' ? colors.primaryContainer : colors.surfaceVariant,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: layoutMode === 'grid' ? colors.primary : colors.textSecondary,
                }}
              >
                ⊞
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLayoutMode('list')}
              style={{
                width: 32,
                height: 32,
                borderRadius: borderRadius.sm,
                backgroundColor: layoutMode === 'list' ? colors.primaryContainer : colors.surfaceVariant,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: layoutMode === 'list' ? colors.primary : colors.textSecondary,
                }}
              >
                ☰
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Video List */}
      {sortedVideos.length > 0 ? (
        <FlatList
          data={sortedVideos}
          keyExtractor={(item) => item.id}
          renderItem={layoutMode === 'grid' ? renderGridItem : renderListItem}
          numColumns={layoutMode === 'grid' ? gridColumns : 1}
          key={layoutMode}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📂</Text>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            No videos found
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizes.md,
              textAlign: 'center',
            }}
          >
            Add folders from the home screen to see videos here
          </Text>
        </View>
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="library" onTabPress={navigate} />
    </View>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
