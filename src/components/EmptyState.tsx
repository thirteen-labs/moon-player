import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

export function EmptyState({ icon = '🎬', title, message }: EmptyStateProps) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing['3xl'],
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sizes.sm,
            textAlign: 'center',
            marginTop: spacing.xs,
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
