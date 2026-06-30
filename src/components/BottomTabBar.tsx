import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import type { Screen } from '../navigation';

interface TabItem {
  icon: string;
  label: string;
  screen: Screen;
  isActive?: boolean;
  onPress?: () => void;
}

interface BottomTabBarProps {
  activeTab: Screen;
  onTabPress: (screen: Screen) => void;
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  const tabs: TabItem[] = [
    { icon: '🏠', label: 'Home', screen: 'home', isActive: activeTab === 'home' },
    { icon: '📚', label: 'Library', screen: 'library', isActive: activeTab === 'library' },
    { icon: '▶', label: 'Player', screen: 'player', isActive: activeTab === 'player' },
    { icon: '🔍', label: 'Search', screen: 'search', isActive: activeTab === 'search' },
    { icon: '⚙', label: 'Settings', screen: 'settings', isActive: activeTab === 'settings' },
  ];

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
      {tabs.map((tab, index) => {
        const isCenter = index === 2;
        const isActive = tab.isActive;

        if (isCenter) {
          return (
            <Pressable
              key={tab.label}
              onPress={() => onTabPress(tab.screen)}
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
            onPress={() => onTabPress(tab.screen)}
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
