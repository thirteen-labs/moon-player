import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { useSettings } from '../storage';

const EQ_BANDS = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'];
const PRESETS: Record<string, number[]> = {
  Normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Classical: [5, 4, 3, 2, 1, 1, 2, 3, 4, 5],
  Dance: [6, 4, 1, 0, 0, 2, 4, 6, 6, 5],
  Rock: [5, 4, 2, 1, 0, 1, 3, 4, 5, 4],
  Pop: [2, 1, 0, 1, 3, 4, 3, 2, 1, 1],
  Jazz: [4, 3, 2, 1, 1, 2, 3, 4, 5, 4],
  Voice: [3, 2, 1, 0, 0, 1, 2, 3, 4, 3],
  Bass: [8, 6, 4, 2, 0, 0, 1, 2, 3, 4],
};

interface AudioEqualizerProps {
  onClose?: () => void;
}

function SliderBar({ value, min, max, onChange, height: barHeight }: { value: number; min: number; max: number; onChange: (v: number) => void; height: number }) {
  const { colors } = useTheme();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={{ flex: 1, alignItems: 'center', height: barHeight, justifyContent: 'flex-end' }}>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{ padding: 2 }}
        accessibilityLabel="Increase band"
      >
        <Text style={{ color: colors.textTertiary, fontSize: 8 }}>+</Text>
      </Pressable>
      <View
        style={{
          width: '60%', height: `${Math.max(pct, 1)}%`,
          backgroundColor: value > 0 ? colors.success : value < 0 ? colors.error : colors.primary,
          borderRadius: 2, minHeight: 2, opacity: 0.8,
        }}
      />
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{ padding: 2 }}
        accessibilityLabel="Decrease band"
      >
        <Text style={{ color: colors.textTertiary, fontSize: 8 }}>-</Text>
      </Pressable>
    </View>
  );
}

export function AudioEqualizer({ onClose }: AudioEqualizerProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();
  const [selectedPreset, setSelectedPreset] = useState<string>('Normal');

  const applyPreset = (name: string) => {
    setSelectedPreset(name);
    updateSettings({ audioEqualizer: PRESETS[name] });
  };

  const adjustBand = (index: number, delta: number) => {
    const newEq = [...(settings.audioEqualizer || PRESETS.Normal)];
    newEq[index] = Math.max(-20, Math.min(20, (newEq[index] || 0) + delta));
    updateSettings({ audioEqualizer: newEq });
    setSelectedPreset('');
  };

  return (
    <View style={{ padding: spacing.md }} accessibilityLabel="Audio equalizer panel">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Equalizer</Text>
        {onClose && <Pressable onPress={onClose}><Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>Done</Text></Pressable>}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Presets</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg }}>
        {Object.keys(PRESETS).map((name) => (
          <Pressable key={name} onPress={() => applyPreset(name)} style={{
            paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: selectedPreset === name ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: selectedPreset === name ? colors.background : colors.text, fontSize: typography.sizes.xs }}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200 }}>
        {(settings.audioEqualizer || PRESETS.Normal).map((val, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <SliderBar value={val} min={-20} max={20} onChange={(v) => adjustBand(i, v - val)} height={200} />
            <Text style={{ color: colors.textTertiary, fontSize: 7, marginTop: 2 }}>{EQ_BANDS[i]}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Advanced</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>Volume Boost</Text>
        <Pressable onPress={() => updateSettings({ volumeBoost: Math.min(3, Math.round((settings.volumeBoost + 0.1) * 10) / 10) })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceVariant }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>{settings.volumeBoost.toFixed(1)}x</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>Bass Boost</Text>
        <Pressable onPress={() => updateSettings({ bassBoost: Math.max(-12, Math.min(12, settings.bassBoost + 1)) })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceVariant }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>{settings.bassBoost > 0 ? `+${settings.bassBoost}` : settings.bassBoost}dB</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>Dialogue Boost</Text>
        <Pressable onPress={() => updateSettings({ dialogueBoost: !settings.dialogueBoost })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: settings.dialogueBoost ? colors.primary : colors.surfaceVariant }}>
          <Text style={{ color: settings.dialogueBoost ? colors.background : colors.text, fontSize: 12 }}>{settings.dialogueBoost ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>Normalization</Text>
        <Pressable onPress={() => updateSettings({ audioNormalization: !settings.audioNormalization })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: settings.audioNormalization ? colors.primary : colors.surfaceVariant }}>
          <Text style={{ color: settings.audioNormalization ? colors.background : colors.text, fontSize: 12 }}>{settings.audioNormalization ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
