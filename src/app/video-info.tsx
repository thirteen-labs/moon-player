"use client";

import { useLocalSearchParams } from 'expo-router';
import { VideoInfoScreen } from '../screens/VideoInfoScreen';

export default function VideoInfoRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <VideoInfoScreen routeUri={params.id} />;
}
