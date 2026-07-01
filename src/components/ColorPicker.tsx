import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useTheme } from '../theme';

const PRESET_COLORS = [
  '#ffffff', '#cccccc', '#999999', '#666666', '#000000',
  '#ff0000', '#ff4444', '#ff8888', '#cc0000', '#880000',
  '#00ff00', '#44ff44', '#88ff88', '#00cc00', '#008800',
  '#0000ff', '#4444ff', '#8888ff', '#0000cc', '#000088',
  '#ffff00', '#ffff44', '#ffff88', '#ffcc00', '#ffaa00',
  '#00ffff', '#44ffff', '#88ffff', '#00cccc', '#008888',
  '#ff00ff', '#ff44ff', '#ff88ff', '#cc00cc', '#880088',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const [hexInput, setHexInput] = useState(value);
  const [showInput, setShowInput] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
        {PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => { onChange(c); setHexInput(c); }}
            style={{
              width: 28, height: 28, borderRadius: 14, backgroundColor: c,
              borderWidth: value === c ? 2 : 0.5,
              borderColor: value === c ? colors.primary : colors.borderVariant,
            }}
          />
        ))}
      </View>
      <Pressable onPress={() => setShowInput(!showInput)}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.xs }}>{showInput ? 'Hide custom' : 'Custom hex...'}</Text>
      </Pressable>
      {showInput && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
          <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: hexInput }} />
          <TextInput
            value={hexInput}
            onChangeText={(v) => { setHexInput(v); if (/^#[0-9a-fA-F]{3,8}$/.test(v)) onChange(v); }}
            placeholder="#rrggbb"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text,
              paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
              borderRadius: borderRadius.md, fontSize: typography.sizes.sm,
            }}
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
        <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: value }} />
        <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>{value}</Text>
      </View>
    </View>
  );
}
