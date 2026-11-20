import type { Dish, Lang } from '../lib/types.ts';
import { STEPS_GU } from './steps-gu.ts';
import { STEPS_HI } from './steps-hi.ts';

const BY_LANG: Partial<Record<Lang, Record<string, string[]>>> = { gu: STEPS_GU, hi: STEPS_HI };

/** Steps in the reader's language when we have them; Marathi and Punjabi readers get Hindi; English otherwise. */
export function stepsIn(dish: Dish, lang: Lang): { steps: string[]; lang: Lang } {
  const t = BY_LANG[lang]?.[dish.id];
  if (t) return { steps: t, lang };
  const hi = (lang === 'mr' || lang === 'pa') && STEPS_HI[dish.id];
  return hi ? { steps: hi, lang: 'hi' } : { steps: dish.steps, lang: 'en' };
}

export { STEPS_GU, STEPS_HI };
