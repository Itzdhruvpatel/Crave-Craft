import type { Dish, Lang } from '../lib/types.ts';
import { STEPS_GU } from './steps-gu.ts';
import { STEPS_HI } from './steps-hi.ts';

const BY_LANG: Partial<Record<Lang, Record<string, string[]>>> = { gu: STEPS_GU, hi: STEPS_HI };

/** Steps in the reader's language when we have them, English otherwise. */
export function stepsIn(dish: Dish, lang: Lang): { steps: string[]; lang: Lang } {
  const t = BY_LANG[lang]?.[dish.id];
  return t ? { steps: t, lang } : { steps: dish.steps, lang: 'en' };
}

export { STEPS_GU, STEPS_HI };
