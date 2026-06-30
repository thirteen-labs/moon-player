import { useMemo } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary } from '../library';
import { useNavigation } from '../navigation';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard';
import { QuickAccessButton } from '../components/QuickAccessButton';
import { MovieCard } from '../components/MovieCard';
import { FolderCard } from '../components/FolderCard';
import { SectionHeader } from '../components/SectionHeader';
import { BottomTabBar } from '../components/BottomTabBar';
import { formatDuration } from '../utils/format';
import { groupVideosByFolder } from '../utils/folders';

export function HomeScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos, isScanning } = useLibrary();
  const { navigate } = useNavigation();

  const continueWatching = useMemo(() => {
    return videos
      .filter((v) => v.resumePosition > 0 && v.lastPlayedAt !== null)
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
      .slice(0, 10);
  }, [videos]);

  const recentlyAdded = useMemo(() => {
    return [...videos]
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, 20);
  }, [videos]);

  const folders = useMemo(() => {
    return groupVideosByFolder(videos);
  }, [videos]);

  const favoriteCount = useMemo(() => {
    return videos.filter((v) => v.isFavorite).length;
  }, [videos]);

  const recentCount = videos.length;
  const folderCount = folders.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isScanning && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.primaryContainer,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 50,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>
            Scanning library...
          </Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.xl,
            paddingBottom: spacing.md,
          }}
        >
          <Pressable hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 24 }}>☰</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.sizes.xl,
                fontWeight: typography.weights.bold,
                letterSpacing: 2,
              }}
            >
              ATLAS
            </Text>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: typography.sizes.xs,
                marginLeft: spacing.sm,
              }}
            >
              Offline Video Player
            </Text>
          </View>

          <Pressable hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 22 }}>🔍</Text>
          </Pressable>
        </View>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <>
            <SectionHeader title="Continue Watching" showViewAll={false} />
            <FlatList
              data={continueWatching}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const duration = item.metadata?.duration ?? 0;
                const progress = duration > 0 ? item.resumePosition / duration : 0;
                return (
                  <ContinueWatchingCard
                    title={item.file.name.replace(/\.[^/.]+$/, '')}
                    year={new Date(item.file.modifiedAt).getFullYear()}
                    progress={progress}
                    currentTime={formatDuration(item.resumePosition)}
                    totalTime={formatDuration(duration)}
                  />
                );
              }}
            />
          </>
        )}

        {/* Quick Access Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingHorizontal: spacing.md,
            marginTop: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <QuickAccessButton icon="🕐" label="Recent" count={recentCount} />
          <QuickAccessButton icon="❤️" label="Favorites" count={favoriteCount} />
          <QuickAccessButton icon="📁" label="Folders" count={folderCount} />
          <QuickAccessButton icon="📋" label="Playlists" count={0} />
          <QuickAccessButton icon="⬇️" label="Downloads" count={0} />
        </View>

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <>
            <SectionHeader title="Recently Added" />
            <FlatList
              data={recentlyAdded}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MovieCard
                  title={item.file.name.replace(/\.[^/.]+$/, '')}
                  year={new Date(item.file.modifiedAt).getFullYear()}
                  duration={formatDuration(item.metadata?.duration ?? 0)}
                />
              )}
            />
          </>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <SectionHeader title="Folders" />
            <FlatList
              data={folders}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FolderCard
                  name={item.name}
                  videoCount={item.videos.length}
                  icon="📁"
                />
              )}
            />
          </View>
        )}

        {/* Empty State */}
        {videos.length === 0 && !isScanning && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: spacing['3xl'],
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
              No videos yet
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.md,
                textAlign: 'center',
              }}
            >
              Tap the menu to add folders and start scanning
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="home" onTabPress={navigate} />
    </View>
  );
}
