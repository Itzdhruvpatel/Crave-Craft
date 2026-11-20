import { aisleOf } from './grocery.ts';
import type { Dish } from './types.ts';

// Every Indian kitchen has these; they never count as "missing".
const ALWAYS = new Set(['water', 'atta', 'rice', 'besan', 'rava', 'poha', 'toor_dal', 'moong_dal', 'chana_dal', 'curd', 'milk', 'onion', 'tomato', 'green_chilli', 'ginger', 'garlic', 'coriander', 'curry_leaves', 'lemon', 'ghee', 'oil']);

/** Ingredients that decide whether you can make a dish: no spices, salt, oil or everyday staples. */
export function keyIngredients(dish: Dish): string[] {
  return [...new Set(dish.ings.map(([id]) => id))].filter((id) => !ALWAYS.has(id) && aisleOf(id) !== 'pantry');
}

export interface FridgeMatch {
  dish: Dish;
  missing: string[];
  used: number;
}

/** Dishes you can cook from what you have, fewest missing first, then the ones using most of your stock. */
export function cookFromFridge(have: string[], dishes: Dish[], maxMissing = 2): FridgeMatch[] {
  const got = new Set(have);
  return dishes
    .map((dish) => {
      const keys = keyIngredients(dish);
      return { dish, missing: keys.filter((k) => !got.has(k)), used: keys.filter((k) => got.has(k)).length };
    })
    .filter((m) => m.used > 0 && m.missing.length <= maxMissing)
    .sort((a, b) => a.missing.length - b.missing.length || b.used - a.used);
}
