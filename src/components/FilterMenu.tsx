import { View, Text, Pressable, Modal } from 'react-native';
import { Paths } from 'expo-file-system';
import { useTheme } from '@/theme';
import { useSettings } from '@/storage';
import { useLibrary } from '@/library';
import { triggerHaptic } from '@/utils/haptics';
import { Icon } from './Icon';

interface FilterMenuProps {
  visible: boolean;
  onClose: () => void;
}

const SORT_OPTIONS: { id: 'name' | 'date' | 'duration'; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'date', label: 'Date Added' },
  { id: 'duration', label: 'Duration' },
];

export function FilterMenu({ visible, onClose }: FilterMenuProps) {
  const { colors, theme } = useTheme();
  const { spacing, borderRadius, typography } = theme;
  const { settings, updateSettings } = useSettings();
  const { scan } = useLibrary();

  const handleScanDevice = async () => {
    triggerHaptic('light');
    try {
      const roots = settings.scanDirectories.length > 0
        ? settings.scanDirectories
        : [Paths.document.uri];
      await scan(roots);
      onClose();
    } catch {
      // Scan failed or unavailable
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            padding: spacing.lg,
            paddingBottom: spacing['2xl'],
          }}
        >
          <Pressable
            onPress={handleScanDevice}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.primaryContainer,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Icon name="refresh" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold }}>
              Scan Device
            </Text>
          </Pressable>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: spacing.md,
            }}
          >
            Sort By
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => { triggerHaptic('light'); updateSettings({ defaultSort: opt.id }); onClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.md,
              }}
            >
              <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>{opt.label}</Text>
              {settings.defaultSort === opt.id ? <Icon name="heart" size={16} color={colors.primary} /> : null}
            </Pressable>
          ))}

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginVertical: spacing.md,
            }}
          >
            Layout
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable
              onPress={() => { triggerHaptic('light'); updateSettings({ defaultLayout: 'grid' }); onClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: settings.defaultLayout === 'grid' ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Icon name="grid" size={18} color={settings.defaultLayout === 'grid' ? colors.background : colors.text} />
              <Text style={{ color: settings.defaultLayout === 'grid' ? colors.background : colors.text, fontSize: typography.sizes.sm }}>
                Grid
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { triggerHaptic('light'); updateSettings({ defaultLayout: 'list' }); onClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: settings.defaultLayout === 'list' ? colors.primary : colors.surfaceVariant,
              }}
            >
              <Icon name="list" size={18} color={settings.defaultLayout === 'list' ? colors.background : colors.text} />
              <Text style={{ color: settings.defaultLayout === 'list' ? colors.background : colors.text, fontSize: typography.sizes.sm }}>
                List
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
