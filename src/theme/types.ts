export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  tertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderVariant: string;
  error: string;
  errorContainer: string;
  success: string;
  warning: string;
  overlay: string;
  card: string;
  cardElevated: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeTypography {
  fontFamily: string;
  sizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', number>;
  weights: Record<'regular' | 'medium' | 'semibold' | 'bold', '400' | '500' | '600' | '700'>;
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
}

export type ThemeId =
  | 'light' | 'dark' | 'oled'
  | 'midnight' | 'slate' | 'charcoal'
  | 'cyber' | 'neon' | 'synthwave'
  | 'forest' | 'moss' | 'ocean' | 'arctic'
  | 'autumn' | 'sunset' | 'desert' | 'magma'
  | 'sakura' | 'lavender' | 'rose' | 'mint' | 'coral' | 'plum'
  | 'cottoncandy' | 'eclipse' | 'nord';

export interface AccentColor {
  id: AccentId;
  name: string;
  primary: string;
  primaryContainer: string;
  tabBarActive: string;
}

export type AccentId =
  | 'indigo' | 'blue' | 'sky' | 'cyan' | 'teal' | 'emerald'
  | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple';

export interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  isDark: boolean;
  colors: ThemeColors;
  accentId: AccentId | null;
  accent: AccentColor | null;
  setAccent: (id: AccentId | null) => void;
}
