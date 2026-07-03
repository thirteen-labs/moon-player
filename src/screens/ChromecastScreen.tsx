import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useRouter } from 'expo-router';

export function ChromecastScreen() {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginLeft: spacing.md }}>Chromecast</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>📡</Text>
        <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.sm }}>Coming Soon</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md, textAlign: 'center' }}>
          Cast your media to Chromecast-enabled devices on your network.
        </Text>
      </View>
    </View>
  );
}
