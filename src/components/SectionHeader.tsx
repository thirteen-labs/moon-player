import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

export function SectionHeader({ title, showViewAll = true, onViewAllPress }: SectionHeaderProps) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.xl,
            fontWeight: typography.weights.bold,
          }}
        >
          {title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.lg, marginLeft: spacing.xs }}>
          ›
        </Text>
      </View>
      {showViewAll && (
        <Pressable onPress={onViewAllPress}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizes.sm,
            }}
          >
            View all
          </Text>
        </Pressable>
      )}
    </View>
  );
}
