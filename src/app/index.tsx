import { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useLibrary } from '@/library';
import { useSettings } from '@/storage';
import { usePlayer } from '@/player';
import type { LibraryVideo } from '@/library/types';
import { TopBar } from '@/components/TopBar';
import { VideoListItem } from '@/components/VideoListItem';
import { FilterMenu } from '@/components/FilterMenu';
import { EmptyState } from '@/components/EmptyState';

function sortVideos(videos: LibraryVideo[], sort: string): LibraryVideo[] {
  const copy = [...videos];
  if (sort === 'name') copy.sort((a, b) => a.file.name.localeCompare(b.file.name));
  else if (sort === 'date') copy.sort((a, b) => b.addedAt - a.addedAt);
  else if (sort === 'duration') copy.sort((a, b) => (b.metadata?.duration ?? 0) - (a.metadata?.duration ?? 0));
  return copy;
}

export default function HomeScreen() {
  const { colors, theme } = useTheme();
  const { spacing } = theme;
  const { videos, isScanning } = useLibrary();
  const { settings } = useSettings();
  const { playVideo } = usePlayer();
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);

  const sorted = useMemo(() => sortVideos(videos, settings.defaultSort), [videos, settings.defaultSort]);

  const openVideo = (video: LibraryVideo) => {
    playVideo(video, videos);
    router.push('/player');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar onFilter={() => setFilterVisible(true)} />

      {isScanning ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginLeft: spacing.sm, fontSize: 14 }}>Scanning library...</Text>
        </View>
      ) : null}

      {videos.length === 0 && !isScanning ? (
        <EmptyState
          title="No videos yet"
          message="Add videos to your library to start watching."
        />
      ) : (
        <FlatList
          data={sorted}
          key={settings.defaultLayout}
          keyExtractor={(item) => item.id}
          numColumns={settings.defaultLayout === 'grid' ? settings.gridColumns : 1}
          contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
          columnWrapperStyle={
            settings.defaultLayout === 'grid'
              ? { paddingHorizontal: spacing.xs }
              : undefined
          }
          renderItem={({ item }) => (
            <VideoListItem video={item} layout={settings.defaultLayout} onPress={openVideo} />
          )}
        />
      )}

      <FilterMenu visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </View>
  );
}
