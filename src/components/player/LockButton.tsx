import { Text, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface LockButtonProps {
  isLocked: boolean;
  onToggle: () => void;
}

export function LockButton({ isLocked, onToggle }: LockButtonProps) {
  const { theme } = useTheme();
  const { spacing } = theme;

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onToggle(); }}
      style={{ position: 'absolute', bottom: isLocked ? spacing.xl : spacing['3xl'] + 50, left: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
      accessibilityLabel={isLocked ? 'Unlock controls' : 'Lock controls'}
      accessibilityRole="button"
    >
      <Text style={{ color: '#fff', fontSize: 18 }}>{isLocked ? '🔒' : '🔓'}</Text>
    </Pressable>
  );
}
