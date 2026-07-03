import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccentId, ThemeColors, ThemeContextValue, ThemeId } from './types';
import { accentColors } from './accent';
import { themes, defaultThemeId } from './themes';
import { useSettings } from '../storage';

function applyAccent(colors: ThemeColors, accentId: AccentId | null): ThemeColors {
  if (!accentId) return colors;
  const accent = accentColors[accentId];
  return {
    ...colors,
    primary: accent.primary,
    primaryContainer: accent.primaryContainer,
    tabBarActive: accent.tabBarActive,
  };
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes[defaultThemeId],
  themeId: defaultThemeId,
  setTheme: () => {},
  isDark: themes[defaultThemeId].isDark,
  colors: themes[defaultThemeId].colors,
  accentId: null,
  accent: null,
  setAccent: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: ThemeId;
  initialAccentId?: AccentId | null;
}

export function ThemeProvider({ children, initialThemeId, initialAccentId = null }: ThemeProviderProps) {
  const { settings, updateSettings } = useSettings();
  const [themeId, setThemeId] = useState<ThemeId>((settings.theme as ThemeId) || (initialThemeId ?? defaultThemeId));
  const [accentId, setAccentId] = useState<AccentId | null>(initialAccentId ?? (settings.accent as AccentId | null));

  const savedTheme = settings.theme as ThemeId;
  if (savedTheme && savedTheme !== themeId && themes[savedTheme]) {
    setThemeId(savedTheme);
  }
  const savedAccent = settings.accent as AccentId | null;
  if (savedAccent !== accentId) {
    setAccentId(savedAccent);
  }

  const theme = themes[themeId];

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    updateSettings({ theme: id });
  }, [updateSettings]);

  const setAccent = useCallback((id: AccentId | null) => {
    setAccentId(id);
    updateSettings({ accent: id });
  }, [updateSettings]);

  const colors = useMemo(() => applyAccent(theme.colors, accentId), [theme, accentId]);
  const accent = accentId ? accentColors[accentId] : null;

  const value = useMemo(
    () => ({ theme, themeId, setTheme, isDark: theme.isDark, colors, accentId, accent, setAccent }),
    [theme, themeId, setTheme, colors, accentId, accent, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
