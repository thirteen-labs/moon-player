"use client";

import { useLocalSearchParams } from 'expo-router';
import { PlaylistScreen } from '../../screens/PlaylistScreen';

export default function PlaylistRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <PlaylistScreen routePlaylistId={params.id} />;
}
