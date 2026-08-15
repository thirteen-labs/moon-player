import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';
import { useTheme } from '@/theme';

export type IconName =
  | 'search'
  | 'filter'
  | 'settings'
  | 'back'
  | 'play'
  | 'pause'
  | 'more'
  | 'heart'
  | 'clock'
  | 'grid'
  | 'list'
  | 'refresh'
  | 'prev'
  | 'next';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const STROKE_ICONS: Record<string, ReactNode> = {
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  filter: <Path d="M3 4h18l-7 8v6l-4 2v-8z" />,
  settings: (
    <>
      <Line x1="4" y1="21" x2="4" y2="14" />
      <Line x1="4" y1="10" x2="4" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12" y2="3" />
      <Line x1="20" y1="21" x2="20" y2="16" />
      <Line x1="20" y1="12" x2="20" y2="3" />
      <Line x1="1" y1="14" x2="7" y2="14" />
      <Line x1="9" y1="8" x2="15" y2="8" />
      <Line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  back: <Path d="M15 18l-6 -6l6 -6" />,
  more: (
    <>
      <Circle cx="5" cy="12" r="1.6" />
      <Circle cx="12" cy="12" r="1.6" />
      <Circle cx="19" cy="12" r="1.6" />
    </>
  ),
  heart: (
    <Path d="M12 21l-1.45 -1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78 -3.4 6.86 -8.55 11.18z" />
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  grid: (
    <>
      <Rect x="3" y="3" width="7" height="7" rx="1.5" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  list: (
    <>
      <Line x1="8" y1="6" x2="21" y2="6" />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Line x1="3" y1="6" x2="3.01" y2="6" />
      <Line x1="3" y1="12" x2="3.01" y2="12" />
      <Line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  refresh: (
    <>
      <Path d="M23 4v6h-6" />
      <Path d="M1 20v-6h6" />
      <Path d="M3.5 9a9 9 0 0 1 14.8 -3.4L23 10" />
      <Path d="M1 14l4.7 4.4A9 9 0 0 0 20.5 15" />
    </>
  ),
};

const FILLED_ICONS: Partial<Record<IconName, ReactNode>> = {
  play: <Path d="M6 4l14 8l-14 8z" />,
  pause: (
    <>
      <Rect x="6" y="4" width="4" height="16" rx="1" />
      <Rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  prev: (
    <>
      <Path d="M7 6v12" />
      <Path d="M20 6 L9 12 L20 18 Z" />
    </>
  ),
  next: (
    <>
      <Path d="M17 6v12" />
      <Path d="M4 6 L15 12 L4 18 Z" />
    </>
  ),
};

export function Icon({ name, size = 24, color }: IconProps) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text;
  const filled = name in FILLED_ICONS;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? stroke : 'none'}
      stroke={filled ? 'none' : stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {filled ? FILLED_ICONS[name as keyof typeof FILLED_ICONS] : STROKE_ICONS[name]}
    </Svg>
  );
}
