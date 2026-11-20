import type { Dish } from '../../lib/types.ts';
import { EVERYDAY } from './everyday.ts';
import { GUJARATI } from './gujarati.ts';
import { MAHARASHTRIAN } from './maharashtrian.ts';
import { NONVEG } from './nonveg.ts';
import { PUNJABI } from './punjabi.ts';
import { REGIONAL } from './regional.ts';
import { SOUTH } from './south.ts';
import { STREET } from './street.ts';

export const DISHES: Dish[] = [...GUJARATI, ...EVERYDAY, ...PUNJABI, ...SOUTH, ...MAHARASHTRIAN, ...REGIONAL, ...STREET, ...NONVEG];

export const DISH_BY_ID = new Map(DISHES.map((d) => [d.id, d]));
