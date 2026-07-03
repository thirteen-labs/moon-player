import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useRouter } from 'expo-router';
import { useLibrary } from '../library';
import { formatDuration } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';

export function VideoInfoScreen({ routeUri }: { routeUri?: string }) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const router = useRouter();
  const { getVideo } = useLibrary();
  const video = routeUri ? getVideo(routeUri) : undefined;
  const videoTitle = video ? video.file.name.replace(/\.[^/.]+$/, '') : 'Unknown';
  const videoYear = video ? new Date(video.file.modifiedAt).getFullYear() : 0;
  const metadata = video?.metadata;

  const metaChips = useMemo(() => {
    const chips: { icon: string; label: string }[] = [];
    if (metadata?.duration) chips.push({ icon: '⏱', label: formatDuration(metadata.duration) });
    if (video?.file?.size) chips.push({ icon: '💾', label: `${(video.file.size / (1024 * 1024 * 1024)).toFixed(1)} GB` });
    if (metadata?.width && metadata?.height) chips.push({ icon: '📺', label: `${metadata.width}x${metadata.height}` });
    if (metadata?.codec) chips.push({ icon: '🎞', label: metadata.codec });
    if (metadata?.frameRate) chips.push({ icon: '⚡', label: `${metadata.frameRate.toFixed(1)} fps` });
    if (video?.isFavorite) chips.push({ icon: '⭐', label: 'Favorite' });
    return chips;
  }, [metadata, video]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => { triggerHaptic('light'); router.push('/player'); }} hitSlop={8} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={{ color: colors.text, fontSize: 24 }}>←</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold }} numberOfLines={1}>
            {videoTitle}
          </Text>
        </View>
        <Pressable hitSlop={8} accessibilityLabel="Video settings" accessibilityRole="button">
          <Text style={{ color: colors.text, fontSize: 22 }}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        <View style={{ aspectRatio: 16 / 9, backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center', margin: spacing.md, borderRadius: borderRadius.xl }}>
          <Text style={{ color: colors.textTertiary, fontSize: 16 }}>POSTER</Text>
        </View>

        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.xs }}>
            {videoTitle}
          </Text>
          {videoYear > 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: spacing.md }}>{videoYear}</Text>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {metaChips.map((chip, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full }}>
                <Text style={{ fontSize: 14 }}>{chip.icon}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium }}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {video && (
          <>
            <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm }}>Actions</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => { triggerHaptic('medium'); router.push(`/player?id=${encodeURIComponent(video.id)}`); }}
                  style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}
                  accessibilityLabel="Play video"
                  accessibilityRole="button"
                >
                  <Text style={{ color: colors.background, fontSize: 14 }}>▶</Text>
                  <Text style={{ color: colors.background, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>Play</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm }}>Details</Text>
              <DetailRow label="File path" value={video.file.path} />
              <DetailRow label="File size" value={`${(video.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`} />
              <DetailRow label="Added" value={new Date(video.addedAt).toLocaleDateString()} />
              <DetailRow label="Last played" value={video.lastPlayedAt ? new Date(video.lastPlayedAt).toLocaleDateString() : 'Never'} />
              <DetailRow label="Play count" value={`${video.playCount}`} />
            </View>

            {metadata && (
              <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm }}>Media Info</Text>
                <DetailRow label="Resolution" value={`${metadata.width}x${metadata.height}`} />
                <DetailRow label="Codec" value={metadata.codec} />
                <DetailRow label="Bitrate" value={`${(metadata.bitrate / 1000).toFixed(0)} kbps`} />
                <DetailRow label="Frame Rate" value={`${metadata.frameRate.toFixed(2)} fps`} />
                <DetailRow label="Aspect Ratio" value={metadata.displayAspectRatio} />
                <DetailRow label="HDR" value={metadata.isHDR ? 'Yes' : 'No'} />
                <DetailRow label="Audio Codec" value={metadata.audioCodec} />
                <DetailRow label="Audio Channels" value={`${metadata.audioChannels}`} />
                <DetailRow label="Sample Rate" value={`${metadata.audioSampleRate} Hz`} />
              </View>
            )}
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md }}>
          <ActionButton icon="⬇️" label="Download" />
          <ActionButton icon="🔄" label="Share" />
          <ActionButton icon="🔗" label="Link" />
          <ActionButton icon="⋮" label="More" />
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors, theme } = useTheme();
  const { typography } = theme;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: typography.sizes.sm, maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  const { colors, theme } = useTheme();
  const { spacing } = theme;
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: spacing.xs }} hitSlop={8} accessibilityLabel={label} accessibilityRole="button">
      <Text style={{ fontSize: 24, color: colors.text }}>{icon}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{label}</Text>
    </Pressable>
  );
}
