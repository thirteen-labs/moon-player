import { useMemo } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary } from '../library';
import { useNavigation } from '../navigation';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard';
import { MovieCard } from '../components/MovieCard';
import { SectionHeader } from '../components/SectionHeader';
import { BottomTabBar } from '../components/BottomTabBar';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import { groupVideosByFolder } from '../utils/folders';

function getGreeting(): string { // eslint-disable-line @typescript-eslint/no-unused-vars
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export function HomeScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos, isScanning } = useLibrary();
  const { navigate } = useNavigation();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const continueWatching = useMemo(() => {
    return videos
      .filter((v) => v.resumePosition > 0 && v.lastPlayedAt !== null)
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0));
  }, [videos]);

  const recentlyAdded = useMemo(() => {
    return [...videos].sort((a, b) => b.addedAt - a.addedAt);
  }, [videos]);

  const folders = useMemo(() => {
    return groupVideosByFolder(videos);
  }, [videos]);

  const headerVideo = useMemo(() => {
    if (continueWatching.length > 0) {
      return continueWatching[0];
    }
    if (videos.length > 0) {
      return videos[0];
    }
    return null;
  }, [continueWatching, videos]);

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
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
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
            paddingBottom: spacing.sm,
          }}
        >
          <Pressable hitSlop={8} accessibilityLabel="Menu" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 24 }}>☰</Text>
          </Pressable>

          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.medium,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.sizes.xl,
                fontWeight: typography.weights.bold,
                letterSpacing: 1,
                marginTop: 2,
              }}
            >
              Aura
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable hitSlop={8} accessibilityLabel="Open menu" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 24 }}>☰</Text>
          </Pressable>
            <Pressable hitSlop={8} onPress={() => navigate('search')}>
              <Text style={{ color: colors.text, fontSize: 22 }}>🔍</Text>
            </Pressable>
          </View>
        </View>

        {/* Highlight / Continue Watching Card */}
        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
              }}
            >
              Continue Watching
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 18, marginLeft: spacing.xs }}>›</Text>
          </View>

          {headerVideo ? (
            (() => {
              const d = headerVideo.metadata?.duration ?? 0;
              const progress = d > 0 ? headerVideo.resumePosition / d : 0;
              return (
                <ContinueWatchingCard
                  title={headerVideo.file.name.replace(/\.[^/.]+$/, '')}
                  year={new Date(headerVideo.file.modifiedAt).getFullYear() || 2024}
                  progress={progress}
                  currentTime={formatDuration(headerVideo.resumePosition || 0)}
                  totalTime={formatDuration(d || 0)}
                  onPlayPress={() => navigate('player', { video: headerVideo })}
                  onPress={() => navigate('videoInfo', { video: headerVideo })}
                />
              );
            })()
          ) : (
            <EmptyState
              icon="🎬"
              title="No videos yet"
              message="Add videos to your library to start watching. Tap the Library tab to scan your device."
            />
          )}
        </View>

        {/* Recently Added Section */}
        <View style={{ marginTop: spacing.md }}>
          <SectionHeader title="Recently Added" onViewAllPress={() => navigate('library')} />
          {recentlyAdded.length > 0 ? (
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
                  onPress={() => navigate('videoInfo', { video: item })}
                  onPlayPress={() => navigate('player', { video: item })}
                />
              )}
            />
          ) : null}
        </View>

        {/* Collections / Categories Section */}
        <View style={{ marginTop: spacing.lg }}>
          <SectionHeader title="Collections" onViewAllPress={() => navigate('folders')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
          >
            {/* Category Cards matching Mockup */}
            <Pressable
              onPress={() => navigate('library', { category: 'movies' })}
              style={{
                width: 140,
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🎬</Text>
              <Text style={{ color: colors.text, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm }}>
                Movies
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                {videos.length} videos
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigate('folders')}
              style={{
                width: 140,
                padding: spacing.md,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>📁</Text>
              <Text style={{ color: colors.text, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm }}>
                Folders
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                {folders.length || 12} folders
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="home" onTabPress={navigate} />
    </View>
  );
}
