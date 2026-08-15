import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput } from 'react-native';
import { useTheme } from '@/theme';
import { themes } from '@/theme';
import { useSettings } from '@/storage';
import type { SettingsData } from '@/storage';
import type { ThemeId, AccentId } from '@/theme/types';
import { TopBar } from '@/components/TopBar';

type SettingsPage = 'menu' | 'appearance' | 'playback' | 'gestures' | 'subtitles' | 'storage' | 'about';

const ALL_THEMES = Object.values(themes).map((t) => ({ id: t.id as ThemeId, name: t.name }));

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

export default function SettingsRoute() {
  const { colors, theme, themeId, setTheme, accentId, setAccent } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();
  const [page, setPage] = useState<SettingsPage>('menu');

  const menuItems = [
    { id: 'appearance' as SettingsPage, title: 'Appearance', subtitle: 'Theme, Accent', icon: '🎨' },
    { id: 'playback' as SettingsPage, title: 'Playback', subtitle: 'Speed, Defaults', icon: '▶' },
    { id: 'gestures' as SettingsPage, title: 'Gestures', subtitle: 'Customize Gestures', icon: '🖖' },
    { id: 'subtitles' as SettingsPage, title: 'Subtitles', subtitle: 'Style, Size, Color', icon: '💬' },
    { id: 'storage' as SettingsPage, title: 'Storage & Data', subtitle: 'Manage Storage', icon: '📁' },
    { id: 'about' as SettingsPage, title: 'About', subtitle: 'Version 1.0.0', icon: 'ℹ️' },
  ];

  const renderMenu = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>General</Text>
      <View style={{ paddingHorizontal: spacing.md }}>
        {menuItems.map((item, index, arr) => (
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
    </ScrollView>
  );

  const backLink = (
    <Pressable onPress={() => setPage('menu')} style={{ marginBottom: spacing.lg }}>
      <Text style={{ color: colors.primary, fontSize: typography.sizes.md }}>‹ Back</Text>
    </Pressable>
  );

  const header = (title: string) => (
    <Text style={{ color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg }}>{title}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Settings" showBack showFilter={false} showSearch={false} />
      {page === 'menu' && renderMenu()}

      {page === 'appearance' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
          {backLink}
          {header('Appearance')}
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Theme</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
            {ALL_THEMES.map((t) => (
              <Pressable key={t.id} onPress={() => setTheme(t.id)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: themeId === t.id ? colors.primary : colors.surfaceVariant }}>
                <Text style={{ color: themeId === t.id ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{t.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Accent Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
            <Pressable onPress={() => setAccent(null)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', borderWidth: accentId === null ? 2 : 0, borderColor: colors.primary }}>
              <Text style={{ color: colors.text, fontSize: 12 }}>×</Text>
            </Pressable>
            {ACCENTS.map((a) => (
              <Pressable key={a.id} onPress={() => setAccent(a.id)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color, borderWidth: accentId === a.id ? 2 : 0, borderColor: colors.text }} />
            ))}
          </View>
        </ScrollView>
      )}

      {page === 'playback' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
          {backLink}
          {header('Playback')}
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Default Speed</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
            {SPEEDS.map((s) => (
              <Pressable key={s} onPress={() => updateSettings({ playbackSpeed: s })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: settings.playbackSpeed === s ? colors.primary : colors.surfaceVariant }}>
                <Text style={{ color: settings.playbackSpeed === s ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{s}x</Text>
              </Pressable>
            ))}
          </View>
          <Row label="Auto-Resume" value={settings.autoResume} onValueChange={(v) => updateSettings({ autoResume: v })} />
          <Row label="Auto-Hide Controls" value={settings.autoHideControls} onValueChange={(v) => updateSettings({ autoHideControls: v })} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Skip Duration</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {[5, 10, 15, 20, 30].map((s) => (
              <Pressable key={s} onPress={() => updateSettings({ skipDuration: s })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: settings.skipDuration === s ? colors.primary : colors.surfaceVariant }}>
                <Text style={{ color: settings.skipDuration === s ? colors.background : colors.text, fontSize: typography.sizes.sm }}>{s}s</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {page === 'gestures' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
          {backLink}
          {header('Gestures')}
          {([
            { key: 'gestureVolume', label: 'Volume (vertical swipe right side)' },
            { key: 'gestureBrightness', label: 'Brightness (vertical swipe left side)' },
            { key: 'gestureSeek', label: 'Seek (horizontal swipe center)' },
            { key: 'gestureDoubleTap', label: 'Double-tap skip (±10s)' },
            { key: 'gestureLongPress', label: 'Long press (2x speed)' },
            { key: 'gesturePinch', label: 'Pinch to zoom' },
          ] as const).map((g) => (
            <Row key={g.key} label={g.label} value={Boolean(settings[g.key as keyof SettingsData])} onValueChange={(v) => updateSettings({ [g.key]: v })} />
          ))}
        </ScrollView>
      )}

      {page === 'subtitles' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}>
          {backLink}
          {header('Subtitles')}
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Font Size</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
            {FONT_SIZES.map((s) => (
              <Pressable key={s} onPress={() => updateSettings({ subtitleFontSize: s })} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: settings.subtitleFontSize === s ? colors.primary : colors.surfaceVariant }}>
                <Text style={{ color: settings.subtitleFontSize === s ? colors.background : colors.text, fontSize: 12 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Row label="Font Color" textValue={settings.subtitleFontColor} onTextChange={(v) => updateSettings({ subtitleFontColor: v })} />
          <Row label="Background Color" textValue={settings.subtitleBackgroundColor} onTextChange={(v) => updateSettings({ subtitleBackgroundColor: v })} />
          <Row label="Delay (seconds)" textValue={String(settings.subtitleOffset)} onTextChange={(v) => updateSettings({ subtitleOffset: Number(v) || 0 })} numeric />
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Effects</Text>
          <Row label="Drop Shadow" value={settings.subtitleShadow} onValueChange={(v) => updateSettings({ subtitleShadow: v })} />
          <Row label="Outline Stroke" value={settings.subtitleOutline} onValueChange={(v) => updateSettings({ subtitleOutline: v })} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginVertical: spacing.sm, textTransform: 'uppercase' }}>Position</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {(['bottom', 'top', 'middle'] as const).map((pos) => (
              <Pressable key={pos} onPress={() => updateSettings({ subtitlePosition: pos })} style={{ flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: settings.subtitlePosition === pos ? colors.primary : colors.surfaceVariant }}>
                <Text style={{ color: settings.subtitlePosition === pos ? colors.background : colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>{pos.charAt(0).toUpperCase() + pos.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {page === 'storage' && <StorageSettings onBack={() => setPage('menu')} />}
      {page === 'about' && <AboutSettings onBack={() => setPage('menu')} />}
    </View>
  );
}

function Row({
  label,
  value,
  onValueChange,
  textValue,
  onTextChange,
  numeric,
}: {
  label: string;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  textValue?: string;
  onTextChange?: (v: string) => void;
  numeric?: boolean;
}) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.text, fontSize: typography.sizes.md, flex: 1 }}>{label}</Text>
      {onValueChange ? (
        <Switch value={value ?? false} onValueChange={onValueChange} trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }} thumbColor={value ? colors.primary : colors.textTertiary} />
      ) : (
        <TextInput
          value={textValue}
          onChangeText={onTextChange}
          keyboardType={numeric ? 'numeric' : 'default'}
          style={{ backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, width: 120, textAlign: 'right' }}
        />
      )}
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
        const { Paths, File } = await import('expo-file-system');
        const dir = Paths.cache;
        if (dir.exists) {
          const entries = dir.list();
          let total = 0;
          for (const entry of entries) {
            if (entry instanceof File) total += entry.size || 0;
          }
          if (!cancelled) setCacheSize(total > 0 ? `${(total / (1024 * 1024)).toFixed(1)} MB` : '0 MB');
        } else if (!cancelled) setCacheSize('0 MB');
      } catch {
        if (!cancelled) setCacheSize('—');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleClearCache = async () => {
    try {
      const { Paths } = await import('expo-file-system');
      const dir = Paths.cache;
      if (dir.exists) {
        for (const entry of dir.list()) {
          try { entry.delete?.(); } catch {}
        }
      }
      setCacheSize('0 MB');
    } catch {}
  };

  const addDirectory = () => {
    const trimmed = newDir.trim();
    if (!trimmed || settings.scanDirectories.includes(trimmed)) return;
    updateSettings({ scanDirectories: [...settings.scanDirectories, trimmed] });
    setNewDir('');
  };

  const removeDirectory = (dir: string) => updateSettings({ scanDirectories: settings.scanDirectories.filter((d) => d !== dir) });

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
            <Pressable onPress={() => removeDirectory(dir)} hitSlop={8} style={{ padding: spacing.xs }}>
              <Text style={{ color: colors.error, fontSize: 14 }}>✕</Text>
            </Pressable>
          </View>
        ))
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <TextInput value={newDir} onChangeText={setNewDir} placeholder="/storage/emulated/0/Movies" placeholderTextColor={colors.textTertiary} style={{ flex: 1, backgroundColor: colors.surfaceVariant, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md }} autoCapitalize="none" autoCorrect={false} />
        <Pressable onPress={addDirectory} style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' }}>
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
      <Pressable onPress={async () => { const { SettingsRepository, closeDatabase } = await import('@/database'); await SettingsRepository.clearAll(); await closeDatabase(); }} style={{ backgroundColor: colors.errorContainer, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm }}>
        <Text style={{ color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>Clear All Data</Text>
      </Pressable>
    </ScrollView>
  );
}

function AboutSettings({ onBack }: { onBack: () => void }) {
  const { colors, theme } = useTheme();
  const { spacing, typography } = theme;
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
    </ScrollView>
  );
}
