import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface QuickAccessButtonProps {
  icon: string;
  label: string;
  count: number;
  onPress?: () => void;
}

export function QuickAccessButton({ icon, label, count, onPress }: QuickAccessButtonProps) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        width: 72,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.medium,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
          marginTop: 2,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}
