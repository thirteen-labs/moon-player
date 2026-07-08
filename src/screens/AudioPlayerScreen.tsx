import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Image, Dimensions, Animated, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import type { LibraryAudio } from '../audio/types';

const { width: W } = Dimensions.get('window');

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayerScreen({
  track,
  onClose,
  queue = [],
}: {
  track: LibraryAudio;
  onClose: () => void;
  queue?: LibraryAudio[];
}) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(track.resumePosition || 0);
  const [duration, setDuration] = useState(track.metadata?.duration || 0);
  const [currentIndex, setCurrentIndex] = useState(
    queue.length > 0 ? queue.findIndex((t) => t.id === track.id) : -1,
  );
  const [currentTrack, setCurrentTrack] = useState(track);
  const [seekBarWidth, setSeekBarWidth] = useState(0);
  const spinAnimRef = useRef(new Animated.Value(0));
  const spinAnim = spinAnimRef.current; // eslint-disable-line react-hooks/refs

  const queueRef = useRef(queue);
  const indexRef = useRef(currentIndex);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const playTrack = useCallback((t: LibraryAudio) => {
    setCurrentTrack(t);
    setPosition(t.resumePosition || 0);
    setDuration(t.metadata?.duration || 0);
    setIsPlaying(true);
  }, []);

  const goToIndex = useCallback((idx: number) => {
    const q = queueRef.current;
    if (idx < 0 || idx >= q.length) return;
    setCurrentIndex(idx);
    playTrack(q[idx]);
  }, [playTrack]);

  const goNext = useCallback(() => {
    const i = indexRef.current;
    const q = queueRef.current;
    if (i < 0 || q.length === 0) return;
    const nextIdx = (i + 1) % q.length;
    goToIndex(nextIdx);
  }, [goToIndex]);

  const goPrev = useCallback(() => {
    const i = indexRef.current;
    const q = queueRef.current;
    if (i < 0 || q.length === 0) return;
    const prevIdx = (i - 1 + q.length) % q.length;
    goToIndex(prevIdx);
  }, [goToIndex]);

  useEffect(() => {
    if (isPlaying && currentTrack.file.uri && duration > 0) {
      const interval = setInterval(() => {
        let completed = false;
        setPosition((p) => {
          const next = p + 1;
          if (next >= duration) {
            completed = true;
            return duration;
          }
          return next;
        });
        if (completed) {
          setIsPlaying(false);
          if (queueRef.current.length > 0) goNext();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrack.file.uri, duration, goNext]);

  useEffect(() => {
    if (isPlaying) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinAnim.setValue(0);
    }
  }, [isPlaying, spinAnim]);

  const spinInterpolation = spinAnim.interpolate({ // eslint-disable-line react-hooks/refs
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      if (p && position >= duration && duration > 0) {
        setPosition(0);
        return true;
      }
      return !p;
    });
  }, [position, duration]);

  const seekTo = useCallback((value: number) => {
    setPosition(Math.max(0, Math.min(value, duration)));
  }, [duration]);

  const meta = currentTrack.metadata;
  const artworkUri = currentTrack.artworkUri;
  const progress = duration > 0 ? position / duration : 0;
  const showPrevNext = queue.length > 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: spacing.xl, paddingHorizontal: spacing.md, paddingBottom: spacing.md,
      }}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 24 }}>▼</Text>
        </Pressable>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: '600', letterSpacing: 1 }}>
          {showPrevNext ? `${currentIndex + 1} of ${queue.length}` : 'NOW PLAYING'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Artwork */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
        {artworkUri ? (
          <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
            <Image
              source={{ uri: artworkUri }}
              style={{
                width: W - spacing.xl * 2,
                height: W - spacing.xl * 2,
                borderRadius: borderRadius.xl,
              }}
            />
          </Animated.View>
        ) : (
          <View style={{
            width: W - spacing.xl * 2,
            height: W - spacing.xl * 2,
            borderRadius: borderRadius.xl,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 80 }}>🎵</Text>
          </View>
        )}
      </View>

      {/* Track info */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.bold,
          }}
          numberOfLines={1}
        >
          {meta?.title || currentTrack.file.name.replace(/\.[^/.]+$/, '')}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sizes.md,
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {meta?.artist || 'Unknown Artist'}
          {meta?.album ? ` · ${meta.album}` : ''}
        </Text>
      </View>

      {/* Seek bar */}
      <View style={{ paddingHorizontal: spacing.xl }}>
        <Pressable
          onLayout={(e: LayoutChangeEvent) => setSeekBarWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            if (seekBarWidth > 0 && duration > 0) {
              const x = e.nativeEvent.locationX;
              seekTo(Math.max(0, Math.min((x / seekBarWidth) * duration, duration)));
            }
          }}
          onResponderMove={(e) => {
            if (seekBarWidth > 0 && duration > 0) {
              const x = e.nativeEvent.locationX;
              seekTo(Math.max(0, Math.min((x / seekBarWidth) * duration, duration)));
            }
          }}
          style={{ height: 40, justifyContent: 'center' }}
        >
          <View style={{ height: 4, backgroundColor: colors.surfaceVariant, borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary, borderRadius: 2 }} />
          </View>
          <View
            style={{
              position: 'absolute', left: `${Math.min(progress * 100, 100)}%`,
              width: 16, height: 16, borderRadius: 8,
              backgroundColor: colors.primary, marginLeft: -8,
            }}
          />
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>
            {formatTime(position)}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: spacing.xl, gap: spacing.xl,
      }}>
        {showPrevNext && (
          <Pressable onPress={goPrev} hitSlop={12}>
            <Text style={{ color: colors.text, fontSize: 28 }}>⏮</Text>
          </Pressable>
        )}

        <Pressable
          onPress={togglePlay}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.background, fontSize: 32, marginLeft: isPlaying ? 0 : 4 }}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        {showPrevNext && (
          <Pressable onPress={goNext} hitSlop={12}>
            <Text style={{ color: colors.text, fontSize: 28 }}>⏭</Text>
          </Pressable>
        )}
      </View>

      {/* Bottom info */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>
          {currentTrack.file.extension.toUpperCase()} · {currentTrack.file.name.replace(/\.[^/.]+$/, '')}
        </Text>
      </View>
    </View>
  );
}
