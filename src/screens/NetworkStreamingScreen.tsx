import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, FlatList, TextInput, ActivityIndicator, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';
import { usePlayer } from '../player';
import { InternetArchiveService, CATEGORIES, type IAItem } from '../services/InternetArchiveService';
import type { LibraryVideo } from '../library/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MARGIN = 6;
const COLS = 2;
const CARD_W = (SCREEN_W - 16 * 2 - CARD_MARGIN * (COLS - 1)) / COLS;

type CategoryId = (typeof CATEGORIES)[number]['id'];

function formatDownloads(n: number): string {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export function NetworkStreamingScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const router = useRouter();
  const { playVideo } = usePlayer();

  const [activeCategory, setActiveCategory] = useState<CategoryId>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<IAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<IAItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const activeCategoryQuery = CATEGORIES.find((c) => c.id === activeCategory)?.query || '';

  const fetchItems = useCallback(async (query: string, pg: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const result = await InternetArchiveService.search(query, pg);
      if (append) {
        setItems((prev) => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }
      setTotal(result.total);
      setPage(pg);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await InternetArchiveService.search(activeCategoryQuery, 1);
        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
          setPage(1);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCategoryQuery]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) {
      fetchItems(activeCategoryQuery);
      return;
    }
    fetchItems(q);
  }, [searchQuery, activeCategoryQuery, fetchItems]);

  const handleLoadMore = useCallback(() => {
    if (loading || items.length >= total) return;
    const q = searchQuery.trim() || activeCategoryQuery;
    fetchItems(q, page + 1, true);
  }, [loading, items.length, total, searchQuery, activeCategoryQuery, fetchItems, page]);

  const handleSelectItem = useCallback(async (item: IAItem) => {
    setSelectedItem(item);
    setDetailLoading(true);
    setVideoUrl(null);
    try {
      const details = await InternetArchiveService.getDetails(item.identifier);
      setVideoUrl(details.videoUrl);
    } catch {
      // handle error
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!selectedItem || !videoUrl) return;

    const video: LibraryVideo = {
      id: selectedItem.identifier,
      file: {
        uri: videoUrl,
        path: videoUrl,
        name: `${selectedItem.title}.mp4`,
        size: 0,
        extension: '.mp4',
        modifiedAt: Date.now(),
      },
      metadata: {
        duration: 0,
        width: 0,
        height: 0,
        codec: 'h264',
        bitrate: 0,
        frameRate: 0,
        displayAspectRatio: '',
        isHDR: false,
        audioCodec: 'aac',
        audioChannels: 2,
        audioSampleRate: 44100,
      },
      subtitles: [],
      thumbnailUri: selectedItem.thumb,
      addedAt: Date.now(),
      lastPlayedAt: null,
      playCount: 0,
      resumePosition: 0,
      isFavorite: false,
    };

    playVideo(video);
    setSelectedItem(null);
    router.push('/player');
  }, [selectedItem, videoUrl, playVideo, router]);

  const renderItem = useCallback(({ item }: { item: IAItem }) => (
    <Pressable
      onPress={() => handleSelectItem(item)}
      style={{ width: CARD_W, marginBottom: spacing.md }}
    >
      <View
        style={{
          width: CARD_W,
          height: CARD_W * 1.4,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceVariant,
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: item.thumb }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: spacing.xs,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}>
          <Text style={{ color: '#fff', fontSize: 10 }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ color: '#aaa', fontSize: 9 }}>
            {item.year || item.date?.slice(0, 4) || ''}  {formatDownloads(item.downloads)} downloads
          </Text>
        </View>
      </View>
    </Pressable>
  ), [colors, spacing, borderRadius, handleSelectItem]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{
          color: colors.text, fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold, marginLeft: spacing.md, flex: 1,
        }}>
          Internet Archive
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 10 }}>
          {total > 0 ? `${total} items` : ''}
        </Text>
      </View>

      {/* Search bar */}
      <View style={{
        flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.sm,
        gap: spacing.sm,
      }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search Archive.org..."
          placeholderTextColor={colors.textTertiary}
          style={{
            flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text,
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.full, fontSize: typography.sizes.sm,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={handleSearch}
          style={{
            backgroundColor: colors.primary, paddingHorizontal: spacing.md,
            borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.background, fontSize: 16 }}>🔍</Text>
        </Pressable>
      </View>

      {/* Category chips */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item: cat }) => (
            <Pressable
              onPress={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
              style={{
                paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                backgroundColor: activeCategory === cat.id ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Text style={{
                color: activeCategory === cat.id ? colors.background : colors.text,
                fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold,
              }}>
                {cat.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Content */}
      {loading && items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.identifier}
          numColumns={COLS}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: CARD_MARGIN }}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? (
            <View style={{ padding: spacing.lg }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🌐</Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>
                No results found
              </Text>
            </View>
          }
        />
      )}

      {/* Detail modal */}
      {selectedItem && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3, shadowRadius: 12, elevation: 16,
        }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Image
              source={{ uri: selectedItem.thumb }}
              style={{ width: 80, height: 110, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: typography.weights.bold, fontSize: typography.sizes.md }} numberOfLines={2}>
                {selectedItem.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing.xs }}>
                {selectedItem.creator}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>
                {selectedItem.year || selectedItem.date?.slice(0, 4) || ''}  ·  {formatDownloads(selectedItem.downloads)} downloads
              </Text>
            </View>
          </View>

          {detailLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : videoUrl ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Pressable
                onPress={handlePlay}
                style={{
                  flex: 1, backgroundColor: colors.primary,
                  paddingVertical: spacing.sm, borderRadius: borderRadius.full,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs,
                }}
              >
                <Text style={{ color: colors.background, fontSize: 14 }}>▶</Text>
                <Text style={{ color: colors.background, fontWeight: typography.weights.semibold }}>
                  Stream
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedItem(null)}
                style={{
                  paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: colors.error, fontSize: typography.sizes.xs, marginTop: spacing.md, textAlign: 'center' }}>
              No playable video found for this item
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
