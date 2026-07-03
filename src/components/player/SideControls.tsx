import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme';

interface SideControlsProps {
  brightness: number;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function SideControls({ brightness, volume, isMuted, onToggleMute }: SideControlsProps) {
  const { colors, theme } = useTheme();
  const { spacing } = theme;

  return (
    <>
      <View style={[styles.sliderContainer, { left: spacing.md }]}>
        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>☀️</Text>
        <View style={styles.verticalTrack}>
          <View style={[styles.verticalProgress, { height: `${brightness * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
      <View style={[styles.sliderContainer, { right: spacing.md }]}>
        <Pressable onPress={onToggleMute}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{isMuted ? '🔇' : '🔊'}</Text>
        </Pressable>
        <View style={styles.verticalTrack}>
          <View style={[styles.verticalProgress, { height: `${(isMuted ? 0 : volume) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
    </>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  sliderContainer: { position: 'absolute', top: '30%', alignItems: 'center', width: 32, zIndex: 10 },
  verticalTrack: { width: 4, height: 120, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-end' },
  verticalProgress: { width: '100%', borderRadius: 2 },
});
