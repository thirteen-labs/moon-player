import type { Theme, ThemeId } from './types';
import { spacing, borderRadius, typography } from './tokens';
import * as palettes from './colors';

function createTheme(id: ThemeId, name: string, isDark: boolean, colors: Theme['colors']): Theme {
  return { id, name, isDark, colors, spacing, borderRadius, typography };
}

export const themes: Record<ThemeId, Theme> = {
  // ── Core ──
  light: createTheme('light', 'Light', false, palettes.light),
  dark: createTheme('dark', 'Dark', true, palettes.dark),
  oled: createTheme('oled', 'OLED Dark', true, palettes.oled),

  // ── Dark neutrals ──
  midnight: createTheme('midnight', 'Midnight', true, palettes.midnight),
  slate: createTheme('slate', 'Slate', true, palettes.slate),
  charcoal: createTheme('charcoal', 'Charcoal', true, palettes.charcoal),

  // ── Neon / Tech ──
  cyber: createTheme('cyber', 'Cyber', true, palettes.cyber),
  neon: createTheme('neon', 'Neon', true, palettes.neon),
  synthwave: createTheme('synthwave', 'Synthwave', true, palettes.synthwave),

  // ── Nature ──
  forest: createTheme('forest', 'Forest', true, palettes.forest),
  moss: createTheme('moss', 'Moss', true, palettes.moss),
  ocean: createTheme('ocean', 'Ocean', true, palettes.ocean),
  arctic: createTheme('arctic', 'Arctic', true, palettes.arctic),

  // ── Warm ──
  autumn: createTheme('autumn', 'Autumn', true, palettes.autumn),
  sunset: createTheme('sunset', 'Sunset', true, palettes.sunset),
  desert: createTheme('desert', 'Desert', true, palettes.desert),
  magma: createTheme('magma', 'Magma', true, palettes.magma),

  // ── Floral / Sweet ──
  sakura: createTheme('sakura', 'Sakura', true, palettes.sakura),
  lavender: createTheme('lavender', 'Lavender', true, palettes.lavender),
  rose: createTheme('rose', 'Rose', true, palettes.rose),
  mint: createTheme('mint', 'Mint', true, palettes.mint),
  coral: createTheme('coral', 'Coral', true, palettes.coral),
  plum: createTheme('plum', 'Plum', true, palettes.plum),

  // ── Special ──
  cottoncandy: createTheme('cottoncandy', 'Cotton Candy', false, palettes.cottoncandy),
  eclipse: createTheme('eclipse', 'Eclipse', true, palettes.eclipse),
  nord: createTheme('nord', 'Nord', true, palettes.nord),
};

export const defaultThemeId: ThemeId = 'dark';
