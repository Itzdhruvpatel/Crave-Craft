import { fitsDiet } from './nutrition.ts';
import type { Course, Cuisine, Dish, Meal, Profile, Season } from './types.ts';

export type Slot = 'breakfast' | 'lunch' | 'dinner';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner'];

export interface DayPlan {
  date: string; // YYYY-MM-DD
  fast: boolean;
  /** guests eating with the family that day; scales recipes and shopping */
  guests?: number;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export const LIMITS = { fancy: 2, chatpata: 2, outside: 1 };

const LUNCH: Partial<Record<Cuisine, Course[]>> = {
  punjabi: ['sabji', 'dal', 'bread'],
  south: ['dal', 'sabji', 'rice'],
};
const DEFAULT_LUNCH: Course[] = ['sabji', 'dal', 'bread', 'rice'];

function template(slot: Slot, dayIndex: number, region: Cuisine): Course[] {
  if (slot === 'breakfast') return ['breakfast'];
  if (slot === 'lunch') return LUNCH[region] ?? DEFAULT_LUNCH;
  return dayIndex % 2 === 0 ? ['oneDish'] : ['sabji', 'bread'];
}

export function seasonOf(date: Date): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'summer';
  if (m >= 6 && m <= 9) return 'monsoon';
  return 'winter';
}

/** Deterministic RNG so plans are reproducible in tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Ctx {
  dishes: Dish[];
  profile: Profile;
  season: Season;
  random: () => number;
  used: Set<string>;
  counts: { fancy: number; chatpata: number; outside: number };
  yesterdayVeg: Set<string>;
  todayVeg: Set<string>;
  yesterdayIds: Set<string>;
  todayIds: Set<string>;
  weekend: boolean;
  slot: Slot;
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

function weight(d: Dish, ctx: Ctx): number {
  let w = 1;
  if (ctx.profile.regions.includes(d.cuisine)) w *= 3;
  else if (d.cuisine === 'pan') w *= 1.5;
  if (d.season?.includes(ctx.season)) w *= 1.5;
  if (ctx.profile.dislikes.includes(d.id)) w *= 0.3;
  const rated = ctx.profile.ratings?.[d.id];
  if (rated === 1) w *= 2;
  else if (rated === -1) w *= 0.5;
  // Staples: plain rotli and bhaat win most days, puri and jeera rice now and then.
  if (STAPLES.includes(d.course)) w /= d.fancy ** 2;
  // Weekdays are busy: long or party dishes go to the weekend.
  if (ctx.weekend) {
    if (d.fancy >= 3) w *= 3;
  } else {
    if (d.fancy >= 4) w *= 0.1;
    if (d.time > (ctx.slot === 'breakfast' ? 25 : 45)) w *= 0.2;
  }
  return w;
}

/** Everyday staples may repeat in a week (dal-bhaat-rotli daily is normal), just not on back-to-back days. */
export const STAPLES: Course[] = ['bread', 'rice', 'dal', 'side'];

function allowed(d: Dish, ctx: Ctx, strict: boolean): boolean {
  if (STAPLES.includes(d.course)) {
    if (ctx.todayIds.has(d.id)) return false;
    // Rotli and bhaat every day is normal; dal and sides should vary day to day.
    if (strict && ctx.yesterdayIds.has(d.id) && d.course !== 'bread' && d.course !== 'rice') return false;
  } else if (ctx.used.has(d.id)) return false;
  if (d.fancy >= 4 && ctx.counts.fancy >= LIMITS.fancy) return false;
  if (d.moods.includes('chatpata') && ctx.counts.chatpata >= LIMITS.chatpata) return false;
  if (d.outside?.length && ctx.counts.outside >= LIMITS.outside) return false;
  if (strict && d.vegType && (ctx.yesterdayVeg.has(d.vegType) || ctx.todayVeg.has(d.vegType))) return false;
  return true;
}

function weightedPick(list: Dish[], ctx: Ctx): Dish | undefined {
  const total = list.reduce((s, d) => s + weight(d, ctx), 0);
  let r = ctx.random() * total;
  for (const d of list) {
    r -= weight(d, ctx);
    if (r <= 0) return d;
  }
  return list[list.length - 1];
}

function pick(pool: Dish[], ctx: Ctx): Dish | undefined {
  const strict = pool.filter((d) => allowed(d, ctx, true));
  const relaxed = strict.length ? strict : pool.filter((d) => allowed(d, ctx, false));
  // Last resort (tiny pools, e.g. many fast days): repeat a dish rather than leave the slot empty.
  const chosen = weightedPick(relaxed.length ? relaxed : pool, ctx);
  if (!chosen) return undefined;
  ctx.used.add(chosen.id);
  ctx.todayIds.add(chosen.id);
  if (chosen.fancy >= 4) ctx.counts.fancy++;
  if (chosen.moods.includes('chatpata')) ctx.counts.chatpata++;
  if (chosen.outside?.length) ctx.counts.outside++;
  if (chosen.vegType) ctx.todayVeg.add(chosen.vegType);
  return chosen;
}

const SLOT_MEAL: Record<Slot, Meal> = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };

// Breakfast is whatever the family eats in the morning: poha, thepla, khaman, handvo...
const BREAKFAST_COURSES: Course[] = ['breakfast', 'farsan', 'bread', 'oneDish'];

function poolFor(ctx: Ctx, slot: Slot, course: Course | 'upvas'): Dish[] {
  const meal = SLOT_MEAL[slot];
  return ctx.dishes.filter((d) => {
    if (!fitsDiet(d, ctx.profile.diet) || !d.meals.includes(meal)) return false;
    if (course === 'upvas') return !!d.upvas && d.course !== 'drink';
    if (course === 'breakfast') return BREAKFAST_COURSES.includes(d.course);
    return d.course === course;
  });
}

export interface PlanOptions {
  start: Date;
  days?: number;
  /** day indexes (0-based) that are fasting days */
  fastDays?: number[];
  seed?: number;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function planWeek(dishes: Dish[], profile: Profile, opts: PlanOptions): DayPlan[] {
  const ctx: Ctx = {
    dishes,
    profile,
    season: seasonOf(opts.start),
    random: rng(opts.seed ?? Date.now()),
    used: new Set(),
    counts: { fancy: 0, chatpata: 0, outside: 0 },
    yesterdayVeg: new Set(),
    todayVeg: new Set(),
    yesterdayIds: new Set(),
    todayIds: new Set(),
    weekend: false,
    slot: 'breakfast',
  };
  const plan: DayPlan[] = [];
  for (let i = 0; i < (opts.days ?? 7); i++) {
    const date = new Date(opts.start);
    date.setDate(date.getDate() + i);
    const fast = opts.fastDays?.includes(i) ?? false;
    const day: DayPlan = { date: isoDate(date), fast, breakfast: [], lunch: [], dinner: [] };
    ctx.weekend = isWeekend(date);
    for (const slot of SLOTS) {
      ctx.slot = slot;
      // Families who cook several styles get each style's lunch format in turn.
      const style = profile.regions[i % profile.regions.length];
      const courses: (Course | 'upvas')[] = fast ? ['upvas'] : template(slot, i, style);
      for (const c of courses) {
        const d = pick(poolFor(ctx, slot, c), ctx);
        if (d) day[slot].push(d.id);
      }
    }
    ctx.yesterdayVeg = ctx.todayVeg;
    ctx.todayVeg = new Set();
    ctx.yesterdayIds = ctx.todayIds;
    ctx.todayIds = new Set();
    plan.push(day);
  }
  return plan;
}

/** Replace one dish with another of the same course, avoiding everything else in the week. */
export function swapDish(
  plan: DayPlan[],
  dayIndex: number,
  slot: Slot,
  pos: number,
  dishes: Dish[],
  profile: Profile,
  seed = Date.now(),
): DayPlan[] {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const current = byId.get(plan[dayIndex][slot][pos]);
  if (!current) return plan;
  const ctx: Ctx = {
    dishes,
    profile,
    season: seasonOf(new Date(plan[dayIndex].date)),
    random: rng(seed),
    used: new Set(plan.flatMap((d) => [...d.breakfast, ...d.lunch, ...d.dinner])),
    counts: { fancy: 0, chatpata: 0, outside: 0 },
    yesterdayVeg: new Set(),
    todayVeg: new Set(),
    yesterdayIds: new Set(),
    todayIds: new Set([...plan[dayIndex].breakfast, ...plan[dayIndex].lunch, ...plan[dayIndex].dinner]),
    weekend: isWeekend(new Date(`${plan[dayIndex].date}T00:00:00`)),
    slot,
  };
  for (const id of ctx.used) {
    const d = byId.get(id);
    if (!d || d.id === current.id) continue;
    if (d.fancy >= 4) ctx.counts.fancy++;
    if (d.moods.includes('chatpata')) ctx.counts.chatpata++;
    if (d.outside?.length) ctx.counts.outside++;
  }
  const course = plan[dayIndex].fast ? 'upvas' : slot === 'breakfast' ? 'breakfast' : current.course;
  const next = pick(poolFor(ctx, slot, course), ctx);
  if (!next) return plan;
  return plan.map((day, i) =>
    i !== dayIndex ? day : { ...day, [slot]: day[slot].map((id, p) => (p === pos ? next.id : id)) },
  );
}
