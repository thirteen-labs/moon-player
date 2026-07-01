import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, FlatList } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary } from '../library';
import { useNavigation } from '../navigation';
import { useSettings } from '../storage';
import { EmptyState } from '../components/EmptyState';
import { BottomTabBar } from '../components/BottomTabBar';
import { formatDuration } from '../utils/format';

type SearchFilter = 'all' | 'movies' | 'tvshows' | 'anime' | 'folders';

export function SearchScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos } = useLibrary();
  const { navigate } = useNavigation();

  const { settings, updateSettings } = useSettings();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [, setShowRecent] = useState(false);

  const recentSearches = useMemo(() => settings.recentSearches || [], [settings.recentSearches]);

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    updateSettings({ recentSearches: [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 10) });
  }, [recentSearches, updateSettings]);

  const clearRecentSearches = useCallback(() => {
    updateSettings({ recentSearches: [] });
  }, [updateSettings]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    addRecentSearch(q);
    setShowRecent(false);
  }, [addRecentSearch]);

  const filterChips: { id: SearchFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'tvshows', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'folders', label: 'Folders' },
  ];

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    let filtered = videos.filter((v) =>
      v.file.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filter === 'tvshows') {
      filtered = filtered.filter((v) => v.file.name.toLowerCase().includes('s0') || v.file.name.toLowerCase().includes('season'));
    } else if (filter === 'anime') {
      filtered = filtered.filter((v) => v.file.name.toLowerCase().includes('anime'));
    }

    return filtered;
  }, [videos, query, filter]);

  const resultsToShow = query.trim() ? searchResults.map(v => ({
    id: v.id,
    title: `${v.file.name.replace(/\.[^/.]+$/, '')} (${new Date(v.file.modifiedAt).getFullYear()})`,
    length: formatDuration(v.metadata?.duration ?? 0),
    size: `${(v.file.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
    resolution: v.metadata?.displayAspectRatio ? '1080p' : '720p',
    video: v,
  })) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Back button and Input box */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => navigate('home')} hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
          </Pressable>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
            }}
          >
            Search
          </Text>
        </View>

        {/* Input Field Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            height: 48,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: spacing.sm }}>🔍</Text>
          <TextInput
            placeholder="Search videos, folders..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={(v) => { setQuery(v); setShowRecent(true); }}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            style={{
              flex: 1,
              color: colors.text,
              fontSize: typography.sizes.md,
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Searches */}
        {!query.trim() && recentSearches.length > 0 && (
          <View style={{ marginBottom: spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>Recent</Text>
              <Pressable onPress={clearRecentSearches}>
                <Text style={{ color: colors.textTertiary, fontSize: 10 }}>Clear</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {recentSearches.map((s: string) => (
                  <Pressable key={s} onPress={() => handleSearch(s)} style={{
                    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.surfaceVariant,
                  }}>
                    <Text style={{ color: colors.text, fontSize: typography.sizes.xs }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Filter chips carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {filterChips.map((chip) => {
              const isActive = filter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setFilter(chip.id)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: borderRadius.full,
                    backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? colors.background : colors.textSecondary,
                      fontSize: typography.sizes.xs,
                      fontWeight: isActive ? typography.weights.semibold : typography.weights.medium,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Results Header */}
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        }}
      >
        Results ({resultsToShow.length})
      </Text>

      {/* Results List */}
      {resultsToShow.length === 0 && query.trim() && (
        <EmptyState
          icon="🔍"
          title="No results found"
          message="Try a different search term or filter."
        />
      )}
      {resultsToShow.length === 0 && !query.trim() && (
        <EmptyState
          icon="🔍"
          title="Search your library"
          message="Type in the search bar above to find videos in your library."
        />
      )}
      <FlatList
        data={resultsToShow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.video ? navigate('videoInfo', { video: item.video }) : undefined}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {/* Thumbnail Placeholder */}
            <View
              style={{
                width: 90,
                height: 56,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.surfaceVariant,
                marginRight: spacing.md,
              }}
            />

            {/* Info details */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.semibold,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: typography.sizes.xs,
                  marginTop: 4,
                }}
              >
                {item.length} • {item.size} • {item.resolution}
              </Text>
            </View>

            {/* Menu icon */}
            <Pressable hitSlop={8} style={{ padding: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>⋮</Text>
            </Pressable>
          </Pressable>
        )}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="search" onTabPress={navigate} />
    </View>
  );
}
