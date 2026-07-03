import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput } from 'react-native';
import { useTheme } from '../theme';
import { useRouter } from 'expo-router';
import { useSettings } from '../storage';
import type { SettingsData } from '../storage';
import type { ThemeId, AccentId } from '../theme/types';

type SettingsPage = 'menu' | 'appearance' | 'playback' | 'gestures' | 'subtitles' | 'audio' | 'storage' | 'about';

const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'dark', name: 'Dark' }, { id: 'light', name: 'Light' }, { id: 'oled', name: 'OLED' },
  { id: 'midnight', name: 'Midnight' }, { id: 'slate', name: 'Slate' }, { id: 'charcoal', name: 'Charcoal' },
  { id: 'cyber', name: 'Cyber' }, { id: 'neon', name: 'Neon' }, { id: 'synthwave', name: 'Synthwave' },
  { id: 'forest', name: 'Forest' }, { id: 'ocean', name: 'Ocean' }, { id: 'nord', name: 'Nord' },
];

const ACCENTS: { id: AccentId; name: string; color: string }[] = [
  { id: 'indigo', name: 'Indigo', color: '#6366f1' }, { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'sky', name: 'Sky', color: '#0ea5e9' }, { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'teal', name: 'Teal', color: '#14b8a6' }, { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'green', name: 'Green', color: '#22c55e' }, { id: 'yellow', name: 'Yellow', color: '#eab308' },
  { id: 'orange', name: 'Orange', color: '#f97316' }, { id: 'red', name: 'Red', color: '#ef4444' },
  { id: 'pink', name: 'Pink', color: '#ec4899' }, { id: 'purple', name: 'Purple', color: '#a855f7' },
];

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
const EQ_BANDS = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz'];

export function SettingsScreen() {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const { setTheme, themeId, setAccent, accentId } = useTheme();
  const [page, setPage] = useState<SettingsPage>('menu');

  const renderMenu = () => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>Settings</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/search')}>
          <Text style={{ color: colors.text, fontSize: 22 }}>🔍</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>General</Text>
        <View style={{ paddingHorizontal: spacing.md }}>
          {[
            { id: 'appearance' as SettingsPage, title: 'Appearance', subtitle: 'Theme, Accent', icon: '🎨' },
            { id: 'playback' as SettingsPage, title: 'Playback', subtitle: 'Speed, Defaults', icon: '▶' },
            { id: 'gestures' as SettingsPage, title: 'Gestures', subtitle: 'Customize Gestures', icon: '🖖' },
            { id: 'subtitles' as SettingsPage, title: 'Subtitles', subtitle: 'Style, Size, Color', icon: '💬' },
            { id: 'audio' as SettingsPage, title: 'Audio', subtitle: 'Equalizer, Volume Boost', icon: '🔊' },
            { id: 'storage' as SettingsPage, title: 'Storage & Data', subtitle: 'Manage Storage', icon: '📁' },
            { id: 'about' as SettingsPage, title: 'About', subtitle: 'Version 1.0.0', icon: 'ℹ️' },
          ].map((item, index, arr) => (
            <Pressable key={item.id} onPress={() => setPage(item.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: index < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>{item.title}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginTop: 2 }}>{item.subtitle}</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 16 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>Coming Soon</Text>
        <View style={{ paddingHorizontal: spacing.md }}>
          {[
            { screen: 'networkStreaming' as const, title: 'Network Streaming', subtitle: 'SMB/NAS, HTTP Server', icon: '🌐' },
            { screen: 'backupRestore' as const, title: 'Backup & Restore', subtitle: 'Library + Settings', icon: '💾' },
            { screen: 'pluginSystem' as const, title: 'Plugin System', subtitle: 'Extend Aura', icon: '🧩' },
            { screen: 'aiOrganization' as const, title: 'AI Organization', subtitle: 'On-device ML', icon: '🤖' },
            { screen: 'layouts' as const, title: 'Responsive Layouts', subtitle: 'Desktop, TV, Tablet', icon: '📱' },
            { screen: 'chromecast' as const, title: 'Chromecast', subtitle: 'Cast to devices', icon: '📡' },
            { screen: 'crossSync' as const, title: 'Cross-Device Sync', subtitle: 'Seamless sync', icon: '🔄' },
          ].map((item, index, arr) => (
            <Pressable key={item.screen} onPress={() => router.push(`/extras/${item.screen}`)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: index < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <View style={{ width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>{item.title}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginTop: 2 }}>{item.subtitle}</Text>
              </View>
              <View style={{ backgroundColor: colors.primaryContainer, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, marginRight: spacing.sm }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>v2.0</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 16 }}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );

  const renderAppearance = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Appearance</Text>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Theme</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {THEMES.map((t) => (
          <Pressable key={t.id} onPress={() => setTheme(t.id)} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: themeId === t.id ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: themeId === t.id ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{t.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Accent Color</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        <Pressable onPress={() => setAccent(null)} style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: accentId === null ? 2 : 0, borderColor: colors.primary,
        }}>
          <Text style={{ color: colors.text, fontSize: 12 }}>×</Text>
        </Pressable>
        {ACCENTS.map((a) => (
          <Pressable key={a.id} onPress={() => setAccent(a.id)} style={{
            width: 36, height: 36, borderRadius: 18, backgroundColor: a.color,
            borderWidth: accentId === a.id ? 2 : 0, borderColor: colors.text,
          }} />
        ))}
      </View>
    </ScrollView>
  );

  const renderPlayback = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Playback</Text>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Default Speed</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
        {SPEEDS.map((s) => (
          <Pressable key={s} onPress={() => updateSettings({ playbackSpeed: s })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: settings.playbackSpeed === s ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.playbackSpeed === s ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{s}x</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Auto-Resume</Text>
        <Switch value={settings.autoResume} onValueChange={(v) => updateSettings({ autoResume: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.autoResume ? colors.primary : colors.textTertiary} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Auto-Hide Controls</Text>
        <Switch value={settings.autoHideControls} onValueChange={(v) => updateSettings({ autoHideControls: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.autoHideControls ? colors.primary : colors.textTertiary} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Skip Duration</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        {[5, 10, 15, 20, 30].map((s) => (
          <Pressable key={s} onPress={() => updateSettings({ skipDuration: s })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: settings.skipDuration === s ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.skipDuration === s ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{s}s</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderGestures = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Gestures</Text>

      {[
        { key: 'gestureVolume' as const, label: 'Volume (vertical swipe right side)' },
        { key: 'gestureBrightness' as const, label: 'Brightness (vertical swipe left side)' },
        { key: 'gestureSeek' as const, label: 'Seek (horizontal swipe center)' },
        { key: 'gestureDoubleTap' as const, label: 'Double-tap skip (±10s)' },
        { key: 'gestureLongPress' as const, label: 'Long press (2x speed)' },
        { key: 'gesturePinch' as const, label: 'Pinch to zoom' },
      ].map((g) => (
        <View key={g.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.md, flex: 1 }}>{g.label}</Text>
          <Switch value={Boolean(settings[g.key as keyof SettingsData])} onValueChange={(v) => updateSettings({ [g.key]: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={Boolean(settings[g.key as keyof SettingsData]) ? colors.primary : colors.textTertiary} />
        </View>
      ))}
    </ScrollView>
  );

  const renderSubtitles = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Subtitles</Text>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Size</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {FONT_SIZES.map((s) => (
          <Pressable key={s} onPress={() => updateSettings({ subtitleFontSize: s })} style={{
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: settings.subtitleFontSize === s ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitleFontSize === s ? colors.background : colors.text, fontSize: 12 }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Font Color</Text>
        <TextInput value={settings.subtitleFontColor} onChangeText={(v) => updateSettings({ subtitleFontColor: v })} style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 120, textAlign: 'right' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Background Color</Text>
        <TextInput value={settings.subtitleBackgroundColor} onChangeText={(v) => updateSettings({ subtitleBackgroundColor: v })} style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 120, textAlign: 'right' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Delay (seconds)</Text>
        <TextInput value={String(settings.subtitleOffset)} onChangeText={(v) => updateSettings({ subtitleOffset: Number(v) || 0 })} keyboardType="numeric" style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 80, textAlign: 'right' }} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Effects</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Drop Shadow</Text>
        <Switch value={settings.subtitleShadow} onValueChange={(v) => updateSettings({ subtitleShadow: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.subtitleShadow ? colors.primary : colors.textTertiary} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Outline Stroke</Text>
        <Switch value={settings.subtitleOutline} onValueChange={(v) => updateSettings({ subtitleOutline: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.subtitleOutline ? colors.primary : colors.textTertiary} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Position</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        {(['bottom', 'top', 'middle'] as const).map((pos) => (
          <Pressable key={pos} onPress={() => updateSettings({ subtitlePosition: pos })} style={{
            flex: 1, paddingVertical: spacing.md, alignItems: 'center',
            borderRadius: borderRadius.md,
            backgroundColor: settings.subtitlePosition === pos ? colors.primary : colors.surfaceVariant,
          }}>
            <Text style={{ color: settings.subtitlePosition === pos ? colors.background : colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderAudio = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Audio</Text>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Equalizer (10-Band)</Text>
      <View style={{ marginBottom: spacing.xl }}>
        {EQ_BANDS.map((band, i) => (
          <View key={band} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, width: 50 }}>{band}</Text>
            <View style={{ flex: 1, height: 4, backgroundColor: colors.surfaceVariant, borderRadius: 2, marginHorizontal: spacing.sm }}>
              <View style={{ width: `${((settings.audioEqualizer[i] || 0) + 20) / 40 * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 2 }} />
            </View>
            <Text style={{ color: colors.text, fontSize: typography.sizes.xs, width: 40, textAlign: 'right' }}>{settings.audioEqualizer[i] || 0}dB</Text>
          </View>
        ))}
        <Pressable onPress={() => updateSettings({ audioEqualizer: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })} style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.sm }}>Reset Equalizer</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Bass Boost</Text>
        <TextInput value={String(settings.bassBoost)} onChangeText={(v) => updateSettings({ bassBoost: Number(v) || 0 })} keyboardType="numeric" style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 60, textAlign: 'right' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Dialogue Boost</Text>
        <Switch value={settings.dialogueBoost} onValueChange={(v) => updateSettings({ dialogueBoost: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.dialogueBoost ? colors.primary : colors.textTertiary} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Loudness Normalization</Text>
        <Switch value={settings.audioNormalization} onValueChange={(v) => updateSettings({ audioNormalization: v })} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={settings.audioNormalization ? colors.primary : colors.textTertiary} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>Volume Boost</Text>
        <TextInput value={String(settings.volumeBoost)} onChangeText={(v) => updateSettings({ volumeBoost: Math.max(1, Math.min(3, Number(v) || 1)) })} keyboardType="numeric" style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 60, textAlign: 'right' }} />
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {page === 'menu' && renderMenu()}
      {page === 'appearance' && renderAppearance()}
      {page === 'playback' && renderPlayback()}
      {page === 'gestures' && renderGestures()}
      {page === 'subtitles' && renderSubtitles()}
      {page === 'audio' && renderAudio()}
      {page === 'storage' && <StorageSettings onBack={() => setPage('menu')} />}
      {page === 'about' && <AboutSettings onBack={() => setPage('menu')} />}
    </View>
  );
}

function StorageSettings({ onBack }: { onBack: () => void }) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();
  const [cacheSize, setCacheSize] = useState('Calculating...');
  const [newDir, setNewDir] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { cacheDirectory, Directory, File } = await import('expo-file-system');
        const dir = new Directory(cacheDirectory);
        if (dir.exists) {
          const entries = dir.list();
          let total = 0;
          for (const entry of entries) {
            if (entry instanceof File) {
              total += entry.size || 0;
            }
          }
          if (!cancelled) setCacheSize(total > 0 ? `${(total / (1024 * 1024)).toFixed(1)} MB` : '0 MB');
        } else {
          if (!cancelled) setCacheSize('0 MB');
        }
      } catch {
        if (!cancelled) setCacheSize('—');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleClearCache = async () => {
    try {
      const { cacheDirectory, Directory } = await import('expo-file-system');
      const dir = new Directory(cacheDirectory);
      if (dir.exists) {
        for (const entry of dir.list()) {
          try { entry.delete?.(); } catch {}
        }
      }
      setCacheSize('0 MB');
    } catch {}
  };

  const handleAddDirectory = () => {
    const trimmed = newDir.trim();
    if (!trimmed) return;
    if (settings.scanDirectories.includes(trimmed)) return;
    updateSettings({ scanDirectories: [...settings.scanDirectories, trimmed] });
    setNewDir('');
  };

  const handleRemoveDirectory = (dir: string) => {
    updateSettings({ scanDirectories: settings.scanDirectories.filter((d) => d !== dir) });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={onBack} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>Storage & Data</Text>

      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Scan Directories</Text>
      {settings.scanDirectories.length === 0 ? (
        <View style={{ backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md }}>
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.sm }}>No scan directories added. Add a folder path below to start scanning.</Text>
        </View>
      ) : (
        settings.scanDirectories.map((dir, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: typography.sizes.sm, flex: 1 }} numberOfLines={1}>{dir}</Text>
            <Pressable onPress={() => handleRemoveDirectory(dir)} hitSlop={8} style={{ padding: spacing.xs }}>
              <Text style={{ color: colors.error, fontSize: 14 }}>✕</Text>
            </Pressable>
          </View>
        ))
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <TextInput
          value={newDir}
          onChangeText={setNewDir}
          placeholder="/storage/emulated/0/Movies"
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={handleAddDirectory} style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.background, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>Add</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>Cache Size</Text>
        <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>{cacheSize}</Text>
      </View>

      <Pressable onPress={handleClearCache} style={{ backgroundColor: colors.errorContainer, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.md }}>
        <Text style={{ color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>Clear Cache</Text>
      </Pressable>
      <Pressable onPress={async () => {
        const { SettingsRepository, closeDatabase } = await import('../database');
        await SettingsRepository.clearAll();
        await closeDatabase();
      }} style={{ backgroundColor: colors.errorContainer, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm }}>
        <Text style={{ color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>Clear All Data</Text>
      </Pressable>
    </ScrollView>
  );
}

function AboutSettings({ onBack }: { onBack: () => void }) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;
  const [showLicenses, setShowLicenses] = useState(false);

  const licenses = [
    { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native/blob/main/LICENSE' },
    { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo/blob/main/LICENSE' },
    { name: 'react-native-video', license: 'MIT', url: 'https://github.com/react-native-video/react-native-video/blob/main/LICENSE' },
    { name: 'NativeWind', license: 'MIT', url: 'https://github.com/nativewind/nativewind/blob/main/LICENSE' },
    { name: 'react-native-reanimated', license: 'MIT', url: 'https://github.com/software-mansion/react-native-reanimated/blob/main/LICENSE' },
    { name: 'react-native-mmkv', license: 'MIT', url: 'https://github.com/mrousavy/react-native-mmkv/blob/main/LICENSE' },
    { name: '@gorhom/bottom-sheet', license: 'MIT', url: 'https://github.com/gorhom/bottom-sheet/blob/master/LICENSE' },
    { name: '@shopify/flash-list', license: 'MIT', url: 'https://github.com/Shopify/flash-list/blob/main/LICENSE' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
      <Pressable onPress={onBack} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
      </Pressable>
      <View style={{ alignItems: 'center', marginBottom: spacing['2xl'], marginTop: spacing.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 36, color: colors.background }}>🎬</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold }}>Aura</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.xs }}>Offline Video Player</Text>
        <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs, marginTop: spacing.xs }}>Version 1.0.0</Text>
      </View>

      {[
        { label: 'Developer', value: 'Aura Team' },
        { label: 'Framework', value: 'React Native + Expo' },
        { label: 'Platform', value: 'Android / iOS / Web' },
        { label: 'Open Source', value: 'MIT License' },
      ].map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>{item.label}</Text>
          <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>{item.value}</Text>
        </View>
      ))}

      <Pressable onPress={() => setShowLicenses(!showLicenses)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>Open Source Licenses</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 16 }}>{showLicenses ? '▾' : '▸'}</Text>
      </Pressable>
      {showLicenses && licenses.map((lic) => (
        <View key={lic.name} style={{ paddingVertical: spacing.sm, paddingLeft: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>{lic.name}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: typography.sizes.xs }}>{lic.license} License</Text>
        </View>
      ))}
    </ScrollView>
  );
}
