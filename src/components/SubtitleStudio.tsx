import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { usePerVideoSubtitleSettings } from '../storage';
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
  const { mergedSubtitleSettings: s, hasPerVideoSettings, updatePerVideo, deletePerVideo } = usePerVideoSubtitleSettings();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Subtitle Studio</Text>
        {onClose && <Pressable onPress={onClose}><Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>Done</Text></Pressable>}
      </View>

      {hasPerVideoSettings && (
        <Pressable onPress={deletePerVideo} style={{ marginBottom: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, backgroundColor: colors.error, alignSelf: 'flex-start' }}>
          <Text style={{ color: '#fff', fontSize: typography.sizes.xs }}>Reset to Global</Text>
        </Pressable>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Family</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {SUBTITLE_FONTS.map((f) => (
          <Pressable key={f} onPress={() => updatePerVideo({ subtitleFontFamily: f })} style={{
            paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: s.subtitleFontFamily === f ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: s.subtitleFontFamily === f ? colors.background : colors.text, fontSize: typography.sizes.xs, fontFamily: f }}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Size</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {FONT_SIZES.map((fs) => (
          <Pressable key={fs} onPress={() => updatePerVideo({ subtitleFontSize: fs })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            backgroundColor: s.subtitleFontSize === fs ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: s.subtitleFontSize === fs ? colors.background : colors.text, fontSize: typography.sizes.xs }}>{fs}</Text>
          </Pressable>
        ))}
      </View>

      <ColorPicker
        label="Font Color"
        value={s.subtitleFontColor}
        onChange={(v) => updatePerVideo({ subtitleFontColor: v })}
      />

      <ColorPicker
        label="Background Color"
        value={s.subtitleBackgroundColor}
        onChange={(v) => updatePerVideo({ subtitleBackgroundColor: v })}
      />

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Effects</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <Pressable onPress={() => updatePerVideo({ subtitleShadow: !s.subtitleShadow })} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: s.subtitleShadow ? colors.primary : colors.surfaceVariant,
        }}>
          <Text style={{ color: s.subtitleShadow ? colors.background : colors.text, fontSize: typography.sizes.sm }}>Shadow</Text>
        </Pressable>
        <Pressable onPress={() => updatePerVideo({ subtitleOutline: !s.subtitleOutline })} style={{
          flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
          borderRadius: borderRadius.md,
          backgroundColor: s.subtitleOutline ? colors.primary : colors.surfaceVariant,
        }}>
          <Text style={{ color: s.subtitleOutline ? colors.background : colors.text, fontSize: typography.sizes.sm }}>Outline</Text>
        </Pressable>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Position</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {POSITIONS.map((p) => (
          <Pressable key={p} onPress={() => updatePerVideo({ subtitlePosition: p })} style={{
            flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
            borderRadius: borderRadius.md,
            backgroundColor: s.subtitlePosition === p ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: s.subtitlePosition === p ? colors.background : colors.text, fontSize: typography.sizes.sm, textTransform: 'capitalize' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Offset (seconds)</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md }}>
        {[-5, -2, -1, 0, 1, 2, 5].map((o) => (
          <Pressable key={o} onPress={() => updatePerVideo({ subtitleOffset: o })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
            borderRadius: borderRadius.md,
            backgroundColor: s.subtitleOffset === o ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: s.subtitleOffset === o ? colors.background : colors.text, fontSize: typography.sizes.xs }}>{o > 0 ? `+${o}` : o}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
