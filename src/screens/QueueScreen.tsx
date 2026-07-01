import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../theme';
import { usePlayer } from '../player';
import { useNavigation } from '../navigation';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';

export function QueueScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { navigate } = useNavigation();
  const { queue, currentVideo, position, duration, removeFromQueue } = usePlayer();

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ position: 'absolute', top: spacing.xl, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, zIndex: 10 }}>
        <Pressable onPress={() => navigate('player')} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', marginHorizontal: spacing.md }}>
          <Text style={{ color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }} numberOfLines={1}>
            {currentVideo ? currentVideo.file.name.replace(/\.[^/.]+$/, '') : 'Queue'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>⋮</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#555', fontSize: 18, fontWeight: 'bold' }}>NOW PLAYING</Text>
        </View>
        <View style={[styles.sliderContainer, { left: spacing.md }]}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>☀️</Text>
          <View style={styles.verticalTrack}>
            <View style={[styles.verticalProgress, { height: '70%', backgroundColor: colors.primary }]} />
          </View>
        </View>
        <View style={[styles.sliderContainer, { right: spacing.md }]}>
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>🔊</Text>
          <View style={styles.verticalTrack}>
            <View style={[styles.verticalProgress, { height: '80%', backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.md }}>
          <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(position)}</Text>
          <View style={{ flex: 1, height: 4, backgroundColor: '#333', borderRadius: borderRadius.full }}>
            <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: borderRadius.full }} />
          </View>
          <Text style={{ color: '#999', fontSize: 12 }}>{formatDuration(duration)}</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 12, fontWeight: typography.weights.semibold, paddingHorizontal: spacing.md, marginBottom: spacing.xs }}>
          Up Next ({queue.length})
        </Text>

        {queue.length === 0 ? (
          <View style={{ padding: spacing.lg }}>
            <EmptyState icon="🎬" title="Queue is empty" message="Add videos to the queue from the player screen." />
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 250 }}
            contentContainerStyle={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.md }}
            renderItem={({ item, index }) => {
              const isCurrent = currentVideo?.id === item.id;
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.md, opacity: isCurrent ? 1 : 0.6 }}>
                  <Text style={{ color: isCurrent ? colors.primary : colors.textSecondary, fontSize: isCurrent ? 20 : 18, fontWeight: isCurrent ? 'bold' : '400' }}>
                    {queue.length - index}
                  </Text>
                  <View style={{ width: 60, height: 38, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceVariant }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }} numberOfLines={1}>
                      {item.file.name.replace(/\.[^/.]+$/, '')}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 10 }}>{formatDuration(item.metadata?.duration || 0)}</Text>
                  </View>
                  <Pressable onPress={() => removeFromQueue(item.id)} hitSlop={8} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.text, fontSize: 14 }}>✕</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: { position: 'absolute', top: '30%', alignItems: 'center', width: 32, zIndex: 10 },
  verticalTrack: { width: 4, height: 120, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-end' },
  verticalProgress: { width: '100%', borderRadius: 2 },
});
