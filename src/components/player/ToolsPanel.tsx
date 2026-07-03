import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

interface ToolButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function ToolButton({ icon, label, onPress }: ToolButtonProps) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', width: 72, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }}>
      <Text style={{ fontSize: 22, marginBottom: 2 }}>{icon}</Text>
      <Text style={{ color: '#ccc', fontSize: 10 }}>{label}</Text>
    </Pressable>
  );
}

interface ToolsPanelProps {
  onAddBookmark: () => void;
  onOpenBookmarks: () => void;
  onScreenshot: () => void;
  onExtractThumbnail: () => void;
  onOpenTimer: () => void;
  onOpenInfo: () => void;
  onOpenAudio: () => void;
  onOpenVideo: () => void;
  onOpenSubtitles: () => void;
  onPiP: () => void;
  isBackgroundAudioEnabled: boolean;
  onToggleBackgroundAudio: () => void;
  onClose: () => void;
}

export function ToolsPanel({ onAddBookmark, onOpenBookmarks, onScreenshot, onExtractThumbnail, onOpenTimer, onOpenInfo, onOpenAudio, onOpenVideo, onOpenSubtitles, onPiP, isBackgroundAudioEnabled, onToggleBackgroundAudio, onClose }: ToolsPanelProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius } = theme;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Tools</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm }}>
        <ToolButton icon="🔖" label="Bookmark" onPress={() => { onAddBookmark(); triggerHaptic('light'); }} />
        <ToolButton icon="📑" label="Saved" onPress={() => { onOpenBookmarks(); triggerHaptic('light'); }} />
        <ToolButton icon="📸" label="Capture" onPress={onScreenshot} />
        <ToolButton icon="🖼" label="Thumbnail" onPress={onExtractThumbnail} />
        <ToolButton icon="⏱" label="Timer" onPress={() => { onOpenTimer(); triggerHaptic('light'); }} />
        <ToolButton icon="ⓘ" label="Info" onPress={() => { onOpenInfo(); triggerHaptic('light'); }} />
        <ToolButton icon="🎚" label="Audio" onPress={() => { onOpenAudio(); triggerHaptic('light'); }} />
        <ToolButton icon="🎬" label="Video" onPress={() => { onOpenVideo(); triggerHaptic('light'); }} />
        <ToolButton icon="💬" label="Subtitles" onPress={() => { onOpenSubtitles(); triggerHaptic('light'); }} />
        <ToolButton icon="📺" label="PiP" onPress={onPiP} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: spacing.sm }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>Background Playback</Text>
        <Pressable onPress={() => { onToggleBackgroundAudio(); triggerHaptic('light'); }} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: isBackgroundAudioEnabled ? colors.primary : 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{isBackgroundAudioEnabled ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
