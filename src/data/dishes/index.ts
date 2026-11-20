import type { Dish } from '../../lib/types.ts';
import { EVERYDAY } from './everyday.ts';
import { EVERYDAY_MORE } from './everyday2.ts';
import { BREAKFAST } from './breakfast.ts';
import { SABZI } from './sabzi.ts';
import { SIDES } from './sides.ts';
import { GUJARATI } from './gujarati.ts';
import { GUJARATI_MORE } from './gujarati2.ts';
import { GUJARATI_DAILY } from './gujarati3.ts';
import { INDIA } from './india.ts';
import { MAHARASHTRIAN } from './maharashtrian.ts';
import { NONVEG } from './nonveg.ts';
import { NONVEG_MORE } from './nonveg2.ts';
import { SWEETS } from './sweets.ts';
import { PUNJABI } from './punjabi.ts';
import { PUNJABI_MORE } from './punjabi2.ts';
import { REGIONAL } from './regional.ts';
import { REGIONAL_MORE } from './regional2.ts';
import { SOUTH } from './south.ts';
import { SOUTH_MORE } from './south2.ts';
import { STREET } from './street.ts';
import { STREET_MORE } from './street2.ts';

export const DISHES: Dish[] = [...GUJARATI, ...GUJARATI_MORE, ...GUJARATI_DAILY, ...EVERYDAY, ...EVERYDAY_MORE, ...BREAKFAST, ...SABZI, ...SIDES, ...PUNJABI, ...PUNJABI_MORE, ...SOUTH, ...SOUTH_MORE, ...MAHARASHTRIAN, ...REGIONAL, ...REGIONAL_MORE, ...STREET, ...STREET_MORE, ...INDIA, ...SWEETS, ...NONVEG, ...NONVEG_MORE];

export const DISH_BY_ID = new Map(DISHES.map((d) => [d.id, d]));
