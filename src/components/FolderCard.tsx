import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface FolderCardProps {
  name: string;
  videoCount: number;
  icon?: string;
  onPress?: () => void;
}

export function FolderCard({ name, videoCount, icon = '📁', onPress }: FolderCardProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 140,
        marginRight: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.card,
        padding: spacing.md,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>{icon}</Text>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.medium,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
          marginTop: 4,
        }}
      >
        {videoCount} Videos
      </Text>
    </Pressable>
  );
}
