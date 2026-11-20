import { grams, ingredient, type ScaledIng } from './scale.ts';
import type { Allergen, Dish, Profile } from './types.ts';

export const ALLERGEN_INGS: Record<Allergen, string[]> = {
  peanut: ['peanuts'],
  nuts: ['cashew', 'almond', 'pistachio'],
  dairy: ['milk', 'full_milk', 'curd', 'buttermilk', 'paneer', 'khoya', 'cream', 'cheese', 'condensed_milk', 'ghee', 'butter'],
  gluten: ['atta', 'maida', 'rava', 'daliya', 'pasta', 'noodles', 'vermicelli', 'semiya', 'pav', 'bread', 'puri_shell', 'papdi_chips', 'pizza_base', 'tortilla', 'soy_sauce'],
  sesame: ['sesame'],
};

/** What the whole family needs, merged from every member's profile. */
export interface Needs {
  allergens: Allergen[];
  diabetic: boolean;
  lowSalt: boolean;
  lowOil: boolean;
}

export function familyNeeds(profile: Profile): Needs {
  const m = profile.members ?? [];
  const has = (tag: 'diabetic' | 'lowSalt' | 'lowOil') => m.some((x) => x.health.includes(tag));
  return {
    allergens: [...new Set(m.flatMap((x) => x.allergies))],
    diabetic: has('diabetic'),
    lowSalt: has('lowSalt'),
    lowOil: has('lowOil'),
  };
}

/** Allergens in this dish that someone at home can't eat. */
export function allergensIn(dish: Dish, allergens: Allergen[]): Allergen[] {
  return allergens.filter((a) => dish.ings.some(([id]) => ALLERGEN_INGS[a].includes(id)));
}

const OILY_G_PER_SERVING = 12;

/** Deep-fried or oil-heavy: more than ~1 tbsp of oil or ghee per plate. */
export function isOily(dish: Dish): boolean {
  if (dish.steps.some((s) => /deep.?fry|for frying|fry (them |it )?in hot oil/i.test(s))) return true;
  const fat = dish.ings.filter(([id]) => ingredient(id).kind === 'oil' || id === 'ghee').reduce((g, [id, q, u]) => g + grams(id, q, u), 0);
  return fat / dish.serves > OILY_G_PER_SERVING;
}

// Starting points for a household cooking for one member's BP or weight; the cook adjusts to taste.
const LOW_SALT = 0.75;
const LOW_OIL = 0.7;

/** Less salt for BP, less oil for low-oil diets. Applied after normal scaling. */
export function healthAdjust(ings: ScaledIng[], needs: Needs): ScaledIng[] {
  return ings.map((i) => {
    const kind = ingredient(i.id).kind;
    if (needs.lowSalt && kind === 'salt') return { ...i, qty: i.qty * LOW_SALT };
    if (needs.lowOil && kind === 'oil') return { ...i, qty: i.qty * LOW_OIL };
    return i;
  });
}
