import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface MovieCardProps {
  title: string;
  year: number;
  duration: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  onPlayPress?: () => void;
}

export function MovieCard({ title, year, duration, onPress, onMenuPress, onPlayPress }: MovieCardProps) {
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
      {/* Poster area */}
      <View
        style={{
          width: 130,
          height: 180,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceVariant,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Floating Play Button Overlay bottom-right */}
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

        {/* Duration badge bottom-left */}
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
          <Text
            style={{
              color: colors.text,
              fontSize: 9,
              fontWeight: typography.weights.medium,
            }}
          >
            {duration}
          </Text>
        </View>
      </View>

      {/* Info area */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: spacing.xs,
        }}
      >
        <View style={{ flex: 1, paddingRight: spacing.xs }}>
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
          >
            {year}
          </Text>
        </View>
        <Pressable onPress={onMenuPress} hitSlop={8} style={{ alignSelf: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>⋮</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
