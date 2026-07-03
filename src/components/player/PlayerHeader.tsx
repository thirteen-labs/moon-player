import { View, Text, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface PlayerHeaderProps {
  videoTitle: string;
  videoYear: number;
  moreSheet: string;
  onToggleSheet: (sheet: string | 'none' | 'metadata' | 'tools') => void;
  fadeAnim: Animated.Value;
}

export function PlayerHeader({ videoTitle, videoYear, moreSheet, onToggleSheet, fadeAnim }: PlayerHeaderProps) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const router = useRouter();

  return (
    <Animated.View style={{ position: 'absolute', top: spacing.xl, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, zIndex: 10, opacity: fadeAnim }}>
      <Pressable
        onPress={() => { triggerHaptic('light'); router.push('/'); }}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={{ color: '#fff', fontSize: 20 }}>‹</Text>
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center', marginHorizontal: spacing.md }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{videoTitle} ({videoYear})</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable onPress={() => onToggleSheet(moreSheet === 'metadata' ? 'none' : 'metadata')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>ⓘ</Text>
        </Pressable>
        <Pressable onPress={() => onToggleSheet(moreSheet === 'tools' ? 'none' : 'tools')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>⋮</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
