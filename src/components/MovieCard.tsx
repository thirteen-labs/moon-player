import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface MovieCardProps {
  title: string;
  year: number;
  duration: string;
  onPress?: () => void;
  onMenuPress?: () => void;
}

export function MovieCard({ title, year, duration, onPress, onMenuPress }: MovieCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 150,
        marginRight: spacing.md,
      }}
    >
      <View
        style={{
          width: 150,
          height: 220,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceVariant,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            backgroundColor: colors.overlay,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.medium,
            }}
          >
            {duration}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: spacing.sm,
          paddingRight: spacing.xs,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.sizes.xs,
              marginTop: 2,
            }}
          >
            ({year})
          </Text>
        </View>
        <Pressable onPress={onMenuPress} hitSlop={8}>
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>⋮</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
