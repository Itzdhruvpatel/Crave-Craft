import { grams, ingredient } from './scale.ts';
import type { Diet, Dish, Nutrition } from './types.ts';

const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fibre', 'sugar', 'sodium'] as const;

export function emptyNutrition(): Nutrition {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 };
}

export function perServing(dish: Dish): Nutrition {
  const total = emptyNutrition();
  for (const [id, qty, unit] of dish.ings) {
    const g = grams(id, qty, unit);
    const n = ingredient(id).n;
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

export function fitsDiet(dish: Dish, diet: Diet): boolean {
  switch (diet) {
    case 'veg':
      return dish.diet === 'veg';
    case 'jain':
      return isJain(dish);
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
