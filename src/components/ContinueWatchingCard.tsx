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
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.card,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: spacing.md,
      }}
    >
      {/* Background Poster Placeholder with gradient */}
      <View
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'flex-end',
        }}
      >
        {/* Play Overlay */}
        <View
          style={{
            ...StyleSheet.absoluteFill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <Pressable
            onPress={onPlayPress}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <Text style={{ color: colors.background, fontSize: 24, marginLeft: 4 }}>▶</Text>
          </Pressable>
        </View>

        {/* Text Gradient Overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: spacing.md,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              marginBottom: spacing.xs,
            }}
          >
            {title} ({year})
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              height: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: borderRadius.full,
              overflow: 'hidden',
              marginBottom: spacing.xs,
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

          {/* Time text */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
              }}
            >
              {currentTime} / {totalTime}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

import { StyleSheet } from 'react-native';
