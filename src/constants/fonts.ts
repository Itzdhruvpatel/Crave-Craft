import {
  AnekDevanagari_400Regular,
  AnekDevanagari_500Medium,
  AnekDevanagari_600SemiBold,
  AnekDevanagari_700Bold,
  AnekDevanagari_800ExtraBold,
} from '@expo-google-fonts/anek-devanagari';
import {
  AnekGujarati_400Regular,
  AnekGujarati_500Medium,
  AnekGujarati_600SemiBold,
  AnekGujarati_700Bold,
  AnekGujarati_800ExtraBold,
} from '@expo-google-fonts/anek-gujarati';
import {
  AnekLatin_400Regular,
  AnekLatin_500Medium,
  AnekLatin_600SemiBold,
  AnekLatin_700Bold,
  AnekLatin_800ExtraBold,
} from '@expo-google-fonts/anek-latin';

import type { Lang } from '@/lib/types.ts';

// Anek (Ek Type) covers Latin, Gujarati and Devanagari with one design, so every language looks the same.
export const FONT_FILES = {
  AnekLatin_400Regular,
  AnekLatin_500Medium,
  AnekLatin_600SemiBold,
  AnekLatin_700Bold,
  AnekLatin_800ExtraBold,
  AnekGujarati_400Regular,
  AnekGujarati_500Medium,
  AnekGujarati_600SemiBold,
  AnekGujarati_700Bold,
  AnekGujarati_800ExtraBold,
  AnekDevanagari_400Regular,
  AnekDevanagari_500Medium,
  AnekDevanagari_600SemiBold,
  AnekDevanagari_700Bold,
  AnekDevanagari_800ExtraBold,
};

export type Weight = 400 | 500 | 600 | 700 | 800;
const SUFFIX: Record<Weight, string> = {
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
  800: '800ExtraBold',
};
const FAMILY: Record<Lang, string> = { en: 'AnekLatin', gu: 'AnekGujarati', hi: 'AnekDevanagari' };

export function font(lang: Lang, weight: Weight): string {
  return `${FAMILY[lang]}_${SUFFIX[weight]}`;
}
