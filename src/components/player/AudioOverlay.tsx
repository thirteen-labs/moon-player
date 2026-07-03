import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import { AudioEqualizer } from '../AudioEqualizer';

interface AudioOverlayProps {
  audioTracks: { title?: string; language?: string }[];
  selectedAudioTrack: number;
  isAudioOnly: boolean;
  onSelectTrack: (index: number) => void;
  onToggleAudioOnly: () => void;
  onClose: () => void;
}

export function AudioOverlay({ audioTracks, selectedAudioTrack, isAudioOnly, onSelectTrack, onToggleAudioOnly, onClose }: AudioOverlayProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Audio</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      <ScrollView style={{ maxHeight: 200 }}>
        {audioTracks.length > 0 && (
          <>
            <Text style={{ color: '#999', fontSize: 12, marginBottom: spacing.xs }}>Audio Track</Text>
            {audioTracks.map((track, idx) => (
              <Pressable
                key={`audio-${idx}`}
                onPress={() => { onSelectTrack(idx); triggerHaptic('light'); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
              >
                <Text style={{ color: selectedAudioTrack === idx ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedAudioTrack === idx ? '700' : '400' }}>
                  {track.title || track.language || `Track ${idx + 1}`}
                </Text>
                {selectedAudioTrack === idx && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
      <AudioEqualizer onClose={onClose} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>Audio-Only Mode</Text>
        <Pressable onPress={onToggleAudioOnly} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: isAudioOnly ? colors.primary : 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{isAudioOnly ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
