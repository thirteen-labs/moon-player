import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface VideoGridCardProps {
  title: string;
  duration: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function VideoGridCard({ title, duration, onPress, onLongPress }: VideoGridCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flex: 1,
        margin: spacing.xs,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          aspectRatio: 2 / 3,
          borderRadius: borderRadius.lg,
          backgroundColor: colors.surfaceVariant,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: spacing.xs,
            right: spacing.xs,
            backgroundColor: colors.overlay,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 10,
              fontWeight: typography.weights.medium,
            }}
          >
            {duration}
          </Text>
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
        {title}
      </Text>
    </Pressable>
  );
}
