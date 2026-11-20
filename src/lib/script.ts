import type { Lang } from './types.ts';

// Dish and ingredient names exist in Devanagari. Indian scripts share one letter layout (ISCII),
// so moving a Devanagari letter to the same slot in another script spells the same sound there.
// Good enough for names like दाल ढोकली; a real translation always wins where we have one.

const BLOCK: Partial<Record<Lang, number>> = { bn: 0x0980, pa: 0x0a00, gu: 0x0a80, ta: 0x0b80, te: 0x0c00, kn: 0x0c80, ml: 0x0d00 };

// Tamil has no separate aspirated or voiced letters: क ख ग घ are all க, and so on.
const TAMIL: Record<string, string> = {
  ख: 'க', ग: 'க', घ: 'க', छ: 'ச', झ: 'ஜ', ठ: 'ட', ड: 'ட', ढ: 'ட', थ: 'த', द: 'த', ध: 'த', फ: 'ப', ब: 'ப', भ: 'ப',
  श: 'ஷ', ऋ: 'ரு', 'ृ': 'ு', 'ं': 'ம்', 'ँ': 'ம்',
};

// Letters a script lacks fall back to the closest one it has.
const FIX: Partial<Record<Lang, Record<string, string>>> = {
  ta: TAMIL,
  pa: { ऋ: 'ਰਿ', 'ृ': 'ਿ', ष: 'ਸ਼' },
  bn: { व: 'ব' },
};
const NO_NUKTA: Lang[] = ['ta', 'te', 'ml'];
// Hindi drops the "a" after a word's last letter (दाल = daal). These scripts would read it out,
// so the last letter gets an explicit vowel killer.
const SPOKEN_A: Lang[] = ['ta', 'te', 'kn', 'ml'];

export function fromDevanagari(text: string, lang: Lang): string {
  const base = BLOCK[lang];
  if (!base) return text;
  const fix = FIX[lang] ?? {};
  // English loan vowels (कॉफ़ी, बैंक) become the nearest common vowel first.
  let src = text.replace(/ॉ/g, 'ो').replace(/ॅ/g, 'े');
  if (SPOKEN_A.includes(lang)) src = src.replace(/([क-ह]़?)(?=$|[^ऀ-ॿ])/g, '$1्');
  let out = '';
  for (const ch of src) {
    const c = ch.codePointAt(0)!;
    if (fix[ch] !== undefined) out += fix[ch];
    else if (c === 0x093c) out += NO_NUKTA.includes(lang) ? '' : String.fromCodePoint(base + 0x3c);
    else if (c >= 0x0901 && c <= 0x094d) out += String.fromCodePoint(c - 0x0900 + base);
    else out += ch;
  }
  // Gurmukhi writes a doubled letter with an addak: ਟਿੱਕਾ, not ਟਿਕ੍ਕਾ.
  return lang === 'pa' ? out.replace(/([ਕ-ਹ])੍\1/g, 'ੱ$1') : out;
}
