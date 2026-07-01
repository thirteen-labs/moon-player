import { useMemo } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useLibrary } from '../library';
import { useNavigation } from '../navigation';
import { EmptyState } from '../components/EmptyState';
import { groupVideosByFolder } from '../utils/folders';

export function FoldersScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { videos } = useLibrary();
  const { navigate } = useNavigation();

  const folders = useMemo(() => {
    return groupVideosByFolder(videos);
  }, [videos]);

  const foldersToShow = folders.length > 0 ? folders.map(f => ({
    id: f.id,
    name: f.name,
    count: f.videos.length,
    path: f.path,
    folder: f,
  })) : [];

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
            Folders
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable hitSlop={8}>
            <Text style={{ color: colors.text, fontSize: 20 }}>⊞</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => navigate('search')}>
            <Text style={{ color: colors.text, fontSize: 20 }}>🔍</Text>
          </Pressable>
        </View>
      </View>

      {/* Folders List */}
      {foldersToShow.length === 0 && (
        <EmptyState
          icon="📁"
          title="No folders found"
          message="Videos are organized by their directory. Add videos to your library to see folders here."
        />
      )}
      <FlatList
        data={foldersToShow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigate('folderView', { folder: item })}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {/* Big Folder Icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <Text style={{ fontSize: 24 }}>📁</Text>
            </View>

            {/* Folder Information */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                }}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {item.count} videos
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 10,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {item.path}
              </Text>
            </View>

            {/* Menu dots */}
            <Pressable hitSlop={8} style={{ padding: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>⋮</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}
