import {
  AnekDevanagari_300Light,
  AnekDevanagari_400Regular,
  AnekDevanagari_500Medium,
  AnekDevanagari_600SemiBold,
  AnekDevanagari_700Bold,
} from '@expo-google-fonts/anek-devanagari';
import {
  AnekGujarati_300Light,
  AnekGujarati_400Regular,
  AnekGujarati_500Medium,
  AnekGujarati_600SemiBold,
  AnekGujarati_700Bold,
} from '@expo-google-fonts/anek-gujarati';
import {
  AnekLatin_300Light,
  AnekLatin_400Regular,
  AnekLatin_500Medium,
  AnekLatin_600SemiBold,
  AnekLatin_700Bold,
} from '@expo-google-fonts/anek-latin';

import type { Lang } from '@/lib/types.ts';

// Anek (Ek Type) covers Latin, Gujarati and Devanagari with one design, so every language looks the same.
export const FONT_FILES = {
  AnekLatin_300Light,
  AnekLatin_400Regular,
  AnekLatin_500Medium,
  AnekLatin_600SemiBold,
  AnekLatin_700Bold,
  AnekGujarati_300Light,
  AnekGujarati_400Regular,
  AnekGujarati_500Medium,
  AnekGujarati_600SemiBold,
  AnekGujarati_700Bold,
  AnekDevanagari_300Light,
  AnekDevanagari_400Regular,
  AnekDevanagari_500Medium,
  AnekDevanagari_600SemiBold,
  AnekDevanagari_700Bold,
};

export type Weight = 300 | 400 | 500 | 600 | 700;
const SUFFIX: Record<Weight, string> = {
  300: '300Light',
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
};
const FAMILY: Record<Lang, string> = { en: 'AnekLatin', gu: 'AnekGujarati', hi: 'AnekDevanagari' };

export function font(lang: Lang, weight: Weight): string {
  return `${FAMILY[lang]}_${SUFFIX[weight]}`;
}
