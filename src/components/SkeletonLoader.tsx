import { useEffect, useMemo } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const opacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  const { theme } = useTheme();
  const { spacing, borderRadius: br } = theme;

  return (
    <View style={{ padding: spacing.md, gap: spacing.sm }}>
      <SkeletonLoader height={120} borderRadius={br.lg} />
      <SkeletonLoader width="80%" height={14} />
      <SkeletonLoader width="50%" height={12} />
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  const { theme } = useTheme();
  const { spacing, borderRadius: br } = theme;

  return (
    <View style={{ gap: spacing.md, paddingHorizontal: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <SkeletonLoader width={80} height={56} borderRadius={br.sm} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLoader width="70%" height={14} />
            <SkeletonLoader width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function GridSkeleton({ columns = 3, count = 6 }: { columns?: number; count?: number }) {
  const { theme } = useTheme();
  const { spacing, borderRadius: br } = theme;

  const items = Array.from({ length: count });
  const rows = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View style={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: spacing.sm }}>
          {row.map((_, ci) => (
            <View key={ci} style={{ flex: 1 }}>
              <SkeletonLoader height={180} borderRadius={br.lg} />
              <View style={{ marginTop: spacing.xs, gap: 4 }}>
                <SkeletonLoader width="80%" height={12} />
                <SkeletonLoader width="40%" height={10} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
