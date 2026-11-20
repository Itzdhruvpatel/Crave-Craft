import { MINERALS } from '../data/minerals.ts';
import { grams, ingredient } from './scale.ts';
import type { Diet, Dish, Nutrition } from './types.ts';

const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fibre', 'sugar', 'sodium', 'iron', 'calcium'] as const;

export function emptyNutrition(): Nutrition {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0, iron: 0, calcium: 0 };
}

export function perServing(dish: Dish): Nutrition {
  const total = emptyNutrition();
  for (const [id, qty, unit] of dish.ings) {
    const g = grams(id, qty, unit);
    const n = [...ingredient(id).n, ...(MINERALS[id] ?? [0, 0])];
    KEYS.forEach((k, i) => (total[k] += (n[i] * g) / 100));
  }
  KEYS.forEach((k) => (total[k] = Math.round((total[k] / dish.serves) * 10) / 10));
  return total;
}

export function sumNutrition(list: Nutrition[]): Nutrition {
  const total = emptyNutrition();
  for (const n of list) KEYS.forEach((k) => (total[k] += n[k]));
  return total;
}

/** Jain-friendly as written, or by just leaving out ginger/garlic (see jainSkips). */
export function isJain(dish: Dish): boolean {
  return dish.diet === 'veg' && dish.ings.every(([id]) => ingredient(id).notJain !== true);
}

export function jainSkips(dish: Dish): string[] {
  return dish.ings.filter(([id]) => ingredient(id).notJain === 'skip').map(([id]) => id);
}

/** Swaminarayan: no onion family; garlic is simply left out. Roots are fine. */
export function isSwami(dish: Dish): boolean {
  return dish.diet === 'veg' && !dish.ings.some(([id]) => id === 'onion' || id === 'spring_onion');
}

/** Ingredients the family's diet drops from a recipe that otherwise fits. */
export function dietSkips(dish: Dish, diet: Diet): string[] {
  if (diet === 'jain') return jainSkips(dish);
  if (diet === 'swami') return dish.ings.filter(([id]) => id === 'garlic').map(([id]) => id);
  return [];
}

export function fitsDiet(dish: Dish, diet: Diet): boolean {
  switch (diet) {
    case 'veg':
      return dish.diet === 'veg';
    case 'jain':
      return isJain(dish);
    case 'swami':
      return isSwami(dish);
    case 'egg':
      return dish.diet !== 'nonveg';
    case 'nonveg':
      return true;
  }
}

// Rough per-person targets for one main meal (lunch or dinner), loosely from ICMR-NIN 2024:
// about a third of a 2000 kcal day with protein and fibre emphasis.
export const MEAL_TARGET = { protein: 15, fibre: 8 };

export interface SideTip {
  reason: 'protein' | 'fibre';
  dishIds: string[];
}

/** If a meal is short on protein or fibre, suggest up to 3 sides that fill the gap. */
export function balanceTips(meal: Dish[], all: Dish[], diet: Diet): SideTip[] {
  const n = sumNutrition(meal.map(perServing));
  const inMeal = new Set(meal.map((d) => d.id));
  const sides = all.filter((d) => d.course === 'side' && !inMeal.has(d.id) && fitsDiet(d, diet));
  const tips: SideTip[] = [];
  for (const reason of ['protein', 'fibre'] as const) {
    if (n[reason] >= MEAL_TARGET[reason]) continue;
    const best = sides
      .map((d) => ({ id: d.id, v: perServing(d)[reason] }))
      .filter((x) => x.v >= 2)
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map((x) => x.id);
    if (best.length) tips.push({ reason, dishIds: best });
  }
  return tips;
}

export type Light = 'green' | 'amber' | 'red';

export interface WeekReport {
  /** average protein (g) per person per lunch or dinner */
  protein: { value: number; light: Light };
  /** days with a vegetable sabji at lunch or dinner */
  veggies: { value: number; light: Light };
  /** deep-fried or oil-heavy dishes in the week */
  fried: { value: number; light: Light };
  /** meals using bought items (pav, bread) */
  outside: { value: number; light: Light };
}

const VEG_TYPES = ['leafy', 'gourd', 'beans', 'root', 'fruitveg', 'mixed'];

/** The traffic-light card for a week's plan. Thresholds follow MEAL_TARGET and the planner's LIMITS. */
export function weekReport(days: { lunch: string[]; dinner: string[] }[], byId: Map<string, Dish>, isOily: (d: Dish) => boolean): WeekReport {
  const meals = days.flatMap((d) => [d.lunch, d.dinner]).map((ids) => ids.map((id) => byId.get(id)).filter((x): x is Dish => !!x));
  const protein = meals.length ? meals.reduce((s, m) => s + sumNutrition(m.map(perServing)).protein, 0) / meals.length : 0;
  const veggies = days.filter((d) => [...d.lunch, ...d.dinner].some((id) => VEG_TYPES.includes(byId.get(id)?.vegType ?? ''))).length;
  const all = meals.flat();
  const fried = all.filter(isOily).length;
  const outside = meals.filter((m) => m.some((d) => d.outside?.length)).length;
  const light = (v: number, green: (v: number) => boolean, amber: (v: number) => boolean): Light => (green(v) ? 'green' : amber(v) ? 'amber' : 'red');
  return {
    protein: { value: Math.round(protein), light: light(protein, (v) => v >= MEAL_TARGET.protein, (v) => v >= MEAL_TARGET.protein * 0.75) },
    veggies: { value: veggies, light: light(veggies, (v) => v >= 6, (v) => v >= 4) },
    fried: { value: fried, light: light(fried, (v) => v <= 2, (v) => v <= 4) },
    outside: { value: outside, light: light(outside, (v) => v <= 1, (v) => v <= 2) },
  };
}
