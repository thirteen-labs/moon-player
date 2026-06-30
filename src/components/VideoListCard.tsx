import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface VideoListCardProps {
  title: string;
  duration: string;
  fileSize?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

export function VideoListCard({
  title,
  duration,
  fileSize,
  onPress,
  onLongPress,
  onMenuPress,
}: VideoListCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 200,
          height: 120,
          borderRadius: borderRadius.md,
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

      <View
        style={{
          flex: 1,
          marginLeft: spacing.md,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.medium,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {fileSize && (
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.sizes.xs,
              marginTop: spacing.xs,
            }}
          >
            {fileSize}
          </Text>
        )}
      </View>

      <Pressable
        onPress={onMenuPress}
        hitSlop={8}
        style={{ justifyContent: 'center', paddingLeft: spacing.sm }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 20 }}>⋮</Text>
      </Pressable>
    </Pressable>
  );
}
