import { View, StyleSheet } from 'react-native';
import { useSettings } from '../storage';

interface VideoFilterOverlayProps {
  enabled?: boolean;
}

export function VideoFilterOverlay({ enabled = true }: VideoFilterOverlayProps) {
  const { settings } = useSettings();

  if (!enabled) return null;

  const b = settings.brightness ?? 1;
  const c = settings.contrast ?? 1;
  const s = settings.saturation ?? 1;
  const g = settings.gamma ?? 1;

  const isDefault = b === 1 && c === 1 && s === 1 && g === 1;
  if (isDefault) return null;

  const brightnessOverlay = b > 1
    ? `rgba(255,255,255,${(b - 1) * 0.3})`
    : b < 1
      ? `rgba(0,0,0,${(1 - b) * 0.5})`
      : 'transparent';

  const contrastOverlay = c !== 1
    ? `rgba(128,128,128,${Math.abs(c - 1) * 0.15})`
    : 'transparent';

  const gammaOverlay = g !== 1
    ? `rgba(0,0,0,${Math.abs(g - 1) * 0.1})`
    : 'transparent';

  return (
    <>
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: brightnessOverlay,
          opacity: 0.5,
          zIndex: 15,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: contrastOverlay,
          opacity: 0.3,
          zIndex: 16,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: gammaOverlay,
          opacity: 0.2,
          zIndex: 17,
        }}
      />
    </>
  );
}
