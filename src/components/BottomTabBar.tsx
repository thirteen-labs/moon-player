import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../theme';

const TAB_ROUTES = [
  { icon: '🏠', label: 'Home', route: '/' },
  { icon: '📚', label: 'Library', route: '/library' },
  { icon: '▶', label: 'Player', route: '/player' },
  { icon: '🔍', label: 'Search', route: '/search' },
  { icon: '⚙', label: 'Settings', route: '/settings' },
] as const;

export function BottomTabBar() {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      {TAB_ROUTES.map((tab, index) => {
        const isCenter = index === 2;
        const isActive = pathname === tab.route || (tab.route !== '/' && pathname.startsWith(tab.route));

        if (isCenter) {
          return (
            <Pressable
              key={tab.label}
              onPress={() => router.push(tab.route)}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -24,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text style={{ color: colors.background, fontSize: 28 }}>{tab.icon}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.label}
            onPress={() => router.push(tab.route)}
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            style={{
              alignItems: 'center',
              minWidth: 60,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                marginBottom: 4,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              {tab.icon}
            </Text>
            <Text
              style={{
                color: isActive ? colors.tabBarActive : colors.tabBarInactive,
                fontSize: typography.sizes.xs,
                fontWeight: isActive ? typography.weights.semibold : typography.weights.regular,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
