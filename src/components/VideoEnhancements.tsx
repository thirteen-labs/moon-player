import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useSettings } from '../storage';

type AspectRatio = 'auto' | '16:9' | '4:3' | '1:1' | '3:2' | '21:9';
type Rotate = 0 | 90 | 180 | 270;
interface VideoEnhancementsProps {
  currentRatio?: AspectRatio;
  currentRotate?: Rotate;
  currentMirror?: boolean;
  currentZoom?: 'contain' | 'cover';
  onRatioChange?: (ratio: AspectRatio) => void;
  onRotateChange?: (rotate: Rotate) => void;
  onMirrorChange?: (mirror: boolean) => void;
  onZoomChange?: (zoom: 'contain' | 'cover') => void;
  onClose?: () => void;
}

const RATIOS: AspectRatio[] = ['auto', '16:9', '4:3', '1:1', '3:2', '21:9'];
const ROTATIONS: Rotate[] = [0, 90, 180, 270];

export function VideoEnhancements({
  currentRatio = 'auto', currentRotate = 0, currentMirror = false,
  currentZoom = 'contain',
  onRatioChange, onRotateChange, onMirrorChange, onZoomChange, onClose,
}: VideoEnhancementsProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();

  return (
    <View style={{ padding: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Video</Text>
        {onClose && <Pressable onPress={onClose}><Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>Done</Text></Pressable>}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Aspect Ratio</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {RATIOS.map((r) => (
          <Pressable key={r} onPress={() => onRatioChange?.(r)} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: currentRatio === r ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: currentRatio === r ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Rotate</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg }}>
        {ROTATIONS.map((r) => (
          <Pressable key={r} onPress={() => onRotateChange?.(r)} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: currentRotate === r ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: currentRotate === r ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{r}°</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Pressable onPress={() => onMirrorChange?.(!currentMirror)} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: currentMirror ? colors.primary : colors.surfaceVariant,
        }}>
          <Text style={{ color: currentMirror ? colors.background : colors.text, fontSize: typography.sizes.sm }}>Mirror</Text>
        </Pressable>
        <Pressable onPress={() => onZoomChange?.(currentZoom === 'contain' ? 'cover' : 'contain')} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: colors.surfaceVariant,
        }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>{currentZoom === 'contain' ? 'Fit' : 'Fill'}</Text>
        </Pressable>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Adjustments</Text>
      {[
        { label: 'Brightness', key: 'brightness' as const, val: settings.brightness, min: 0, max: 2, step: 0.05 },
        { label: 'Contrast', key: 'contrast' as const, val: settings.contrast, min: 0, max: 2, step: 0.05 },
        { label: 'Saturation', key: 'saturation' as const, val: settings.saturation, min: 0, max: 2, step: 0.05 },
        { label: 'Gamma', key: 'gamma' as const, val: settings.gamma, min: 0.5, max: 2, step: 0.05 },
      ].map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm, width: 80 }}>{item.label}</Text>
          <View style={{ flex: 1, height: 32, justifyContent: 'center', marginHorizontal: spacing.sm }}>
            <View style={{ height: 4, backgroundColor: colors.surfaceVariant, borderRadius: 2 }}>
              <View style={{ width: `${((item.val - item.min) / (item.max - item.min)) * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 2 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Pressable onPress={() => updateSettings({ [item.key]: Math.max(item.min, Math.round((item.val - item.step) * 100) / 100) })} style={{ paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 10 }}>-</Text>
              </Pressable>
              <Text style={{ color: colors.textTertiary, fontSize: 10 }}>{item.val.toFixed(1)}</Text>
              <Pressable onPress={() => updateSettings({ [item.key]: Math.min(item.max, Math.round((item.val + item.step) * 100) / 100) })} style={{ paddingHorizontal: 4 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 10 }}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
