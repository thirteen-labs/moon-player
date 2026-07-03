"use client";

import { useLocalSearchParams } from 'expo-router';
import { FolderViewScreen } from '../../screens/FolderViewScreen';

export default function FolderViewRoute() {
  const params = useLocalSearchParams<{ path?: string }>();
  return <FolderViewScreen routeFolderPath={params.path} />;
}
