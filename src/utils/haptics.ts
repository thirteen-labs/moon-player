export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' = 'light') {
  try {
    const HapticFeedback = require('expo-haptics')?.default; // eslint-disable-line @typescript-eslint/no-require-imports
    if (!HapticFeedback) return;

    const map: Record<string, unknown> = {
      light: HapticFeedback.ImpactFeedbackStyle.Light,
      medium: HapticFeedback.ImpactFeedbackStyle.Medium,
      heavy: HapticFeedback.ImpactFeedbackStyle.Heavy,
      selection: 'selection',
      success: 'success',
      error: 'error',
    };

    const value = map[type];
    if (type === 'selection') {
      HapticFeedback.selectionAsync();
    } else if (type === 'success' || type === 'error') {
      HapticFeedback.notificationAsync(
        type === 'success'
          ? HapticFeedback.NotificationFeedbackType.Success
          : HapticFeedback.NotificationFeedbackType.Error
      );
    } else {
      HapticFeedback.impactAsync(value);
    }
  } catch {
    // haptics not available
  }
}
