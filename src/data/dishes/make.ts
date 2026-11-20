import type { Course, Cuisine, Dish, DishIng, Meal, Mood, Season, VegType } from '../../lib/types.ts';

const MEAL: Record<string, Meal> = { B: 'breakfast', L: 'lunch', D: 'dinner', S: 'snack' };

interface Opts {
  moods: Mood[];
  fancy?: Dish['fancy'];
  time: number;
  serves?: number;
  /** false for sweets and drinks: hides the spice selector */
  spicy?: boolean;
  veg?: VegType;
  season?: Season[];
  diet?: Dish['diet'];
  upvas?: boolean;
  outside?: string[];
  pairs?: string[];
}

/**
 * Compact dish entry. `meals` is a string of letters: B breakfast, L lunch, D dinner, S snack.
 * Quantities are for `serves` people (default 4).
 */
export function dish(
  id: string,
  [en, hi, gu]: [string, string, string],
  cuisine: Cuisine,
  course: Course,
  meals: string,
  o: Opts,
  ings: DishIng[],
  steps: string[],
): Dish {
  return {
    id,
    name: { en, hi, gu },
    cuisine,
    course,
    meals: [...meals].map((m) => MEAL[m]),
    diet: o.diet ?? 'veg',
    upvas: o.upvas,
    moods: o.moods,
    fancy: o.fancy ?? 1,
    outside: o.outside,
    time: o.time,
    serves: o.serves ?? 4,
    spicy: o.spicy ?? true,
    vegType: o.veg,
    season: o.season,
    ings,
    steps,
    pairs: o.pairs,
  };
}
