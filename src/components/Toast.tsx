import { useEffect, useMemo } from 'react';
import { Text, Animated } from 'react-native';
import { useTheme } from '../theme';

interface ToastProps {
  message: string;
  visible: boolean;
  duration?: number;
  onHide: () => void;
}

export function Toast({ message, visible, duration = 2000, onHide }: ToastProps) {
  const { theme } = useTheme();
  const { spacing, borderRadius } = theme;
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 180,
        left: spacing.xl,
        right: spacing.xl,
        alignItems: 'center',
        zIndex: 200,
        opacity,
      }}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 14,
          fontWeight: '600',
          backgroundColor: 'rgba(0,0,0,0.85)',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
