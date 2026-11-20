import { grams, ingredient, scaleDish } from './scale.ts';
import type { DayPlan } from './planner.ts';
import type { Dish, SpiceLevel } from './types.ts';

export type Aisle = 'veg' | 'dairy' | 'grains' | 'ready' | 'pantry';

const VEG = new Set([
  'potato', 'onion', 'spring_onion', 'tomato', 'green_chilli', 'coriander', 'mint', 'palak', 'methi', 'sarson',
  'bathua', 'dudhi', 'turiya', 'karela', 'tinda', 'tindora', 'parwal', 'bhindi', 'brinjal', 'big_brinjal', 'cauliflower', 'cabbage',
  'capsicum', 'peas', 'carrot', 'beetroot', 'french_beans', 'guvar', 'papdi', 'lilva', 'sweet_potato', 'suran', 'raw_banana',
  'pumpkin', 'drumstick', 'corn', 'mushroom', 'cucumber', 'arbi', 'patra_leaves', 'raw_mango', 'lemon', 'coconut', 'banana',
  'mango', 'apple', 'ginger', 'garlic', 'baby_corn', 'broccoli', 'lettuce', 'moong_sprouts',
]);
const DAIRY = new Set(['milk', 'full_milk', 'curd', 'buttermilk', 'paneer', 'khoya', 'cream', 'cheese', 'butter', 'ghee', 'egg', 'chicken', 'fish', 'mutton', 'prawns']);
const READY = new Set(['pav', 'bread', 'sev', 'puri_shell', 'papdi_chips', 'papad', 'boondi', 'farsan_mix', 'pizza_base', 'tortilla', 'noodles', 'pasta', 'urad_papad', 'mayonnaise', 'ketchup', 'soy_sauce', 'chilli_sauce', 'vinegar']);

export function aisleOf(id: string): Aisle {
  // Most homes have a curry leaf plant or a bunch in the fridge; counting leaves is silly.
  if (id === 'curry_leaves') return 'pantry';
  if (VEG.has(id)) return 'veg';
  if (DAIRY.has(id)) return 'dairy';
  if (READY.has(id)) return 'ready';
  const kind = ingredient(id).kind;
  if (kind === 'spice' || kind === 'chilli' || kind === 'salt' || kind === 'oil' || kind === 'sweet') return 'pantry';
  return 'grains';
}

export interface GroceryItem {
  id: string;
  aisle: Aisle;
  /** pieces when every use was counted in pieces, else grams */
  qty: number;
  unit: 'pc' | 'g';
  dishes: string[];
}

/** Everything needed to cook these days for `people`, summed per ingredient. */
export function groceryList(days: DayPlan[], byId: Map<string, Dish>, people: number, spice: SpiceLevel): GroceryItem[] {
  const acc = new Map<string, { g: number; pc: number; allPc: boolean; dishes: Set<string> }>();
  for (const day of days) {
    for (const id of [...day.breakfast, ...day.lunch, ...day.dinner]) {
      const dish = byId.get(id);
      if (!dish) continue;
      for (const s of scaleDish(dish, people, spice)) {
        if (s.id === 'water') continue;
        const e = acc.get(s.id) ?? { g: 0, pc: 0, allPc: true, dishes: new Set<string>() };
        e.g += grams(s.id, s.qty, s.unit);
        if (s.unit === 'pc') e.pc += s.qty;
        else e.allPc = false;
        e.dishes.add(dish.id);
        acc.set(s.id, e);
      }
    }
  }
  return [...acc.entries()]
    .map(([id, e]) => ({
      id,
      aisle: aisleOf(id),
      qty: e.allPc ? Math.ceil(e.pc) : Math.ceil(e.g),
      unit: (e.allPc ? 'pc' : 'g') as 'pc' | 'g',
      dishes: [...e.dishes],
    }))
    .sort((a, b) => b.qty - a.qty);
}

/** "1.2 kg", "350 g", "6 pcs". Rounds grams up to a buyable amount. */
export function formatBuy(item: GroceryItem): string {
  if (item.unit === 'pc') return `${item.qty} pcs`;
  if (item.qty >= 1000) return `${(Math.ceil(item.qty / 100) / 10).toFixed(1)} kg`;
  if (item.qty >= 100) return `${Math.ceil(item.qty / 50) * 50} g`;
  return `${Math.max(5, Math.ceil(item.qty / 5) * 5)} g`;
}
