import { useSyncExternalStore } from 'react';

import { DISHES } from '@/data/dishes/index.ts';
import { tr, type StrKey } from '@/lib/i18n.ts';
import { fastsOn } from '@/lib/fasts.ts';
import { isoDate, packTiffin, planWeek, replanDay, type DayPlan } from '@/lib/planner.ts';
import { load, save } from '@/lib/storage';
import type { Lang, Profile, Rating } from '@/lib/types.ts';

interface AppState {
  profile: Profile | null;
  plan: DayPlan[] | null;
  /** language picked before setup (intro and login); profile.lang wins after setup */
  lang: Lang;
  seenIntro: boolean;
  /** using the app on this phone only, without an account */
  guest: boolean;
  /** grocery items ticked off this week */
  bought: string[];
  /** big-button mode for elders */
  simple: boolean;
  /** what's in the fridge, for "cook from what I have" */
  pantry: string[];
  /** daily 8 am menu notification */
  reminder: boolean;
  /** days someone tapped "Thank you Mummy" */
  thanks: string[];
  /** surprise dinner guesses, by day */
  guesses: Record<string, string>;
}

const KEY = 'crave-craft-v1';
const EMPTY: AppState = { profile: null, plan: null, lang: 'en', seenIntro: false, guest: false, bought: [], simple: false, pantry: [], reminder: false, thanks: [], guesses: {} };

function read(): AppState {
  try {
    const raw = load(KEY);
    if (raw) {
      const saved = { ...EMPTY, ...JSON.parse(raw) };
      // Older saves had a single `region`.
      if (saved.profile && !saved.profile.regions) saved.profile.regions = [saved.profile.region ?? 'gujarati'];
      return saved;
    }
  } catch {
    // corrupt or missing storage: start fresh
  }
  return EMPTY;
}

let state: AppState = read();
const listeners = new Set<() => void>();

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  save(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useLangNow(): Lang {
  const s = useApp();
  return s.profile?.lang ?? s.lang;
}

export function useT() {
  const lang = useLangNow();
  return (key: StrKey) => tr(lang, key);
}

export function startOfWeek(d = new Date()): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // Monday
  return s;
}

export function isoWeekStart(): string {
  return isoDate(startOfWeek());
}

export function setLang(lang: Lang) {
  set({ lang, profile: state.profile ? { ...state.profile, lang } : null });
}

export function finishIntro() {
  set({ seenIntro: true });
}

export function continueAsGuest() {
  set({ guest: true });
}

/** Guest wants an account: the app sends them back to login, keeping their plan. */
export function leaveGuest() {
  set({ guest: false });
}

export function setProfile(profile: Profile) {
  set({ profile, lang: profile.lang });
}

/** Fresh plan for this week. Without `fastDays`, the family's fasts (Ekadashi...) are found by date. */
export function newWeek(fastDays?: number[]) {
  if (!state.profile) return;
  const keep = state.profile.fasts ?? [];
  // A new plan means a new shopping list.
  const guests = new Map(state.plan?.map((d) => [d.date, d.guests]));
  const start = startOfWeek();
  const guestDays = [...Array(7).keys()].filter((i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return !!guests.get(isoDate(d));
  });
  fastDays ??= [...Array(7).keys()].filter((i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return fastsOn(d, keep).length > 0;
  });
  const plan = planWeek(DISHES, state.profile, { start, fastDays, guestDays }).map((d) => ({ ...d, guests: guests.get(d.date) }));
  set({ plan, bought: [] });
}

/** Guests arriving (or cancelling) re-picks that day's lunch and dinner; changing the count doesn't. */
export function setGuests(date: string, guests: number) {
  if (!state.plan || !state.profile) return;
  const i = state.plan.findIndex((d) => d.date === date);
  if (i < 0) return;
  const before = !!state.plan[i].guests;
  let plan = state.plan.map((d, k) => (k === i ? { ...d, guests } : d));
  if (before !== !!guests) plan = replanDay(plan, i, DISHES, state.profile);
  set({ plan });
}

/** Another tiffin idea for one day; with no date, packs every day (plans made before tiffins existed). */
export function rerollTiffin(date?: string) {
  if (!state.plan || !state.profile) return;
  const plan = [...state.plan];
  plan.forEach((d, i) => {
    if (date && d.date !== date) return;
    plan[i] = { ...d, tiffin: packTiffin(d, DISHES, state.profile!, Math.random, plan) };
  });
  set({ plan });
}

/** Tapping the same face again clears the rating. */
export function rate(id: string, r: Rating) {
  const p = state.profile;
  if (!p) return;
  const ratings = { ...p.ratings };
  if (ratings[id] === r) delete ratings[id];
  else ratings[id] = r;
  set({ profile: { ...p, ratings } });
}

export function sayThanks() {
  const today = isoDate(new Date());
  if (!state.thanks.includes(today)) set({ thanks: [...state.thanks, today] });
}

export function setGuess(day: string, dishId: string) {
  set({ guesses: { ...state.guesses, [day]: dishId } });
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function toggleBought(id: string) {
  set({ bought: toggleIn(state.bought, id) });
}

export function togglePantry(id: string) {
  set({ pantry: toggleIn(state.pantry, id) });
}

export function setSimple(simple: boolean) {
  set({ simple });
}

export function setReminder(reminder: boolean) {
  set({ reminder });
}

export function setPlan(plan: DayPlan[]) {
  set({ plan });
}

export function toggleDislike(id: string) {
  const p = state.profile;
  if (!p) return;
  const dislikes = p.dislikes.includes(id) ? p.dislikes.filter((x) => x !== id) : [...p.dislikes, id];
  set({ profile: { ...p, dislikes } });
}

/** Clears this phone's setup and plan. Keeps the language and intro so dadi doesn't see English again. */
export function resetAll() {
  set({ profile: null, plan: null, guest: false });
}
