import { View, Text, Pressable } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

interface TransportControlsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  previous: () => void;
  next: () => void;
  onSkip: (seconds: number) => void;
  skipAmount: number;
}

export function TransportControls({ isPlaying, togglePlay, previous, next, onSkip, skipAmount }: TransportControlsProps) {
  return (
    <View style={[styles.centerControls]}>
      <Pressable onPress={() => { triggerHaptic('light'); previous(); }} style={styles.playbackSideButton} accessibilityLabel="Previous" accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 18 }}>⏮</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onSkip(-skipAmount); }} style={styles.playbackSideButton} accessibilityLabel={`Rewind ${skipAmount} seconds`} accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 16 }}>⟲{skipAmount}</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('medium'); togglePlay(); }} style={styles.playButton} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 28, marginLeft: isPlaying ? 0 : 4 }}>{isPlaying ? '⏸' : '▶'}</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); onSkip(skipAmount); }} style={styles.playbackSideButton} accessibilityLabel={`Fast forward ${skipAmount} seconds`} accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 16 }}>{skipAmount}⟳</Text>
      </Pressable>
      <Pressable onPress={() => { triggerHaptic('light'); next(); }} style={styles.playbackSideButton} accessibilityLabel="Next" accessibilityRole="button">
        <Text style={{ color: '#fff', fontSize: 18 }}>⏭</Text>
      </Pressable>
    </View>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  centerControls: { position: 'absolute', top: '45%', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 },
  playbackSideButton: { width: 44, height: 40, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
