import { allergensIn, familyNeeds, isOily, type Needs } from './health.ts';
import { fitsDiet } from './nutrition.ts';
import type { Course, Cuisine, Dish, Meal, Profile, Season } from './types.ts';

export type Slot = 'breakfast' | 'lunch' | 'dinner';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner'];

export interface DayPlan {
  date: string; // YYYY-MM-DD
  fast: boolean;
  /** guests eating with the family that day; scales recipes and shopping, allows party food */
  guests?: number;
  /** a disliked dish put back on the menu by Vegetable Justice */
  justice?: string;
  /** school or office box: one dry dish, or a bread with a dry sabji (Monday to Saturday) */
  tiffin?: string[];
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
  needs: Needs;
  season: Season;
  random: () => number;
  used: Set<string>;
  counts: { fancy: number; chatpata: number; outside: number };
  yesterdayVeg: Set<string>;
  todayVeg: Set<string>;
  yesterdayIds: Set<string>;
  todayIds: Set<string>;
  weekend: boolean;
  /** guests are coming: fancy dishes welcome, weekly fancy limit ignored */
  party: boolean;
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
  if (ctx.needs.diabetic && d.course === 'sweet') w *= 0.2;
  if (ctx.needs.lowOil && isOily(d)) w *= 0.4;
  const rated = ctx.profile.ratings?.[d.id];
  if (rated === 1) w *= 2;
  else if (rated === -1) w *= 0.5;
  // Staples: plain rotli and bhaat win most days, puri and jeera rice now and then.
  if (STAPLES.includes(d.course)) w /= d.fancy ** 2;
  // Weekdays are busy: long or party dishes go to the weekend.
  if (ctx.party) {
    if (d.fancy >= 3) w *= 6;
  } else if (ctx.weekend) {
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
  if (d.fancy >= 4 && !ctx.party && ctx.counts.fancy >= LIMITS.fancy) return false;
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
  if (chosen.fancy >= 4 && !ctx.party) ctx.counts.fancy++;
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
    if (allergensIn(d, ctx.needs.allergens).length) return false;
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
  /** day indexes with guests coming */
  guestDays?: number[];
  seed?: number;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function planWeek(dishes: Dish[], profile: Profile, opts: PlanOptions): DayPlan[] {
  const ctx: Ctx = {
    dishes,
    profile,
    needs: familyNeeds(profile),
    season: seasonOf(opts.start),
    random: rng(opts.seed ?? Date.now()),
    used: new Set(),
    counts: { fancy: 0, chatpata: 0, outside: 0 },
    yesterdayVeg: new Set(),
    todayVeg: new Set(),
    yesterdayIds: new Set(),
    todayIds: new Set(),
    weekend: false,
    party: false,
    slot: 'breakfast',
  };
  const plan: DayPlan[] = [];
  for (let i = 0; i < (opts.days ?? 7); i++) {
    const date = new Date(opts.start);
    date.setDate(date.getDate() + i);
    const fast = opts.fastDays?.includes(i) ?? false;
    const day: DayPlan = { date: isoDate(date), fast, breakfast: [], lunch: [], dinner: [] };
    ctx.weekend = isWeekend(date);
    ctx.party = opts.guestDays?.includes(i) ?? false;
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
  // Packed day by day so the week's boxes don't repeat.
  const withTiffin: DayPlan[] = [];
  for (const d of plan) withTiffin.push({ ...d, tiffin: packTiffin(d, dishes, profile, ctx.random, withTiffin) });
  return profile.justice ? vegetableJustice(withTiffin, dishes, profile, ctx.random) : withTiffin;
}

// Dry dishes that survive a few hours in a steel dabba without going soggy.
const TIFFIN_MAINS = [
  'methi_thepla', 'dudhi_thepla', 'aloo_paratha', 'gobi_paratha', 'paneer_paratha', 'handvo', 'khaman', 'white_dhokla',
  'methi_muthiya', 'patra', 'besan_chilla', 'moong_chilla', 'idli', 'batata_poha', 'kanda_poha', 'rava_upma', 'semiya_upma',
  'vegetable_dalia', 'bombay_sandwich', 'veg_grilled_sandwich', 'thalipeeth', 'veg_frankie', 'uttapam', 'pesarattu',
  'kothimbir_vadi', 'hakka_noodles', 'red_sauce_pasta', 'egg_bhurji',
];
const TIFFIN_BREADS = ['rotli', 'methi_thepla', 'dudhi_thepla'];
const TIFFIN_SABJIS = [
  'bateta_nu_shaak', 'bhinda_nu_shaak', 'tindora_nu_shaak', 'jeera_aloo', 'cabbage_poriyal', 'beans_poriyal', 'gobi_matar',
  'kobi_vatana', 'guvar_nu_shaak', 'aloo_shimla', 'zunka', 'batata_bhaji', 'arbi_fry',
];
const TIFFIN_FARALI = ['farali_chevdo', 'sabudana_khichdi', 'farali_bateta', 'upvas_thalipeeth'];

/** One tiffin for a day, avoiding anything already in other days' boxes. Sundays get none. */
export function packTiffin(day: DayPlan, dishes: Dish[], profile: Profile, random: () => number, week: DayPlan[] = []): string[] {
  if (new Date(`${day.date}T00:00:00`).getDay() === 0) return [];
  const needs = familyNeeds(profile);
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const taken = new Set(week.filter((d) => d.date !== day.date).flatMap((d) => d.tiffin ?? []));
  const ok = (ids: string[]) =>
    ids.filter((id) => {
      const d = byId.get(id);
      return d && fitsDiet(d, profile.diet) && !allergensIn(d, needs.allergens).length && !profile.dislikes.includes(id);
    });
  const any = (ids: string[]) => {
    const fresh = ids.filter((id) => !taken.has(id));
    const list = fresh.length ? fresh : ids;
    return list[Math.floor(random() * list.length)];
  };
  if (day.fast) {
    const f = ok(TIFFIN_FARALI);
    return f.length ? [any(f)] : [];
  }
  const mains = ok(TIFFIN_MAINS);
  const breads = ok(TIFFIN_BREADS);
  const sabjis = ok(TIFFIN_SABJIS);
  if (breads.length && sabjis.length && (random() < 0.5 || !mains.length)) return [any(breads), any(sabjis)];
  return mains.length ? [any(mains)] : [];
}

const JUSTICE_COURSES: Course[] = ['sabji', 'oneDish'];

/**
 * Vegetable Justice: a disliked sabji still comes round once a week, on a weekday lunch,
 * in place of that lunch's sabji. Skipped if one is already on the menu.
 */
export function vegetableJustice(plan: DayPlan[], dishes: Dish[], profile: Profile, random: () => number): DayPlan[] {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const all = new Set(plan.flatMap((d) => [...d.breakfast, ...d.lunch, ...d.dinner]));
  const hated = profile.dislikes
    .map((id) => byId.get(id))
    .filter((d): d is Dish => !!d && JUSTICE_COURSES.includes(d.course) && fitsDiet(d, profile.diet) && d.meals.includes('lunch') && !allergensIn(d, familyNeeds(profile).allergens).length);
  if (!hated.length || hated.some((d) => all.has(d.id))) return plan;
  const dish = hated[Math.floor(random() * hated.length)];
  const days = plan
    .map((d, i) => ({ d, i, pos: d.lunch.findIndex((id) => byId.get(id)?.course === dish.course) }))
    .filter(({ d, pos }) => !d.fast && !d.guests && !isWeekend(new Date(`${d.date}T00:00:00`)) && pos >= 0);
  if (!days.length) return plan;
  const { i, pos } = days[Math.floor(random() * days.length)];
  return plan.map((d, k) => (k !== i ? d : { ...d, lunch: d.lunch.map((id, p) => (p === pos ? dish.id : id)), justice: dish.id }));
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
    needs: familyNeeds(profile),
    season: seasonOf(new Date(plan[dayIndex].date)),
    random: rng(seed),
    used: new Set(plan.flatMap((d) => [...d.breakfast, ...d.lunch, ...d.dinner])),
    counts: { fancy: 0, chatpata: 0, outside: 0 },
    yesterdayVeg: new Set(),
    todayVeg: new Set(),
    yesterdayIds: new Set(),
    todayIds: new Set([...plan[dayIndex].breakfast, ...plan[dayIndex].lunch, ...plan[dayIndex].dinner]),
    weekend: isWeekend(new Date(`${plan[dayIndex].date}T00:00:00`)),
    party: !!plan[dayIndex].guests,
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

/** Guests just got added (or removed): re-pick that day's lunch and dinner to suit. */
export function replanDay(plan: DayPlan[], dayIndex: number, dishes: Dish[], profile: Profile, seed = Date.now()): DayPlan[] {
  let next = plan;
  for (const slot of ['lunch', 'dinner'] as const) {
    next[dayIndex][slot].forEach((_, pos) => {
      next = swapDish(next, dayIndex, slot, pos, dishes, profile, seed + pos);
    });
  }
  return next;
}
