import { View, Text, Pressable, Image } from 'react-native';
import { useTheme } from '../theme';

interface AudioCardProps {
  title: string;
  artist: string;
  album: string;
  artworkUri: string | null;
  duration: string;
  onPress?: () => void;
  onPlayPress?: () => void;
}

export function AudioCard({ title, artist, album, artworkUri, duration, onPress, onPlayPress }: AudioCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 130,
        marginRight: spacing.md,
      }}
    >
      <View
        style={{
          width: 130,
          height: 130,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceVariant,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {artworkUri ? (
          <Image source={{ uri: artworkUri }} style={{ width: 130, height: 130 }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>🎵</Text>
          </View>
        )}

        <Pressable
          onPress={onPlayPress}
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 4,
            zIndex: 10,
          }}
        >
          <Text style={{ color: colors.background, fontSize: 14, marginLeft: 2 }}>▶</Text>
        </Pressable>

        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            left: spacing.sm,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
            zIndex: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 9, fontWeight: typography.weights.medium }}>
            {duration}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.xs, paddingRight: spacing.xs }}>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: typography.sizes.xs,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {artist}{album ? ` · ${album}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}
