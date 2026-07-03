import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettings } from '../storage';

interface VideoFilterOverlayProps {
  enabled?: boolean;
}

function blend(channel: number, target: number, amount: number): number {
  return channel + (target - channel) * amount;
}

export function VideoFilterOverlay({ enabled = true }: VideoFilterOverlayProps) {
  const { settings } = useSettings();

  const b = settings.brightness ?? 1;
  const c = settings.contrast ?? 1;
  const s = settings.saturation ?? 1;
  const g = settings.gamma ?? 1;
  const t = settings.temperature ?? 0;

  const overlayColor = useMemo(() => {
    if (!enabled) return 'transparent';
    const isDefault = b === 1 && c === 1 && s === 1 && g === 1 && t === 0;
    if (isDefault) return 'transparent';
    let r = 128, gv = 128, bl = 128, a = 0;

    // Brightness: push toward white (255) or black (0)
    if (b > 1) {
      const amt = (b - 1) * 0.35;
      r = blend(r, 255, amt);
      gv = blend(gv, 255, amt);
      bl = blend(bl, 255, amt);
      a = blend(a, 0.5, amt);
    } else if (b < 1) {
      const amt = (1 - b) * 0.55;
      r = blend(r, 0, amt);
      gv = blend(gv, 0, amt);
      bl = blend(bl, 0, amt);
      a = blend(a, 0.5, amt);
    }

    // Contrast: push toward 128 (gray) for less, or toward extremes for more
    if (c < 1) {
      const amt = (1 - c) * 0.3;
      r = blend(r, 128, amt);
      gv = blend(gv, 128, amt);
      bl = blend(bl, 128, amt);
      a = blend(a, 0.3, amt);
    } else if (c > 1) {
      const amt = (c - 1) * 0.15;
      r = r > 128 ? blend(r, 255, amt) : blend(r, 0, amt);
      gv = gv > 128 ? blend(gv, 255, amt) : blend(gv, 0, amt);
      bl = bl > 128 ? blend(bl, 255, amt) : blend(bl, 0, amt);
      a = blend(a, 0.25, amt);
    }

    // Saturation: push toward gray (128,128,128) for desaturation
    if (s < 1) {
      const amt = (1 - s) * 0.4;
      r = blend(r, 128, amt);
      gv = blend(gv, 128, amt);
      bl = blend(bl, 128, amt);
      a = blend(a, 0.3, amt);
    } else if (s > 1) {
      // Boost saturation via subtle complementary push
      const amt = (s - 1) * 0.1;
      r = r >= 128 ? blend(r, 255, amt) : blend(r, 0, amt);
      gv = gv >= 128 ? blend(gv, 255, amt) : blend(gv, 0, amt);
      bl = bl >= 128 ? blend(bl, 255, amt) : blend(bl, 0, amt);
      a = blend(a, 0.15, amt);
    }

    // Gamma: subtle darkening (g > 1) or brightening (g < 1) of midtones
    if (g > 1) {
      const amt = (g - 1) * 0.12;
      r = blend(r, 0, amt);
      gv = blend(gv, 0, amt);
      bl = blend(bl, 0, amt);
      a = blend(a, 0.2, amt);
    } else if (g < 1) {
      const amt = (1 - g) * 0.08;
      r = blend(r, 255, amt);
      gv = blend(gv, 255, amt);
      bl = blend(bl, 255, amt);
      a = blend(a, 0.15, amt);
    }

    // Temperature: warm (orange) or cool (blue) tint
    if (t > 0) {
      const amt = t * 0.18;
      r = blend(r, 255, amt * 1.2);
      gv = blend(gv, 180, amt);
      bl = blend(bl, 80, amt);
      a = blend(a, 0.3, amt);
    } else if (t < 0) {
      const amt = Math.abs(t) * 0.18;
      r = blend(r, 80, amt);
      gv = blend(gv, 180, amt);
      bl = blend(bl, 255, amt * 1.2);
      a = blend(a, 0.3, amt);
    }

    return `rgba(${Math.round(r)},${Math.round(gv)},${Math.round(bl)},${Math.min(a, 0.6).toFixed(3)})`;
  }, [b, c, s, g, t, enabled]);

  return (
    <View
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFill,
        backgroundColor: overlayColor,
        zIndex: 15,
      }}
    />
  );
}
