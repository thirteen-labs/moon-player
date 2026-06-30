import type { AccentColor, AccentId } from './types';

export const accentColors: Record<AccentId, AccentColor> = {
  indigo: { id: 'indigo', name: 'Indigo', primary: '#6366F1', primaryContainer: '#312E81', tabBarActive: '#818CF8' },
  blue: { id: 'blue', name: 'Blue', primary: '#3B82F6', primaryContainer: '#1E3A5F', tabBarActive: '#60A5FA' },
  sky: { id: 'sky', name: 'Sky', primary: '#38BDF8', primaryContainer: '#0C4A6E', tabBarActive: '#7DD3FC' },
  cyan: { id: 'cyan', name: 'Cyan', primary: '#22D3EE', primaryContainer: '#155E75', tabBarActive: '#67E8F9' },
  teal: { id: 'teal', name: 'Teal', primary: '#14B8A6', primaryContainer: '#115E59', tabBarActive: '#5EEAD4' },
  emerald: { id: 'emerald', name: 'Emerald', primary: '#10B981', primaryContainer: '#064E3B', tabBarActive: '#34D399' },
  green: { id: 'green', name: 'Green', primary: '#22C55E', primaryContainer: '#14532D', tabBarActive: '#4ADE80' },
  yellow: { id: 'yellow', name: 'Yellow', primary: '#EAB308', primaryContainer: '#713F12', tabBarActive: '#FDE047' },
  orange: { id: 'orange', name: 'Orange', primary: '#FB923C', primaryContainer: '#7C2D12', tabBarActive: '#FDBA74' },
  red: { id: 'red', name: 'Red', primary: '#EF4444', primaryContainer: '#7F1D1D', tabBarActive: '#F87171' },
  pink: { id: 'pink', name: 'Pink', primary: '#EC4899', primaryContainer: '#831843', tabBarActive: '#F472B6' },
  purple: { id: 'purple', name: 'Purple', primary: '#A855F7', primaryContainer: '#581C87', tabBarActive: '#C084FC' },
};

export const accentColorList: AccentColor[] = Object.values(accentColors);
export const defaultAccentId: AccentId | null = null;
