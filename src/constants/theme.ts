import '@/global.css';

import { Platform } from 'react-native';

// Steel thali + bandhani palette: steel plates, indigo ink, haldi, kumkum, kadi patta.
export const Colors = {
  light: {
    text: '#1D2B5C', // indigo ink
    textSecondary: '#5A6587',
    background: '#F4F6F7',
    backgroundElement: '#E8ECEF', // steel
    backgroundSelected: '#D5DCE1',
    border: '#D0D7DD',
    accent: '#C8102E', // kumkum
    accentText: '#FFFFFF',
    haldi: '#F2B705',
    onHaldi: '#3A2A00',
    good: '#2E6B3F', // kadi patta
    goodSoft: '#DCEBDF',
    warn: '#A15C00',
    steelHi: '#FFFFFF',
    steelLo: '#C3CCD3',
    scrim: 'rgba(17,22,46,0.72)',
  },
  dark: {
    text: '#EEF1FA',
    textSecondary: '#A5AEC8',
    background: '#11162E',
    backgroundElement: '#1B2244',
    backgroundSelected: '#283160',
    border: '#283160',
    accent: '#FF4D5E',
    accentText: '#11162E',
    haldi: '#F7C531',
    onHaldi: '#2B2000',
    good: '#6FC08A',
    goodSoft: '#1D3A2B',
    warn: '#F2B04C',
    steelHi: '#46517E',
    steelLo: '#1B2244',
    scrim: 'rgba(8,10,24,0.78)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
