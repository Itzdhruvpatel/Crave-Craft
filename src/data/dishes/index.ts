import type { Dish } from '../../lib/types.ts';
import { GUJARATI } from './gujarati.ts';

export const DISHES: Dish[] = [...GUJARATI];

export const DISH_BY_ID = new Map(DISHES.map((d) => [d.id, d]));
