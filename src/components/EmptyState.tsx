import { View, Text } from 'react-native';
import { useTheme } from '../theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing['3xl'],
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: spacing.md, opacity: 0.6 }}>
        {icon}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
