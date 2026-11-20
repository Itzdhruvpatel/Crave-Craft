import '@/global.css';

import { Platform } from 'react-native';

// Glass Kitchen: dark frosted glass over blurred food photos, white controls, one lime accent.
// The app is always dark so the food photography carries the colour.
const glass = {
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.66)',
  textDim: 'rgba(255,255,255,0.45)',
  background: '#0B0D0A',
  backgroundElement: 'rgba(255,255,255,0.10)', // glass fill
  backgroundSelected: 'rgba(255,255,255,0.18)',
  glassStrong: 'rgba(22,24,20,0.62)',
  border: 'rgba(255,255,255,0.16)',
  accent: '#CFF54A', // lime
  accentText: '#10140A',
  haldi: '#CFF54A',
  onHaldi: '#10140A',
  good: '#CFF54A',
  goodSoft: 'rgba(207,245,74,0.14)',
  warn: '#FFC15A',
  white: '#FFFFFF',
  ink: '#10140A',
  steelHi: '#3A3D37',
  steelLo: '#1A1C18',
  scrim: 'rgba(11,13,10,0.85)',
} as const;

export const Colors = { light: glass, dark: glass } as const;

export type ThemeColor = keyof typeof glass;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Space the floating dock takes at the bottom of every tab screen. */
export const BottomTabInset = Platform.select({ ios: 110, android: 110 }) ?? 110;
export const MaxContentWidth = 560;
