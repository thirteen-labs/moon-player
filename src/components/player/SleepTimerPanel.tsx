import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface SleepTimerPanelProps {
  sleepTimer: { isActive: boolean; remainingSeconds: number } | null;
  onStartTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  onClose: () => void;
}

export function SleepTimerPanel({ sleepTimer, onStartTimer, onCancelTimer, onClose }: SleepTimerPanelProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sleep Timer</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      {sleepTimer?.isActive ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: spacing.sm }}>
            Timer active — {Math.floor(sleepTimer.remainingSeconds / 60)}:{String(sleepTimer.remainingSeconds % 60).padStart(2, '0')} remaining
          </Text>
          <Pressable onPress={onCancelTimer} style={{ backgroundColor: colors.error, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Cancel Timer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm }}>
          {[15, 30, 45, 60, 90, 120].map((mins) => (
            <Pressable key={mins} onPress={() => { onStartTimer(mins); triggerHaptic('medium'); }}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>{mins < 60 ? `${mins} min` : `${mins / 60} hr`}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
