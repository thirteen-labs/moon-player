import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { useSettings } from '../storage';
import { ColorPicker } from './ColorPicker';

const SUBTITLE_FONTS = [
  'System', 'monospace', 'serif', 'sans-serif',
  'sans-serif-light', 'sans-serif-medium', 'sans-serif-condensed',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42];
const POSITIONS = ['bottom', 'middle', 'top'] as const;

interface SubtitleStudioProps {
  onClose?: () => void;
}

export function SubtitleStudio({ onClose }: SubtitleStudioProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Subtitle Studio</Text>
        {onClose && <Pressable onPress={onClose}><Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>Done</Text></Pressable>}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Family</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {SUBTITLE_FONTS.map((f) => (
          <Pressable key={f} onPress={() => updateSettings({ subtitleFontFamily: f })} style={{
            paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: settings.subtitleFontFamily === f ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitleFontFamily === f ? colors.background : colors.text, fontSize: typography.sizes.xs, fontFamily: f }}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Size</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {FONT_SIZES.map((s) => (
          <Pressable key={s} onPress={() => updateSettings({ subtitleFontSize: s })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            backgroundColor: settings.subtitleFontSize === s ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitleFontSize === s ? colors.background : colors.text, fontSize: typography.sizes.xs }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <ColorPicker
        label="Font Color"
        value={settings.subtitleFontColor}
        onChange={(v) => updateSettings({ subtitleFontColor: v })}
      />

      <ColorPicker
        label="Background Color"
        value={settings.subtitleBackgroundColor}
        onChange={(v) => updateSettings({ subtitleBackgroundColor: v })}
      />

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Effects</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <Pressable onPress={() => updateSettings({ subtitleShadow: !settings.subtitleShadow })} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: settings.subtitleShadow ? colors.primary : colors.surfaceVariant,
        }}>
          <Text style={{ color: settings.subtitleShadow ? colors.background : colors.text, fontSize: typography.sizes.sm }}>Shadow</Text>
        </Pressable>
        <Pressable onPress={() => updateSettings({ subtitleOutline: !settings.subtitleOutline })} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: settings.subtitleOutline ? colors.primary : colors.surfaceVariant,
        }}>
          <Text style={{ color: settings.subtitleOutline ? colors.background : colors.text, fontSize: typography.sizes.sm }}>Outline</Text>
        </Pressable>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Position</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {POSITIONS.map((p) => (
          <Pressable key={p} onPress={() => updateSettings({ subtitlePosition: p })} style={{
            flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
            borderRadius: borderRadius.md,
            backgroundColor: settings.subtitlePosition === p ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitlePosition === p ? colors.background : colors.text, fontSize: typography.sizes.sm, textTransform: 'capitalize' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Offset (seconds)</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md }}>
        {[-5, -2, -1, 0, 1, 2, 5].map((s) => (
          <Pressable key={s} onPress={() => updateSettings({ subtitleOffset: s })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            backgroundColor: settings.subtitleOffset === s ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitleOffset === s ? colors.background : colors.text, fontSize: typography.sizes.xs }}>{s > 0 ? `+${s}` : s}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
