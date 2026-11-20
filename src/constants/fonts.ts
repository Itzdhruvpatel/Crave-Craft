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

import {
  AnekBangla_300Light,
  AnekBangla_400Regular,
  AnekBangla_500Medium,
  AnekBangla_600SemiBold,
  AnekBangla_700Bold,
} from '@expo-google-fonts/anek-bangla';
import {
  AnekTamil_300Light,
  AnekTamil_400Regular,
  AnekTamil_500Medium,
  AnekTamil_600SemiBold,
  AnekTamil_700Bold,
} from '@expo-google-fonts/anek-tamil';
import {
  AnekTelugu_300Light,
  AnekTelugu_400Regular,
  AnekTelugu_500Medium,
  AnekTelugu_600SemiBold,
  AnekTelugu_700Bold,
} from '@expo-google-fonts/anek-telugu';
import {
  AnekKannada_300Light,
  AnekKannada_400Regular,
  AnekKannada_500Medium,
  AnekKannada_600SemiBold,
  AnekKannada_700Bold,
} from '@expo-google-fonts/anek-kannada';
import {
  AnekMalayalam_300Light,
  AnekMalayalam_400Regular,
  AnekMalayalam_500Medium,
  AnekMalayalam_600SemiBold,
  AnekMalayalam_700Bold,
} from '@expo-google-fonts/anek-malayalam';
import {
  AnekGurmukhi_300Light,
  AnekGurmukhi_400Regular,
  AnekGurmukhi_500Medium,
  AnekGurmukhi_600SemiBold,
  AnekGurmukhi_700Bold,
} from '@expo-google-fonts/anek-gurmukhi';

import type { Lang } from '@/lib/types.ts';

// Anek (Ek Type) covers Latin and every Indian script we support with one design, so every language looks the same.
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
  AnekBangla_300Light,
  AnekBangla_400Regular,
  AnekBangla_500Medium,
  AnekBangla_600SemiBold,
  AnekBangla_700Bold,
  AnekTamil_300Light,
  AnekTamil_400Regular,
  AnekTamil_500Medium,
  AnekTamil_600SemiBold,
  AnekTamil_700Bold,
  AnekTelugu_300Light,
  AnekTelugu_400Regular,
  AnekTelugu_500Medium,
  AnekTelugu_600SemiBold,
  AnekTelugu_700Bold,
  AnekKannada_300Light,
  AnekKannada_400Regular,
  AnekKannada_500Medium,
  AnekKannada_600SemiBold,
  AnekKannada_700Bold,
  AnekMalayalam_300Light,
  AnekMalayalam_400Regular,
  AnekMalayalam_500Medium,
  AnekMalayalam_600SemiBold,
  AnekMalayalam_700Bold,
  AnekGurmukhi_300Light,
  AnekGurmukhi_400Regular,
  AnekGurmukhi_500Medium,
  AnekGurmukhi_600SemiBold,
  AnekGurmukhi_700Bold,
};

export type Weight = 300 | 400 | 500 | 600 | 700;
const SUFFIX: Record<Weight, string> = {
  300: '300Light',
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
};
const FAMILY: Record<Lang, string> = {
  en: 'AnekLatin',
  gu: 'AnekGujarati',
  hi: 'AnekDevanagari',
  mr: 'AnekDevanagari',
  bn: 'AnekBangla',
  pa: 'AnekGurmukhi',
  ta: 'AnekTamil',
  te: 'AnekTelugu',
  kn: 'AnekKannada',
  ml: 'AnekMalayalam',
};

export function font(lang: Lang, weight: Weight): string {
  return `${FAMILY[lang]}_${SUFFIX[weight]}`;
}
