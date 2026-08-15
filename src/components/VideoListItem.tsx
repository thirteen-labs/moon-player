import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { formatDuration } from '@/utils/format';
import { triggerHaptic } from '@/utils/haptics';
import type { LibraryVideo } from '@/library/types';
import { Icon } from './Icon';

interface VideoListItemProps {
  video: LibraryVideo;
  layout: 'grid' | 'list';
  onPress: (video: LibraryVideo) => void;
}

function titleOf(video: LibraryVideo): string {
  return video.file.name.replace(/\.[^/.]+$/, '');
}

export function VideoListItem({ video, layout, onPress }: VideoListItemProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  const duration = formatDuration(video.metadata?.duration ?? 0);
  const hasResume = video.resumePosition > 0;
  const progress = video.metadata?.duration
    ? Math.min(1, video.resumePosition / video.metadata.duration)
    : 0;

  if (layout === 'grid') {
    return (
      <Pressable
        onPress={() => { triggerHaptic('light'); onPress(video); }}
        style={{ flex: 1, margin: spacing.xs }}
      >
        <View
          style={{
            aspectRatio: 16 / 9,
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: colors.surfaceVariant,
          }}
        >
          {video.thumbnailUri ? (
            <Image source={{ uri: video.thumbnailUri }} contentFit="cover" style={{ flex: 1 }} />
          ) : null}
          {hasResume ? (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <View style={{ height: 3, width: `${progress * 100}%`, backgroundColor: colors.primary }} />
            </View>
          ) : null}
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: borderRadius.sm,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{duration}</Text>
          </View>
        </View>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.medium,
            marginTop: spacing.xs,
          }}
          numberOfLines={2}
        >
          {titleOf(video)}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(video); }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View
        style={{
          width: 120,
          height: 68,
          borderRadius: borderRadius.md,
          overflow: 'hidden',
          backgroundColor: colors.surfaceVariant,
          marginRight: spacing.md,
        }}
      >
        {video.thumbnailUri ? (
          <Image source={{ uri: video.thumbnailUri }} contentFit="cover" style={{ flex: 1 }} />
        ) : null}
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11 }}>{duration}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}
          numberOfLines={2}
        >
          {titleOf(video)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs }}>
          {hasResume ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>Resume</Text>
            </View>
          ) : null}
          {video.isFavorite ? (
            <Icon name="heart" size={14} color={colors.primary} />
          ) : null}
        </View>
      </View>

      <Icon name="more" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}
