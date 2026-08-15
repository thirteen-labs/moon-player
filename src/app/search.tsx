import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useLibrary } from '@/library';
import { useSettings } from '@/storage';
import { usePlayer } from '@/player';
import { formatDuration } from '@/utils/format';
import { triggerHaptic } from '@/utils/haptics';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import type { LibraryVideo } from '@/library/types';

type SearchFilter = 'all' | 'movies' | 'tvshows' | 'anime' | 'folders';

const FILTER_CHIPS: { id: SearchFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies' },
  { id: 'tvshows', label: 'TV Shows' },
  { id: 'anime', label: 'Anime' },
  { id: 'folders', label: 'Folders' },
];

function titleOf(video: LibraryVideo): string {
  return video.file.name.replace(/\.[^/.]+$/, '');
}

export default function SearchScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const insets = useSafeAreaInsets();
  const { videos } = useLibrary();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { playVideo } = usePlayer();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');

  const recentSearches = useMemo(() => settings.recentSearches ?? [], [settings.recentSearches]);

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    updateSettings({ recentSearches: [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 10) });
  }, [recentSearches, updateSettings]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    let filtered = videos.filter((v) => v.file.name.toLowerCase().includes(q));
    if (filter === 'tvshows') {
      filtered = filtered.filter((v) => /s0\d|season/i.test(v.file.name));
    } else if (filter === 'anime') {
      filtered = filtered.filter((v) => v.file.name.toLowerCase().includes('anime'));
    }
    return filtered;
  }, [videos, query, filter]);

  const openVideo = (video: LibraryVideo) => {
    playVideo(video, videos);
    router.push('/player');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md }}>
        <Pressable hitSlop={10} onPress={() => { triggerHaptic('light'); router.back(); }} accessibilityLabel="Go back">
          <Icon name="back" size={24} />
        </Pressable>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceVariant,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            height: 44,
          }}
        >
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search videos, folders..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => addRecentSearch(query)}
            returnKeyType="search"
            autoFocus
            style={{ flex: 1, color: colors.text, fontSize: typography.sizes.md, marginLeft: spacing.sm }}
          />
          {query.length > 0 ? (
            <Pressable hitSlop={10} onPress={() => setQuery('')}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!query.trim() && recentSearches.length > 0 ? (
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold }}>Recent</Text>
            <Pressable onPress={() => updateSettings({ recentSearches: [] })}>
              <Text style={{ color: colors.textTertiary, fontSize: 10 }}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {recentSearches.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => { triggerHaptic('light'); setQuery(s); addRecentSearch(s); }}
                  style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceVariant }}
                >
                  <Text style={{ color: colors.text, fontSize: typography.sizes.xs }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => { triggerHaptic('light'); setFilter(chip.id); }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: borderRadius.full,
                  backgroundColor: active ? colors.primary : colors.surfaceVariant,
                }}
              >
                <Text
                  style={{
                    color: active ? colors.background : colors.textSecondary,
                    fontSize: typography.sizes.xs,
                    fontWeight: active ? typography.weights.semibold : typography.weights.medium,
                  }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
        Results ({results.length})
      </Text>

      {query.trim() && results.length === 0 ? (
        <EmptyState icon="🔍" title="No results found" message="Try a different search term or filter." />
      ) : null}
      {!query.trim() && results.length === 0 ? (
        <EmptyState icon="🔍" title="Search your library" message="Type in the search bar above to find videos." />
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openVideo(item)}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View
              style={{
                width: 90,
                height: 56,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.surfaceVariant,
                marginRight: spacing.md,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }} numberOfLines={1}>
                {titleOf(item)}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginTop: 4 }}>
                {formatDuration(item.metadata?.duration ?? 0)}
              </Text>
            </View>
            <Icon name="more" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      />
    </View>
  );
}
