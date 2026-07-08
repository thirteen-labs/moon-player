"use client";

import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { AudioPlayerScreen } from '../screens/AudioPlayerScreen';
import { useAudioLibrary } from '../audio/useAudioLibrary';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

export default function AudioPlayerRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { getTrack, tracks } = useAudioLibrary();
  const track = params.id ? getTrack(params.id) : undefined;

  const queue = useMemo(() => {
    if (!track) return [];
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx < 0) return [track];
    return [...tracks.slice(idx), ...tracks.slice(0, idx)];
  }, [track, tracks]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  }, []);

  if (!track) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading track...</Text>
      </View>
    );
  }

  return (
    <AudioPlayerScreen
      track={track}
      onClose={handleClose}
      queue={queue}
    />
  );
}
