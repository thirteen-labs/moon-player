import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface ContinueWatchingCardProps {
  title: string;
  year: number;
  progress: number;
  currentTime: string;
  totalTime: string;
  onPress?: () => void;
  onPlayPress?: () => void;
}

export function ContinueWatchingCard({
  title,
  year,
  progress,
  currentTime,
  totalTime,
  onPress,
  onPlayPress,
}: ContinueWatchingCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 280,
        marginRight: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.card,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: 160,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'flex-end',
          padding: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
              }}
              numberOfLines={1}
            >
              {title} ({year})
            </Text>
          </View>
          <Pressable
            onPress={onPlayPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: spacing.sm,
            }}
          >
            <Text style={{ color: colors.background, fontSize: 18 }}>▶</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: spacing.sm }}>
        <View
          style={{
            height: 3,
            backgroundColor: colors.borderVariant,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: borderRadius.full,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: spacing.xs,
          }}
        >
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typography.sizes.xs,
            }}
          >
            {currentTime} / {totalTime}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
