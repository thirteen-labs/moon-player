import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
const { height: H } = Dimensions.get('window');

interface MetaRowProps {
  label: string;
  value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ color: '#999', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

interface MetadataPanelProps {
  metadata?: {
    width?: number;
    height?: number;
    codec?: string;
    bitrate?: number;
    frameRate?: number;
    displayAspectRatio?: string;
    isHDR?: boolean;
    audioCodec?: string;
    audioChannels?: number;
    audioSampleRate?: number;
  };
  fileSize?: number;
  filePath?: string;
  onClose: () => void;
}

export function MetadataPanel({ metadata, fileSize, filePath, onClose }: MetadataPanelProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Media Info</Text>
        <Pressable onPress={onClose}><Text style={{ color: '#999', fontSize: 18 }}>✕</Text></Pressable>
      </View>
      <ScrollView style={{ maxHeight: 300 }}>
        <MetaRow label="Resolution" value={metadata ? `${metadata.width}x${metadata.height}` : '—'} />
        <MetaRow label="Codec" value={metadata?.codec || '—'} />
        <MetaRow label="Bitrate" value={metadata?.bitrate ? `${(metadata.bitrate / 1000).toFixed(0)} kbps` : '—'} />
        <MetaRow label="Frame Rate" value={metadata?.frameRate ? `${metadata.frameRate.toFixed(2)} fps` : '—'} />
        <MetaRow label="Aspect Ratio" value={metadata?.displayAspectRatio || '—'} />
        <MetaRow label="HDR" value={metadata?.isHDR ? 'Yes' : 'No'} />
        <MetaRow label="Audio Codec" value={metadata?.audioCodec || '—'} />
        <MetaRow label="Audio Channels" value={metadata?.audioChannels ? `${metadata.audioChannels}` : '—'} />
        <MetaRow label="Sample Rate" value={metadata?.audioSampleRate ? `${metadata.audioSampleRate} Hz` : '—'} />
        <MetaRow label="File Size" value={fileSize ? `${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB` : '—'} />
        <MetaRow label="File Path" value={filePath || '—'} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 16, padding: 16, zIndex: 50, maxHeight: H * 0.5 },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
});
