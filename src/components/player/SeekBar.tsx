import { View, Text, Pressable, Dimensions } from 'react-native';
import { useTheme } from '../../theme';
import { formatDuration } from '../../utils/format';

interface SeekBarProps {
  position: number;
  duration: number;
  progress: number;
  onSeek: (time: number) => void;
}

const { width: W } = Dimensions.get('window');

export function SeekBar({ position, duration, progress, onSeek }: SeekBarProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
      <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(position)}</Text>
      <Pressable
        style={{ flex: 1, height: 4, backgroundColor: '#333', borderRadius: borderRadius.full, position: 'relative' }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const ratio = e.nativeEvent.locationX / (W - spacing.md * 2);
          onSeek(Math.min(ratio, 1) * duration);
        }}
      >
        <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: borderRadius.full }} />
        <View style={{ position: 'absolute', top: -4, left: `${progress * 100}%`, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginLeft: -6 }} />
      </Pressable>
      <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(duration)}</Text>
    </View>
  );
}
