import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface SubtitleVideoOverlayProps {
  textTracks: { title?: string; language?: string }[];
  selectedTextTrack: number;
  externalSubtitles?: { language: string; name: string }[];
  resizeMode: 'contain' | 'cover';
  onSelectTextTrack: (index: number) => void;
  onZoomChange: (z: 'contain' | 'cover') => void;
  onClose: () => void;
}

export function SubtitleVideoOverlay({ textTracks, selectedTextTrack, externalSubtitles, resizeMode, onSelectTextTrack, onZoomChange, onClose }: SubtitleVideoOverlayProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Video</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      <ScrollView style={{ maxHeight: 180 }}>
        <Text style={{ color: '#999', fontSize: 12, marginBottom: spacing.xs }}>Subtitles</Text>
        <Pressable
          onPress={() => { onSelectTextTrack(-1); triggerHaptic('light'); }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
        >
          <Text style={{ color: selectedTextTrack === -1 ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedTextTrack === -1 ? '700' : '400' }}>Off</Text>
          {selectedTextTrack === -1 && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
        </Pressable>
        {textTracks.map((track, idx) => (
          <Pressable
            key={`sub-${idx}`}
            onPress={() => { onSelectTextTrack(idx); triggerHaptic('light'); }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text style={{ color: selectedTextTrack === idx ? colors.primary : '#fff', fontSize: 14, fontWeight: selectedTextTrack === idx ? '700' : '400' }}>
              {track.title || track.language || `Track ${idx + 1}`}
            </Text>
            {selectedTextTrack === idx && <Text style={{ color: colors.primary, marginLeft: spacing.sm }}>✓</Text>}
          </Pressable>
        ))}
        {externalSubtitles && externalSubtitles.length > 0 && (
          <>
            <Text style={{ color: '#999', fontSize: 12, marginTop: spacing.sm, marginBottom: spacing.xs }}>External Subtitles</Text>
            {externalSubtitles.map((sub, idx) => (
              <View key={`ext-sub-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
                <Text style={{ color: '#fff', fontSize: 13 }}>{sub.language} ({sub.name})</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>Zoom</Text>
        <Pressable onPress={() => { onZoomChange(resizeMode === 'contain' ? 'cover' : 'contain'); triggerHaptic('light'); }} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{resizeMode === 'contain' ? 'Fit' : 'Fill'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
