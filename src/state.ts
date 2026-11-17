import { useSyncExternalStore } from 'react';

import { DISHES } from '@/data/dishes/index.ts';
import { tr, type StrKey } from '@/lib/i18n.ts';
import { isoDate, planWeek, type DayPlan } from '@/lib/planner.ts';
import { load, save } from '@/lib/storage';
import type { Profile } from '@/lib/types.ts';

interface AppState {
  profile: Profile | null;
  plan: DayPlan[] | null;
}

const KEY = 'crave-craft-v1';

function read(): AppState {
  try {
    const raw = load(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt or missing storage: start fresh
  }
  return { profile: null, plan: null };
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

export function useT() {
  const lang = useApp().profile?.lang ?? 'en';
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

export function setProfile(profile: Profile) {
  set({ profile });
}

export function newWeek(fastDays: number[] = []) {
  if (!state.profile) return;
  set({ plan: planWeek(DISHES, state.profile, { start: startOfWeek(), fastDays }) });
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

export function resetAll() {
  set({ profile: null, plan: null });
}
