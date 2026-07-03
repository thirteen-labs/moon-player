"use client";

import { useLocalSearchParams } from 'expo-router';
import { PlayerScreen } from '../screens/PlayerScreen';

export default function PlayerRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <PlayerScreen routeUri={params.id} />;
}
