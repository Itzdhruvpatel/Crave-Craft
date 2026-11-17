import { INGREDIENTS } from '../data/ingredients.ts';
import type { Dish, DishIng, Ingredient, SpiceLevel, Unit } from './types.ts';

export const SPICE_LEVEL: Record<SpiceLevel, number> = { low: 0.5, medium: 1, high: 1.5 };

// Salt and spices do not grow linearly with batch size; doubling a dal needs less than double salt.
// Starting values, calibrate with real cooking feedback.
const SPICE_EXP = 0.85;
const OIL_EXP = 0.9;

export function ingredient(id: string): Ingredient {
  const ing = INGREDIENTS[id];
  if (!ing) throw new Error(`Unknown ingredient: ${id}`);
  return ing;
}

export function scaleQty(
  [id, qty]: DishIng,
  servings: number,
  base: number,
  level: SpiceLevel,
  spicyDish: boolean,
): number {
  const f = servings / base;
  switch (ingredient(id).kind) {
    case 'salt':
    case 'spice':
      return qty * f ** SPICE_EXP;
    case 'chilli':
      return qty * f ** SPICE_EXP * (spicyDish ? SPICE_LEVEL[level] : 1);
    case 'oil':
      return qty * f ** OIL_EXP;
    default:
      return qty * f;
  }
}

export interface ScaledIng {
  id: string;
  qty: number;
  unit: Unit;
}

export function scaleDish(dish: Dish, servings: number, level: SpiceLevel): ScaledIng[] {
  return dish.ings.map((ing) => ({
    id: ing[0],
    qty: scaleQty(ing, servings, dish.serves, level, dish.spicy),
    unit: ing[2],
  }));
}

export function grams(id: string, qty: number, unit: Unit): number {
  const ing = ingredient(id);
  const tsp = ing.tsp ?? 5;
  switch (unit) {
    case 'g':
    case 'ml':
      return qty;
    case 'tsp':
      return qty * tsp;
    case 'tbsp':
      return qty * tsp * 3;
    case 'cup':
      return qty * tsp * 48;
    case 'pinch':
      return (qty * tsp) / 8;
    case 'pc':
      return qty * (ing.pc ?? 50);
  }
}

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

function frac(q: number): string {
  const whole = Math.floor(q);
  const part = FRACTIONS[q - whole];
  if (!part) return String(q);
  return whole ? `${whole}${part}` : part;
}

/** Kitchen-friendly rounding: spoons to quarters, grams to 5, pieces to halves. */
export function roundQty(qty: number, unit: Unit): number {
  switch (unit) {
    case 'tsp':
    case 'tbsp':
    case 'cup':
      return Math.max(0.25, Math.round(qty * 4) / 4);
    case 'pc':
      return Math.max(0.5, Math.round(qty * 2) / 2);
    case 'pinch':
      return Math.max(1, Math.round(qty));
    default:
      return qty < 20 ? Math.max(1, Math.round(qty)) : Math.round(qty / 5) * 5;
  }
}

export function formatQty(qty: number, unit: Unit): string {
  const q = roundQty(qty, unit);
  if (unit === 'pc') return frac(q);
  return `${frac(q)} ${unit}`;
}
