import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { triggerHaptic } from '@/utils/haptics';
import { Icon } from './Icon';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showFilter?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  onFilter?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}

export function TopBar({
  title = 'Moon Player',
  showBack = false,
  onBack,
  showFilter = true,
  showSearch = true,
  showSettings = true,
  onFilter,
  onSearch,
  onSettings,
}: TopBarProps) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSearch = onSearch ?? (() => { triggerHaptic('light'); router.push('/search'); });
  const handleSettings = onSettings ?? (() => { triggerHaptic('light'); router.push('/settings'); });
  const handleFilter = onFilter ?? (() => triggerHaptic('light'));
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={{
        paddingTop: insets.top || spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {showBack ? (
          <Pressable hitSlop={10} onPress={handleBack} accessibilityLabel="Back">
            <Icon name="back" size={24} />
          </Pressable>
        ) : null}
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.xl,
            fontWeight: typography.weights.bold,
            letterSpacing: 1,
          }}
        >
          {title}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        {showFilter && (
          <Pressable
            hitSlop={10}
            onPress={handleFilter}
            accessibilityLabel="Filter"
            accessibilityRole="button"
          >
            <Icon name="filter" size={22} />
          </Pressable>
        )}
        {showSearch && (
          <Pressable
            hitSlop={10}
            onPress={handleSearch}
            accessibilityLabel="Search"
            accessibilityRole="button"
          >
            <Icon name="search" size={22} />
          </Pressable>
        )}
        {showSettings && (
          <Pressable
            hitSlop={10}
            onPress={handleSettings}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Icon name="settings" size={22} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
