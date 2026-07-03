import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import { formatDuration } from '../../utils/format';

interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
}

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  onSeek: (time: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function BookmarksPanel({ bookmarks, onSeek, onRemove, onClose }: BookmarksPanelProps) {
  const { colors, theme } = useTheme();
  const { spacing } = theme;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Bookmarks ({bookmarks.length})</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      <ScrollView style={{ maxHeight: 250 }}>
        {bookmarks.length === 0 ? (
          <Text style={{ color: '#666', fontSize: 13, paddingVertical: spacing.md, textAlign: 'center' }}>No bookmarks yet.</Text>
        ) : (
          [...bookmarks].sort((a, b) => a.timestamp - b.timestamp).map((bm) => (
            <View key={bm.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <Pressable onPress={() => onSeek(bm.timestamp)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{formatDuration(bm.timestamp)}</Text>
                <Text style={{ color: '#ccc', fontSize: 13 }} numberOfLines={1}>{bm.label}</Text>
              </Pressable>
              <Pressable onPress={() => { onRemove(bm.id); triggerHaptic('light'); }} hitSlop={8} style={{ padding: spacing.xs }}>
                <Text style={{ color: '#666', fontSize: 14 }}>✕</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
